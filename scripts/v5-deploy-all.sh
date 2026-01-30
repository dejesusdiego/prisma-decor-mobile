#!/bin/bash
# StudioOS V5 - Deploy All Apps Script
# Usage: ./scripts/v5-deploy-all.sh

set -e

echo "🚀 StudioOS V5 - Multi-App Deploy"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy an app
deploy_app() {
    local app_dir=$1
    local app_name=$2
    local domain=$3
    
    echo -e "${BLUE}📦 Deploying $app_name...${NC}"
    cd "$app_dir"
    
    # Check if already linked to Vercel
    if [ -d ".vercel" ]; then
        echo -e "${YELLOW}   Already linked to Vercel, deploying...${NC}"
        vercel --prod
    else
        echo -e "${YELLOW}   First time deploy, creating project...${NC}"
        vercel --name "$app_name"
        echo -e "${YELLOW}   Now deploying to production...${NC}"
        vercel --prod
    fi
    
    echo -e "${GREEN}   ✅ $app_name deployed!${NC}"
    echo -e "${YELLOW}   🌐 Configure domain: $domain${NC}"
    echo ""
    
    cd - > /dev/null
}

# Main execution
echo -e "${YELLOW}This script will deploy all 3 StudioOS V5 apps to Vercel.${NC}"
echo -e "${YELLOW}Make sure you are logged in: vercel login${NC}"
echo ""

read -p "Continue with deploy? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploy cancelled."
    exit 1
fi

echo ""

# Deploy Core (ERP)
deploy_app "apps/core" "studioos-core" "app.studioos.pro"

# Deploy Platform (Admin)
deploy_app "apps/platform" "studioos-platform" "panel.studioos.pro"

# Deploy Portal (Suppliers)
deploy_app "apps/portal" "studioos-portal" "fornecedores.studioos.pro"

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}🎉 All apps deployed successfully!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure domains in Vercel dashboard:"
echo "   - https://vercel.com/dashboard"
echo ""
echo "2. Add environment variables to each project:"
echo "   VITE_SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY"
echo ""
echo "3. Your apps will be available at:"
echo "   - https://app.studioos.pro (Core ERP)"
echo "   - https://panel.studioos.pro (Platform Admin)"
echo "   - https://fornecedores.studioos.pro (Portal)"
echo ""