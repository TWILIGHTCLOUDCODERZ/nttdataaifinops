# NTT DATA FinOps Dashboard — Azure Deployment Guide

**App Name:** `nttdataAImalaysia`
**Resource Group:** `nttdata-rg`
**App Service Plan:** `nttdata-plan`
**Key Vault:** `nttdataMALAYSIAkeyvault`
**Region:** Southeast Asia (southeastasia)
**Runtime:** Node 22 LTS (Linux)
**Live URL:** `https://nttdataAImalaysia.azurewebsites.net`

> All commands are in **Azure CLI format** for PowerShell on Windows.
> Run them in order from your project root directory.

---

## PART 1 — FIRST-TIME AZURE SETUP
*Run this section only once.*

---

### Step 1 — Login to Azure

```powershell
az login
```

Confirm the correct subscription is active:

```powershell
az account show --query "{name:name, id:id}" -o table
```

Switch subscription if needed:

```powershell
az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"
```

---

### Step 2 — Create Resource Group

```powershell
az group create --name nttdata-rg --location southeastasia
```

---

### Step 3 — Create App Service Plan (Linux)

```powershell
az appservice plan create --name nttdata-plan --resource-group nttdata-rg --location southeastasia --sku B1 --is-linux
```

---

### Step 4 — Create the Web App

```powershell
az webapp create --name nttdataAImalaysia --resource-group nttdata-rg --plan nttdata-plan --runtime "NODE|22-lts"
```

Verify the app was created:

```powershell
az webapp show --name nttdataAImalaysia --resource-group nttdata-rg --query "{state:state, url:defaultHostName}" -o table
```

---

### Step 5 — Create Key Vault

```powershell
az keyvault create --name nttdataMALAYSIAkeyvault --resource-group nttdata-rg --location southeastasia --sku standard
```

---

### Step 6 — Store Secrets in Key Vault

```powershell
az keyvault secret set --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-URL --value "YOUR_SUPABASE_URL"
```

```powershell
az keyvault secret set --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-ANON-KEY --value "YOUR_SUPABASE_ANON_KEY"
```

Confirm both secrets are stored:

```powershell
az keyvault secret list --vault-name nttdataMALAYSIAkeyvault --query "[].name" -o table
```

---

### Step 7 — Enable Managed Identity on Web App

```powershell
az webapp identity assign --name nttdataAImalaysia --resource-group nttdata-rg
```

Get the Principal ID:

```powershell
az webapp identity show --name nttdataAImalaysia --resource-group nttdata-rg --query principalId -o tsv
```

Copy the output value, then grant it read access to Key Vault (replace `PRINCIPAL_ID_HERE` with the copied value):

```powershell
az keyvault set-policy --name nttdataMALAYSIAkeyvault --object-id PRINCIPAL_ID_HERE --secret-permissions get list
```

---

### Step 8 — Configure Web App Settings

```powershell
az webapp config appsettings set --name nttdataAImalaysia --resource-group nttdata-rg --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false WEBSITE_RUN_FROM_PACKAGE=0 WEBSITES_PORT=8080
```

Set the startup command:

```powershell
az webapp config set --name nttdataAImalaysia --resource-group nttdata-rg --startup-file "npx serve /home/site/wwwroot -l 8080"
```

---

### Step 9 — Get Publish Profile (for GitHub Actions CI/CD)

```powershell
az webapp deployment list-publishing-profiles --name nttdataAImalaysia --resource-group nttdata-rg --xml --output tsv
```

Copy the entire output. Add it to GitHub:

- Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
- Add secret `AZURE_PUBLISH_PROFILE` — paste the output
- Add secret `AZURE_WEBAPP_NAME` — value: `nttdataAImalaysia`
- Add secret `VITE_SUPABASE_URL` — value: your database URL from Key Vault
- Add secret `VITE_SUPABASE_ANON_KEY` — value: your anon key from Key Vault

After this, every push to `main` branch deploys automatically.

---

## PART 2 — MANUAL DEPLOY (every release)
*Use this when deploying manually without GitHub Actions.*

---

### Step 1 — Navigate to project folder

```powershell
cd C:\path\to\your\project
```

---

### Step 2 — Pull secrets from Key Vault into local environment

```powershell
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-URL --query value -o tsv
```

```powershell
$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-ANON-KEY --query value -o tsv
```

Confirm secrets loaded:

```powershell
Write-Host "URL loaded: $env:VITE_SUPABASE_URL"
```

---

### Step 3 — Install dependencies and build

```powershell
npm ci
```

```powershell
npm run build
```

---

### Step 4 — Package the build into a zip

The zip must contain files directly at the root — `index.html` must NOT be inside a `dist/` subfolder.

```powershell
Push-Location dist
Compress-Archive -Path * -DestinationPath ..\deploy.zip -Force
Pop-Location
```

Verify zip structure (`index.html` must appear at root level):

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead("$PWD\deploy.zip").Entries | Select-Object FullName | Select-Object -First 6
```

Expected output:
```
FullName
--------
index.html
web.config
serve.json
assets/index-XXXX.css
assets/index-XXXX.js
```

---

### Step 5 — Deploy to Azure

```powershell
az webapp deploy --name nttdataAImalaysia --resource-group nttdata-rg --src-path .\deploy.zip --type zip
```

---

### Step 6 — Clean up and restart

```powershell
Remove-Item .\deploy.zip
```

```powershell
az webapp restart --name nttdataAImalaysia --resource-group nttdata-rg
```

Wait 30 seconds, then open the app:

```powershell
Start-Process "https://nttdataAImalaysia.azurewebsites.net"
```

---

## PART 3 — VERIFY THE DEPLOYMENT

Check app is running:

```powershell
az webapp show --name nttdataAImalaysia --resource-group nttdata-rg --query "{state:state, url:defaultHostName}" -o table
```

Stream live logs:

```powershell
az webapp log tail --name nttdataAImalaysia --resource-group nttdata-rg
```

Confirm startup command is correct:

```powershell
az webapp config show --name nttdataAImalaysia --resource-group nttdata-rg --query "appCommandLine" -o tsv
```

Confirm app settings:

```powershell
az webapp config appsettings list --name nttdataAImalaysia --resource-group nttdata-rg -o table
```

---

## PART 4 — TROUBLESHOOTING

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white page | JS files returning 404 | Confirm `index.html` is at zip root, not inside a `dist/` folder |
| MIME type errors for `.js` | Wrong serving mode | Confirm startup command is `npx serve /home/site/wwwroot -l 8080` |
| Page refresh gives 404 | SPA routing not configured | Confirm `serve.json` is present in the zip |
| "Application Error" on load | Startup command crashed | Run `az webapp log tail` and check for errors |
| Data not loading | Database keys missing from build | Re-run Step 2 of Part 2 in the same PowerShell window, then rebuild |
| App stuck after deploy | Old process still running | Run `az webapp restart` and wait 30 seconds |

---

## PART 5 — COMPLETE COPY-PASTE SCRIPTS

### First-Time Setup Script (run once)

```powershell
az login

az account show --query "{name:name, id:id}" -o table

az group create --name nttdata-rg --location southeastasia

az appservice plan create --name nttdata-plan --resource-group nttdata-rg --location southeastasia --sku B1 --is-linux

az webapp create --name nttdataAImalaysia --resource-group nttdata-rg --plan nttdata-plan --runtime "NODE|22-lts"

az keyvault create --name nttdataMALAYSIAkeyvault --resource-group nttdata-rg --location southeastasia --sku standard

az keyvault secret set --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-URL --value "YOUR_SUPABASE_URL"

az keyvault secret set --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-ANON-KEY --value "YOUR_SUPABASE_ANON_KEY"

az webapp identity assign --name nttdataAImalaysia --resource-group nttdata-rg

az webapp identity show --name nttdataAImalaysia --resource-group nttdata-rg --query principalId -o tsv

az keyvault set-policy --name nttdataMALAYSIAkeyvault --object-id PRINCIPAL_ID_HERE --secret-permissions get list

az webapp config appsettings set --name nttdataAImalaysia --resource-group nttdata-rg --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false WEBSITE_RUN_FROM_PACKAGE=0 WEBSITES_PORT=8080

az webapp config set --name nttdataAImalaysia --resource-group nttdata-rg --startup-file "npx serve /home/site/wwwroot -l 8080"

Write-Host "First-time setup complete."
```

---

### Every Deploy Script (run each release)

```powershell
$env:VITE_SUPABASE_URL = az keyvault secret show --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-URL --query value -o tsv

$env:VITE_SUPABASE_ANON_KEY = az keyvault secret show --vault-name nttdataMALAYSIAkeyvault --name VITE-Database-ANON-KEY --query value -o tsv

npm ci

npm run build

Push-Location dist
Compress-Archive -Path * -DestinationPath ..\deploy.zip -Force
Pop-Location

az webapp deploy --name nttdataAImalaysia --resource-group nttdata-rg --src-path .\deploy.zip --type zip

Remove-Item .\deploy.zip

az webapp restart --name nttdataAImalaysia --resource-group nttdata-rg

Write-Host "Deployed successfully."
Start-Process "https://nttdataAImalaysia.azurewebsites.net"
```

---

## Resource Summary

| Resource | Name | Resource Group | Region |
|----------|------|----------------|--------|
| Resource Group | `nttdata-rg` | — | Southeast Asia |
| App Service Plan | `nttdata-plan` | `nttdata-rg` | Southeast Asia |
| Web App | `nttdataAImalaysia` | `nttdata-rg` | Southeast Asia |
| Key Vault | `nttdataMALAYSIAkeyvault` | `nttdata-rg` | Southeast Asia |

**Live URL: https://nttdataAImalaysia.azurewebsites.net**
