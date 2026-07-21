/**
 * Smart Gemini Model Manager with automatic fallback.
 *
 * Models are ordered from best quality to most generous limits.
 * - RPD (daily) exhausted  → automatically falls back to the next model
 * - RPM (per-minute) exhausted on ALL models → returns retryAfter for client-side retry
 * - Model not found / no access → silently skips to next model
 *
 * Total free-tier capacity: ~580 requests/day across all models.
 */

// Models ordered: best quality first, most generous limits last
const MODEL_TIERS = [
  { id: 'gemini-3.5-flash', rpm: 5, rpd: 20 },
  { id: 'gemini-3.0-flash', rpm: 5, rpd: 20 },
  { id: 'gemini-2.5-flash', rpm: 5, rpd: 20 },
  { id: 'gemini-3.1-flash-lite', rpm: 15, rpd: 500 },
  { id: 'gemini-2.5-flash-lite', rpm: 10, rpd: 20 },
];

// In-memory usage tracking (resets on server restart, which is fine)
const modelUsage = {};

// Concurrency lock to prevent burst 429/503 errors from Google API
let generateQueue = Promise.resolve();

function getToday() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getUsage(modelId) {
  const today = getToday();
  if (!modelUsage[modelId] || modelUsage[modelId].date !== today) {
    modelUsage[modelId] = { date: today, dailyCount: 0, minuteTimestamps: [] };
  }
  return modelUsage[modelId];
}

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
              model: tier.id,
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

module.exports = { generateWithFallback, MODEL_TIERS };
