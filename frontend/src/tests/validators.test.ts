import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  sendMoneySchema,
  cashSchema,
  billSchema,
  changePinSchema,
} from '../utils/validators';

// ── Login ─────────────────────────────────────────────────────────────────────
describe('loginSchema', () => {
  it('passes with valid phone and PIN', () => {
    const result = loginSchema.safeParse({
      phone: '01711000001',
      pin: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('fails with invalid phone number', () => {
    const result = loginSchema.safeParse({
      phone: '12345',
      pin: '123456',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/valid Bangladeshi/i);
  });

  it('fails with PIN less than 6 digits', () => {
    const result = loginSchema.safeParse({
      phone: '01711000001',
      pin: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/6 digits/i);
  });

  it('fails with non-numeric PIN', () => {
    const result = loginSchema.safeParse({
      phone: '01711000001',
      pin: 'abcdef',
    });
    expect(result.success).toBe(false);
  });
});

// ── Register ──────────────────────────────────────────────────────────────────
describe('registerSchema', () => {
  const validData = {
    full_name: 'Jahidul Islam',
    phone: '01711000001',
    email: 'jahid@email.com',
    nid_number: '1234567890',
    user_type: 'personal' as const,
    pin: '123456',
    confirm_pin: '123456',
  };

  it('passes with valid data', () => {
    expect(registerSchema.safeParse(validData).success).toBe(true);
  });

  it('fails when PINs do not match', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirm_pin: '654321',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/do not match/i);
  });

  it('fails with invalid NID', () => {
    const result = registerSchema.safeParse({
      ...validData,
      nid_number: '123', // too short
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/valid NID/i);
  });

  it('fails with invalid email', () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts 13-digit NID', () => {
    expect(
      registerSchema.safeParse({ ...validData, nid_number: '1234567890123' }).success
    ).toBe(true);
  });

  it('accepts 17-digit NID', () => {
    expect(
      registerSchema.safeParse({ ...validData, nid_number: '12345678901234567' }).success
    ).toBe(true);
  });
});

// ── Send Money ────────────────────────────────────────────────────────────────
describe('sendMoneySchema', () => {
  it('passes with valid transfer data', () => {
    const result = sendMoneySchema.safeParse({
      receiver_phone: '01711000002',
      amount: 5000,
      pin: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('fails with amount of 0', () => {
    const result = sendMoneySchema.safeParse({
      receiver_phone: '01711000002',
      amount: 0,
      pin: '123456',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/minimum/i);
  });

  it('fails with amount exceeding 25000', () => {
    const result = sendMoneySchema.safeParse({
      receiver_phone: '01711000002',
      amount: 30000,
      pin: '123456',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/25,000/i);
  });
});

// ── Cash In / Out ─────────────────────────────────────────────────────────────
describe('cashSchema', () => {
  it('passes with valid cash data', () => {
    expect(
      cashSchema.safeParse({
        agent_phone: '01711000006',
        amount: 5000,
        pin: '123456',
      }).success
    ).toBe(true);
  });

  it('fails with amount below minimum 50', () => {
    const result = cashSchema.safeParse({
      agent_phone: '01711000006',
      amount: 10,
      pin: '123456',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/50/);
  });

  it('fails with amount above agent maximum', () => {
    const result = cashSchema.safeParse({
      agent_phone: '01711000006',
      amount: 999999,
      pin: '123456',
    });
    expect(result.success).toBe(false);
  });
});

// ── Bill Payment ──────────────────────────────────────────────────────────────
describe('billSchema', () => {
  it('passes with valid bill data', () => {
    expect(
      billSchema.safeParse({
        biller_name: 'DESCO',
        account_number: 'DESCO-001-001',
        amount: 1500,
        pin: '123456',
      }).success
    ).toBe(true);
  });

  it('fails with empty biller name', () => {
    const result = billSchema.safeParse({
      biller_name: '',
      account_number: 'DESCO-001-001',
      amount: 1500,
      pin: '123456',
    });
    expect(result.success).toBe(false);
  });
});

// ── Change PIN ────────────────────────────────────────────────────────────────
describe('changePinSchema', () => {
  it('passes with valid PIN change', () => {
    expect(
      changePinSchema.safeParse({
        old_pin: '123456',
        new_pin: '654321',
        confirm_new_pin: '654321',
      }).success
    ).toBe(true);
  });

  it('fails when new PIN same as old PIN', () => {
    const result = changePinSchema.safeParse({
      old_pin: '123456',
      new_pin: '123456',
      confirm_new_pin: '123456',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/different/i);
  });

  it('fails when confirm PIN does not match', () => {
    const result = changePinSchema.safeParse({
      old_pin: '123456',
      new_pin: '654321',
      confirm_new_pin: '999999',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/do not match/i);
  });
});
