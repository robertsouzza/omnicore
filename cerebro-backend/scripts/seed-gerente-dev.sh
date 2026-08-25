#!/usr/bin/env bash
# Cadastra gerente de desenvolvimento para autorizar cancelamento de vendas pagas.
# Pré-requisito: API em http://localhost:8080 e token JWT (login de qualquer colaborador ativo).

set -euo pipefail

API="${OMNICORE_API:-http://localhost:8080}"
EMAIL="${GERENTE_EMAIL:-ana.gerente@omnicore.local}"
SENHA="${GERENTE_SENHA:-senha123}"
NOME="${GERENTE_NOME:-Ana Gerente OmniCore}"
CPF="${GERENTE_CPF:-52998224725}"

if [[ -z "${TOKEN:-}" ]]; then
  echo "Obtenha um token e exporte TOKEN=..."
  echo "Ex.: curl -s $API/api/auth/login -H 'Content-Type: application/json' \\"
  echo "  -d '{\"email\":\"carlos.vendedor@omnicore.local\",\"senha\":\"senha123\"}' | jq -r .token"
  exit 1
fi

curl -sS -X POST "$API/api/colaboradores" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"nome\": \"$NOME\",
    \"cpf\": \"$CPF\",
    \"email\": \"$EMAIL\",
    \"senha\": \"$SENHA\",
    \"perfil\": \"GERENTE\",
    \"limiteDescontoAutonomo\": 15.00
  }"

echo
echo "Gerente dev: $EMAIL / $SENHA"
