#!/usr/bin/env bash
# Cadastra conferente e caixa de desenvolvimento (senha senha123).
# Pré-requisito: API em http://localhost:8080 e TOKEN JWT de um GERENTE.

set -euo pipefail

API="${OMNICORE_API:-http://localhost:8080}"

if [[ -z "${TOKEN:-}" ]]; then
  echo "Exporte TOKEN com login de gerente (Ana)."
  echo "Ex.: TOKEN=\$(curl -s $API/api/auth/login -H 'Content-Type: application/json' \\"
  echo "  -d '{\"email\":\"ana.gerente@omnicore.local\",\"senha\":\"senha123\"}' | jq -r .token)"
  exit 1
fi

cadastrar() {
  local nome="$1" cpf="$2" email="$3" perfil="$4"
  curl -sS -o /tmp/omnicore-seed-body.json -w "%{http_code}" -X POST "$API/api/colaboradores" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"nome\": \"$nome\",
      \"cpf\": \"$cpf\",
      \"email\": \"$email\",
      \"senha\": \"senha123\",
      \"perfil\": \"$perfil\",
      \"limiteDescontoAutonomo\": 5.00
    }"
}

for row in \
  "Paulo Conferente OmniCore|39053344705|conferente@omnicore.local|CONFERENTE" \
  "Marina Caixa OmniCore|45317828791|caixa@omnicore.local|CAIXA"
do
  IFS='|' read -r nome cpf email perfil <<< "$row"
  code=$(cadastrar "$nome" "$cpf" "$email" "$perfil")
  if [[ "$code" == "201" ]]; then
    echo "OK: $email ($perfil)"
  elif [[ "$code" == "409" || "$code" == "400" ]]; then
    echo "Já existe ou conflito ($code): $email — ver resposta em /tmp/omnicore-seed-body.json"
    cat /tmp/omnicore-seed-body.json
    echo
  else
    echo "Falha HTTP $code para $email"
    cat /tmp/omnicore-seed-body.json
    exit 1
  fi
done

echo "Logins dev: conferente@omnicore.local / caixa@omnicore.local — senha123"
