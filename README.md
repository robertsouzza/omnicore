# OmniCore

Engine **omnichannel** para varejo híbrido — backend (Cérebro) + frontend (React), cobrindo loja física, salão, caixa e e-commerce.

Monorepo mantido por [Roberto Souza](https://github.com/robertsouzza).

---

## Visão

| Canal | Função |
|-------|--------|
| **Web** | E-commerce B2C — cliente compra, paga e recebe (**Fase 15**, planejamento em `.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md`) |
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

**Upload de imagem (Sessão 11.5):** suba o MinIO local antes do backend:

```bash
docker compose -f docker-compose.minio.yml up -d
# Console MinIO: http://localhost:9001 (minioadmin / minioadmin)
```

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
| Estoque | `/api/estoque` | Entrada, saída, **saldo disponível** (físico − reservas), saldo/indicador (pico histórico), histórico |
| Clientes | `/api/clientes` | CRUD, busca por documento, busca por `nome`, CEP ViaCEP |
| Colaboradores | `/api/colaboradores` | CRUD, perfis (vendedor, caixa, gerente…) |
| Vendas | `/api/vendas` | Criar, listar, **pagar** (body opcional com forma), cancelar |
| Pagamentos | `/api/pagamentos` | Listar por venda, **webhook** experiência externa |

Regras de negócio incluem: baixa de estoque na venda, estorno no cancelamento, **reserva de estoque em vendas PENDENTE**, validação de produto/cliente/colaborador ativos, kits com baixa nos produtos filhos.

---

## Frontend (estado atual — Ago/2026)

| Tela | Rota | Status |
|------|------|--------|
| Login | `/login` | ✅ |
| Listagem de produtos (busca nome/EAN, paginação, imagem + lightbox, **coluna estoque colorida**, **atualização ~4s**) | `/produtos` | ✅ |
| Cadastro / edição de produtos (+ gerar/salvar barcode e QR Code, **upload imagem**) | `/produtos/novo`, `/produtos/:id/editar` | ✅ |
| Composição de kit (pacote) | `/produtos/:id/kit` | ✅ |
| Listagem de clientes (busca nome/documento, paginação) | `/clientes` | ✅ |
| Cadastro / edição de clientes | `/clientes/novo`, `/clientes/:id/editar` | ✅ |
| Estoque (saldo com indicador colorido, entrada/saída, histórico — só unitários; **atualização ~4s**) | `/estoque`, `/estoque/:produtoId` | ✅ |
| Vendas (nova, listagem, detalhe, cancelamento, **pagar pendente**; **limite qtd = estoque disp.**) | `/vendas`, `/vendas/nova`, `/vendas/:id` | ✅ |
| **Caixa** (modal pagamento: dinheiro, Pix, crédito, débito bancário) | `/caixa` | ✅ 14-A |
| **PDV** (checkout bip, atalhos F3–F10, imagem + cupom ≥1024px, **formas de pagamento**) | `/pdv` | ✅ 14-A |
| PWA salão (código de barras, **banner pós-venda**, **qtd editável + teto estoque**) | — | ✅ `/salao`, `/salao/vendas` |
| UI kit (`components/ui/`, design tokens) | — | ✅ Sessão 12.5 — Login + Estoque migrados |
| TanStack Query + Vitest | — | ✅ Sessão 13-FE — 51 testes |

Último commit relevante: ver [`.cursor/CONTEXTO-OMNICORE.md`](.cursor/CONTEXTO-OMNICORE.md). Cronograma completo: idem.

### Débitos técnicos (documentados no CONTEXTO)

| Item | MVP atual | Quando implementar |
|------|-----------|-------------------|
| Clientes Fase B | Entrega só no Brasil | Entrega internacional (futuro) |
| Imagem do produto | URL opcional **ou upload** JPG/PNG/WebP (MinIO dev) | Produção: S3/Cloudinary — trocar `omnicore.storage.*` |
| Pagamento / caixa | ✅ `/caixa` modal + `PUT /pagar` com forma; PDV/Nova Venda “Paga” via reserva + pagar | Simulador externo (dev) · **14-B/C/D** |
| Meios de pagamento | ✅ UI 14-A (DINHEIRO, PIX, CREDITO, DEBITO_BANCARIO) | **14-C** pinpad débito (TEF) |
| Cancelamento venda paga | ✅ Motivo + autorização **GERENTE** (Sessão 11.1) | Estorno financeiro/fiscal/NFC-e = **futuro** |
| Catálogo / precificação / compras | Cadastro enxuto; `precoVenda` livre; estoque via movimentação (entrada manual) | Precificação básica **pós-Sessão 11**; fornecedor + NF-e **Fase 6 / Sessão 13+** |
| Código barras / QR produto | Gerar PNG + salvar no banco + baixar | **Impressão etiqueta** + QR só EAN = **pós-12.5** (precisa impressora para teste) |
| Evolução frontend (arquitetura) | hooks ✅ · UI kit ✅ · Query+Vitest ✅ · **PDV ✅** · **14-A pagamento UI** | Simulador + commit |
| E-commerce B2C (loja web cliente) | ⬜ não implementado | **Fase 15** — ver `ECOMMERCE-B2C-PLANEJAMENTO.md` |

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
npm run test
npm run build
```

---

## Progresso do projeto (resumo)

| Área | Status |
|------|--------|
| Infra + Postgres + Swagger | ✅ |
| Produtos, estoque, vendas, kits | ✅ (backend) |
| **Reserva de estoque (PENDENTE)** | ✅ backend + UX frontend |
| Clientes e colaboradores | ✅ (backend) |
| Auth JWT + Swagger Authorize | ✅ |
| CI GitHub Actions (backend) | ✅ |
| Frontend: login | ✅ |
| Frontend: produtos (CRUD, kits, busca nome/EAN, imagem, **coluna estoque**) | ✅ |
| Frontend: clientes (CRUD, CEP, telefone int., documento estrangeiro) | ✅ |
| Frontend: estoque (saldo, movimentação manual, histórico; indicador colorido; só unitários) | ✅ |
| Frontend: vendas (carrinho, listagem, cancelamento; kits na busca) | ✅ |
| Frontend: UI kit (tokens + componentes `ui/`) | ✅ Sessão 12.5 |
| Frontend: TanStack Query + Vitest | ✅ Sessão 13-FE |
| Frontend: upload imagem produto (MinIO dev) | ✅ Sessão 11.5 |
| Frontend: salão/caixa + reserva estoque + saldo tempo real | ✅ Sessão 13+ |
| Frontend: PDV caixa (`/pdv`) | ✅ Sessão 13+/14 |
| Meios pagamento (14-A) + pinpad/TEF + fiscal | ✅ 14-A FE + simulador `:9090` + UX polling Pix | **14-B/C/D** Stone/Getnet |
| **E-commerce B2C (cliente final)** | ⬜ planejado — **último módulo** | **[`.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md`](.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md)** (Fase 15) |

Cronograma completo por sessões: [`.cursor/CONTEXTO-OMNICORE.md`](.cursor/CONTEXTO-OMNICORE.md).

---

## Desenvolvimento com Cursor

- Abra o workspace **`~/omnicore/`** para backend + frontend juntos.
- **Simulador de pagamento (14-A dev):** pasta irmã **`~/omnicore-pagamento-simulador/`** — skill em `.cursor/skills/omnicore-pagamento-simulador/SKILL.md`; porta **9090**. **Não é TEF/maquininha real** — imita o webhook/contrato externo; produção = **14-B** (Pix PSP) + **14-C** (pinpad Stone/Cielo/Rede via TEF ou API).
- Em chat novo: `@.cursor/CONTEXTO-OMNICORE.md` para restaurar contexto.
- **Multi-PSP (Stone/Getnet/PagBank…):** `@.cursor/MULTI-PSP-ADAPTERS.md` — Port/Adapter, config por loja, Pix via PSP
- Regra persistente em `.cursor/rules/omnicore-projeto.mdc`.

---

## Licença

Projeto privado em desenvolvimento. Definir licença antes de distribuição pública.
