import { z } from 'zod';

// Project schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  customer_id: z.string()
    .min(1, 'Customer is required'),
  billing_model: z.string()
    .min(1, 'Billing model is required')
    .refine((val) => val === 'task-based' || val === 'timesheet', {
      message: 'Billing model must be either "task-based" or "timesheet"'
    }),
  hourly_rate: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
      message: 'Hourly rate must be a valid positive number'
    })
    .or(z.literal('')),
  is_active: z.boolean().optional().default(true),
});

// Type inference for TypeScript
export type ProjectFormData = z.infer<typeof projectSchema>;

// Validation helper function
export const validateProject = (data: unknown) => {
  try {
    return { success: true, data: projectSchema.parse(data) };
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
