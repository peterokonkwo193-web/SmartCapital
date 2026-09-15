import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity as ActivityIcon, Bell, Palette, Shield, User as UserIcon, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Spinner } from "@/components/common/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useActivities } from "@/hooks/use-activities";
import { isSupabaseConfigured } from "@/lib/supabase";
import { profileSchema, type ProfileInput } from "@/lib/validation";
import { formatDate, formatDateTime, initials } from "@/utils/format";

function ProfilePage() {
  const [params] = useSearchParams();
  const initialTab = params.get("tab") ?? "profile";

  useEffect(() => {
    document.title = "Profile — SmartCapital";
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account, security, and preferences." />

      <Tabs defaultValue={initialTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { fullName: user?.fullName ?? "" } });

  if (!user) return null;

  async function onSubmit(values: ProfileInput) {
    try {
      await updateProfile({ fullName: values.fullName });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Avatar className="size-20">
            <AvatarFallback className="text-xl">{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-semibold text-foreground">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          {user.role === "admin" && <Badge>Admin</Badge>}
          <Separator className="my-1" />
          <div className="grid w-full grid-cols-2 gap-3 text-left">
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{formatDate(user.memberSince)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Balance</p>
              <p className="font-mono text-sm font-medium">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(user.practiceBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your display name. Your email is used to sign in and can't be changed here.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" aria-invalid={Boolean(errors.fullName)} {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Spinner className="size-4 text-current" />}
              Update Profile
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { user, changePassword, isDemoMode, grantDemoAdmin, revokeDemoAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminToggling, setAdminToggling] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleDemoAdmin() {
    if (!user) return;
    setAdminToggling(true);
    try {
      if (user.role === "admin") {
        await revokeDemoAdmin();
        toast.info("Admin access revoked");
      } else {
        await grantDemoAdmin();
        toast.success("Admin access granted", { description: "Admin role applied to your account." });
      }
    } finally {
      setAdminToggling(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4" /> Password
          </CardTitle>
          <CardDescription>Choose a strong password you don't use elsewhere.</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={!isSupabaseConfigured}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="size-4 text-current" />}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
            <CardDescription>Where you're currently signed in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-border px-3.5 py-3">
              <div>
                <p className="text-sm font-medium">This device</p>
                <p className="text-xs text-muted-foreground">Signed in now</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isSupabaseConfigured
                ? "Session managed securely by Supabase Auth."
                : "Credentials are stored securely in this browser."}
            </p>
          </CardContent>
        </Card>

        {isDemoMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-4" /> Admin Access Control
              </CardTitle>
              <CardDescription>
                Local admin role management. Grants access to the <code className="font-mono text-xs">/admin</code> panel.
                Real admin roles are granted server-side via the{" "}
                <code className="font-mono text-xs">user_roles</code> table.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                type="button"
                variant={user?.role === "admin" ? "outline" : "default"}
                onClick={handleToggleDemoAdmin}
                disabled={adminToggling}
              >
                {adminToggling && <Spinner className="size-4 text-current" />}
                {user?.role === "admin" ? "Revoke Admin Access" : "Grant Admin Access (local only)"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

function PreferencesTab() {
  const [defaultOrderType, setDefaultOrderType] = useState<"market" | "limit" | "stop">("market");
  const [confirmOrders, setConfirmOrders] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Preferences</CardTitle>
        <CardDescription>Defaults applied to your live trading order form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Default Order Type</Label>
          <div className="inline-flex rounded-md border border-border bg-muted/50 p-0.5">
            {(["market", "limit", "stop"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDefaultOrderType(type)}
                className={`rounded-[5px] px-3.5 py-1.5 text-sm font-medium capitalize transition-colors ${
                  defaultOrderType === type ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Confirm before placing orders</p>
            <p className="text-xs text-muted-foreground">Show a confirmation step before every live order.</p>
          </div>
          <Switch checked={confirmOrders} onCheckedChange={setConfirmOrders} />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => toast.success("Preferences saved")}>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({ orderFills: true, priceAlerts: true, education: false, product: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4" /> Notification Preferences
        </CardTitle>
        <CardDescription>Choose what you'd like to be notified about.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { key: "orderFills" as const, label: "Order fills", description: "When a live order is filled." },
          { key: "priceAlerts" as const, label: "Price alerts", description: "Significant moves on watchlisted assets." },
          { key: "education" as const, label: "New education content", description: "New guides and articles." },
          { key: "product" as const, label: "Product updates", description: "New features and platform news." },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, [item.key]: checked }))}
            />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={() => toast.success("Notification preferences saved")}>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
}

function AppearanceTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-4" /> Appearance
        </CardTitle>
        <CardDescription>Choose how SmartCapital looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <ThemeToggle />
      </CardContent>
    </Card>
  );
}

function ActivityTab() {
  const { activities, loading } = useActivities();

  const ICON_MAP = { trade: Wallet, watchlist: ActivityIcon, profile: UserIcon, support: Bell, account: Shield, profit: TrendingUp };

  if (loading) return null;

  if (activities.length === 0) {
    return <EmptyState icon={ActivityIcon} title="No recent activity" description="Your account activity will show up here." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of actions taken on your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {activities.map((activity) => {
          const Icon = ICON_MAP[activity.type];
          return (
            <div key={activity.id} className="flex items-center gap-3 rounded-md px-2 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default ProfilePage;
