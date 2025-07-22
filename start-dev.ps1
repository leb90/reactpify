# Reactpify Development Setup
# Script to start development workflow with 2 terminals

Write-Host "🚀 Starting Reactpify Development Mode..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created. Please edit it with your Shopify store details." -ForegroundColor Green
        Write-Host "   Then run this script again." -ForegroundColor White
        exit
    } else {
        Write-Host "❌ .env.example file not found. Please create .env manually." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "This will open 2 terminals:" -ForegroundColor Yellow
Write-Host "  📺 Terminal 1: Watch Mode (Auto-generates Liquid templates)" -ForegroundColor Cyan
Write-Host "  🛍️  Terminal 2: Shopify Theme Dev Server" -ForegroundColor Cyan
Write-Host ""

# Terminal 1: Watch mode
Write-Host "Opening Watch Mode terminal..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '📺 WATCH MODE - Auto-generating Liquid templates' -ForegroundColor Green; Write-Host 'Create React components and watch the magic! ✨' -ForegroundColor Yellow; Write-Host ''; npm run watch"

# Wait before opening second terminal
Start-Sleep -Seconds 2

# Terminal 2: Shopify dev
Write-Host "Opening Shopify Dev Server terminal..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🛍️ SHOPIFY DEV SERVER' -ForegroundColor Green; Write-Host 'Live preview of your theme changes!' -ForegroundColor Yellow; Write-Host ''; npm run env:dev"

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "Now you can create React components and see them live in Shopify!" -ForegroundColor Yellow 