// frontend/src/utils/validators.ts
import { z } from 'zod';

// ── Reusable fields ───────────────────────────────────────────────────────────
const phoneSchema = z
  .string()
  .regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi number (e.g. 01711000001)');

const pinSchema = z
  .string()
  .length(6, 'PIN must be exactly 6 digits')
  .regex(/^\d+$/, 'PIN must contain only numbers');

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ── Register ──────────────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    full_name: z.string().min(3, 'Full name must be at least 3 characters'),
    phone: phoneSchema,
    email: emailSchema,
    nid_number: z
      .string()
      .regex(/^(\d{10}|\d{13}|\d{17})$/, 'Enter a valid NID (10, 13 or 17 digits)'),
    user_type: z.enum(['personal', 'agent']),
    pin: pinSchema,
    confirm_pin: pinSchema,
  })
  .refine((data) => data.pin === data.confirm_pin, {
    message: 'PINs do not match',
    path: ['confirm_pin'],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

// ── Send Money ────────────────────────────────────────────────────────────────
export const sendMoneySchema = z.object({
  receiver_phone: phoneSchema,
  amount: z
    .number()
    .min(1, 'Minimum transfer is ৳1')
    .max(25000, 'Maximum transfer is ৳25,000'),
  pin: pinSchema,
});
export type SendMoneyFormData = z.infer<typeof sendMoneySchema>;

// ── Cash In / Cash Out ────────────────────────────────────────────────────────
export const cashSchema = z.object({
  agent_phone: phoneSchema,
  amount: z
    .number()
    .min(50, 'Minimum amount is ৳50')
    .max(200000, 'Maximum amount is ৳2,00,000'),
  pin: pinSchema,
});
export type CashFormData = z.infer<typeof cashSchema>;

// ── Bill Payment ──────────────────────────────────────────────────────────────
export const billSchema = z.object({
  biller_name: z.string().min(1, 'Select a biller'),
  account_number: z.string().min(4, 'Enter a valid account number'),
  amount: z
    .number()
    .min(10, 'Minimum bill amount is ৳10'),
  pin: pinSchema,
});
export type BillFormData = z.infer<typeof billSchema>;

// ── Change PIN ────────────────────────────────────────────────────────────────
export const changePinSchema = z
  .object({
    old_pin: pinSchema,
    new_pin: pinSchema,
    confirm_new_pin: pinSchema,
  })
  .refine((data) => data.new_pin === data.confirm_new_pin, {
    message: 'New PINs do not match',
    path: ['confirm_new_pin'],
  })
  .refine((data) => data.old_pin !== data.new_pin, {
    message: 'New PIN must be different from old PIN',
    path: ['new_pin'],
  });
export type ChangePinFormData = z.infer<typeof changePinSchema>;
