import {
  LayoutDashboard,
  Cloud,
  Building2,
  Server,
  Sparkles,
  Container,
  BarChart3,
  MessageSquare,
  Shield,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Cpu,
  Rocket
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems: { id: ViewType; label: string; icon: React.ElementType; section: string }[] = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { id: 'cost-explorer', label: 'Cost Explorer', icon: Cloud, section: 'Cost Management' },
  { id: 'business-mapping', label: 'Business Mapping', icon: Building2, section: 'Cost Management' },
  { id: 'resources', label: 'Resource Inventory', icon: Server, section: 'Operations' },
  { id: 'recommendations', label: 'AI Optimization', icon: Sparkles, section: 'Operations' },
  { id: 'kubernetes', label: 'Kubernetes', icon: Container, section: 'Operations' },
  { id: 'analytics', label: 'FinOps Analytics', icon: BarChart3, section: 'Insights' },
  { id: 'ai-analytics', label: 'AI Token Analytics', icon: Cpu, section: 'Insights' },
  { id: 'copilot', label: 'AI Copilot', icon: MessageSquare, section: 'Insights' },
  { id: 'governance', label: 'Governance', icon: Shield, section: 'Governance' },
];

export function Sidebar({ currentView, onViewChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <aside
      className={`sidebar-transition h-screen bg-navy-900/90 backdrop-blur-md border-r border-navy-800/50 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-navy-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-semibold text-navy-100 text-sm leading-tight">NTT DATA</h1>
              <p className="text-xs text-primary-400 font-medium">FinOps Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-4">
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold text-navy-500 uppercase tracking-wider">
                {section}
              </p>
            )}
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`nav-item w-full ${currentView === item.id ? 'nav-item-active' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && currentView === item.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-navy-800/50 p-2">
        <button
          onClick={() => onViewChange('deployment-guide')}
          className={`nav-item w-full ${currentView === 'deployment-guide' ? 'nav-item-active' : ''}`}
          title={isCollapsed ? 'Deployment Guide' : undefined}
        >
          <Rocket className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Deployment Guide</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className="nav-item w-full justify-center group mt-1"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 group-hover:text-navy-200 transition-colors" />
          ) : (
            <ChevronLeft className="w-5 h-5 group-hover:text-navy-200 transition-colors" />
          )}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
