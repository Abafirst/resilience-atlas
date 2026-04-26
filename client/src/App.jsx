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
import './styles/resources.css';
import './styles/sharing.css';
import './styles/teams-enhanced.css';
import './styles/upsell.css';
import './styles/icons.css';
import './styles/soft-storytelling.css';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SiteFooter from './components/SiteFooter.jsx';
import { useAuth0 } from '@auth0/auth0-react';

// Existing pages
import LandingPage from './pages/LandingPage.jsx';
import AssessmentHub from './pages/AssessmentHub.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
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
import OrgGamificationPage from './pages/OrgGamificationPage.jsx';
import TeamManagementPage from './pages/TeamManagementPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import ResultsHistoryPage from './pages/ResultsHistoryPage.jsx';
import CompleteProfilePage from './pages/CompleteProfilePage.jsx';
import IATLASCurriculumPage from './pages/IATLASCurriculumPage.jsx';
import IATLASDashboardPage from './pages/IATLASDashboardPage.jsx';
import IATLASKidsLandingPage from './pages/IATLASKidsLandingPage.jsx';
import DimensionCurriculumPage from './components/IATLAS/DimensionCurriculumPage.jsx';
import SkillModulePage from './components/IATLAS/SkillModulePage.jsx';
import KidsAgeGroupPage from './components/IATLAS/Kids/KidsAgeGroupPage.jsx';
import KidsDimensionActivities from './components/IATLAS/Kids/KidsDimensionActivities.jsx';
import ContentRoadmapPage from './components/IATLAS/ContentRoadmapPage.jsx';
import PractitionerProtocolLibrary from './pages/PractitionerProtocolLibrary.jsx';
import SessionPlansPage from './pages/SessionPlansPage.jsx';
import ChildProfilesPage from './pages/ChildProfilesPage.jsx';
import { apiUrl } from './api/baseUrl.js';
import AndroidWebModal from './components/AndroidWebModal.jsx';
import { isCapacitorAndroid } from './utils/platform.js';
import { ProfileProvider } from './contexts/ProfileContext.jsx';

function AuthenticatedApp({ user, getAccessTokenSilently, logout }) {
  const [page, setPage] = useState('home');
  const [paymentResult, setPaymentResult] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [showAndroidModal, setShowAndroidModal] = useState(false);

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
    <>
      <AssessmentHub
        user={user}
        userEmail={user?.email}
        onUpgrade={() => {
          if (isCapacitorAndroid()) {
            setShowAndroidModal(true);
          } else {
            setPage('payment');
          }
        }}
        onLogout={handleLogout}
      />
      {showAndroidModal && (
        <AndroidWebModal onClose={() => setShowAndroidModal(false)} />
      )}
    </>
  );
}

/**
 * RequireProfileCompletion — global guard that runs after authentication.
 *
 * After a user logs in via Auth0, this wrapper checks whether they have a full
 * name stored in the app database.  If not, they are redirected to
 * /complete-profile so the name can be captured before they continue.
 *
 * Guard rules:
 *  - Skip when the user is not authenticated (Auth0 still loading, or not
 *    logged in).
 *  - Skip when already on /complete-profile (avoid redirect loop).
 *  - Call GET /api/auth/profile-status?email=... with a Bearer token.
 *  - If hasName === false, redirect to /complete-profile.
 *  - Fail open: if the API call fails, allow the user through.
 *  - Show a brief loading spinner while checking.
 */
function RequireProfileCompletion({ children }) {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [checking, setChecking] = useState(false);
  const checked    = useRef(false);

  useEffect(() => {
    // Skip when not authenticated, still loading, already on the target page,
    // or when we have already run the check this session.
    if (
      isLoading ||
      !isAuthenticated ||
      !user?.email ||
      location.pathname === '/complete-profile' ||
      checked.current
    ) {
      return;
    }

    checked.current = true;
    setChecking(true);

    const run = async () => {
      try {
        const token = await getAccessTokenSilently();
        const r = await fetch(
          apiUrl(`/api/auth/profile-status?email=${encodeURIComponent(user.email)}`),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!r.ok) return; // fail open
        const data = await r.json();

        if (data.hasName !== false) return; // name already stored — proceed

        // Check whether Auth0 already provided a usable display name.
        // user.name is set to the email address when no name was given, so
        // filter out any value that looks like an email address.
        const auth0Name = [user?.name, user?.given_name].find(
          (n) => n && n.trim().length >= 2 && n.trim().length <= 80 && !n.includes('@')
        );

        if (auth0Name) {
          // Auto-save the Auth0 name to the database and skip the profile page.
          const saveRes = await fetch(apiUrl('/api/auth/complete-profile'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email: user.email, fullName: auth0Name.trim() }),
          });
          if (!saveRes.ok) {
            // Save failed — fall through to the profile completion page.
            navigate('/complete-profile', { replace: true });
            return;
          }
          // Save succeeded — no redirect needed.
        } else {
          // No name from Auth0 — ask the user to provide one.
          navigate('/complete-profile', { replace: true });
        }
      } catch {
        // Fail open — do not block the user if the check fails.
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [isLoading, isAuthenticated, user, location.pathname, getAccessTokenSilently, navigate]);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
        <span style={{ color: '#a0aec0', fontSize: 16 }}>Loading…</span>
      </div>
    );
  }

  return children;
}

function HomeRoute() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently, logout } = useAuth0();
  const navigate = useNavigate();
  const [statusChecked, setStatusChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.email || statusChecked) return;

    const email = user.email;
    fetch(apiUrl(`/api/auth/user-status?email=${encodeURIComponent(email)}`))
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch user status');
        return r.json();
      })
      .then((data) => {
        setStatusChecked(true);
        if (data.hasCompletedQuiz) {
          navigate('/results', { replace: true });
        }
      })
      .catch(() => {
        // On error, fall through to normal AssessmentHub
        setStatusChecked(true);
      });
  }, [isAuthenticated, user, navigate, statusChecked]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
        <span style={{ color: '#a0aec0', fontSize: 16 }}>Loading…</span>
      </div>
    );
  }
  if (!isAuthenticated) return <LandingPage />;

  // Show a spinner while we check if the user has already completed the quiz.
  if (isAuthenticated && !statusChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
        <span style={{ color: '#a0aec0', fontSize: 16 }}>Loading…</span>
      </div>
    );
  }

  return <AuthenticatedApp user={user} getAccessTokenSilently={getAccessTokenSilently} logout={logout} />;
}

function AppShell() {
  const location = useLocation();
  const showFooter = !location.pathname.startsWith('/kids');

  return (
    <>
      <RequireProfileCompletion>
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
          <Route path="/team" element={<Navigate to="/teams" replace />} />
          <Route path="/kids" element={<KidsPage />} />
          <Route path="/atlas" element={<AtlasPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard-advanced" element={<DashboardAdvancedPage />} />
          <Route path="/team-analytics" element={<TeamAnalyticsPage />} />
          <Route path="/teams-resources" element={<TeamsResourcesPage />} />
          <Route path="/teams/resources" element={<TeamsResourcesPage />} />
          <Route path="/teams-facilitation" element={<TeamsFacilitationPage />} />
          <Route path="/teams/facilitation" element={<TeamsFacilitationPage />} />
          <Route path="/teams-activities" element={<TeamsActivitiesPage />} />
          <Route path="/teams/activities" element={<TeamsActivitiesPage />} />

          {/* Admin & org pages */}
          <Route path="/admin/leads" element={<AdminLeadsPage />} />
          <Route path="/leadership-report" element={<LeadershipReportPage />} />
          <Route path="/org-dashboard" element={<OrgDashboardPage />} />

          {/* Gamification */}
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/org-gamification/:orgId" element={<OrgGamificationPage />} />

          {/* Team Management */}
          <Route path="/team-management/:orgId" element={<TeamManagementPage />} />

          {/* Privacy & Data Control */}
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Returning-user hub — /login and /register redirect here */}
          <Route path="/results-history" element={<ResultsHistoryPage />} />

          {/* Post-login profile completion (skipped by RequireProfileCompletion guard) */}
          <Route path="/complete-profile" element={<CompleteProfilePage />} />

          {/* IATLAS Curriculum */}
          <Route path="/iatlas" element={<IATLASCurriculumPage />} />
          <Route path="/iatlas/dashboard" element={<IATLASDashboardPage />} />
          <Route path="/iatlas/kids" element={<IATLASKidsLandingPage />} />
          <Route path="/iatlas/kids/:ageGroup" element={<KidsAgeGroupPage />} />
          <Route path="/iatlas/kids/:ageGroup/:dimension" element={<KidsDimensionActivities />} />
          <Route path="/iatlas/roadmap" element={<ContentRoadmapPage />} />
          <Route path="/iatlas/clinical/aba-protocols" element={<PractitionerProtocolLibrary />} />
          <Route path="/iatlas/clinical/session-plans" element={<SessionPlansPage />} />
          <Route path="/iatlas/profiles" element={<ChildProfilesPage />} />
          <Route path="/iatlas/curriculum/:dimensionKey" element={<DimensionCurriculumPage />} />
          <Route path="/iatlas/skills/:dimensionKey/:skillId" element={<SkillModulePage />} />
          {/* Legacy redirect */}
          <Route path="/iarf" element={<Navigate to="/iatlas" replace />} />

          {/* Default auth-gated home route */}
          <Route path="/*" element={<HomeRoute />} />
        </Routes>
      </RequireProfileCompletion>
      {showFooter && <SiteFooter />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <AppShell />
      </ProfileProvider>
    </BrowserRouter>
  );
}
