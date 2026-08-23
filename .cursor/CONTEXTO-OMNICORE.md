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
├── frontend-app/                 ← React (Sessões 6–9 ✅ — login, produtos, kits, clientes)
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
| 7.2 | Produtos: busca por nome/código de barras + UX listagem (paridade clientes) | ✅ | `856f1e0`, `dbec4d0` |
| **8** | **Frontend: composição de pacotes (kits)** | ✅ testado browser | `07c89c2`, `6834f88`, `d11f099` |
| **9** | **Frontend + backend: clientes (CRUD, CEP, telefone internacional)** | ✅ testado browser | `7490a01` |
| **9.1** | **Clientes estrangeiros: tipo documento, busca, CPF válido, UX listagem** | ✅ | `cd60244` |
| **10** | Frontend: estoque (saldo, entrada/saída, histórico) | ⬜ **próximo** | — |
| 11 | Frontend: vendas (nova venda, listagem, cancelamento) | ⬜ | — |
| 12 | PWA salão: manifest, offline básico, layout mobile + código de barras | ⬜ | — |
| 13+ | Backend avançado: reserva estoque, salão→caixa, WebSocket desconto | ⬜ | — |
| 14+ | Fiscal/deploy: pagamentos, NFC-e, CI frontend, staging | ⬜ | — |

### Detalhe das próximas sessões (frontend)

| Sessão | Escopo | APIs já prontas |
|--------|--------|-------------------|
| ~~**9**~~ | ~~CRUD clientes; busca por CPF; endereço via CEP; telefone internacional~~ | ✅ `7490a01` |
| **10** | Saldo, movimentação manual, histórico paginado por produto | `/api/estoque/*` |
| **11** | Carrinho simples → `POST /api/vendas`; listagem com filtros; cancelar venda | `/api/vendas` |
| **12** | `vite-plugin-pwa`; UI mobile vendedor; scan/input código de barras | reutiliza produtos + vendas |

### Sessão 7.2 — busca e paginação de produtos (paridade clientes)

**Backend:** `GET /api/produtos?nome=` e `?codigoBarras=` (mín. 3 caracteres/dígitos, paginado); filtros combináveis (AND); normalização EAN só dígitos; testes em `ProdutoServiceTest` e `ProdutoControllerTest`.

**Frontend:** campos “Buscar por produto” e “Código de barras”; filtro instantâneo na página + API a partir de 3 chars; paginação sempre visível; input não perde foco durante refresh.

### Sessão 9.1 — documento do cliente (Fase A) — entregue

**Backend:** `tipoDocumento` (CPF, PASSAPORTE, DOCUMENTO_ESTRANGEIRO) + `numeroDocumento` único por tipo; `GET /api/clientes/documento?tipo=&numero=`; atalho `/cpf/{cpf}` mantido; `GET /api/clientes?nome=` (mín. 3 letras, paginado). Estrangeiro exige **endereço de entrega no Brasil**. Validação **CPF com dígitos verificadores** (`CpfValidator`); celular 4–15 dígitos + libphonenumber. `GlobalExceptionHandler`: mensagens amigáveis (409/500).

**Frontend:** select tipo documento; máscara CPF ou alfanumérico; busca por **nome** (filtro instantâneo na página + API a partir de 3 letras); busca por documento; coluna “Documento”; paginação sempre visível (“Página X de Y · N clientes”); listagem não some em erro de busca; validação CPF no form.

**Migração DB:** `cerebro-backend/scripts/migrate-cliente-documento.sql` — copia `cpf` → `numero_documento`, remove colunas legadas `cpf` e `endereco_entrega_padrao`.

### Débito técnico — Clientes Fase B (futuro)

| Item | Descrição |
|------|-----------|
| Entrega internacional | Endereço no exterior, sem CEP/ViaCEP BR |
| País do documento | Campo emissor (ex.: passaporte canadense) |
| Endereço dual | Residência exterior + endereço BR separados |
| Validação fiscal | Integração receita/NFC-e se necessário |

**Decisão vigente:** OmniCore atende **entregas somente no Brasil**; estrangeiro usa telefone internacional (WhatsApp/Telegram) mas endereço de entrega deve ser brasileiro.

### Sessão 9 — entregue (`7490a01`)

**Backend:** endereço estruturado (cep, logradouro, numero, bairro, cidade, estado); `codigoPais` ISO (BR); validação celular com libphonenumber; `GET /api/cep/{cep}` (ViaCEP).

**Frontend:** listagem paginada + busca CPF; form cadastro/edição; máscaras CPF/CEP; combo países + celular dinâmico (libphonenumber-js); rotas `/clientes/*`.

### Fases PDF Gemini (progresso)

```
Fase 1 – Infra & base          ~95% ✅
Fase 2 – Cadastro & Estoque    ~90% ✅ (backend); frontend ~35% 🔄
Fase 3 – Vendas & Regras       ~65% 🔄 (backend ok; falta UI)
Fase 4–5 – React               ~40% 🔄 (Sessões 6–9 feitas)
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

### Clientes de teste (4 cadastrados — Ago/2026)

| id | nome | documento | país tel. |
|----|------|-----------|-----------|
| 1 | Maria Silva Teste | CPF | BR |
| 2 | Rafael Castro de Melo | CPF | BR |
| 4 | Sofia Mendes Almeida | Passaporte N1234568 | PT |
| 5 | Michael Johnson | Doc. estrangeiro CA-D1234568 | US |

> Migração 9.1: rodar `migrate-cliente-documento.sql` uma vez se o banco ainda tiver coluna `cpf`.

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
- **Fechar sessão:** sempre atualizar este `.md`, `omnicore-projeto.mdc` e atalho `CONTEXTO-OMNICORE.md` (idealmente no mesmo commit da sessão)
- **Clientes estrangeiros (9.1):** passaporte/doc. estrangeiro OK; entrega **somente Brasil** — endereço BR obrigatório para não-CPF (Fase B = entrega internacional, ver débito técnico)

---

## Próximo passo acordado

**Sessão 10 — Estoque (frontend)** em `frontend-app/`:

1. Consultar saldo por produto → `/api/estoque/*`
2. Entrada/saída manual de estoque
3. Histórico paginado por produto

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
Próximo: Sessão 10 — estoque no frontend.
Workspace: ~/omnicore/. Não commitar docker-compose.yml.
```

---

*Última atualização: 23/ago/2026 — Sessão 7.2 (`dbec4d0` busca EAN); próximo: Sessão 10 estoque.*
