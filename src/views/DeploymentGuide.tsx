import { useState } from 'react';
import { Copy, Check, Lock, Unlock, ChevronRight, Terminal, Cloud, Key, Rocket, Globe, Shield, Settings, GitBranch, Github } from 'lucide-react';

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

        {/* Architecture Diagram */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            Solution Architecture
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            This architecture represents a scalable, secure and intelligent FinOps Dashboard built on Microsoft Azure Cloud.
          </p>
          <div className="rounded-lg overflow-hidden border border-slate-600">
            <img
              src="/images/Finops_Dashboard_azure_requirement.png"
              alt="FinOps Dashboard Azure Architecture Diagram"
              className="w-full h-auto object-contain bg-white"
            />
          </div>
        </div>

        {/* Target Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Deployment Target</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Region</p>
              <p className="text-white font-medium">Southeast Asia</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Resource Group</p>
              <p className="text-white font-medium">nttdata-rg</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">App Service Plan</p>
              <p className="text-white font-medium">nttdata-plan</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Web App Name</p>
              <p className="text-white font-medium">nttdataAImalaysia</p>
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
            <CodeBlock code={`az keyvault create --name nttdata-keyvault --resource-group nttdata-rg --location southeastasia --sku standard`} />
            <p className="text-slate-400 text-sm mt-4 mb-2">Store your secrets:</p>
            <CodeBlock code={`az keyvault secret set --vault-name nttdata-keyvault --name VITE-SUPABASE-URL --value "https://your-project.supabase.co"

az keyvault secret set --vault-name nttdata-keyvault --name VITE-SUPABASE-ANON-KEY --value "your-anon-key-here"`} />
            <p className="text-slate-400 text-sm mt-4 mb-2">Verify secrets are stored:</p>
            <CodeBlock code={`az keyvault secret list --vault-name nttdata-keyvault -o table`} />
          </Step>

          {/* Step 3 */}
          <Step
            number={3}
            title="Create Web App"
            icon={<Globe className="w-5 h-5 text-emerald-400" />}
            color="border-emerald-500"
          >
            <p className="text-slate-300 mb-4">Create the Web App using the existing App Service Plan. The <code className="text-amber-400">--%</code> syntax escapes the pipe character in PowerShell.</p>
            <CodeBlock code={`az webapp create --name nttdataAImalaysia --resource-group nttdata-rg --plan nttdata-plan --% --runtime "NODE|22-lts"`} />
            <p className="text-slate-400 text-sm mt-4 mb-2">Verify app creation:</p>
            <CodeBlock code={`az webapp show --name nttdataAImalaysia --resource-group nttdata-rg --query defaultHostName -o tsv

# Output: nttdataAImalaysia.azurewebsites.net`} />
          </Step>

          {/* Step 4 */}
          <Step
            number={4}
            title="Enable Managed Identity"
            icon={<Shield className="w-5 h-5 text-purple-400" />}
            color="border-purple-500"
          >
            <p className="text-slate-300 mb-4">Enable system-assigned managed identity for secure access to Key Vault.</p>
            <CodeBlock code={`az webapp identity assign --name nttdataAImalaysia --resource-group nttdata-rg

$principalId = az webapp identity show --name nttdataAImalaysia --resource-group nttdata-rg --query principalId -o tsv

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
az keyvault set-policy --name nttdata-keyvault --object-id $principalId --secret-permissions get list

# Assign Key Vault Secrets User role
az role assignment create \\
  --assignee-object-id $principalId \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope $(az keyvault show --name nttdata-keyvault --query id -o tsv)`} />
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
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdata-keyvault --name VITE-SUPABASE-URL --query value -o tsv

$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdata-keyvault --name VITE-SUPABASE-ANON-KEY --query value -o tsv

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
            <CodeBlock code={`az webapp deploy --name nttdataAImalaysia --resource-group nttdata-rg --src-path deploy.zip --type zip

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
            <CodeBlock code={`az webapp config set --name nttdataAImalaysia --resource-group nttdata-rg --startup-file "npx serve -s"`} />
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
az webapp browse --name nttdataAImalaysia --resource-group nttdata-rg

# Or visit directly:
# https://nttdataAImalaysia.azurewebsites.net`} />
          </Step>

          {/* Step 9: GitHub Actions Secrets */}
          <Step
            number={9}
            title="Configure GitHub Actions Secrets"
            icon={Github}
            description="Set up secrets in your GitHub repository to enable CI/CD deployment to Azure. Two authentication methods are supported."
          >
            <div className="space-y-6">
              <p className="text-slate-300 text-sm">
                Navigate to your GitHub repository → <span className="text-blue-400 font-mono">Settings</span> → <span className="text-blue-400 font-mono">Secrets and variables</span> → <span className="text-blue-400 font-mono">Actions</span> → <span className="text-blue-400 font-mono">New repository secret</span>.
              </p>

              {/* Common Secrets */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-400" />
                  Required Build Secrets (both methods)
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <code className="text-cyan-400 text-sm">VITE_SUPABASE_URL</code>
                    <span className="text-slate-500 text-xs">Your Supabase project URL</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <code className="text-cyan-400 text-sm">VITE_SUPABASE_ANON_KEY</code>
                    <span className="text-slate-500 text-xs">Your Supabase anon public key</span>
                  </div>
                </div>
              </div>

              {/* Method 1: Publish Profile */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Method 1: Publish Profile (Simplest)
                </h4>
                <p className="text-slate-400 text-sm mb-3">
                  Download the publish profile from the Azure Portal and add it as a single secret.
                </p>
                <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded mb-3">
                  <code className="text-cyan-400 text-sm">AZURE_PUBLISH_PROFILE</code>
                  <span className="text-slate-500 text-xs">Contents of the .PublishSettings file</span>
                </div>
                <CodeBlock code={`# Download publish profile from Azure Portal:
# Web App → Overview → Get publish profile

# Add the entire XML content as AZURE_PUBLISH_PROFILE secret in GitHub`} />
              </div>

              {/* Method 2: Service Principal (Client ID / Client Secret) */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  Method 2: Service Principal (Client ID / Client Secret)
                </h4>
                <p className="text-slate-400 text-sm mb-3">
                  Create a service principal for OIDC-based authentication. More secure — no long-lived publish profile.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <code className="text-cyan-400 text-sm">AZURE_CLIENT_ID</code>
                    <span className="text-slate-500 text-xs">Service principal (app) ID</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <code className="text-cyan-400 text-sm">AZURE_CLIENT_SECRET</code>
                    <span className="text-slate-500 text-xs">Service principal secret</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <code className="text-cyan-400 text-sm">AZURE_TENANT_ID</code>
                    <span className="text-slate-500 text-xs">Azure AD tenant ID</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <code className="text-cyan-400 text-sm">AZURE_SUBSCRIPTION_ID</code>
                    <span className="text-slate-500 text-xs">Azure subscription ID</span>
                  </div>
                </div>
                <CodeBlock code={`# Create service principal and grant access to the web app

az ad sp create-for-rbac \\
  --name "nttdata-github-actions" \\
  --role contributor \\
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/nttdata-rg/providers/Microsoft.Web/sites/nttdataAImalaysia \\
  --sdk-auth

# Output provides:
#   clientId     -> AZURE_CLIENT_ID
#   clientSecret -> AZURE_CLIENT_SECRET
#   tenantId     -> AZURE_TENANT_ID
#   subscriptionId -> AZURE_SUBSCRIPTION_ID

# Add each value as a separate GitHub Actions secret`} />
              </div>

              {/* Updated Workflow */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  GitHub Actions Workflow (Service Principal Method)
                </h4>
                <p className="text-slate-400 text-sm mb-3">
                  Update <code className="text-cyan-400 text-xs">.github/workflows/deploy.yml</code> to use the client ID/secret method:
                </p>
                <CodeBlock code={`name: Build & Deploy to Azure Web App

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: \${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: \${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Login to Azure (Service Principal)
        uses: azure/login@v2
        with:
          creds: '{"clientId":"\${{ secrets.AZURE_CLIENT_ID }}","clientSecret":"\${{ secrets.AZURE_CLIENT_SECRET }}","subscriptionId":"\${{ secrets.AZURE_SUBSCRIPTION_ID }}","tenantId":"\${{ secrets.AZURE_TENANT_ID }}"}'

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: nttdataAImalaysia
          package: ./dist
          slot-name: production`} />
              </div>
            </div>
          </Step>
        </div>

        {/* Quick Reference */}
        <div className="mt-12 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-blue-400" />
            Quick Reference - All Commands
          </h2>
          <p className="text-slate-300 mb-4">Copy and paste the entire block below to execute all steps at once:</p>
          <CodeBlock code={`# === Complete Deployment Script ===

# 1. Login
az login

# 2. Create Key Vault
az keyvault create --name nttdata-keyvault --resource-group nttdata-rg --location southeastasia --sku standard

az keyvault secret set --vault-name nttdata-keyvault --name VITE-SUPABASE-URL --value "https://your-project.supabase.co"
az keyvault secret set --vault-name nttdata-keyvault --name VITE-SUPABASE-ANON-KEY --value "your-anon-key"

# 3. Create Web App
az webapp create --name nttdataAImalaysia --resource-group nttdata-rg --plan nttdata-plan --% --runtime "NODE|22-lts"

# 4. Enable managed identity
az webapp identity assign --name nttdataAImalaysia --resource-group nttdata-rg

$principalId = az webapp identity show --name nttdataAImalaysia --resource-group nttdata-rg --query principalId -o tsv

# 5. Grant Key Vault access
az keyvault set-policy --name nttdata-keyvault --object-id $principalId --secret-permissions get list

az role assignment create \\
  --assignee-object-id $principalId \\
  --assignee-principal-type ServicePrincipal \\
  --role "Key Vault Secrets User" \\
  --scope $(az keyvault show --name nttdata-keyvault --query id -o tsv)

# 6. Build
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdata-keyvault --name VITE-SUPABASE-URL --query value -o tsv
$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdata-keyvault --name VITE-SUPABASE-ANON-KEY --query value -o tsv

npm ci
npm run build

# 7. Package
Compress-Archive -Path dist/* -DestinationPath deploy.zip -Force

# 8. Deploy
az webapp deploy --name nttdataAImalaysia --resource-group nttdata-rg --src-path deploy.zip --type zip
Remove-Item deploy.zip

# 9. Startup command
az webapp config set --name nttdataAImalaysia --resource-group nttdata-rg --startup-file "npx serve -s"

# 10. Browse
az webapp browse --name nttdataAImalaysia --resource-group nttdata-rg`} />
        </div>

        {/* Troubleshooting */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Troubleshooting</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-2">View Logs</p>
              <CodeBlock code={`az webapp log tail --name nttdataAImalaysia --resource-group nttdata-rg`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Restart App</p>
              <CodeBlock code={`az webapp restart --name nttdataAImalaysia --resource-group nttdata-rg`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Check Status</p>
              <CodeBlock code={`az webapp show --name nttdataAImalaysia --resource-group nttdata-rg --query "{state:state, defaultHostName:defaultHostName}" -o table`} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Enable HTTPS Only</p>
              <CodeBlock code={`az webapp update --name nttdataAImalaysia --resource-group nttdata-rg --set httpsOnly=true`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>App URL: <a href="https://nttdataAImalaysia.azurewebsites.net" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://nttdataAImalaysia.azurewebsites.net</a></p>
        </div>
      </div>
    </div>
  );
}
