import { createContext } from "react";

import type { Profile } from "@/types";

interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
}

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "fullName" | "avatarUrl">>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  grantDemoAdmin: () => Promise<void>;
  revokeDemoAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext, type AuthContextValue, type SignUpInput };
