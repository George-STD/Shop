const mongoose = require('mongoose');
const User = require('../../models/User');
const { cleanupUnverifiedUsers, startPeriodicCleanup, stopPeriodicCleanup } = require('../../services/cleanupService');

describe('CleanupService - Unverified Users Auto-Purge', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterEach(() => {
    stopPeriodicCleanup();
  });

  it('should delete unverified users whose verification expired past the grace period', async () => {
    const expiredPastGrace = await User.create({
      firstName: 'Expired',
      lastName: 'User',
      email: 'expired@example.com',
      phone: '01011111111',
      password: 'password123',
      isVerified: false,
      role: 'user',
      emailVerificationExpires: new Date(Date.now() - 2 * 60 * 60 * 1000) // expired 2 hours ago
    });

    const result = await cleanupUnverifiedUsers({ gracePeriodMs: 60 * 60 * 1000 });
    expect(result.deletedCount).toBe(1);

    const exists = await User.findById(expiredPastGrace._id);
    expect(exists).toBeNull();
  });

  it('should NOT delete unverified users whose verification is still active or within grace period', async () => {
    const activeUnverified = await User.create({
      firstName: 'Active',
      lastName: 'Unverified',
      email: 'active@example.com',
      phone: '01022222222',
      password: 'password123',
      isVerified: false,
      role: 'user',
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000) // expires in 10 minutes
    });

    const withinGrace = await User.create({
      firstName: 'Grace',
      lastName: 'Period',
      email: 'grace@example.com',
      phone: '01033333333',
      password: 'password123',
      isVerified: false,
      role: 'user',
      emailVerificationExpires: new Date(Date.now() - 15 * 60 * 1000) // expired 15 mins ago (within 1h grace)
    });

    const result = await cleanupUnverifiedUsers({ gracePeriodMs: 60 * 60 * 1000 });
    expect(result.deletedCount).toBe(0);

    const check1 = await User.findById(activeUnverified._id);
    const check2 = await User.findById(withinGrace._id);
    expect(check1).not.toBeNull();
    expect(check2).not.toBeNull();
  });

  it('should NEVER delete verified users regardless of emailVerificationExpires', async () => {
    const verifiedUser = await User.create({
      firstName: 'Verified',
      lastName: 'User',
      email: 'verified@example.com',
      phone: '01044444444',
      password: 'password123',
      isVerified: true,
      role: 'user',
      emailVerificationExpires: new Date(Date.now() - 5 * 60 * 60 * 1000)
    });

    const result = await cleanupUnverifiedUsers({ gracePeriodMs: 60 * 60 * 1000 });
    expect(result.deletedCount).toBe(0);

    const check = await User.findById(verifiedUser._id);
    expect(check).not.toBeNull();
  });

  it('should NEVER delete admin users even if unverified', async () => {
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phone: '01055555555',
      password: 'password123',
      isVerified: false,
      role: 'admin',
      emailVerificationExpires: new Date(Date.now() - 5 * 60 * 60 * 1000)
    });

    const result = await cleanupUnverifiedUsers({ gracePeriodMs: 60 * 60 * 1000 });
    expect(result.deletedCount).toBe(0);

    const check = await User.findById(adminUser._id);
    expect(check).not.toBeNull();
  });

  it('should start and stop periodic cleanup cleanly', () => {
    expect(() => {
      startPeriodicCleanup(10000);
      stopPeriodicCleanup();
    }).not.toThrow();
  });
});
