"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

interface UseSignOutOptions {
  redirectTo?: string;
  refresh?: boolean;
}

export function useSignOut(options: UseSignOutOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    try {
      setIsPending(true);
      setError(null);

      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        const errorMessage = signOutError.message || "Error al cerrar sesión";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Redirigir según las opciones
      if (options.redirectTo) {
        router.push(options.redirectTo);
      } else if (pathname === "/") {
        router.push("/");
      } else {
        router.push("/auth/login");
      }

      // Refrescar si se solicita
      if (options.refresh !== false) {
        router.refresh();
      }

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPending(false);
    }
  };

  return {
    signOut,
    isPending,
    error,
  };
}
