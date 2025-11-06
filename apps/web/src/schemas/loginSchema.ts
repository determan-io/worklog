import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username or email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

