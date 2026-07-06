import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Bot,
  User,
  Loader2,
  ChevronDown
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function Copilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI FinOps Copilot. I can help you analyze cloud costs, identify savings opportunities, and answer questions about your cloud spending. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = generateResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responses,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const suggestions = [
    { icon: TrendingUp, text: 'Why did AWS spend increase last month?', color: 'text-coral-400' },
    { icon: Lightbulb, text: 'Show top cost drivers this quarter', color: 'text-amber-400' },
    { icon: AlertCircle, text: 'Which resources are idle?', color: 'text-primary-400' },
    { icon: Sparkles, text: 'How can I save $50,000 this month?', color: 'text-emerald-400' },
  ];

  return (
    <div className="p-6 h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            AI FinOps Copilot
          </h2>
          <p className="text-sm text-navy-500 mt-1">
            Ask questions about your cloud costs in natural language
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-info">GPT-4o</span>
          <span className="badge badge-success">Active</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-navy-800/50 text-navy-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-primary-200' : 'text-navy-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-navy-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-navy-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-navy-400">
                  <span className="text-sm">Analyzing your cloud data</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-navy-800/50">
          {/* Quick suggestions */}
          {messages.length <= 2 && (
            <div className="mb-4">
              <p className="text-xs text-navy-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(s.text)}
                    className="flex items-center gap-2 px-3 py-2 bg-navy-800/50 hover:bg-navy-800 rounded-lg text-xs text-navy-300 transition-colors"
                  >
                    <s.icon className={`w-3 h-3 ${s.color}`} />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about cloud costs, savings, or resources..."
                className="input w-full pr-12"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:bg-navy-700 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <p className="text-xs text-navy-600 mt-2">
            Powered by AI • Data from your cloud accounts is analyzed securely
          </p>
        </div>
      </div>
    </div>
  );
}

function generateResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('aws') && (q.includes('increase') || q.includes('why'))) {
    return `Based on my analysis of your AWS spending patterns:

**Key Findings:**
• AWS spending increased by 12.3% last month, totaling $248K
• Primary driver: EC2 instance count increased by 15 instances in us-east-1
• Top cost services: EC2 (45%), RDS (28%), S3 (12%)

**Root Causes Identified:**
1. **Orphaned instances detected** - 3 EC2 instances running without tags (potential waste)
2. **Increased data transfer** - 23% more egress traffic from S3
3. **RDS storage growth** - Production databases using 85% provisioned storage

**Recommendations:**
• Right-size the 3 orphaned EC2 instances - Save ~$2,400/month
• Review S3 data transfer patterns - Potential $1,800/month savings
• Enable S3 Intelligent-Tiering on frequently accessed buckets

Would you like me to create a detailed action plan for these optimizations?`;
  }

  if (q.includes('top cost') || q.includes('cost drivers')) {
    return `Here are your top cost drivers for the current quarter:

**Top 10 Services by Cost:**
1. **EC2** - $89,450/month (32% of total)
2. **RDS** - $56,230/month (20%)
3. **S3** - $33,670/month (12%)
4. **EKS** - $28,540/month (10%)
5. **Lambda** - $19,230/month (7%)
6. **CloudWatch** - $14,120/month (5%)
7. **DynamoDB** - $11,450/month (4%)
8. **Elastic Load Balancing** - $9,340/month (3%)
9. **VPC** - $7,890/month (3%)
10. **CloudFront** - $6,230/month (2%)

**Trend Analysis:**
• EC2 costs are trending up 8% MoM
• EKS costs stabilized after optimization
• DynamoDB showing unusual spike (potential caching issue)

Should I drill down into any specific service?`;
  }

  if (q.includes('idle') || q.includes('unused') || q.includes('waste')) {
    return `I've identified several idle and underutilized resources:

**Idle Resources (0% utilization):**
| Resource | Type | Monthly Cost | Recommendation |
|----------|------|--------------|----------------|
| i-0abc123 | EC2 | $2,400 | Terminate or snapshot |
| vol-xyz789 | EBS Volume | $520 | Delete if unattached |
| db-stopped | RDS | $1,200 | Delete or start |

**Underutilized Resources (<30% utilization):**
| Resource | Utilization | Monthly Cost | Potential Savings |
|----------|-------------|--------------|------------------|
| i-0def456 | 15% | $3,600 | Right-size to t3.large |
| i-0ghi789 | 22% | $2,100 | Downsize or schedule stop |
| prod-cluster | 18% | $1,850 | Pod rightsizing |

**Total Potential Monthly Savings: $8,670**

Would you like me to automatically generate rightsizing recommendations for these resources?`;
  }

  if (q.includes('save') || q.includes('optimization')) {
    return `I've analyzed your entire cloud environment and found significant savings opportunities:

**Immediate Savings Opportunities:**
1. **Reserved Instance Purchases** - $45,000/month
   • EC2: Purchase 1-year RI for stable workloads
   • RDS: 3-year RI for production databases

2. **Right-sizing Underutilized Resources** - $12,300/month
   • 8 EC2 instances at <30% utilization
   • 4 RDS instances oversized

3. **Spot Instances** - $8,500/month
   • Perfect for: Dev environments, batch processing
   • Risk: Low (stateless workloads)

4. **Storage Optimization** - $6,200/month
   • Enable S3 Intelligent-Tiering
   • Delete old EBS snapshots

**Total Potential Savings: $72,000/month ($864K/year)**

**ROI Analysis:**
• Implementation effort: 2-3 weeks
• First-year savings: $864,000
• Payback period: Immediate

Should I create a prioritized implementation plan for these savings?`;
  }

  return `I've analyzed your query and found relevant insights:

**Summary Analysis:**
Based on your recent cloud spending data, I can provide the following insights:

• **Monthly cloud spend:** $2.85M across 7 cloud providers
• **Month-over-month change:** +8.3%
• **Potential savings identified:** $482K through optimization
• **FinOps maturity score:** 78/100

**Recommended Actions:**
1. Review the 25 open optimization recommendations
2. Consider deploying Reserved Instances for stable workloads
3. Implement automated rightsizing policies
4. Configure budget alerts to prevent overruns

Would you like me to elaborate on any of these areas, or ask a more specific question about your cloud costs?`;
}
