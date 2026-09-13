import { describe, it, expect } from 'vitest';
import { computeHeuristicScore } from '../ai/scoring';

describe('computeHeuristicScore', () => {
  it('gives a low score to a bare-minimum lead with no engagement', () => {
    const result = computeHeuristicScore({
      hasEmail: false,
      hasPhone: false,
      source: null,
      estimatedValue: null,
      daysSinceCreated: 45,
      activityCount: 0,
      emailActivityCount: 0,
      meetingActivityCount: 0,
    });
    expect(result.score).toBeLessThan(40);
    expect(result.intent).toBe('Low');
  });

  it('rewards referral source, contact info, and deal value', () => {
    const result = computeHeuristicScore({
      hasEmail: true,
      hasPhone: true,
      source: 'Referral',
      estimatedValue: 50000,
      daysSinceCreated: 2,
      activityCount: 0,
      emailActivityCount: 0,
      meetingActivityCount: 0,
    });
    expect(result.score).toBeGreaterThan(60);
  });

  it('boosts score and intent for meeting engagement', () => {
    const result = computeHeuristicScore({
      hasEmail: true,
      hasPhone: false,
      source: 'Website',
      estimatedValue: 10000,
      daysSinceCreated: 5,
      activityCount: 3,
      emailActivityCount: 1,
      meetingActivityCount: 1,
    });
    expect(result.intent).toBe('High');
    expect(result.engagement).toBeGreaterThan(0);
  });

  it('penalizes stale leads with zero activity', () => {
    const engaged = computeHeuristicScore({
      hasEmail: true,
      hasPhone: false,
      source: 'Website',
      estimatedValue: null,
      daysSinceCreated: 5,
      activityCount: 2,
      emailActivityCount: 1,
      meetingActivityCount: 0,
    });
    const stale = computeHeuristicScore({
      hasEmail: true,
      hasPhone: false,
      source: 'Website',
      estimatedValue: null,
      daysSinceCreated: 60,
      activityCount: 0,
      emailActivityCount: 0,
      meetingActivityCount: 0,
    });
    expect(stale.score).toBeLessThan(engaged.score);
  });

  it('always returns a score within 0-100', () => {
    const result = computeHeuristicScore({
      hasEmail: true,
      hasPhone: true,
      source: 'Referral',
      estimatedValue: 1_000_000,
      daysSinceCreated: 1,
      activityCount: 50,
      emailActivityCount: 50,
      meetingActivityCount: 50,
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
