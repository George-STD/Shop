/**
 * Smart Gemini Model Manager with automatic multi-tier fallback.
 *
 * Models are arranged in quality order with graceful degradation:
 * - RPD (Requests Per Day) exhausted  → automatically falls back to next available model
 * - RPM (Requests Per Minute) exhausted on ALL models → returns retryAfterSeconds for client-side backoff
 * - Model not found / 403 / 503 → gracefully handles and continues down the tier cascade
 *
 * Total free-tier capacity: ~580+ requests/day across all models.
 */

/**
 * Model Tiers configuration with strict RPM and RPD quotas
 */
const MODEL_TIERS = [
  { id: 'gemini-3.6-flash', realId: 'gemini-3.6-flash', rpm: 5, rpd: 20 },
  { id: 'gemini-3.5-flash-lite', realId: 'gemini-3.5-flash-lite', rpm: 15, rpd: 500 },
  { id: 'gemini-3.1-flash-lite', realId: 'gemini-3.1-flash-lite', rpm: 15, rpd: 500 },
  { id: 'gemini-3.5-flash', realId: 'gemini-3.5-flash', rpm: 5, rpd: 20 },
];

/** In-memory usage tracking per model */
const modelUsage = {};

/** Concurrency queue promise chain to serialize bursts and prevent 503 rate collisions */
let generateQueue = Promise.resolve();

/**
 * Returns current UTC date formatted as YYYY-MM-DD
 * @returns {string}
 */
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Gets or initializes model quota counters for the current day
 * @param {string} modelId
 * @returns {{ date: string, dailyCount: number, minuteTimestamps: number[] }}
 */
function getUsage(modelId) {
  const today = getToday();
  if (!modelUsage[modelId] || modelUsage[modelId].date !== today) {
    modelUsage[modelId] = { date: today, dailyCount: 0, minuteTimestamps: [] };
  }
  return modelUsage[modelId];
}

/**
 * Clears timestamps older than 60 seconds from the rolling minute window
 * @param {{ minuteTimestamps: number[] }} usage
 */
function cleanMinuteWindow(usage) {
  const cutoff = Date.now() - 60_000;
  usage.minuteTimestamps = usage.minuteTimestamps.filter((t) => t > cutoff);
}

function recordSuccess(modelId) {
  const usage = getUsage(modelId);
  usage.dailyCount++;
  usage.minuteTimestamps.push(Date.now());
}

function markRpmExhausted(modelId, tier) {
  const usage = getUsage(modelId);
  usage.minuteTimestamps = Array(tier.rpm).fill(Date.now());
}

function markRpdExhausted(modelId, tier) {
  const usage = getUsage(modelId);
  usage.dailyCount = tier.rpd;
}

/**
 * Check whether a model can accept a new request right now.
 * @returns {{ available: boolean, reason?: 'rpd' | 'rpm' }}
 */
function getModelStatus(tier) {
  const usage = getUsage(tier.id);

  if (usage.dailyCount >= tier.rpd) {
    return { available: false, reason: 'rpd' };
  }

  cleanMinuteWindow(usage);
  if (usage.minuteTimestamps.length >= tier.rpm) {
    return { available: false, reason: 'rpm' };
  }

  return { available: true };
}

/**
 * Try generating content with automatic model fallback.
 *
 * @param {object} aiClient  – GoogleGenAI instance
 * @param {object} options   – { contents, config } (do NOT include `model`)
 * @returns {{ text: string, modelUsed: string }}
 * @throws Error with `.retryAfterSeconds` (RPM) or `.allDailyExhausted` (RPD)
 */
async function generateWithFallback(aiClient, { contents, config }) {
  let rpmBlockedCount = 0;
  let rpdExhaustedCount = 0;

  for (const tier of MODEL_TIERS) {
    const status = getModelStatus(tier);

    if (!status.available) {
      if (status.reason === 'rpd') rpdExhaustedCount++;
      if (status.reason === 'rpm') rpmBlockedCount++;
      continue;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        generateQueue = generateQueue.then(async () => {
          try {
            // Add a small 500ms delay between consecutive requests to prevent Google 503s
            await new Promise(r => setTimeout(r, 500));
            const res = await aiClient.models.generateContent({
              model: tier.realId || tier.id,
              contents,
              config,
            });
            resolve(res);
          } catch (err) {
            reject(err);
          }
        }).catch(err => reject(err));
      });

      recordSuccess(tier.id);
      console.log(`[GeminiManager] ✅ Success with ${tier.id} (daily: ${getUsage(tier.id).dailyCount}/${tier.rpd})`);
      return { text: response.text, modelUsed: tier.id };
    } catch (error) {
      console.log(`[GeminiManager] Error with ${tier.id}:`, error.status, error.message);
      const is429 =
        error.status === 429 ||
        (error.message && error.message.includes('429')) ||
        (error.message && error.message.toLowerCase().includes('resource_exhausted')) ||
        (error.status === 503) || // Handle Google 503 Overloaded as a retryable 429
        (error.status === 400 && error.message && error.message.toLowerCase().includes('quota'));

      // Model not found or no access → skip silently
      if (error.status === 404 || error.status === 403) {
        console.log(`[GeminiManager] ⚠️ Model ${tier.id} not available (${error.status}). Skipping...`);
        continue;
      }

      if (is429) {
        const usage = getUsage(tier.id);
        // If our daily tracker is close to RPD, assume RPD exhausted
        if (usage.dailyCount >= tier.rpd - 1) {
          markRpdExhausted(tier.id, tier);
          rpdExhaustedCount++;
          console.log(`[GeminiManager] 🔴 ${tier.id} RPD exhausted (${usage.dailyCount}/${tier.rpd}). Falling back...`);
        } else {
          markRpmExhausted(tier.id, tier);
          rpmBlockedCount++;
          console.log(`[GeminiManager] 🟡 ${tier.id} RPM exhausted (daily: ${usage.dailyCount}/${tier.rpd}). Falling back...`);
        }
        continue;
      }

      // Non-rate-limit error → rethrow immediately
      throw error;
    }
  }

  // ── All models failed ──

  // Check if ALL models are RPD-exhausted (no point retrying today)
  const allRpd = MODEL_TIERS.every((tier) => {
    const usage = getUsage(tier.id);
    return usage.dailyCount >= tier.rpd;
  });

  if (allRpd) {
    const err = new Error('تم استنفاد جميع الموديلات المتاحة لليوم. يرجى المحاولة غداً.');
    err.allDailyExhausted = true;
    err.statusCode = 429;
    throw err;
  }

  // Some models are just RPM-limited → they'll reset within ~60s
  if (rpmBlockedCount > 0) {
    const err = new Error('تم تجاوز عدد الطلبات في الدقيقة لجميع الموديلات. سيتم إعادة المحاولة تلقائياً...');
    err.retryAfterSeconds = 60;
    err.statusCode = 429;
    throw err;
  }

  // Fallthrough: no model worked (e.g., all returned 404)
  throw new Error('لم يتمكن أي من الموديلات المتاحة من إتمام الطلب.');
}

module.exports = {
  generateWithFallback,
  MODEL_TIERS,
  getModelStatus,
  recordSuccess,
  markRpmExhausted,
  markRpdExhausted
};
