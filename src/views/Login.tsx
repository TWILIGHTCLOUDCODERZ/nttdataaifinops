import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { AuthNavbar } from '../components/AuthNavbar';
import { Mail, Lock, ArrowRight, Brain, Sparkles, Shield } from 'lucide-react';

interface LoginProps {
  onToggleMode: () => void;
}

export function Login({ onToggleMode }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);
    if (result.error) setError(result.error);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AuthNavbar currentPage="login" onNavigate={() => onToggleMode()} />

      {/* Main Content */}
      <section className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-12rem)]">
            {/* Left Panel - NTT DATA Branding */}
            <div className="flex flex-col justify-center lg:pr-8">
              {/* Logo and Branding */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-xl leading-tight">NTT DATA</h1>
                  <p className="text-blue-400 text-sm font-medium">Cloud Cost Intelligence</p>
                </div>
              </div>

              {/* Powered by AI Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 w-fit mb-8">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-medium text-sm">Powered by AI</span>
              </div>

              {/* Tagline */}
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                Optimize Cloud Costs<br />
                <span className="text-blue-400">With Intelligence</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md leading-relaxed">
                Monitor, analyze, and optimize your multi-cloud infrastructure with AI-driven insights across AWS, Azure, GCP, and more.
              </p>

              {/* Key Points */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Reduce cloud spend by up to 40%</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Real-time cost visibility across providers</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>AI-powered recommendations</span>
                </div>
              </div>
            </div>

            {/* Center - Dashboard Preview Image */}
            <div className="flex justify-center lg:justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-60" />
                <img
                  src="/images/Finops_dashboard.png"
                  alt="FinOps Dashboard Preview"
                  className="relative w-full max-w-2xl rounded-2xl shadow-2xl shadow-blue-900/30 border border-slate-700/50"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Form - Below the image on mobile, bottom section on desktop */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-1">Sign In</h2>
              <p className="text-slate-400 text-sm">Access your cloud dashboard</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={onToggleMode}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Enterprise-Grade Security
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/60 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} NTT DATA Cloud Cost Intelligence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
