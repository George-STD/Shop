/**
 * Asynchronous Password Hashing & Comparison Utility
 *
 * Uses async bcryptjs directly with internal event-loop yielding (setImmediate).
 * Avoids spawning unbounded Worker threads (which create new V8 isolates and ~30MB overhead each)
 * that cause OOM container crashes on memory-constrained free tiers (512MB RAM).
 */

const bcrypt = require('bcryptjs');

/**
 * Hashes a plaintext password
 * @param {string} password
 * @param {number} saltRounds
 * @returns {Promise<string>}
 */
const hashPassword = async (password, saltRounds = 12) => {
  if (!password) return '';
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares candidate plaintext password with stored hash
 * @param {string} candidatePassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (candidatePassword, hash) => {
  if (!candidatePassword || !hash) return false;
  return await bcrypt.compare(candidatePassword, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
