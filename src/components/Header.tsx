import {
  Bell,
  Search,
  Globe,
  ChevronDown,
  Menu,
  TrendingUp,
  Calendar,
  LogOut,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTimeFilter } from '../lib/TimeFilterContext';
import { useAuth } from '../lib/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  currentView: string;
}

const viewTitles: Record<string, string> = {
  dashboard: 'Executive Dashboard',
  'cost-explorer': 'Multi-Cloud Cost Explorer',
  'business-mapping': 'Business Mapping Engine',
  resources: 'Resource Inventory',
  recommendations: 'AI Cost Optimization',
  kubernetes: 'Kubernetes Cost Management',
  commitments: 'Commitment Management',
  analytics: 'FinOps Analytics',
  copilot: 'AI Copilot',
  governance: 'Governance Center',
};

export function Header({ onMenuClick, currentView }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { period, setPeriod, periods, allPeriodLabels } = useTimeFilter();
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-navy-900/80 backdrop-blur-md border-b border-navy-800/50 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-navy-800/50 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-navy-400" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-navy-100 truncate">
            {viewTitles[currentView] || 'Dashboard'}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-xs text-navy-500">
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
          <input
            type="text"
            placeholder="Search resources, costs, recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-10 pr-16 py-2 text-sm"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-navy-500 bg-navy-800 rounded border border-navy-700">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Time period selector */}
        <div className="relative hidden sm:block" ref={dropdownRef}>
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-navy-800/50 hover:bg-navy-800 rounded-lg text-sm text-navy-300 transition-colors border border-navy-700/50"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden lg:inline">{allPeriodLabels[period]}</span>
            <ChevronDown className="w-4 h-4 text-navy-500" />
          </button>
          {showPeriodDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    period === p
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-navy-300 hover:bg-navy-700'
                  }`}
                >
                  {allPeriodLabels[p]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick insights */}
        <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-sm text-emerald-400 border border-emerald-500/20 transition-colors">
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline-flex items-center gap-1">
            <span className="font-medium">$482K</span>
            <span className="text-emerald-500/80 hidden lg:inline">saved</span>
          </span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-navy-800/50 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-navy-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
        </button>

        {/* Language */}
        <button className="p-2 hover:bg-navy-800/50 rounded-lg transition-colors hidden md:block">
          <Globe className="w-5 h-5 text-navy-400" />
        </button>

        {/* User avatar */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 pl-2 sm:pl-3 pr-2 py-1 sm:py-1.5 bg-navy-800/50 hover:bg-navy-800 rounded-lg transition-colors border border-navy-700/50"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-navy-100 truncate max-w-[120px]">
                {user?.email?.split('@')[0] ?? 'User'}
              </p>
              <p className="text-xs text-navy-500">Cloud Architect</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-navy-500 hidden lg:block transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showUserDropdown && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-navy-700">
                <p className="font-medium text-navy-100 truncate">{user?.email ?? 'User'}</p>
                <p className="text-xs text-navy-500">Cloud Architect</p>
                <p className="text-xs text-primary-400 mt-1">NTT DATA Cloud Intelligence</p>
              </div>
              <div className="p-1">
                {['Profile Settings', 'Preferences', 'API Keys', 'Help & Support'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full px-3 py-2 text-left text-sm text-navy-300 hover:bg-navy-700 rounded-md transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="p-1 border-t border-navy-700">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    signOut();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-coral-400 hover:bg-coral-500/10 rounded-md transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
