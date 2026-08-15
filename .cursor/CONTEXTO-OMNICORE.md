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
├── frontend-app/                 ← React (próximo passo — Opção A)
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
| 6+ | Frontend React (`frontend-app/`) | ⬜ **próximo** | — |

### Fases PDF Gemini (progresso)

```
Fase 1 – Infra & base          ~95% ✅
Fase 2 – Cadastro & Estoque    ~90% ✅
Fase 3 – Vendas & Regras       ~65% 🔄
Fase 4–5 – React               0%  ⬜
Fase 6 – Fiscal/deploy         ~15% (CI ok; NFC-e/pagamentos pendentes)
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

# Testes
./mvnw test   # ~76 testes passando
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

---

## Próximo passo acordado

**Opção A — Frontend React** em `frontend-app/`:

1. Scaffold (Vite + React + TypeScript)
2. Tela login → `POST /api/auth/login`
3. Guardar JWT (localStorage)
4. Listagem produtos → `GET /api/produtos` com Bearer token
5. CORS no backend se necessário

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
Próximo: Opção A — setup React em frontend-app/ com login JWT.
Workspace: ~/omnicore/. Não commitar docker-compose.yml.
```

---

*Última atualização: 15/ago/2026 — git em `a7cb6a9`; config Agent em `~/omnicore/.cursor/`.*
