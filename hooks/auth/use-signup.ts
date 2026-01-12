"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface UseSignUpOptions {
  redirectTo?: string;
  emailRedirectTo?: string;
}

export function useSignUp(options: UseSignUpOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const emailRedirectTo =
        options.emailRedirectTo || `${window.location.origin}/dashboard`;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return { success: false, error: signUpError.message };
      }

      // Redirigir si se especifica
      if (options.redirectTo) {
        router.push(options.redirectTo);
      } else {
        router.push("/auth/sign-up-success");
      }

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    isLoading,
    error,
  };
}
