import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/layouts/app-shell";
import { ProtectedRoute, AdminRoute } from "@/layouts/protected-route";
import { PageSpinner } from "@/components/common/spinner";

const AuthPage = lazy(() => import("@/pages/auth-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const MarketsPage = lazy(() => import("@/pages/markets-page"));
const AssetDetailPage = lazy(() => import("@/pages/asset-detail-page"));
const PortfolioPage = lazy(() => import("@/pages/portfolio-page"));
const WatchlistPage = lazy(() => import("@/pages/watchlist-page"));
const PaperTradingPage = lazy(() => import("@/pages/paper-trading-page"));
const DepositPage = lazy(() => import("@/pages/deposit-page"));
const TradersPage = lazy(() => import("@/pages/traders-page"));
const EducationIndexPage = lazy(() => import("@/pages/education/education-index-page"));
const EducationArticlePage = lazy(() => import("@/pages/education/education-article-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const SupportPage = lazy(() => import("@/pages/support-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/markets" element={<MarketsPage />} />
            <Route path="/markets/:symbol" element={<AssetDetailPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/paper-trading" element={<PaperTradingPage />} />
            <Route path="/deposits" element={<DepositPage />} />
            <Route path="/traders" element={<TradersPage />} />
            <Route path="/education" element={<EducationIndexPage />} />
            <Route path="/education/stocks" element={<EducationArticlePage slugOverride="stocks" />} />
            <Route path="/education/crypto" element={<EducationArticlePage slugOverride="crypto" />} />
            <Route path="/education/bonds" element={<EducationArticlePage slugOverride="bonds" />} />
            <Route path="/education/etfs" element={<EducationArticlePage slugOverride="etfs" />} />
            <Route path="/education/:slug" element={<EducationArticlePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/audit-logs" element={<AdminPage initialTab="audit" />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
