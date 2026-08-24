const {
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
} = require('../../utils/money');

describe('IEEE-754 Precision Financial Utility (money.js)', () => {
  describe('toPiasters & toEgp', () => {
    it('should accurately convert EGP to integer piasters without binary floating point drift', () => {
      expect(toPiasters(0.1)).toBe(10);
      expect(toPiasters(0.2)).toBe(20);
      expect(toPiasters(199.99)).toBe(19999);
      expect(toPiasters('45.50')).toBe(4550);
      expect(toPiasters(0)).toBe(0);
      expect(toPiasters(-15.25)).toBe(-1525);
    });

    it('should accurately convert integer piasters back to 2-decimal EGP numbers', () => {
      expect(toEgp(10)).toBe(0.1);
      expect(toEgp(19999)).toBe(199.99);
      expect(toEgp(4550)).toBe(45.5);
      expect(toEgp(0)).toBe(0);
    });
  });

  describe('addEgp & subEgp', () => {
    it('should solve classic 0.1 + 0.2 !== 0.3 floating point bug', () => {
      expect(0.1 + 0.2).not.toBe(0.3); // Proves native JS float failure
      expect(addEgp(0.1, 0.2)).toBe(0.3); // Money utility fix
    });

    it('should add multiple EGP values cleanly', () => {
      expect(addEgp(10.25, 20.35, 5.40)).toBe(36.00);
      expect(addEgp(0.1, 0.1, 0.1)).toBe(0.3);
    });

    it('should subtract EGP values without drift', () => {
      expect(subEgp(100.00, 33.33)).toBe(66.67);
      expect(subEgp(0.3, 0.1)).toBe(0.2);
    });
  });

  describe('mulEgp & divEgp', () => {
    it('should multiply EGP by integer and float multipliers', () => {
      expect(mulEgp(150, 0.1)).toBe(15); // 150 loyalty points * 0.1 EGP = 15 EGP
      expect(mulEgp(19.99, 3)).toBe(59.97);
    });

    it('should divide EGP accurately', () => {
      expect(divEgp(100, 3)).toBe(33.33);
      expect(divEgp(150, 2)).toBe(75);
    });
  });

  describe('percentOf & applyPercentDiscount', () => {
    it('should calculate accurate percentage amounts and apply discounts', () => {
      // 25% of 199.99 = 50.00 discount -> final 149.99
      expect(percentOf(199.99, 25)).toBe(50.00);
      expect(applyPercentDiscount(199.99, 25)).toBe(149.99);

      // 10% discount on 100
      expect(applyPercentDiscount(100, 10)).toBe(90);

      // 0% discount
      expect(applyPercentDiscount(150, 0)).toBe(150);
    });
  });

  describe('isIntegerNumber validator', () => {
    it('should strictly validate non-negative integers for stock, points, quantities', () => {
      expect(isIntegerNumber(5)).toBe(true);
      expect(isIntegerNumber(0)).toBe(true);
      expect(isIntegerNumber(1.5)).toBe(false);
      expect(isIntegerNumber(-3)).toBe(false);
      expect(isIntegerNumber('abc')).toBe(false);
    });
  });
});
