import { z } from 'zod';

// Customer address schema
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string()
    .optional()
    .refine((val) => !val || /^\d{5}(-\d{4})?$/.test(val), {
      message: 'Please enter a valid ZIP code (12345 or 12345-6789)'
    })
});

// Customer billing settings schema
const billingSettingsSchema = z.object({
  currency: z.string().default('USD'),
  payment_terms: z.string().default('Net 30')
});

// Main customer schema
export const customerSchema = z.object({
  name: z.string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, '')), {
      message: 'Please enter a valid phone number'
    })
    .or(z.literal('')),
  address: addressSchema,
  billing_settings: billingSettingsSchema,
  is_active: z.boolean().optional().default(true)
});

// Type inference for TypeScript
export type CustomerFormData = z.infer<typeof customerSchema>;

// Validation helper function
export const validateCustomer = (data: unknown) => {
  try {
    return { success: true, data: customerSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        fieldErrors[field] = err.message;
      });
      return { success: false, errors: fieldErrors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
