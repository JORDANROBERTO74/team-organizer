"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // Obtener el usuario actual
    const getUser = async () => {
      try {
        setLoading(true);
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (cancelled) return;
        
        if (userError) {
          setError(userError);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Si hay usuario, obtener su perfil (si existe una tabla de perfiles)
        if (currentUser) {
          // Intentar obtener datos del perfil desde user_metadata o desde una tabla de perfiles
          const profile: UserProfile = {
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name,
            avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture,
          };

          if (!cancelled) {
            setUserProfile(profile);
          }
        } else {
          if (!cancelled) {
            setUserProfile(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    getUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      
      if (session?.user) {
        setUser(session.user);
        const profile: UserProfile = {
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        };
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    data: userProfile,
    loading,
    error,
  };
}
