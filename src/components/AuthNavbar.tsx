import { useState } from 'react';
import { Brain, Menu, X, TrendingUp, GitBranch, Layers, Sparkles } from 'lucide-react';

interface AuthNavbarProps {
  onSignIn: () => void;
}

const navLinks = [
  {
    label: 'Features',
    href: '#features',
    icon: Layers,
  },
  {
    label: 'Benefits',
    href: '#benefits',
    icon: TrendingUp,
  },
  {
    label: 'Workflow',
    href: '#workflow',
    icon: GitBranch,
  },
];

export function AuthNavbar({ onSignIn }: AuthNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="h-16 border-b border-slate-800/60 bg-slate-900/95 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-white font-semibold text-sm">NTT DATA Cloud Cost Intelligence</h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 text-[10px] font-medium">Powered by AI</span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-2"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
          >
            Sign In
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-b border-slate-800/60 shadow-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </a>
            ))}
            <div className="pt-3 border-t border-slate-800/60 mt-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all text-center"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
