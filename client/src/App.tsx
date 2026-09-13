import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { Login } from '@/pages/Login';
import { OnboardingWizard } from '@/pages/OnboardingWizard';
import { AcceptInvite } from '@/pages/AcceptInvite';
import { Landing } from '@/pages/Landing';
import { Privacy } from '@/pages/Privacy';
import { Terms } from '@/pages/Terms';
import { Dashboard } from '@/pages/Dashboard';
import { Leads } from '@/pages/Leads';
import { LeadDetail } from '@/pages/LeadDetail';
import { Contacts } from '@/pages/Contacts';
import { ContactDetail } from '@/pages/ContactDetail';
import { Companies } from '@/pages/Companies';
import { CompanyDetail } from '@/pages/CompanyDetail';
import { Deals } from '@/pages/Deals';
import { DealDetail } from '@/pages/DealDetail';
import { Pipeline } from '@/pages/Pipeline';
import { Tasks } from '@/pages/Tasks';
import { Calendar } from '@/pages/Calendar';
import { AIAssistant } from '@/pages/AIAssistant';
import { Analytics } from '@/pages/Analytics';
import { Reports } from '@/pages/Reports';
import { Automation } from '@/pages/Automation';
import { Team } from '@/pages/Team';
import { Settings } from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<OnboardingWizard />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/:id" element={<ContactDetail />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:id" element={<DealDetail />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/automation" element={<Automation />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
