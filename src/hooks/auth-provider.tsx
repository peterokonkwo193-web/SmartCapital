import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as demoStore from "@/lib/demo-store";
import { AuthContext, type AuthContextValue, type SignUpInput } from "@/hooks/auth-context";
import type { Profile } from "@/types";

interface NewProfileDetails {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
}

async function fetchOrCreateSupabaseProfile(
  userId: string,
  email: string,
  details?: NewProfileDetails,
): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      fullName: existing.full_name,
      firstName: existing.first_name ?? "",
      lastName: existing.last_name ?? "",
      phone: existing.phone ?? "",
      country: existing.country ?? "",
      email: existing.email,
      memberSince: existing.created_at,
      practiceBalance: existing.practice_balance ?? 0,
      avatarUrl: existing.avatar_url ?? undefined,
      role: existing.role ?? "user",
    };
  }

  const firstName = details?.firstName ?? "";
  const lastName = details?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0];

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      phone: details?.phone ?? "",
      country: details?.country ?? "",
      practice_balance: 0,
    })
    .select("*")
    .single();

  if (error) throw error;

  return {
    id: created.id,
    fullName: created.full_name,
    firstName: created.first_name ?? "",
    lastName: created.last_name ?? "",
    phone: created.phone ?? "",
    country: created.country ?? "",
    email: created.email,
    memberSince: created.created_at,
    practiceBalance: created.practice_balance ?? 0,
    avatarUrl: created.avatar_url ?? undefined,
    role: created.role ?? "user",
  };
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchOrCreateSupabaseProfile(session.user.id, session.user.email ?? "");
          if (mounted) setUser(profile);
        }
        if (mounted) setLoading(false);
      });

      const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await fetchOrCreateSupabaseProfile(session.user.id, session.user.email ?? "");
          setUser(profile);
        } else {
          setUser(null);
        }
      });

      return () => {
        mounted = false;
        subscription.subscription.unsubscribe();
      };
    }

    const profile = demoStore.getActiveProfile();
    setUser(profile);
    setLoading(false);
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const profile = await fetchOrCreateSupabaseProfile(data.user.id, data.user.email ?? "");
        setUser(profile);
      }
      return;
    }
    const profile = await demoStore.loginDemoUser(email, password);
    setUser(profile);
  }, []);

  const signUp = useCallback(async ({ firstName, lastName, email, password, country }: SignUpInput) => {
    const fullName = `${firstName} ${lastName}`.trim();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, first_name: firstName, last_name: lastName, country } },
      });
      if (error) throw error;

      // With email confirmation enabled (Supabase's default), signUp succeeds and the
      // `handle_new_user` trigger creates the profile row server-side, but no session
      // exists yet — so the client has no auth.uid() and RLS blocks reading it back.
      // Skip that fetch here; the profile will load normally after the user confirms
      // and signs in.
      if (!data.session) {
        return { needsEmailConfirmation: true };
      }

      if (data.user) {
        const profile = await fetchOrCreateSupabaseProfile(data.user.id, email, { firstName, lastName, phone: "", country });
        setUser(profile);
      }
      return { needsEmailConfirmation: false };
    }
    const profile = await demoStore.registerDemoUser(firstName, lastName, email, password, "", country);
    setUser(profile);
    return { needsEmailConfirmation: false };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      setUser(null);
      return;
    }
    demoStore.setActiveSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, "fullName" | "avatarUrl">>) => {
      if (!user) return;
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: patch.fullName, avatar_url: patch.avatarUrl })
          .eq("id", user.id);
        if (error) throw error;
        setUser({ ...user, ...patch });
        return;
      }
      const updated = demoStore.updateProfile(user.id, patch);
      setUser(updated);
    },
    [user],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user) throw new Error("You must be signed in.");
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return;
      }
      await demoStore.changeDemoPassword(user.id, currentPassword, newPassword);
    },
    [user],
  );

  const grantDemoAdmin = useCallback(async () => {
    if (!user || isSupabaseConfigured) return;
    const updated = demoStore.grantDemoAdmin(user.id);
    setUser(updated);
  }, [user]);

  const revokeDemoAdmin = useCallback(async () => {
    if (!user || isSupabaseConfigured) return;
    const updated = demoStore.revokeDemoAdmin(user.id);
    setUser(updated);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemoMode: !isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
      grantDemoAdmin,
      revokeDemoAdmin,
    }),
    [user, loading, signIn, signUp, signOut, updateProfile, changePassword, grantDemoAdmin, revokeDemoAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
