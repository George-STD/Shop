/**
 * Smart Gemini Model Manager with multi-tier fallback, concurrency limits, and queue bounds.
 *
 * Prevents event-loop starvation, unbounded promise closures, and Google 503 rate collisions.
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

/**
 * Queue and concurrency control
 */
const MAX_CONCURRENT_CALLS = 2;
const MAX_QUEUE_DEPTH = 20;
let activeCalls = 0;
const pendingQueue = [];

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
 * In-place cleanup of expired timestamps older than 60 seconds
 * @param {{ minuteTimestamps: number[] }} usage
 */
function cleanMinuteWindow(usage) {
  const cutoff = Date.now() - 60_000;
  const timestamps = usage.minuteTimestamps;
  let firstValidIndex = 0;

  while (firstValidIndex < timestamps.length && timestamps[firstValidIndex] <= cutoff) {
    firstValidIndex++;
  }

  if (firstValidIndex > 0) {
    usage.minuteTimestamps = timestamps.slice(firstValidIndex);
  }
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
 * Executes a single AI generation with concurrency and queue bounds
 */
function executeWithQueue(taskFn) {
  if (activeCalls + pendingQueue.length >= MAX_QUEUE_DEPTH) {
    const err = new Error('الخادم مشغول حالياً بمعالجة طلبات ذكاء اصطناعي أخرى. يرجى المحاولة بعد لحظات.');
    err.statusCode = 503;
    err.retryAfterSeconds = 5;
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    pendingQueue.push({ taskFn, resolve, reject });
    processNext();
  });
}

function processNext() {
  if (activeCalls >= MAX_CONCURRENT_CALLS || pendingQueue.length === 0) {
    return;
  }

  const { taskFn, resolve, reject } = pendingQueue.shift();
  activeCalls++;

  const isTest = process.env.NODE_ENV === 'test';
  const interCallDelay = isTest ? 0 : 200;

  const run = async () => {
    try {
      if (interCallDelay > 0) {
        await new Promise((r) => setTimeout(r, interCallDelay));
      }
      const res = await taskFn();
      resolve(res);
    } catch (err) {
      reject(err);
    } finally {
      activeCalls--;
      processNext();
    }
  };

  run();
}

/**
 * Try generating content with automatic model fallback.
 *
 * @param {object} aiClient  – GoogleGenAI instance
 * @param {object} options   – { contents, config } (do NOT include `model`)
 * @returns {Promise<{ text: string, modelUsed: string }>}
 */
async function generateWithFallback(aiClient, { contents, config }) {
  return executeWithQueue(async () => {
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
        const response = await aiClient.models.generateContent({
          model: tier.realId || tier.id,
          contents,
          config,
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
          (error.status === 503) ||
          (error.status === 400 && error.message && error.message.toLowerCase().includes('quota'));

        if (error.status === 404 || error.status === 403) {
          console.log(`[GeminiManager] ⚠️ Model ${tier.id} not available (${error.status}). Skipping...`);
          continue;
        }

        if (is429) {
          const usage = getUsage(tier.id);
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

        throw error;
      }
    }

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

    if (rpmBlockedCount > 0) {
      const err = new Error('تم تجاوز عدد الطلبات في الدقيقة لجميع الموديلات. سيتم إعادة المحاولة تلقائياً...');
      err.retryAfterSeconds = 60;
      err.statusCode = 429;
      throw err;
    }

    throw new Error('لم يتمكن أي من الموديلات المتاحة من إتمام الطلب.');
  });
}

module.exports = {
  generateWithFallback,
  MODEL_TIERS,
  getModelStatus,
  recordSuccess,
  markRpmExhausted,
  markRpdExhausted,
};
