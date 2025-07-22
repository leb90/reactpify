#!/bin/bash

# Reactpify Development Setup
# Script to start development workflow with 2 terminals

echo "🚀 Starting Reactpify Development Mode..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit it with your Shopify store details."
        echo "   Then run this script again."
        exit 0
    else
        echo "❌ .env.example file not found. Please create .env manually."
        exit 1
    fi
fi

echo ""
echo "This will open 2 terminals:"
echo "  📺 Terminal 1: Watch Mode (Auto-generates Liquid templates)"
echo "  🛍️  Terminal 2: Shopify Theme Dev Server"
echo ""

# Detect OS and available terminal
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Opening Watch Mode terminal..."
    osascript -e 'tell application "Terminal" to do script "echo \"📺 WATCH MODE - Auto-generating Liquid templates\"; echo \"Create React components and watch the magic! ✨\"; echo \"\"; npm run watch"'
    
    sleep 2
    
    echo "Opening Shopify Dev Server terminal..."
    osascript -e 'tell application "Terminal" to do script "echo \"🛍️ SHOPIFY DEV SERVER\"; echo \"Live preview of your theme changes!\"; echo \"\"; npm run env:dev"'
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "Opening Watch Mode terminal..."
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c 'echo "📺 WATCH MODE - Auto-generating Liquid templates"; echo "Create React components and watch the magic! ✨"; echo ""; npm run watch; exec bash'
        sleep 2
        gnome-terminal -- bash -c 'echo "🛍️ SHOPIFY DEV SERVER"; echo "Live preview of your theme changes!"; echo ""; npm run env:dev; exec bash'
    elif command -v xterm &> /dev/null; then
        xterm -e 'echo "📺 WATCH MODE"; npm run watch' &
        sleep 2
        xterm -e 'echo "🛍️ SHOPIFY DEV SERVER"; npm run env:dev' &
    else
        echo "No suitable terminal found. Please run manually:"
        echo "Terminal 1: npm run watch"
        echo "Terminal 2: npm run dev"
        exit 1
    fi
else
    # Other systems
    echo "System not detected. Please run manually:"
    echo "Terminal 1: npm run watch"
    echo "Terminal 2: npm run env:dev"
    exit 1
fi

echo ""
echo "✅ Development environment started!"
echo "Now you can create React components and see them live in Shopify!" 