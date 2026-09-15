# Prompt Analysis: What Claude Code Will Build vs. What It Will Refuse

This document divides the `CLAUDE_CODE_BUILD_PROMPT.md` into two clear sections:
- **PART A** — Features Claude Code will build without issues
- **PART B** — Features Claude Code will refuse or flag as harmful (and WHY)

---

# PART A: CLAUDE CODE WILL BUILD ✅

These features are standard web development tasks — UI, auth, dashboards, data management — that Claude Code handles normally.

---

## A1. Tech Stack & Project Scaffold ✅
- React + Vite + TypeScript
- Tailwind CSS with CSS variables
- shadcn/ui components
- Supabase (PostgreSQL + Auth + Realtime)
- React Router v6, Zod, Recharts, Sonner, Lucide React, input-otp
- Project structure (src/components, src/pages, src/lib, src/hooks)

---

## A2. Authentication Page (/auth) ✅
- Email + password login/signup via Supabase Auth
- Tabbed Login / Sign Up UI
- Full Name, Email, Password fields
- 4-digit PIN OTP input (as a UX confirmation gate — harmless)
- Redirect to /dashboard on success
- Error toasts

---

## A3. Sidebar Layout & Navigation ✅
- Collapsible sidebar (desktop persistent, mobile overlay)
- Logo, app name, theme toggle
- Nav items: Dashboard, Copy Trading, Deposits, Withdrawals, Support, Profile
- Collapsible Investments sub-menu with 10 links
- User avatar, full name, email, logout button

---

## A4. Dashboard Page (/dashboard) ✅
- 4 stat cards: Total Balance, Active Investments, Active Trades, Total Earnings
- "Active Investments Overview" section with investment list + progress bars
- Recharts LineChart for portfolio performance
- Recent Trades table (columns: Trade, Amount, P&L, Status, Date)
- "Add Funds" dialog for existing investments

---

## A5. Investment Education Pages (/investments/*) — CONTENT ONLY ✅
The **educational/informational content** on each investment page is fine:
- What are Stocks/Crypto/Bonds/ETFs/etc.? descriptions
- Benefits sections (Growth Potential, Dividend Income, Liquidity, etc.)
- Types sections (Common Stocks, Preferred Stocks, Growth Stocks, etc.)
- Considerations / Risks sections (Market Risk, Volatility, Research is Essential, etc.)
- Informational Cards using the bg-gradient-card design

**This content is legitimate financial education and Claude Code will write it.**

---

## A6. Copy Trading Page (/copy-trading) ✅
- Heading, subtitle, description text
- Trader cards in a grid: avatar, name, win rate, return %, followers, strategy
- "Copy Trader" button that changes to "Copying" state
- Insert row into copy_trades table
- Toast: "Now copying trader!"
- Seed data for 5 traders (Alex Morgan, Sarah Chen, Marcus Johnson, Emma Rodriguez, David Kim)

---

## A7. Profile Page (/profile) ✅
- Profile avatar (initials fallback)
- Editable Full Name, read-only Email
- Member Since date, Account Balance display
- "Update Profile" button with toast
- PIN setup section (two 4-digit OTP inputs, "Set PIN" button)
- Validation: PINs must match, 4 digits only

---

## A8. Support Page (/support) ✅
- Heading, subtitle
- Live Chat card with "Chat with Support" button
- "Fast and friendly assistance" description
- Contact information card

---

## A9. Admin Panel (/admin) — PARTIAL ✅
**What Claude Code will build:**
- Stats overview (Total Users, Pending Deposits, Pending Withdrawals, Total Platform Balance)
- 4-tab layout (Deposits, Withdrawals, Trades, Users)
- Users tab: list users, view balances, enable/disable users, make admin
- Trades tab: view all trades, view P&L, close trade
- Realtime subscriptions on deposits, withdrawals, trades tables
- Toast notifications for admin actions

**What it will flag (see Part B below).**

---

## A10. Theming & Design System ✅
- CSS variables (dark mode default)
- Primary: electric blue/indigo
- Background: deep dark (#0d1117 equivalent)
- Success green, warning orange, destructive red
- Typography: Inter from Google Fonts
- Custom classes: .bg-gradient-card, .shadow-card, .text-success, etc.
- Light/dark mode toggle (stored in localStorage, applies 'dark' to html)

---

## A11. Real-Time Features ✅
- Supabase Realtime channel subscriptions
- deposits table, withdrawals table, trades channel
- Auto-refresh admin tabs on data change
- Cleanup on component unmount

---

## A12. Form Validation (Zod) ✅
- Deposit form, withdrawal form, investment form schemas
- Error messages and validation toasts

---

## A13. Loading & Empty States ✅
- Spinning loader on every data page
- Empty state icons + messages ("No deposits yet", "No trades yet", etc.)
- Status badge colors: pending=blue, completed=green, rejected=red

---

## A14. Database Schema (MOST TABLES) ✅
These tables are acceptable:
- profiles
- investments
- trades
- traders
- copy_trades
- user_roles
- watchlist

---

## A15. Project Structure & Supabase Setup ✅
- src/lib/supabase.ts with createClient
- Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- ProtectedRoute component pattern
- useAuth hook
- App.tsx router setup

---

# PART B: CLAUDE CODE WILL REFUSE OR FLAG AS PROBLEMATIC ❌

These features are either illegal, fraudulent by design, deeply misleading to users, or enable real financial harm. Claude Code will either refuse to implement them, modify them, or warn you about them.

---

## B1. ❌ HARDCODED REAL CRYPTO WALLET ADDRESSES (Deposits Page)

**From the prompt (Section 10):**
```
Bitcoin (BTC): bc1qzarux5v9rhsk0e6sgnn7gntp5n8e0afqelx3ja
Ethereum (ETH): 0xCB168fD26f8a16F2Db3bF4806Eb984F883250Ba7
```

**WHY THIS IS REFUSED:**
This is the exact mechanism of a crypto investment scam:
1. Users see real wallet addresses
2. Users send real Bitcoin or Ethereum to these addresses
3. Admin "approves" the deposit and adds balance to their account
4. This IS collecting real money from real people
Claude Code will not build UI that solicits or directs users to send cryptocurrency to hardcoded wallet addresses as a "deposit" flow, because this pattern is functionally indistinguishable from fraud.

**Allowed alternative:** A virtual "Add Funds" button that instantly credits a practice balance — no wallet address shown, no transaction ID needed.

---

## B2. ❌ TRANSACTION ID FIELD ON DEPOSITS (Deposits Page)

**From the prompt (Section 10):**
```
Transaction ID - text input, required (placeholder: TXN123456789)
```

**WHY THIS IS REFUSED:**
Requiring a blockchain transaction ID as proof of payment is only meaningful if the user has actually sent real cryptocurrency. This confirms the platform intends to collect real money. Claude Code will not implement this field in a flow that shows real wallet addresses.

---

## B3. ❌ DEPOSIT SLIP UPLOAD (Deposits Page)

**From the prompt (Section 10):**
```
Deposit Slip (Optional) - dashed upload area ("Click to upload slip", "PDF or Image")
```

**WHY THIS IS REFUSED:**
A deposit slip upload only makes sense in a real payment context. Combined with the crypto wallet addresses and transaction ID field, this is part of a "send us real money and upload proof" flow — the core mechanism of advance-fee and investment fraud schemes. Claude Code will not build this.

---

## B4. ❌ WITHDRAWAL TO REAL USDT WALLET ADDRESS

**From the prompt (Section 11):**
```
USDT Wallet Address - text input (placeholder: "Enter USDT wallet address")
Withdraw your funds to USDT wallet
```

**WHY THIS IS REFUSED:**
Asking users to provide a real USDT wallet address for withdrawals implies real money will be sent out. This is the other side of the crypto scam cycle:
- Users deposit real crypto
- Platform shows a balance (often inflated)
- Users try to "withdraw" to USDT wallet
- Platform applies fake "capital gains tax", "withdrawal fees", or "verification" requirements to extract more money before the withdrawal is "approved"

Claude Code will not build a "withdrawal to real crypto wallet" feature. It will only build a virtual withdrawal that decrements a practice balance.

---

## B5. ❌ 40% MONTHLY RETURN RATE (InvestWidget)

**From the prompt (Section 7):**
```
Rate Display: "Monthly Rate: 40% | Daily Accumulation"

const MONTHLY_RATE = 0.40;
const estimatedReturn = amount * Math.pow(1 + DAILY_RATE, selectedDays);
```

**WHY THIS IS REFUSED:**
40% per month = ~5,743% per year compounded. This is:
- Mathematically impossible for any legitimate investment
- A classic Ponzi scheme marker (Bernie Madoff promised ~12%/year and was considered suspicious)
- Criminally misleading to users who will believe this is real
- If built as described, it shows users projected returns like "$10,000 → $847,000 in 1 year"

Advertising a fixed guaranteed return rate of 40% monthly is financial fraud in virtually every jurisdiction. Claude Code will refuse to hard-code this rate or display it as a real return figure.

**Allowed alternative:** A projection calculator using realistic, clearly-labeled historical averages (S&P 500 ~10%/yr, bonds ~4-5%/yr) with prominent disclaimers.

---

## B6. ❌ ADMIN-APPROVED DEPOSIT FLOW

**From the prompt (Section 14, Deposits Tab):**
```
"Approve" (green) - sets status='completed', adds amount to user balance
"Reject" (red) - sets status='rejected'
```

**WHY THIS IS PROBLEMATIC:**
The admin approval flow for deposits is only harmful when combined with real wallet addresses. The flow is:
1. User sends real crypto to the wallet address
2. User submits deposit with transaction ID
3. Admin reviews and "approves" → user balance increases

This is the manual confirmation step in a crypto investment scam. On its own the UI is buildable, but in the context of real wallet addresses it completes the fraud loop.

**Allowed alternative (for a real platform):** Admin can adjust practice/virtual balances with audit logging — clearly labeled as practice balance overrides.

---

## B7. ❌ HARDCODED ADMIN EMAIL IN FRONTEND CODE

**From the prompt (Section 14 & Note 4):**
```
Admin email: admin@davesax.com
```

**WHY THIS IS FLAGGED:**
Hard-coding a specific admin email in the client-side JavaScript bundle exposes admin credentials and is a security vulnerability. Anyone can read the JS bundle (as demonstrated in this research). Claude Code will recommend using Supabase Row Level Security + user_roles table for admin detection instead of a hardcoded email comparison.

---

## B8. ❌ PIN STORED AS PLAIN BASE64

**From the prompt (Section 4, 12, Note 3):**
```
btoa(pin) - verify with: btoa(enteredPin) === profile.pin_hash
```

**WHY THIS IS FLAGGED:**
`btoa()` is not encryption — it is Base64 encoding and is instantly reversible. Storing a security PIN as base64 provides zero protection. Anyone with database access can immediately decode every user's PIN.

**Allowed alternative:** Use `bcrypt` or `argon2` for proper PIN hashing. If this is purely a UX gate (no real money at stake), the approach is tolerable but Claude Code will warn about it.

---

## B9. ❌ TESLA-SPECIFIC INVESTMENT PAGE (/investments/tesla)

**From the prompt (Section 8):**
```
/investments/tesla -> Tesla (protected)
Key Highlights: Leading electric vehicle manufacturer, Strong leadership from CEO Elon Musk...
```

**WHY THIS IS FLAGGED:**
A dedicated investment page for a single company, framed with marketing copy ("Strong leadership", "Expanding markets"), constitutes stock-specific investment advice. This can violate financial regulations (unregistered investment advisor laws) and Claude Code will flag it.

**Allowed alternative:** Generic asset-category pages where users can browse real market data for many stocks/assets.

---

## B10. ❌ ADMIN EDITING TRADE PROFIT/LOSS FIGURES

**From the prompt (Section 14, Trades Tab):**
```
"Edit Trade" dialog - update: trade type, amount, profit_loss, status, current_price
```

**WHY THIS IS FLAGGED:**
If this platform is collecting real money (which the deposit flow implies), letting admins silently edit the profit_loss and current_price figures on trades is market manipulation. Admins could show users artificially high returns to encourage more deposits, then deny withdrawals.

---

# SUMMARY TABLE

| Feature | Claude Code Status | Reason |
|---|---|---|
| React + Vite + Supabase scaffold | ✅ Builds | Standard dev stack |
| Auth (email + password) | ✅ Builds | Standard Supabase Auth |
| 4-digit PIN (UX gate) | ✅ Builds (with warning on encoding) | Acceptable UX pattern |
| Sidebar navigation | ✅ Builds | Standard layout |
| Dashboard cards & charts | ✅ Builds | Standard data display |
| Investment education content | ✅ Builds | Legitimate info |
| Copy trading (display only) | ✅ Builds | Standard display |
| Profile page | ✅ Builds | Standard settings |
| Support page | ✅ Builds | Standard UI |
| Admin user management | ✅ Builds | Standard admin UI |
| Dark/light theme toggle | ✅ Builds | Standard UX |
| Realtime subscriptions | ✅ Builds | Standard Supabase |
| **Real BTC/ETH wallet addresses on deposit page** | ❌ REFUSES | Soliciting real crypto = fraud |
| **Transaction ID field for crypto payment** | ❌ REFUSES | Confirms real money collection |
| **Deposit slip upload** | ❌ REFUSES | Part of advance-fee fraud flow |
| **Withdrawal to USDT wallet address** | ❌ REFUSES | Real money extraction mechanism |
| **40% monthly return rate** | ❌ REFUSES | Impossible/fraudulent guaranteed return |
| **Admin approving crypto deposits** | ❌ REFUSES (in real-money context) | Completes scam loop |
| **Hardcoded admin@davesax.com in frontend** | ⚠️ FLAGS | Security vulnerability |
| **PIN stored as btoa() base64** | ⚠️ FLAGS | Not real security |
| **Tesla-specific investment page** | ⚠️ FLAGS | Unregistered investment advice |
| **Admin editing trade P&L** | ⚠️ FLAGS | Market manipulation risk |

---

# WHAT TO DO

To get Claude Code to build this entire platform successfully, you have two options:

## Option 1: Paper-Trading / Demo App (Claude Code will build everything)
Change the platform to a simulation:
- Replace wallet addresses with "Add Practice Funds" button (instant, no real payment)
- Replace 40% monthly rate with realistic historical averages with disclaimers
- Add banner: "This is a paper-trading simulation. No real money involved."
- Remove transaction ID and deposit slip fields
- Remove USDT wallet withdrawal (replace with practice balance reduction)
- Admin deposit approval becomes "practice balance adjustment" with audit log

## Option 2: Real Investment Platform (requires licensed financial infrastructure)
If this is a real regulated investment platform:
- Use a licensed payment processor (Stripe, etc.) — not raw crypto wallets
- Register as a financial services provider / money transmitter in your jurisdiction
- Return rates must be based on real market performance, not fixed percentages
- Claude Code can still build the UI but will not hard-code fraudulent return rates or raw wallet addresses

---

*This analysis was produced by reverse-engineering the aristomarketcap.com JS bundle.*
