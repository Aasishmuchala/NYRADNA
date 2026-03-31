import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import AuthGuard from '@/components/ui/AuthGuard';
import EnvBanner from '@/components/ui/EnvBanner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { WizardProvider } from '@/context/WizardContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ErrorBoundary>
        <WizardProvider>
          <div className="min-h-screen bg-surface">
            <Sidebar />
            <TopNav />
            <div className="md:ml-64 pt-32 pb-24 px-16 min-h-screen">
              <EnvBanner />
              <main>
                {children}
              </main>
            </div>
          </div>
        </WizardProvider>
      </ErrorBoundary>
    </AuthGuard>
  );
}
