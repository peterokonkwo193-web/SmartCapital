export type AssetCategory = "stocks" | "crypto" | "etfs" | "commodities" | "indices";

export interface Asset {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
  sector?: string;
  description: string;
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
}

export interface PricePoint {
  date: string;
  value: number;
  benchmark?: number;
}

export type ChartRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

export interface AllocationSlice {
  label: string;
  percent: number;
  colorVar: string;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
}

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop";
export type OrderStatus = "filled" | "open" | "cancelled";

export interface PaperOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  status: OrderStatus;
  createdAt: string;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface Trader {
  id: string;
  name: string;
  avatarInitials: string;
  strategy: string;
  bio: string;
  liveReturn: number;
  winRate: number;
  riskLevel: "Low" | "Moderate" | "High";
  experienceYears: number;
  followers: number;
  tags: string[];
}

export interface EducationArticle {
  slug: "stocks" | "crypto" | "bonds" | "etfs";
  title: string;
  tagline: string;
  whatItIs: string;
  howItWorks: string[];
  types: { name: string; description: string }[];
  benefits: string[];
  risks: string[];
  terminology: { term: string; definition: string }[];
  considerations: string[];
  faq: { question: string; answer: string }[];
}

export interface Activity {
  id: string;
  type: "trade" | "watchlist" | "profile" | "support" | "account" | "profit";
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  createdAt: string;
  category: string;
}

export interface SupportTicketReply {
  id: string;
  ticketId: string;
  authorName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  email: string;
  memberSince: string;
  practiceBalance: number;
  avatarUrl?: string;
  role: "user" | "admin";
  disabled?: boolean;
}

export type DepositMethod = "bank_transfer" | "card" | "crypto" | "other";
export type DepositStatus = "pending" | "approved" | "rejected";

export interface DepositRequest {
  id: string;
  amount: number;
  method: DepositMethod;
  proofImageUrl: string;
  note?: string;
  status: DepositStatus;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}
