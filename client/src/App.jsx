import './styles/styles.css';
import './styles/affirmations.css';
import './styles/dashboard.css';
import './styles/evidence-practices.css';
import './styles/kids.css';
import './styles/landing.css';
import './styles/leadership-report.css';
import './styles/org-dashboard.css';
import './styles/payment-ui.css';
import './styles/research.css';
import './styles/sharing.css';
import './styles/teams-enhanced.css';
import './styles/upsell.css';
import './styles/icons.css';

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

// Existing pages
import LandingPage from './pages/LandingPage.jsx';
import AssessmentHub from './pages/AssessmentHub.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import Auth0LoginBar from './components/Auth0LoginBar.jsx';

// New migrated pages
import AboutPage from './pages/AboutPage.jsx';
import ResearchPage from './pages/ResearchPage.jsx';
import FounderPage from './pages/FounderPage.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import JoinPage from './pages/JoinPage.jsx';
import TeamsLandingPage from './pages/TeamsLandingPage.jsx';
import PricingTeamsPage from './pages/PricingTeamsPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import KidsPage from './pages/KidsPage.jsx';
import AtlasPage from './pages/AtlasPage.jsx';
import ComparisonPage from './pages/ComparisonPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DashboardAdvancedPage from './pages/DashboardAdvancedPage.jsx';
import TeamAnalyticsPage from './pages/TeamAnalyticsPage.jsx';
import TeamsResourcesPage from './pages/TeamsResourcesPage.jsx';
import TeamsFacilitationPage from './pages/TeamsFacilitationPage.jsx';
import TeamsActivitiesPage from './pages/TeamsActivitiesPage.jsx';
import InsightsTeamResiliencePage from './pages/InsightsTeamResiliencePage.jsx';
import InsightsSixDimensionsPage from './pages/InsightsSixDimensionsPage.jsx';
import InsightsResilienceUnderPressurePage from './pages/InsightsResilienceUnderPressurePage.jsx';
import WorkshopSomaticPage from './pages/WorkshopSomaticPage.jsx';
import WorkshopEmotionalPage from './pages/WorkshopEmotionalPage.jsx';
import WorkshopSpiritualPage from './pages/WorkshopSpiritualPage.jsx';
import WorkshopCognitivePage from './pages/WorkshopCognitivePage.jsx';
import WorkshopAgenticPage from './pages/WorkshopAgenticPage.jsx';
import WorkshopRelationalPage from './pages/WorkshopRelationalPage.jsx';
import LeadershipReportPage from './pages/LeadershipReportPage.jsx';
import OrgDashboardPage from './pages/OrgDashboardPage.jsx';
import AdminLeadsPage from './pages/AdminLeadsPage.jsx';
import GamificationPage from './pages/GamificationPage.jsx';

function AuthenticatedApp({ user, getAccessTokenSilently, logout }) {
  const [page, setPage] = useState('home');
  const [paymentResult, setPaymentResult] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => setAccessToken(token))
      .catch((err) => {
        console.error('Failed to retrieve Auth0 access token:', err);
        setAccessToken('');
      });
  }, [getAccessTokenSilently]);

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setPage('success');
  };

  if (page === 'success') {
    return (
      <>
        <Auth0LoginBar />
        <PaymentSuccess result={paymentResult} onNewPayment={() => setPage('home')} onLogout={handleLogout} />
      </>
    );
  }

  if (page === 'payment') {
    return (
      <>
        <Auth0LoginBar />
        <Payment token={accessToken} onSuccess={handlePaymentSuccess} onLogout={handleLogout} />
      </>
    );
  }

  return (
    <AssessmentHub
      userEmail={user?.email}
      onUpgrade={() => setPage('payment')}
      onLogout={handleLogout}
    />
  );
}

function HomeRoute() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently, logout } = useAuth0();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
        <span style={{ color: '#a0aec0', fontSize: 16 }}>Loading…</span>
      </div>
    );
  }
  if (!isAuthenticated) return <LandingPage />;
  return <AuthenticatedApp user={user} getAccessTokenSilently={getAccessTokenSilently} logout={logout} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public informational pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/founder" element={<FounderPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/teams" element={<TeamsLandingPage />} />
        <Route path="/pricing-teams" element={<PricingTeamsPage />} />
        <Route path="/resources" element={<ResourcesPage />} />

        {/* Insight sub-pages */}
        <Route path="/insights/team-resilience" element={<InsightsTeamResiliencePage />} />
        <Route path="/insights/six-resilience-dimensions" element={<InsightsSixDimensionsPage />} />
        <Route path="/insights/resilience-under-pressure" element={<InsightsResilienceUnderPressurePage />} />

        {/* Workshop guides */}
        <Route path="/resources/workshop-guides/somatic" element={<WorkshopSomaticPage />} />
        <Route path="/resources/workshop-guides/emotional" element={<WorkshopEmotionalPage />} />
        <Route path="/resources/workshop-guides/spiritual" element={<WorkshopSpiritualPage />} />
        <Route path="/resources/workshop-guides/cognitive" element={<WorkshopCognitivePage />} />
        <Route path="/resources/workshop-guides/agentic" element={<WorkshopAgenticPage />} />
        <Route path="/resources/workshop-guides/relational" element={<WorkshopRelationalPage />} />

        {/* Assessment routes */}
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/legacy-results" element={<Navigate to="/results" replace />} />

        {/* App routes */}
        <Route path="/team" element={<TeamPage />} />
        <Route path="/kids" element={<KidsPage />} />
        <Route path="/atlas" element={<AtlasPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard-advanced" element={<DashboardAdvancedPage />} />
        <Route path="/team-analytics" element={<TeamAnalyticsPage />} />
        <Route path="/teams-resources" element={<TeamsResourcesPage />} />
        <Route path="/teams-facilitation" element={<TeamsFacilitationPage />} />
        <Route path="/teams-activities" element={<TeamsActivitiesPage />} />

        {/* Admin & org pages */}
        <Route path="/admin/leads" element={<AdminLeadsPage />} />
        <Route path="/leadership-report" element={<LeadershipReportPage />} />
        <Route path="/org-dashboard" element={<OrgDashboardPage />} />

        {/* Gamification */}
        <Route path="/gamification" element={<GamificationPage />} />

        {/* Default auth-gated home route */}
        <Route path="/*" element={<HomeRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
