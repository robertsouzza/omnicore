# OmniCore

Engine **omnichannel** para varejo híbrido — backend (Cérebro) + frontend (React), cobrindo loja física, salão, caixa e e-commerce.

Monorepo mantido por [Roberto Souza](https://github.com/robertsouzza).

---

## Visão

| Canal | Função |
|-------|--------|
| **Web** | E-commerce com checkout ágil |
| **Salão** | App do vendedor (PWA + leitor de código de barras) |
| **Caixa** | PDV (dinheiro, cartão, Pix) |
| **Balcão / Entrega** | Separação e conferência de pedidos |

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Java 21, Spring Boot 3.5, Spring Security, JWT, JPA, PostgreSQL |
| **Frontend** | React 19, TypeScript, Vite 8, React Router 7 |
| **Infra** | Docker Compose (Postgres), GitHub Actions (CI backend) |
| **Docs / API** | Swagger UI, OpenAPI 3 |

---

## Estrutura do repositório

```
omnicore/
├── cerebro-backend/      # API REST Spring Boot
├── frontend-app/         # SPA React (Vite)
├── docker-compose.yml    # PostgreSQL local
├── .cursor/              # Contexto e regras do Cursor Agent
├── CONTEXTO-OMNICORE.md  # Atalho para restaurar contexto em chats
└── omnicore.code-workspace
```

Documentação detalhada do cronograma e decisões: [`.cursor/CONTEXTO-OMNICORE.md`](.cursor/CONTEXTO-OMNICORE.md).

---

## Pré-requisitos

- **Java 21** (OpenJDK)
- **Maven** (ou use `./mvnw` no backend)
- **Node.js 20+** e **npm** (frontend)
- **Docker** (PostgreSQL)
- **WSL2** recomendado no Windows (terminal Linux para API e npm)

---

## Subir o ambiente local

### 1. Banco de dados (Docker)

Na raiz do monorepo:

```bash
docker compose up -d
```

| Item | Valor |
|------|-------|
| Container | `omnicore-postgres-db` |
| Host | `localhost:5432` |
| Banco | `omnicore_management` |
| Usuário | `admin` |
| Senha | `omnicore_secret_pass` |

### 2. Backend (API)

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64   # ajuste se necessário
cd cerebro-backend
./mvnw spring-boot:run
```

| Serviço | URL |
|---------|-----|
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api-docs |

### 3. Frontend (React)

```bash
cd frontend-app
npm install
npm run dev
```

| Serviço | URL |
|---------|-----|
| App | http://localhost:5173 |

Em desenvolvimento, o Vite faz **proxy** de `/api` para `http://localhost:8080`. O backend aceita CORS em `localhost:5173`.

Copie `.env.example` para `.env` se precisar apontar para outra URL de API:

```bash
cp .env.example .env
# VITE_API_BASE_URL=   (vazio = proxy Vite em dev)
```

---

## Autenticação

A API é **stateless** com JWT Bearer.

1. **Login (público):** `POST /api/auth/login`

```json
{
  "email": "carlos.vendedor@omnicore.local",
  "senha": "senha123"
}
```

2. Demais rotas `/api/**` exigem header:

```
Authorization: Bearer <token>
```

3. No **Swagger**, use o botão **Authorize** (cadeado) com o token.

Colaboradores são cadastrados via `POST /api/colaboradores` (senha armazenada com BCrypt).

---

## Módulos da API (backend)

| Módulo | Base path | Principais operações |
|--------|-----------|----------------------|
| Autenticação | `/api/auth` | Login JWT |
| Produtos | `/api/produtos` | CRUD paginado, inativação lógica, busca; `GET /{id}/codigos` (barcode/QR PNG) |
| Composição (kits) | `/api/produtos/{id}/composicao` | Itens de pacote/combo |
| Estoque | `/api/estoque` | Entrada, saída, saldo, saldo/indicador (pico histórico), histórico |
| Clientes | `/api/clientes` | CRUD, busca por documento, busca por `nome`, CEP ViaCEP |
| Colaboradores | `/api/colaboradores` | CRUD, perfis (vendedor, caixa, gerente…) |
| Vendas | `/api/vendas` | Criar, listar com filtros, cancelar com estorno |

Regras de negócio incluem: baixa de estoque na venda, estorno no cancelamento, validação de produto/cliente/colaborador ativos, kits com baixa nos produtos filhos.

---

## Frontend (estado atual — Ago/2026)

| Tela | Rota | Status |
|------|------|--------|
| Login | `/login` | ✅ |
| Listagem de produtos (busca nome/EAN, paginação, imagem + lightbox, **coluna estoque colorida**) | `/produtos` | ✅ |
| Cadastro / edição de produtos (+ gerar/salvar barcode e QR Code) | `/produtos/novo`, `/produtos/:id/editar` | ✅ |
| Composição de kit (pacote) | `/produtos/:id/kit` | ✅ |
| Listagem de clientes (busca nome/documento, paginação) | `/clientes` | ✅ |
| Cadastro / edição de clientes | `/clientes/novo`, `/clientes/:id/editar` | ✅ |
| Estoque (saldo com indicador colorido, entrada/saída, histórico — só unitários) | `/estoque`, `/estoque/:produtoId` | ✅ |
| Vendas (nova, listagem, detalhe, cancelamento) | `/vendas`, `/vendas/nova`, `/vendas/:id` | ✅ |
| PWA salão (código de barras) | — | ✅ Sessão 12 — `/salao`, manifest, SW |

Último commit relevante: ver [`.cursor/CONTEXTO-OMNICORE.md`](.cursor/CONTEXTO-OMNICORE.md). Cronograma completo: idem.

### Débitos técnicos (documentados no CONTEXTO)

| Item | MVP atual | Quando implementar |
|------|-----------|-------------------|
| Clientes Fase B | Entrega só no Brasil | Entrega internacional (futuro) |
| Imagem do produto | URL opcional no cadastro (sem upload) | **Sessão 11.5** (upload + Object Storage, antes da 12) |
| Pagamento / caixa | Status PENDENTE ou PAGA só na criação da venda | Confirmar pagamento PENDENTE→PAGA + formas (Pix/cartão) = **Sessão 12+** |
| Cancelamento venda paga | ✅ Motivo + autorização **GERENTE** (Sessão 11.1) | Estorno financeiro/fiscal/NFC-e = **futuro** |
| Catálogo / precificação / compras | Cadastro enxuto; `precoVenda` livre; estoque via movimentação (entrada manual) | Precificação básica **pós-Sessão 11**; fornecedor + NF-e **Fase 6 / Sessão 13+** |
| Evolução frontend (arquitetura) | hooks ✅ (10.5) · PWA salão ✅ (12) | **12.5** UI kit **próximo** · **13-FE** Query+Vitest |

---

## Testes

### Backend

```bash
cd cerebro-backend
./mvnw test
```

CI roda automaticamente em push/PR (`.github/workflows/cerebro-backend-ci.yml`).

### Frontend

```bash
cd frontend-app
npm run lint
npm run build
```

---

## Progresso do projeto (resumo)

| Área | Status |
|------|--------|
| Infra + Postgres + Swagger | ✅ |
| Produtos, estoque, vendas, kits | ✅ (backend) |
| Clientes e colaboradores | ✅ (backend) |
| Auth JWT + Swagger Authorize | ✅ |
| CI GitHub Actions (backend) | ✅ |
| Frontend: login | ✅ |
| Frontend: produtos (CRUD, kits, busca nome/EAN, imagem, **coluna estoque**) | ✅ |
| Frontend: clientes (CRUD, CEP, telefone int., documento estrangeiro) | ✅ |
| Frontend: estoque (saldo, movimentação manual, histórico; indicador colorido; só unitários) | ✅ |
| Frontend: vendas (carrinho, listagem, cancelamento; kits na busca) | ✅ |
| Frontend: UI kit / TanStack Query | ⬜ **próximo** (12.5 ou 13-FE) |
| Reserva de estoque, WebSocket desconto, fiscal | ⬜ |

Cronograma completo por sessões: [`.cursor/CONTEXTO-OMNICORE.md`](.cursor/CONTEXTO-OMNICORE.md).

---

## Desenvolvimento com Cursor

- Abra o workspace **`~/omnicore/`** para backend + frontend juntos.
- Em chat novo: `@.cursor/CONTEXTO-OMNICORE.md` para restaurar contexto.
- Regra persistente em `.cursor/rules/omnicore-projeto.mdc`.

---

## Licença

Projeto privado em desenvolvimento. Definir licença antes de distribuição pública.
