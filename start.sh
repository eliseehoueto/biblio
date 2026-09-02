#!/bin/bash
# Script de démarrage complet du projet

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${BLUE}========================================="
echo "📚 Démarrage Système Bibliothèque (Complète)"
echo "=========================================${RESET}\n"

# Backend
echo -e "${YELLOW}🔧 Démarrage Backend (FastAPI)...${RESET}"
cd back
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null || true
python3 main.py &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend en cours de démarrage (PID: $BACKEND_PID)${RESET}"
sleep 2

# Frontend
echo -e "\n${YELLOW}🔧 Démarrage Frontend (Next.js)...${RESET}"
cd ../front/biblio
npm install -q 2>/dev/null || true
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend en cours de démarrage (PID: $FRONTEND_PID)${RESET}"

echo -e "\n${BLUE}========================================="
echo -e "${GREEN}Système démarré avec succès!${RESET}"
echo -e "${BLUE}=========================================${RESET}\n"

echo -e "Endpoints:"
echo -e "   Backend:  ${YELLOW}http://localhost:8002${RESET}"
echo -e "   Frontend: ${YELLOW}http://localhost:3000${RESET}"
echo -e "\n📝 Pour arrêter: ${YELLOW}Ctrl+C${RESET}\n"

# Wait for both processes
wait $BACKEND_PID
wait $FRONTEND_PID
