import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().optional(),
    confirmNewPassword: z.string().optional(),
    currentPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.password || data.password === "") return true;
      return data.password.length >= 8;
    },
    {
      message: "New password must be at least 8 characters",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password !== "") {
        return data.password === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: "New passwords do not match",
      path: ["confirmNewPassword"],
    }
  );
