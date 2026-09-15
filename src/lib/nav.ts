import {
  LayoutDashboard,
  LineChart,
  Briefcase,
  CandlestickChart,
  Star,
  Users,
  GraduationCap,
  LifeBuoy,
  Banknote,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: LineChart },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Live Trading", href: "/paper-trading", icon: CandlestickChart },
  { label: "Deposits", href: "/deposits", icon: Banknote },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Trader Strategies", href: "/traders", icon: Users },
  { label: "Education", href: "/education", icon: GraduationCap },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export const MOBILE_TAB_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Markets", href: "/markets", icon: LineChart },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Trades", href: "/paper-trading", icon: CandlestickChart },
];
