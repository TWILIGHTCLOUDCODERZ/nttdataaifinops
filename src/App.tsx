import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './views/Dashboard';
import { CostExplorer } from './views/CostExplorer';
import { BusinessMapping } from './views/BusinessMapping';
import { Resources } from './views/Resources';
import { Recommendations } from './views/Recommendations';
import { Kubernetes } from './views/Kubernetes';
import { Commitments } from './views/Commitments';
import { Analytics } from './views/Analytics';
import { Copilot } from './views/Copilot';
import { Governance } from './views/Governance';
import { AITokenAnalytics } from './views/AITokenAnalytics';
import { LandingPage } from './views/LandingPage';
import DeploymentGuide from './views/DeploymentGuide';
import { ViewType } from './types';
import { TimeFilterProvider } from './lib/TimeFilterContext';
import { DataProvider } from './lib/DataContext';
import { AuthProvider, useAuth } from './lib/AuthContext';

type AuthMode = 'login' | 'signup';

function AppContent() {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleOpenSignIn = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleToggleAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleViewChange} />;
      case 'cost-explorer':
        return <CostExplorer />;
      case 'business-mapping':
        return <BusinessMapping />;
      case 'resources':
        return <Resources />;
      case 'recommendations':
        return <Recommendations />;
      case 'kubernetes':
        return <Kubernetes />;
      case 'commitments':
        return <Commitments />;
      case 'analytics':
        return <Analytics />;
      case 'copilot':
        return <Copilot />;
      case 'governance':
        return <Governance />;
      case 'ai-analytics':
        return <AITokenAnalytics />;
      case 'deployment-guide':
        return <DeploymentGuide />;
      default:
        return <Dashboard onNavigate={handleViewChange} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onSignIn={handleOpenSignIn} />
        <AuthModal
          isOpen={authModalOpen}
          mode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onToggleMode={handleToggleAuthMode}
        />
      </>
    );
  }

  return (
    <TimeFilterProvider>
      <DataProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar
              currentView={currentView}
              onViewChange={handleViewChange}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile Sidebar */}
          <div
            className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              currentView={currentView}
              onViewChange={handleViewChange}
              isCollapsed={false}
              onToggleCollapse={() => {}}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              currentView={currentView}
            />
            <main className="flex-1 overflow-auto">
              <div className="min-h-full">
                {renderView()}
              </div>
            </main>
          </div>
        </div>
      </DataProvider>
    </TimeFilterProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
