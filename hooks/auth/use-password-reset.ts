"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UsePasswordResetOptions {
  redirectTo?: string;
}

export function usePasswordReset(options: UsePasswordResetOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const redirectTo =
        options.redirectTo ||
        `${window.location.origin}/auth/update-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return { success: false, error: resetError.message };
      }

      setSuccess(true);
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
    resetPassword,
    isLoading,
    error,
    success,
  };
}
