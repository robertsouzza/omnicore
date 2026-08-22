# OmniCore — Contexto do Projeto (restaurar conversa)

> **Como usar em chat novo:** `@.cursor/CONTEXTO-OMNICORE.md` ou `@CONTEXTO-OMNICORE.md` (atalho na raiz).
>
> **Assistente:** Logan (Cursor Agent) · **Usuário:** Roberto · **Comunicação:** português (BR)

---

## Visão (PDF Gemini — ~90% do planejamento)

**OmniCore / Cerebro** = engine omnichannel para varejo híbrido.

| Canal | Função |
|-------|--------|
| Web | E-commerce + checkout ágil |
| Salão | App vendedor (PWA + código de barras) |
| Caixa | PDV (dinheiro, cartão, Pix) |
| Balcão/Entrega | Separação e conferência |

**Stack:** Java 21 · Spring Boot 3.5 · PostgreSQL (Docker) · React (PWA) · JWT · Swagger · GitHub Actions CI

**Repo:** `https://github.com/robertsouzza/omnicore`

---

## Estrutura de pastas

```
~/omnicore/
├── .cursor/
│   ├── CONTEXTO-OMNICORE.md      ← este arquivo (contexto completo)
│   └── rules/
│       └── omnicore-projeto.mdc  ← regra alwaysApply do Agent
├── cerebro-backend/              ← API Spring Boot (backend core pronto)
├── frontend-app/                 ← React (Sessão 6 ✅ — login + produtos)
├── docker-compose.yml            ← Postgres (NÃO commitar alterações locais sem pedir)
├── CONTEXTO-OMNICORE.md          ← atalho na raiz → aponta para .cursor/
└── omnicore.code-workspace
```

### Workspace Cursor (importante)

- Chat do Agent fica ligado ao **workspace**, não à pasta git.
- **Recomendação:** abrir `~/omnicore/` como workspace (backend + frontend juntos).
- Chat novo/vazio ao mudar workspace → use `@.cursor/CONTEXTO-OMNICORE.md` para restaurar contexto.
- Regra `.cursor/rules/omnicore-projeto.mdc` carrega memória básica automaticamente.

---

## Cronograma por sessões — status (Ago/2026)

| Sessão | Conteúdo | Status | Commit |
|--------|----------|--------|--------|
| 1 | Vendas: listagem paginada, filtros, GET id, cancelamento + estorno | ✅ | `df65725`, fix `02ebc15` |
| 2 | ComposicaoPacote: kits + baixa nos filhos | ✅ | `4ed32d7` |
| 3 | Estoque: histórico paginado, saída manual, produto ativo | ✅ | `0077d1d` |
| 4 | Cliente & Colaborador: CRUD, CPF, BCrypt, integração Venda | ✅ | `7072a9c` |
| 5 | CI GitHub Actions + GlobalExceptionHandler @Valid | ✅ | `58eabac` |
| Auth | JWT login, Spring Security, Swagger Authorize | ✅ testado Swagger | `434b7f3` |
| 6 | Frontend: scaffold Vite + login JWT + listagem produtos + CORS | ✅ testado browser | `3d7caab` |
| 7 | Frontend: cadastro/edição/inativação de produtos | ✅ | `7c48196` |
| 7.1 | Frontend: responsividade (mobile cards, header, forms) | ✅ | `8cf002c` |
| **8** | **Frontend: composição de pacotes (kits)** | ✅ implementado | — |
| 9 | Frontend: clientes (listagem, CPF, CRUD) | ⬜ **próximo** | — |
| 10 | Frontend: estoque (saldo, entrada/saída, histórico) | ⬜ | — |
| 11 | Frontend: vendas (nova venda, listagem, cancelamento) | ⬜ | — |
| 12 | PWA salão: manifest, offline básico, layout mobile + código de barras | ⬜ | — |
| 13+ | Backend avançado: reserva estoque, salão→caixa, WebSocket desconto | ⬜ | — |
| 14+ | Fiscal/deploy: pagamentos, NFC-e, CI frontend, staging | ⬜ | — |

### Detalhe das próximas sessões (frontend)

| Sessão | Escopo | APIs já prontas |
|--------|--------|-------------------|
| **7** | Form novo/editar produto; botão inativar; enums tipo/tamanho; feedback de validação `@Valid` | `POST/GET/PUT/DELETE /api/produtos` |
| **8** | Aba “Composição” em produto PACOTE; adicionar/remover filhos | `/api/produtos/{id}/composicao` |
| **9** | CRUD clientes; busca por CPF na venda | `/api/clientes`, `/api/clientes/cpf/{cpf}` |
| **10** | Saldo, movimentação manual, histórico paginado por produto | `/api/estoque/*` |
| **11** | Carrinho simples → `POST /api/vendas`; listagem com filtros; cancelar venda | `/api/vendas` |
| **12** | `vite-plugin-pwa`; UI mobile vendedor; scan/input código de barras | reutiliza produtos + vendas |

### Fases PDF Gemini (progresso)

```
Fase 1 – Infra & base          ~95% ✅
Fase 2 – Cadastro & Estoque    ~90% ✅ (backend); frontend ~10%
Fase 3 – Vendas & Regras       ~65% 🔄 (backend ok; falta UI)
Fase 4–5 – React               ~15% 🔄 (Sessão 6 feita)
Fase 6 – Fiscal/deploy         ~15% (CI backend ok; frontend/deploy pendente)
```

### Backend avançado (PDF — pendente)

- Reserva temporária de estoque
- WebSockets (desconto gerente)
- Fluxo salão → caixa
- Pagamentos / NFC-e
- Conferência balcão

---

## Auth JWT (validado no Swagger — 14/ago/2026)

- `POST /api/auth/login` — público
- Demais `/api/**` — exige `Authorization: Bearer <token>`
- Swagger: botão **Authorize** (bearer-jwt)

### Colaborador de teste (banco local)

| Campo | Valor |
|-------|-------|
| id | 1 |
| nome | Carlos Vendedor OmniCore |
| email | `carlos.vendedor@omnicore.local` |
| senha | `senha123` (hash BCrypt resetado via SQL em 14/ago) |
| perfil | VENDEDOR |
| ativo | true |

### Cliente de teste

| id | nome | email | cpf |
|----|------|-------|-----|
| 1 | Maria Silva Teste | maria.teste@omnicore.local | 12345678909 |

---

## Dev — comandos rápidos

```bash
# Postgres (Docker)
docker ps   # container: omnicore-postgres-db

# API
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
cd ~/omnicore/cerebro-backend
./mvnw spring-boot:run

# Swagger
http://localhost:8080/swagger-ui.html

# Frontend (Vite — porta 5173)
cd ~/omnicore/frontend-app
npm run dev

# Build frontend
npm run build
```

### application.yml (DB)

- URL: `jdbc:postgresql://localhost:5432/omnicore_management`
- User: `admin` / Pass: `omnicore_secret_pass`

---

## Decisões alinhadas com Roberto

- BCrypt no cadastro de colaborador (Sessão 4); login JWT em sessão dedicada
- **Não commitar** `docker-compose.yml` salvo pedido explícito
- Commits/push só quando Roberto pedir
- Assistente chama Roberto de Roberto; ele chama o agente de **Logan**
- Frontend em `frontend-app/` (monorepo, não copiar backend para dentro)
- Config Agent/Claude na **raiz** `~/omnicore/.cursor/` (não dentro de `cerebro-backend/`)
- **Produto inativo:** exclusão lógica sem reativação (decisão de negócio — não implementar endpoint/UI de reativar por enquanto)

---

## Próximo passo acordado

**Sessão 9 — Clientes (CRUD)** em `frontend-app/`:

1. Listagem paginada → `GET /api/clientes`
2. Busca por CPF → `GET /api/clientes/cpf/{cpf}`
3. Cadastro/edição/inativação

---

## Histórico Cursor (transcript bruto)

Conversa principal salva automaticamente pelo Cursor em:

```
~/.cursor/projects/home-roberto-omnicore-cerebro-backend/agent-transcripts/
9b7a82ff-be56-4644-b9f0-c46b246bb76b/9b7a82ff-be56-4644-b9f0-c46b246bb76b.jsonl
```

Formato JSONL (uma linha JSON por evento). Não é amigável para ler manualmente — use este `.md` para restaurar contexto.

---

## Mensagem modelo para chat novo

```
Olá Logan, leia @.cursor/CONTEXTO-OMNICORE.md e vamos continuar o OmniCore.
Próximo: Sessão 7 — cadastro/edição de produtos no frontend.
Workspace: ~/omnicore/. Não commitar docker-compose.yml.
```

---

*Última atualização: 15/ago/2026 — git em `3d7caab`; Sessão 6 (frontend login + produtos) concluída.*
