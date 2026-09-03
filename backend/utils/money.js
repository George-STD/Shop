/**
 * IEEE-754 Precision Financial Utility (Piasters Engine)
 *
 * Prevents floating point accumulation drift in currency calculations.
 * 1 EGP = 100 Piasters.
 * All intermediate operations are computed in integer Piasters before returning rounded EGP.
 */

/**
 * Converts EGP (pounds) to integer piasters (1 EGP = 100 piasters)
 * Handles float inputs, strings, and avoids binary floating point drift.
 * @param {number|string} egp
 * @returns {number} Integer piasters
 */
const MAX_EGP = 10_000_000;

const toPiasters = (egp) => {
  if (egp === null || egp === undefined || egp === '') return 0;
  const n = Number(egp);
  if (!Number.isFinite(n)) return 0;

  if (Math.abs(n) > MAX_EGP) {
    throw new Error(`Amount ${n} EGP exceeds maximum allowed ceiling of ${MAX_EGP} EGP`);
  }

  // Use direct scaling with 1e-9 epsilon nudge to avoid binary float under-rounding (e.g. 1.005 -> 101)
  const piasters = Math.round(Math.abs(n) * 100 + 1e-9);
  return n < 0 ? -piasters : piasters;
};

/**
 * Converts integer piasters back to rounded 2-decimal EGP number
 * @param {number} piasters
 * @returns {number} EGP number with 2 decimal precision
 */
const toEgp = (piasters) => {
  if (!Number.isFinite(piasters)) {
    throw new Error('toEgp received a non-finite value — refusing to silently return 0 for a monetary amount');
  }
  return Number((Math.round(piasters) / 100).toFixed(2));
};

/**
 * Safely rounds any EGP float value to exactly 2 decimals
 * @param {number|string} egp
 * @returns {number}
 */
const roundTo2Decimals = (egp) => {
  return toEgp(toPiasters(egp));
};

/**
 * Safely adds multiple EGP values
 * @param  {...(number|string)} values
 * @returns {number} Sum in EGP
 */
const addEgp = (...values) => {
  const sumPiasters = values.reduce((acc, val) => acc + toPiasters(val), 0);
  return toEgp(sumPiasters);
};

/**
 * Safely subtracts (a - b) in EGP
 * @param {number|string} a
 * @param {number|string} b
 * @returns {number} Difference in EGP
 */
const subEgp = (a, b) => {
  return toEgp(toPiasters(a) - toPiasters(b));
};

/**
 * Multiplies EGP by a numeric multiplier (e.g. quantity)
 * @param {number|string} egp
 * @param {number} multiplier
 * @returns {number} Product in EGP
 */
const mulEgp = (egp, multiplier) => {
  const mult = Number(multiplier) || 0;
  return toEgp(Math.round(toPiasters(egp) * mult));
};

/**
 * Divides EGP by a numeric divisor
 * @param {number|string} egp
 * @param {number} divisor
 * @returns {number}
 */
const divEgp = (egp, divisor) => {
  const div = Number(divisor);
  if (!div || !Number.isFinite(div)) return 0;
  return toEgp(Math.round(toPiasters(egp) / div));
};

/**
 * Computes exact percentage of an EGP value
 * @param {number|string} egp
 * @param {number} percent - e.g. 25 for 25%
 * @returns {number} Calculated discount amount in EGP
 */
const percentOf = (egp, percent) => {
  const p = Number(percent) || 0;
  if (p <= 0) return 0;
  const piasters = toPiasters(egp);
  const discountPiasters = Math.round((piasters * p) / 100);
  return toEgp(discountPiasters);
};

/**
 * Applies percentage discount: value - (value * percent / 100)
 * @param {number|string} egp
 * @param {number} percent
 * @returns {number} Final discounted EGP
 */
const applyPercentDiscount = (egp, percent) => {
  return Math.max(0, subEgp(egp, percentOf(egp, percent)));
};

/**
 * Validates whether a value is a valid non-negative integer (for stock, quantity, points)
 * @param {any} value
 * @returns {boolean}
 */
const isIntegerNumber = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
};

module.exports = {
  toPiasters,
  toEgp,
  roundTo2Decimals,
  addEgp,
  subEgp,
  mulEgp,
  divEgp,
  percentOf,
  applyPercentDiscount,
  isIntegerNumber,
};
