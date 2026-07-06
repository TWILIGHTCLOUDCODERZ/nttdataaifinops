import { useState } from 'react';
import { Copy, Check, Lock, Unlock, ChevronRight, Terminal, Cloud, Key, Rocket, Globe, Shield, Settings } from 'lucide-react';

const PASSWORD = 'Deepan@123';

interface StepProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}

function Step({ number, title, icon, color, children }: StepProps) {
  return (
    <div className={`border-l-4 ${color} pl-6 py-4 bg-slate-800/50 rounded-r-lg mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-500/20')} flex items-center justify-center text-white font-bold`}>
          {number}
        </div>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-emerald-400 font-mono whitespace-pre-wrap">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors opacity-100"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-300" />
        )}
      </button>
    </div>
  );
}

function PasswordScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Deployment Guide</h1>
          <p className="text-slate-400">Enter password to access the deployment guide</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={`w-full px-4 py-3 bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors`}
            />
            {error && <p className="text-red-400 text-sm mt-2">Incorrect password</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Unlock className="w-5 h-5" />
            Unlock Guide
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DeploymentGuide() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full mb-4">
            <Rocket className="w-5 h-5" />
            <span className="font-medium">Production Ready</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Azure Deployment Guide</h1>
          <p className="text-slate-400 text-lg">Complete step-by-step guide to deploy your FinOps Dashboard to Azure App Service</p>
        </div>

        {/* Target Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Deployment Target</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Region</p>
              <p className="text-white font-medium">Southeast Asia</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">App Service Plan</p>
              <p className="text-white font-medium">sunway-plan (sunway-rg)</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Web App Name</p>
              <p className="text-white font-medium">nttdatamalaysia</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {/* Step 1 */}
          <Step
            number={1}
            title="Login to Azure"
            icon={<Cloud className="w-5 h-5 text-blue-400" />}
            color="border-blue-500"
          >
            <p className="text-slate-300 mb-4">Open PowerShell and login to your Azure account. A browser window will open for authentication.</p>
            <CodeBlock code={`az login`} />
            <p className="text-slate-400 text-sm mt-3">Verify your subscription:</p>
            <CodeBlock code={`az account show --query "{name:name, id:id}" -o table

# If multiple subscriptions, set the correct one:
az account set --subscription "YOUR_SUBSCRIPTION_NAME"`} />
          </Step>

          {/* Step 2 */}
          <Step
            number={2}
            title="Create Key Vault for Secrets"
            icon={<Key className="w-5 h-5 text-amber-400" />}
            color="border-amber-500"
          >
            <p className="text-slate-300 mb-4">Create an Azure Key Vault to securely store your application secrets.</p>
            <CodeBlock code={`az keyvault create --name nttdatamykeyvault --resource-group sunway-rg --location southeastasia --sku standard`} />
            <p className="text-slate-400 text-sm mt-4 mb-2">Store your secrets:</p>
            <CodeBlock code={`az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --value "https://your-project.supabase.co"

az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --value "your-anon-key-here"`} />
            <p className="text-slate-400 text-sm mt-4 mb-2">Verify secrets are stored:</p>
            <CodeBlock code={`az keyvault secret list --vault-name nttdatamykeyvault -o table`} />
          </Step>

          {/* Step 3 */}
          <Step
            number={3}
            title="Create Web App"
            icon={<Globe className="w-5 h-5 text-emerald-400" />}
            color="border-emerald-500"
          >
            <p className="text-slate-300 mb-4">Create the Web App using the existing App Service Plan. The <code className="text-amber-400">--%</code> syntax escapes the pipe character in PowerShell.</p>
            <CodeBlock code={`az webapp create --name nttdatamalaysia --resource-group sunway-rg --plan sunway-plan --% --runtime "NODE|22-lts"`} />
            <p className="text-slate-400 text-sm mt-4 mb-2">Verify app creation:</p>
            <CodeBlock code={`az webapp show --name nttdatamalaysia --resource-group sunway-rg --query defaultHostName -o tsv

# Output: nttdatamalaysia.azurewebsites.net`} />
          </Step>

          {/* Step 4 */}
          <Step
            number={4}
            title="Enable Managed Identity"
            icon={<Shield className="w-5 h-5 text-purple-400" />}
            color="border-purple-500"
          >
            <p className="text-slate-300 mb-4">Enable system-assigned managed identity for secure access to Key Vault.</p>
            <CodeBlock code={`az webapp identity assign --name nttdatamalaysia --resource-group sunway-rg

$principalId = az webapp identity show --name nttdatamalaysia --resource-group sunway-rg --query principalId -o tsv

Write-Host "Principal ID: $principalId"`} />
          </Step>

          {/* Step 5 */}
          <Step
            number={5}
            title="Grant Key Vault Access"
            icon={<Lock className="w-5 h-5 text-red-400" />}
            color="border-red-500"
          >
            <p className="text-slate-300 mb-4">Grant the Web App permission to read secrets from Key Vault.</p>
            <CodeBlock code={`# Set Key Vault policy
az keyvault set-policy --name nttdatamykeyvault --object-id $principalId --secret-permissions get list

# Assign Key Vault Secrets User role
az role assignment create \\
  --assignee-object-id $principalId \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope $(az keyvault show --name nttdatamykeyvault --query id -o tsv)`} />
          </Step>

          {/* Step 6 */}
          <Step
            number={6}
            title="Build Application Locally"
            icon={<Settings className="w-5 h-5 text-cyan-400" />}
            color="border-cyan-500"
          >
            <p className="text-slate-300 mb-4">Export secrets from Key Vault and build the application. Environment variables are baked into the build, so they must be set before building.</p>
            <CodeBlock code={`# Export secrets
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --query value -o tsv

$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --query value -o tsv

# Verify
Write-Host "URL: $env:VITE_SUPABASE_URL"

# Install dependencies and build
npm ci
npm run build`} />
          </Step>

          {/* Step 7 */}
          <Step
            number={7}
            title="Create Deployment Package"
            icon={<Terminal className="w-5 h-5 text-orange-400" />}
            color="border-orange-500"
          >
            <p className="text-slate-300 mb-4">Create a ZIP archive of the build output.</p>
            <CodeBlock code={`Compress-Archive -Path dist/* -DestinationPath deploy.zip -Force`} />
          </Step>

          {/* Step 8 */}
          <Step
            number={8}
            title="Deploy to Azure"
            icon={<Rocket className="w-5 h-5 text-pink-400" />}
            color="border-pink-500"
          >
            <p className="text-slate-300 mb-4">Deploy the application to Azure Web App.</p>
            <CodeBlock code={`az webapp deploy --name nttdatamalaysia --resource-group sunway-rg --src-path deploy.zip --type zip

# Clean up
Remove-Item deploy.zip`} />
          </Step>

          {/* Step 9 */}
          <Step
            number={9}
            title="Configure Startup Command"
            icon={<ChevronRight className="w-5 h-5 text-teal-400" />}
            color="border-teal-500"
          >
            <p className="text-slate-300 mb-4">Set the startup command for the Linux App Service to serve static files.</p>
            <CodeBlock code={`az webapp config set --name nttdatamalaysia --resource-group sunway-rg --startup-file "npx serve -s"`} />
          </Step>

          {/* Step 10 */}
          <Step
            number={10}
            title="Launch Application"
            icon={<Globe className="w-5 h-5 text-green-400" />}
            color="border-green-500"
          >
            <p className="text-slate-300 mb-4">Your application is now live!</p>
            <CodeBlock code={`# Open in browser
az webapp browse --name nttdatamalaysia --resource-group sunway-rg

# Or visit directly:
# https://nttdatamalaysia.azurewebsites.net`} />
          </Step>
        </div>

        {/* Quick Reference */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-blue-400" />
            Quick Reference - All Commands
          </h2>
          <p className="text-slate-300 mb-4">Copy and paste the entire block below to execute all steps at once:</p>
          <CodeBlock code={`# === Complete Deployment Script ===

# 1. Login
az login

# 2. Create Key Vault
az keyvault create --name nttdatamykeyvault --resource-group sunway-rg --location southeastasia --sku standard

az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --value "https://your-project.supabase.co"
az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --value "your-anon-key"

# 3. Create Web App
az webapp create --name nttdatamalaysia --resource-group sunway-rg --plan sunway-plan --% --runtime "NODE|22-lts"

# 4. Enable managed identity
az webapp identity assign --name nttdatamalaysia --resource-group sunway-rg

$principalId = az webapp identity show --name nttdatamalaysia --resource-group sunway-rg --query principalId -o tsv

# 5. Grant Key Vault access
az keyvault set-policy --name nttdatamykeyvault --object-id $principalId --secret-permissions get list

az role assignment create \\
  --assignee-object-id $principalId \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope $(az keyvault show --name nttdatamykeyvault --query id -o tsv)

# 6. Build
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --query value -o tsv
$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --query value -o tsv

npm ci
npm run build

# 7. Package
Compress-Archive -Path dist/* -DestinationPath deploy.zip -Force

# 8. Deploy
az webapp deploy --name nttdatamalaysia --resource-group sunway-rg --src-path deploy.zip --type zip
Remove-Item deploy.zip

# 9. Startup command
az webapp config set --name nttdatamalaysia --resource-group sunway-rg --startup-file "npx serve -s"

# 10. Browse
az webapp browse --name nttdatamalaysia --resource-group sunway-rg`} />
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Troubleshooting</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-2">View Logs</p>
              <CodeBlock code={`az webapp log tail --name nttdatamalaysia --resource-group sunway-rg`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Restart App</p>
              <CodeBlock code={`az webapp restart --name nttdatamalaysia --resource-group sunway-rg`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Check Status</p>
              <CodeBlock code={`az webapp show --name nttdatamalaysia --resource-group sunway-rg --query "{state:state, defaultHostName:defaultHostName}" -o table`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Enable HTTPS Only</p>
              <CodeBlock code={`az webapp update --name nttdatamalaysia --resource-group sunway-rg --set httpsOnly=true`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>App URL: <a href="https://nttdatamalaysia.azurewebsites.net" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://nttdatamalaysia.azurewebsites.net</a></p>
        </div>
      </div>
    </div>
  );
}
