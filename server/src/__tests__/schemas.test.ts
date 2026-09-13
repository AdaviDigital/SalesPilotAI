import { describe, it, expect } from 'vitest';
import { createLeadSchema, listLeadsQuerySchema } from '../schemas/lead.schema';
import { createDealSchema } from '../schemas/deal.schema';
import { registerSchema } from '../schemas/auth.schema';

describe('createLeadSchema', () => {
  it('accepts a minimal valid lead', () => {
    const result = createLeadSchema.safeParse({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = createLeadSchema.safeParse({ firstName: 'Ada', lastName: 'Lovelace', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('defaults status to NEW', () => {
    const result = createLeadSchema.parse({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(result.status).toBe('NEW');
  });

  it('rejects a negative estimated value', () => {
    const result = createLeadSchema.safeParse({ firstName: 'Ada', lastName: 'Lovelace', estimatedValue: -100 });
    expect(result.success).toBe(false);
  });
});

describe('listLeadsQuerySchema', () => {
  it('coerces string query params to numbers with sane defaults', () => {
    const result = listLeadsQuerySchema.parse({ page: '2', pageSize: '10' });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.sortBy).toBe('createdAt');
  });

  it('caps page size at 100', () => {
    const result = listLeadsQuerySchema.safeParse({ pageSize: '500' });
    expect(result.success).toBe(false);
  });
});

describe('createDealSchema', () => {
  it('requires a pipelineId and stageId', () => {
    const result = createDealSchema.safeParse({ name: 'Big Deal', value: 1000 });
    expect(result.success).toBe(false);
  });

  it('accepts a valid deal', () => {
    const result = createDealSchema.safeParse({
      name: 'Big Deal',
      value: 1000,
      pipelineId: '11111111-1111-1111-1111-111111111111',
      stageId: '22222222-2222-2222-2222-222222222222',
    });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'short',
      organizationName: 'Acme',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'longenoughpassword',
      organizationName: 'Acme',
    });
    expect(result.success).toBe(true);
  });
});
