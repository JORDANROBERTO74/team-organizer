"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

interface UserContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let hasInitialized = false;

    // Función para actualizar el estado del usuario
    const updateUserState = (sessionUser: User | null) => {
      if (sessionUser) {
        setUser(sessionUser);
        const profile: UserProfile = {
          email: sessionUser.email,
          full_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name,
          avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture,
        };
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    };

    // Obtener el session inicial (sin petición HTTP, lee del cliente)
    const getInitialSession = async () => {
      try {
        // getSession() lee del localStorage/cookies, NO hace petición HTTP
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (cancelled) return;
        
        if (sessionError) {
          setError(sessionError);
          updateUserState(null);
          hasInitialized = true;
          setLoading(false);
          return;
        }

        updateUserState(session?.user || null);
        hasInitialized = true;
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
          updateUserState(null);
          hasInitialized = true;
          setLoading(false);
        }
      }
    };

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      
      updateUserState(session?.user || null);
      
      // Solo establecer loading a false después de la inicialización
      if (hasInitialized) {
        setLoading(false);
      }
    });

    // Cargar la sesión inicial
    getInitialSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, userProfile, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
