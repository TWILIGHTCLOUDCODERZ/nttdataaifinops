import { AuthNavbar } from '../components/AuthNavbar';
import {
  Brain,
  Layers,
  TrendingUp,
  GitBranch,
  Cloud,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  Target,
  PieChart,
  LineChart,
  Settings,
  CheckCircle,
  ArrowRight,
  Globe,
  Lock,
  Sparkles,
  Users,
  Building2,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

const features = [
  {
    icon: Cloud,
    title: 'Multi-Cloud Visibility',
    description: 'Unified cost monitoring across AWS, Azure, GCP, and Kubernetes with real-time dashboards and alerts.',
    color: 'blue',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Machine learning algorithms identify savings opportunities and predict future spending patterns.',
    color: 'cyan',
  },
  {
    icon: DollarSign,
    title: 'Cost Allocation Engine',
    description: 'Tag and map costs to business units, projects, and teams with automated allocation rules.',
    color: 'emerald',
  },
  {
    icon: PieChart,
    title: 'Commitment Optimization',
    description: 'Intelligent recommendations for reserved instances, savings plans, and commitments.',
    color: 'amber',
  },
  {
    icon: Shield,
    title: 'Governance & Compliance',
    description: 'Policy enforcement, budget controls, and compliance reporting across your cloud footprint.',
    color: 'rose',
  },
  {
    icon: BarChart3,
    title: 'Kubernetes Cost Tracking',
    description: ' granular container-level cost visibility with namespace and workload attribution.',
    color: 'violet',
  },
];

const benefits = [
  {
    value: '40%',
    label: 'Average Cost Reduction',
    description: 'Customers typically achieve 40% savings within the first 6 months',
  },
  {
    value: '15min',
    label: 'Time to First Insight',
    description: 'Connect your cloud accounts and get actionable insights in minutes',
  },
  {
    value: '99.9%',
    label: 'Platform Uptime',
    description: 'Enterprise-grade reliability with global redundancy',
  },
  {
    value: '50+',
    label: 'Cloud Integrations',
    description: 'Native integrations with all major cloud service providers',
  },
];

const workflowSteps = [
  {
    step: 1,
    title: 'Connect Cloud Accounts',
    description: 'Securely link your AWS, Azure, GCP, and Kubernetes clusters with read-only access. No changes to your infrastructure.',
    icon: Cloud,
  },
  {
    step: 2,
    title: 'Auto-Discover Resources',
    description: 'Automated discovery maps all cloud resources, identifies tagging gaps, and builds a complete inventory.',
    icon: Layers,
  },
  {
    step: 3,
    title: 'AI Analyze & Recommend',
    description: 'Our AI engine analyzes spend patterns, identifies anomalies, and generates prioritized recommendations.',
    icon: Sparkles,
  },
  {
    step: 4,
    title: 'Implement & Save',
    description: 'Execute recommendations with one click, track savings, and continuously optimize your cloud spend.',
    icon: TrendingUp,
  },
];

const trustedBy = [
  'Enterprise organizations worldwide trust NTT DATA Cloud Cost Intelligence',
];

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <AuthNavbar onSignIn={onSignIn} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">AI-Powered Cloud Cost Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Optimize Multi-Cloud Costs
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                With Intelligence
              </span>
            </h1>
            <p className="text-slate-400 text-lg sm:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
              Monitor, analyze, and optimize cloud infrastructure spend across AWS, Azure, GCP, and Kubernetes
              with AI-driven insights and automated recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onSignIn}
                className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 hover:shadow-blue-600/40 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group"
              >
                Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Dashboard Preview - Center Image */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-3xl opacity-50" />
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-2xl opacity-60" />
            <img
              src="/images/Finops_dashboard.png"
              alt="FinOps Dashboard Preview"
              className="relative w-full rounded-2xl shadow-2xl shadow-blue-900/40 border border-slate-700/50"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-white font-semibold mb-1">{stat.label}</div>
                <div className="text-slate-500 text-sm">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Comprehensive Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need for Cloud Cost Management
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A complete platform designed for FinOps teams, cloud architects, and finance leaders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const colorMap: Record<string, string> = {
                blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
                cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
                emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
                amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
                rose: 'from-rose-500/20 to-rose-600/20 border-rose-500/30',
                violet: 'from-violet-500/20 to-violet-600/20 border-violet-500/30',
              };
              const iconColorMap: Record<string, string> = {
                blue: 'bg-blue-500/20 text-blue-400',
                cyan: 'bg-cyan-500/20 text-cyan-400',
                emerald: 'bg-emerald-500/20 text-emerald-400',
                amber: 'bg-amber-500/20 text-amber-400',
                rose: 'bg-rose-500/20 text-rose-400',
                violet: 'bg-violet-500/20 text-violet-400',
              };

              return (
                <div
                  key={index}
                  className={`group relative p-6 rounded-2xl bg-gradient-to-br ${colorMap[feature.color]} border backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}
                >
                  <div className={`w-12 h-12 rounded-xl ${iconColorMap[feature.color]} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium">Proven Results</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Drive Measurable Business Impact
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: DollarSign,
                    title: 'Reduce Cloud Spend',
                    description: 'Identify and eliminate waste, optimize commitments, and right-size resources to reduce costs by up to 40%.',
                  },
                  {
                    icon: Target,
                    title: 'Improve Forecasting Accuracy',
                    description: 'AI-powered forecasting helps you predict spend accurately and avoid surprise bills.',
                  },
                  {
                    icon: Users,
                    title: 'Enable Team Accountability',
                    description: 'Tag and allocate costs to teams and projects, driving ownership and responsible spending.',
                  },
                  {
                    icon: Shield,
                    title: 'Ensure Compliance',
                    description: 'Automated policies and audit trails keep your cloud spend compliant and secure.',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-40" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monthly Savings</span>
                  <span className="text-emerald-400 font-semibold">+32.5%</span>
                </div>
                <div className="h-32 flex items-end gap-2">
                  {[40, 55, 45, 60, 75, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">$482K</div>
                    <div className="text-slate-500 text-sm">Annual Savings</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white">156</div>
                    <div className="text-slate-500 text-sm">Recommendations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">Simple Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start Saving in Four Steps
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Get up and running quickly with our streamlined onboarding process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {step.step}
                    </div>
                    <step.icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 mb-6">{trustedBy[0]}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['AWS Partner', 'Azure Partner', 'GCP Partner', 'Kubernetes', 'FinOps Foundation'].map(
              (partner) => (
                <div key={partner} className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-medium">
                  {partner}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-3xl p-12">
            <Brain className="w-12 h-12 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Optimize Your Cloud Costs?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of enterprises saving millions with AI-powered cloud cost management.
            </p>
            <div className="flex flex-col items-center gap-4 justify-center">
              <button
                onClick={onSignIn}
                className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 hover:shadow-blue-600/40 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group"
              >
                Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/60 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">NTT DATA</h3>
                  <p className="text-blue-400 text-xs">Cloud Cost Intelligence</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                AI-powered cloud cost management for modern enterprises.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Benefits</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} NTT DATA Cloud Cost Intelligence. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
