"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import styles from "../sign-in/sign-in-form.module.css";

import { signUpDefaultValues } from "@/src/lib/constants";
import { signUpUser } from "@/src/lib/actions/user.actions";

export default function SignUpForm() {
  const [state, action] = useActionState(signUpUser, {
    success: false,
    message: "",
    errors: {},
    inputs: {},
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const SignUpButton = () => {
    const { pending } = useFormStatus();

    return (
      <button disabled={pending} className={styles.button} type="submit">
        {pending ? "Submitting..." : "Sign Up"}
      </button>
    );
  };

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className={styles.formWrapper}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="name"
            className={styles.input}
            style={state.errors?.name ? { borderColor: "red" } : {}}
            required
            autoComplete="name"
            defaultValue={state.inputs?.name || signUpDefaultValues.name}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={styles.input}
            style={state.errors?.email ? { borderColor: "red" } : {}}
            required
            autoComplete="email"
            defaultValue={state.inputs?.email || signUpDefaultValues.email}
          />
          {state.errors?.email && (
            <p style={{ color: "red", fontSize: "12px" }}>
              {state.errors.email[0]}
            </p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="password"
            className={styles.input}
            style={state.errors?.password ? { borderColor: "red" } : {}}
          />
          {state.errors?.password && (
            <p style={{ color: "red", fontSize: "12px" }}>
              {state.errors.password[0]}
            </p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="confirmPassword"
            className={styles.input}
          />
          {state.errors?.confirmPassword && (
            <p style={{ color: "red", fontSize: "12px" }}>
              {state.errors.confirmPassword[0]}
            </p>
          )}
        </div>
        <div>
          <SignUpButton />
        </div>

        {state.errors?.name && (
          <p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
            {state.errors.name[0]}
          </p>
        )}

        {state && !state.success && (
          <div className={styles.errorText}>{state.message}</div>
        )}

        <div className={styles.signUpLinkContainer}>
          Already have an account?{" "}
          <Link href="/sign-in" target="_self" className={styles.signUpLink}>
            Sign In
          </Link>
        </div>
      </div>
    </form>
  );
}
