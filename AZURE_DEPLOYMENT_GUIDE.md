# NTT DATA FinOps Dashboard - Azure Deployment Guide

**Target Region:** Southeast Asia
**Existing App Service Plan:** sunway-plan (sunway-rg, Linux)
**App Name:** nttdatamalaysia

---

## Prerequisites

1. Azure CLI installed: `az --version`
2. Node.js 20+ installed: `node --version`
3. Project cloned locally and `npm ci` has run

> **Note:** All commands in this guide are for **PowerShell on Windows**. The `--%` syntax is used to escape the `|` character in runtime strings.

---

## Step 1: Login to Azure

```powershell
az login
```

A browser window will open. Sign in with your Azure credentials.

**Verify subscription:**

```powershell
az account show --query "{name:name, id:id}" -o table
```

**If multiple subscriptions, set the correct one:**

```powershell
az account set --subscription "YOUR_SUBSCRIPTION_NAME"
```

---

## Step 2: Create Key Vault for Secrets

**Create Key Vault:**

```powershell
az keyvault create --name nttdatamykeyvault --resource-group sunway-rg --location southeastasia --sku standard
```

**Store Supabase URL:**

```powershell
az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --value "https://aixorspllmwhjemtwboi.supabase.co"
```

**Store Supabase Anon Key:**

```powershell
az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpeG9yc3BsbG13aGplbXR3Ym9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjIwMjIsImV4cCI6MjA5NzE5ODAyMn0.FAbqXtSpn38arxb_IjaBKumfpUCCIhqvDHe2ZrM-kqs"
```

**Verify secrets:**

```powershell
az keyvault secret list --vault-name nttdatamykeyvault -o table
```

---

## Step 3: Create Web App (Using Existing Plan)

The existing plan is Linux-based. In PowerShell, use `--%` to escape the pipe character:

```powershell
az webapp create --name nttdatamalaysia --resource-group sunway-rg --plan sunway-plan --% --runtime "NODE|22-lts"
```

**Verify app creation:**

```powershell
az webapp show --name nttdatamalaysia --resource-group sunway-rg --query defaultHostName -o tsv
```

Output should be: `nttdatamalaysia.azurewebsites.net`

---

## Step 4: Enable Managed Identity & Grant Key Vault Access

**Enable system-assigned managed identity:**

```powershell
az webapp identity assign --name nttdatamalaysia --resource-group sunway-rg
```

**Get the Principal ID:**

```powershell
$PRINCIPAL_ID = az webapp identity show --name nttdatamalaysia --resource-group sunway-rg --query principalId -o tsv

Write-Host "Principal ID: $PRINCIPAL_ID"
```

**Grant Key Vault permissions:**

```powershell
az keyvault set-policy --name nttdatamykeyvault --object-id $PRINCIPAL_ID --secret-permissions get list
```

---

## Step 5: Build the Application Locally

**Important:** Vite bakes environment variables into the JS bundle at build time. You must build with secrets present.

**Export secrets from Key Vault:**

```powershell
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --query value -o tsv

$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --query value -o tsv
```

**Verify exports:**

```powershell
Write-Host "SUPABASE_URL: $env:VITE_SUPABASE_URL"
```

**Install dependencies and build:**

```powershell
npm ci
npm run build
```

---

## Step 6: Create Deployment Package

The zip must contain the **contents** of `dist/` at the root level (not a `dist/` subfolder), so that `index.html` is at the zip root. Use PowerShell's `Push-Location` + `Compress-Archive` pattern:

```powershell
Push-Location dist
Compress-Archive -Path * -DestinationPath ..\deploy.zip -Force
Pop-Location
```

> **Why this matters:** If you zip the `dist/` folder itself, Azure extracts it to `wwwroot/dist/` and can't find `index.html` at the expected root path.

---

## Step 7: Disable Server-Side Build (One-Time Setup)

This prevents Kudu from running `npm install`/`npm build` on the server. Run once:

```powershell
az webapp config appsettings set --name nttdatamalaysia --resource-group sunway-rg --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false WEBSITE_RUN_FROM_PACKAGE=0
```

---

## Step 8: Set Startup Command (One-Time Setup)

The app runs on Linux with a Node.js runtime. `serve` is the correct tool to serve static files with proper MIME types and SPA routing. The `serve.json` in the build output configures SPA fallback automatically.

```powershell
az webapp config set --name nttdatamalaysia --resource-group sunway-rg --startup-file "npx serve /home/site/wwwroot -l 8080"
```

---

## Step 9: Deploy to Azure Web App

> **Important:** Use `az webapp deploy` with `--type zip`. Do **not** use the old `az webapp deployment source config-zip` command — it triggers a server-side build that will fail.

```powershell
az webapp deploy --name nttdatamalaysia --resource-group sunway-rg --src-path ..\deploy.zip --type zip
```

**Clean up:**

```powershell
Remove-Item ..\deploy.zip
```

---

## Step 10: Browse Your Application

```powershell
az webapp browse --name nttdatamalaysia --resource-group sunway-rg
```

**Or open manually:**

```
https://nttdatamalaysia.azurewebsites.net
```

---

## Step 11: Configure Custom Domain (Optional)

**Add custom domain:**

```powershell
az webapp config hostname add --hostname finops.yourdomain.com --webapp-name nttdatamalaysia --resource-group sunway-rg
```

**Enable HTTPS only:**

```powershell
az webapp update --name nttdatamalaysia --resource-group sunway-rg --set httpsOnly=true
```

---

## GitHub Actions CI/CD Setup

### 10.1: Get Publish Profile

```powershell
az webapp deployment list-publishing-profiles --name nttdatamalaysia --resource-group sunway-rg --xml --output tsv | Out-File -FilePath publish-profile.xml -Encoding utf8

Get-Content publish-profile.xml
```

Copy the entire XML output.

### 10.2: Add GitHub Secrets

Go to: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|-------------|-------|
| `AZURE_WEBAPP_NAME` | `nttdatamalaysia` |
| `AZURE_PUBLISH_PROFILE` | Paste full XML from above |
| `VITE_SUPABASE_URL` | `https://aixorspllmwhjemtwboi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### 10.3: Push to Deploy

Every push to `main` branch will automatically build and deploy.

```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

---

## Troubleshooting

### View Logs

```powershell
az webapp log tail --name nttdatamalaysia --resource-group sunway-rg
```

### Restart App

```powershell
az webapp restart --name nttdatamalaysia --resource-group sunway-rg
```

### Check App Status

```powershell
az webapp show --name nttdatamalaysia --resource-group sunway-rg --query "{state:state, defaultHostName:defaultHostName}" -o table
```

---

## Quick Reference - All Commands (PowerShell)

**Copy and paste in PowerShell:**

```powershell
# 1. Login
az login

# 2. Create Key Vault and store secrets
az keyvault create --name nttdatamykeyvault --resource-group sunway-rg --location southeastasia --sku standard

az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --value "https://aixorspllmwhjemtwboi.supabase.co"

az keyvault secret set --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpeG9yc3BsbG13aGplbXR3Ym9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjIwMjIsImV4cCI6MjA5NzE5ODAyMn0.FAbqXtSpn38arxb_IjaBKumfpUCCIhqvDHe2ZrM-kqs"

# 3. Create Web App using existing plan (use --% to escape pipe in PowerShell)
az webapp create --name nttdatamalaysia --resource-group sunway-rg --plan sunway-plan --% --runtime "NODE|22-lts"

# 4. Enable managed identity
az webapp identity assign --name nttdatamalaysia --resource-group sunway-rg

$PRINCIPAL_ID = az webapp identity show --name nttdatamalaysia --resource-group sunway-rg --query principalId -o tsv

az keyvault set-policy --name nttdatamykeyvault --object-id $PRINCIPAL_ID --secret-permissions get list

# 5. Build locally
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-URL --query value -o tsv
$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdatamykeyvault --name VITE-SUPABASE-ANON-KEY --query value -o tsv

npm ci
npm run build

# 6. Create deployment package (zip dist/ CONTENTS so index.html is at zip root)
Push-Location dist
Compress-Archive -Path * -DestinationPath ..\deploy.zip -Force
Pop-Location

# 7. Disable server-side build (one-time, run once ever)
az webapp config appsettings set --name nttdatamalaysia --resource-group sunway-rg --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false WEBSITE_RUN_FROM_PACKAGE=0

# 8. Set startup command (one-time, run once ever)
az webapp config set --name nttdatamalaysia --resource-group sunway-rg --startup-file "npx serve /home/site/wwwroot -l 8080"

# 9. Deploy
az webapp deploy --name nttdatamalaysia --resource-group sunway-rg --src-path ..\deploy.zip --type zip

Remove-Item ..\deploy.zip

# 10. Browse
az webapp browse --name nttdatamalaysia --resource-group sunway-rg
```

---

## Resource Summary

| Resource | Name | Resource Group | Region |
|----------|------|----------------|--------|
| App Service Plan | sunway-plan | sunway-rg | Southeast Asia |
| Web App | nttdatamalaysia | sunway-rg | Southeast Asia |
| Key Vault | nttdatamykeyvault | sunway-rg | Southeast Asia |

---

## App URL

**Production:** `https://nttdatamalaysia.azurewebsites.net`
