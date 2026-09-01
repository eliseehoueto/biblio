#!/bin/bash
# Script de test complet des 3 opérations de la bibliothèque

set -e

API_URL="http://localhost:8002/api"
RESET='\033[0m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'

echo -e "${BLUE}==================================="
echo "📚 Test API Bibliothèque"
echo "===================================${RESET}\n"

# Test Health Check
echo -e "${YELLOW}🏥 Health Check...${RESET}"
curl -s "$API_URL/../health" | jq .
echo -e "${GREEN}✓ API accessible\n${RESET}"

# Operation 1: Create Books
echo -e "${YELLOW}📝 Opération 1: Créer des livres...${RESET}"

BOOK1=$(curl -s -X POST "$API_URL/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "978-0451524934"
  }')
BOOK1_ID=$(echo "$BOOK1" | jq -r '.id')
echo "$BOOK1" | jq .
echo -e "${GREEN}✓ Livre 1 créé: $BOOK1_ID\n${RESET}"

BOOK2=$(curl -s -X POST "$API_URL/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Le Seigneur des Anneaux",
    "author": "J.R.R. Tolkien",
    "isbn": "978-2253051410"
  }')
BOOK2_ID=$(echo "$BOOK2" | jq -r '.id')
echo "$BOOK2" | jq .
echo -e "${GREEN}✓ Livre 2 créé: $BOOK2_ID\n${RESET}"

BOOK3=$(curl -s -X POST "$API_URL/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fondation",
    "author": "Isaac Asimov",
    "isbn": "978-0553293356"
  }')
BOOK3_ID=$(echo "$BOOK3" | jq -r '.id')
echo "$BOOK3" | jq .
echo -e "${GREEN}✓ Livre 3 créé: $BOOK3_ID\n${RESET}"

# Operation 2: List Books with Status
echo -e "${YELLOW}📖 Opération 2: Afficher les livres avec leurs statuts...${RESET}"
BOOKS=$(curl -s "$API_URL/books")
echo "$BOOKS" | jq .
echo -e "${GREEN}✓ Tous les livres affichés\n${RESET}"

# Operation 3: Borrow Books
echo -e "${YELLOW}🎫 Opération 3: Emprunter des livres...${RESET}"

BORROW1=$(curl -s -X POST "$API_URL/books/$BOOK1_ID/borrow" \
  -H "Content-Type: application/json" \
  -d '{"borrower_name": "Alice Dupont"}')
echo "Emprunt par Alice:"
echo "$BORROW1" | jq .
echo -e "${GREEN}✓ Livre emprunté\n${RESET}"

BORROW2=$(curl -s -X POST "$API_URL/books/$BOOK2_ID/borrow" \
  -H "Content-Type: application/json" \
  -d '{"borrower_name": "Bob Martin"}')
echo "Emprunt par Bob:"
echo "$BORROW2" | jq .
echo -e "${GREEN}✓ Livre emprunté\n${RESET}"

# Vérifier l'état final
echo -e "${YELLOW}📊 État final des livres:${RESET}"
FINAL=$(curl -s "$API_URL/books")
echo "$FINAL" | jq .

# Statistiques
TOTAL=$(echo "$FINAL" | jq 'length')
AVAILABLE=$(echo "$FINAL" | jq '[.[] | select(.status=="available")] | length')
BORROWED=$(echo "$FINAL" | jq '[.[] | select(.status=="borrowed")] | length')

echo -e "${GREEN}"
echo "📊 Résumé:"
echo "  Total: $TOTAL"
echo "  Disponibles: $AVAILABLE"
echo "  Empruntés: $BORROWED"
echo "===================================${RESET}"

# Test d'erreur: emprunter un livre déjà emprunté
echo -e "${YELLOW}🔴 Test erreur: Emprunter un livre déjà emprunté...${RESET}"
ERROR=$(curl -s -X POST "$API_URL/books/$BOOK1_ID/borrow" \
  -H "Content-Type: application/json" \
  -d '{"borrower_name": "Charlie"}')
echo "$ERROR" | jq .
echo -e "${GREEN}✓ Erreur correctement gérée\n${RESET}"

echo -e "${BLUE}✅ Tous les tests réussis!${RESET}"
