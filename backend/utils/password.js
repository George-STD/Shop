/**
 * Asynchronous & Worker-Thread Password Hashing Utility
 *
 * In production, offloads CPU-intensive bcrypt hashing (100–300ms) to a worker thread
 * to protect the Node.js single-threaded event loop from starvation during login bursts.
 * In development/testing, uses async bcryptjs directly.
 */

const bcrypt = require('bcryptjs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// If this file is executed as a worker thread
if (!isMainThread && parentPort) {
  const { action, password, hash, saltRounds } = workerData || {};
  if (action === 'hash') {
    bcrypt.hash(password, saltRounds || 12).then((res) => {
      parentPort.postMessage({ success: true, result: res });
    }).catch((err) => {
      parentPort.postMessage({ success: false, error: err.message });
    });
  } else if (action === 'compare') {
    bcrypt.compare(password, hash).then((res) => {
      parentPort.postMessage({ success: true, result: res });
    }).catch((err) => {
      parentPort.postMessage({ success: false, error: err.message });
    });
  }
}

/**
 * Hashes a plaintext password
 * @param {string} password
 * @param {number} saltRounds
 * @returns {Promise<string>}
 */
const hashPassword = async (password, saltRounds = 12) => {
  if (!password) return '';

  // In test / non-production or if worker threads are disabled, use standard async bcrypt
  if (process.env.NODE_ENV !== 'production') {
    return await bcrypt.hash(password, saltRounds);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { action: 'hash', password, saltRounds },
    });

    worker.on('message', (msg) => {
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error));
    });

    worker.on('error', (err) => {
      // Fallback to in-process async if worker fails
      bcrypt.hash(password, saltRounds).then(resolve).catch(reject);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        bcrypt.hash(password, saltRounds).then(resolve).catch(reject);
      }
    });
  });
};

/**
 * Compares candidate plaintext password with stored hash
 * @param {string} candidatePassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (candidatePassword, hash) => {
  if (!candidatePassword || !hash) return false;

  if (process.env.NODE_ENV !== 'production') {
    return await bcrypt.compare(candidatePassword, hash);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { action: 'compare', password: candidatePassword, hash },
    });

    worker.on('message', (msg) => {
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error));
    });

    worker.on('error', () => {
      bcrypt.compare(candidatePassword, hash).then(resolve).catch(reject);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        bcrypt.compare(candidatePassword, hash).then(resolve).catch(reject);
      }
    });
  });
};

module.exports = {
  hashPassword,
  comparePassword,
};
