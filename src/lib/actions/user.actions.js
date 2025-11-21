"use server";

import { auth, signIn } from "@/src/auth";
import { signUpSchema, updateProfileSchema } from "../validation";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

// sign up
export async function signUpUser(prevState, formData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = signUpSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: "Please fix the errors above.",
      errors: validation.error.flatten().fieldErrors,
      inputs: {
        name: rawData.name,
        email: rawData.email,
      },
    };
  }

  const { name, email, password } = validation.data;

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });

    if (existingUser) {
      return {
        success: false,
        message: "User already exists",
        inputs: {
          name: rawData.name,
          email: rawData.email,
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        username: name,
        email,
        password_hash: hashedPassword,
        created_at: new Date(),
      },
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Sign up error:", error);
    return { success: false, message: "Registration failed." };
  }
  redirect("/sign-in");
}

// sign in
export async function signInWithCredentials(prevState, formData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    await signIn("credentials", {
      email,
      password: password,
      redirect: false,
    });

    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    if (isRedirectError(error)) throw error;

    if (error.type === "CredentialsSignin" || error.code === "credentials") {
      return { success: false, message: "Invalid email or password" };
    }

    return { success: false, message: "Something went wrong." };
  }
}

// delete account
export async function deleteUserAccount() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return { success: false, message: "Not authenticated" };
    }

    await prisma.users.delete({
      where: {
        id: parseInt(session.user.id),
      },
    });

    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    console.error("Delete account error: ", error);
    return { success: false, message: "Failed to delete account" };
  }
}

// update the user profile
export async function updateUserProfile(formData) {
  try {
    const session = await auth();
    if (!session || !session.user)
      return { success: false, message: "Not authenticated" };

    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmNewPassword: formData.get("confirmNewPassword"),
      currentPassword: formData.get("currentPassword"),
    };

    const validation = updateProfileSchema.safeParse(rawData);
    if (!validation.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, currentPassword } = validation.data;
    const updateData = { username: name };

    const isChangingEmail = email !== session.user.email;
    const isChangingPassword = password && password.trim() !== "";

    if (isChangingEmail || isChangingPassword) {
      if (!currentPassword) {
        return {
          success: false,
          message: "Please enter your current password to confirm changes.",
          errors: { currentPassword: ["Required to change email or password"] },
        };
      }

      const dbUser = await prisma.users.findUnique({
        where: { id: parseInt(session.user.id) },
      });

      const isMatch = await bcrypt.compare(
        currentPassword,
        dbUser.password_hash
      );
      if (!isMatch) {
        return {
          success: false,
          message: "Incorrect current password",
          errors: { currentPassword: ["Incorrect password"] },
        };
      }
    }

    if (isChangingEmail) {
      const existingUser = await prisma.users.findUnique({ where: { email } });
      if (existingUser) {
        return {
          success: false,
          message: "This email is already in use.",
          errors: { email: ["Email is already taken"] },
        };
      }
      updateData.email = email;
    }

    if (isChangingPassword) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password_hash = hashedPassword;
    }

    await prisma.users.update({
      where: { id: parseInt(session.user.id) },
      data: updateData,
    });

    return { success: true, message: "Profile updated" };
  } catch (error) {
    console.error("Update error:", error);
    return { success: false, message: "Failed to update profile" };
  }
}
