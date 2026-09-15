import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller, type FieldValues, type Path, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, TrendingUp, ShieldCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { BrandLockup } from "@/components/common/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/common/spinner";
import { CountrySelect } from "@/components/common/country-select";
import { TestimonialsSection } from "@/components/common/testimonials-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  type LoginInput,
  type SignUpInput,
  type ForgotPasswordInput,
} from "@/lib/validation";

function AuthPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");

  if (!loading && user) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div>
      <div className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel />

        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLockup />
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="mb-7 w-full">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-0">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <SignUpForm onSuccess={() => setTab("login")} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <TestimonialsSection />
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
      <DecorativeChart />

      <BrandLockup className="[&_span]:text-sidebar-foreground [&_span_span]:text-sidebar-primary" />

      <div className="relative max-w-md space-y-6">
        <h1 className="text-[34px] font-bold leading-[1.15] tracking-tight">
          Trade markets. Grow your wealth.
        </h1>
        <p className="text-[15px] leading-relaxed text-sidebar-muted">
          SmartCapital gives you institutional-grade live market data and real order execution — so you can
          trade real assets with confidence.
        </p>

        <ul className="space-y-3.5 pt-2">
          <FeatureRow icon={TrendingUp} text="Live-style market snapshots across stocks, crypto, ETFs, and more" />
          <FeatureRow icon={ShieldCheck} text="Secure, real-money live trading with transparent execution" />
          <FeatureRow icon={GraduationCap} text="Editorial-grade education on how each asset class actually works" />
        </ul>
      </div>

      <p className="relative text-xs text-sidebar-muted">© {new Date().getFullYear()} SmartCapital. Professional live trading platform.</p>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: typeof TrendingUp; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary">
        <Icon className="size-4" />
      </span>
      <span className="text-sm leading-relaxed text-sidebar-foreground/90">{text}</span>
    </li>
  );
}

function DecorativeChart() {
  return (
    <svg
      viewBox="0 0 600 800"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="authLineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-sidebar-primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-sidebar-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 560 L50 540 L100 580 L150 500 L200 520 L250 440 L300 470 L350 380 L400 410 L450 320 L500 350 L550 260 L600 300"
        fill="none"
        stroke="var(--color-sidebar-primary)"
        strokeWidth="2"
        opacity="0.5"
      />
      <path
        d="M0 560 L50 540 L100 580 L150 500 L200 520 L250 440 L300 470 L350 380 L400 410 L450 320 L500 350 L550 260 L600 300 L600 800 L0 800 Z"
        fill="url(#authLineGradient)"
      />
      <path
        d="M0 700 L60 680 L120 710 L180 660 L240 690 L300 630 L360 660 L420 600 L480 630 L540 580 L600 610"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        opacity="0.3"
      />
      {[
        [100, 580],
        [250, 440],
        [400, 410],
        [550, 260],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" fill="var(--color-sidebar-primary)" opacity="0.7" />
      ))}
    </svg>
  );
}

function PasswordField<T extends FieldValues>({
  id,
  label,
  register,
  error,
  autoComplete,
}: {
  id: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="pr-11"
          {...register(id)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setSubmitError(null);
    try {
      await signIn(values.email, values.password);
      toast.success("Welcome back");
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Log in to access your dashboard and live trading portfolio.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <PasswordField
          id="password"
          label="Password"
          register={register}
          error={errors.password?.message}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <ForgotPasswordDialog />
        </div>

        {submitError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="size-4 text-current" />}
          Log In
        </Button>
      </form>
    </div>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpInput) {
    setSubmitError(null);
    try {
      const { needsEmailConfirmation } = await signUp(values);
      if (needsEmailConfirmation) {
        toast.success("Account created — check your email to confirm before logging in");
      } else {
        toast.success("Account created — welcome to SmartCapital");
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create your account.");
      return;
    }
    onSuccess();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Create your account</h2>
        <p className="text-sm text-muted-foreground">Join SmartCapital and start trading live markets today.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={Boolean(errors.firstName)}
              {...register("firstName")}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={Boolean(errors.lastName)}
              {...register("lastName")}
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <CountrySelect id="country" value={field.value} onValueChange={field.onChange} aria-invalid={Boolean(errors.country)} />
            )}
          />
          {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
        </div>

        <PasswordField
          id="password"
          label="Password"
          register={register}
          error={errors.password?.message}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          register={register}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />

        {submitError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="size-4 text-current" />}
          Create Account
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          By signing up you agree to our Terms of Service and acknowledge that trading involves risk. Only invest
          what you can afford to lose.
        </p>
      </form>
    </div>
  );
}

function ForgotPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      // No email transport exists in local demo mode — nothing is actually sent.
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    setSent(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSent(false);
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="text-xs font-medium text-primary hover:underline">
          Forgot password?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            {sent
              ? "Check your inbox for a reset link."
              : "Enter your email and we'll send you a reset link."}

          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <Button className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" type="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4 text-current" />}
              Send Reset Link
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AuthPage;
