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
| Caixa | PDV checkout (dinheiro, cartão, Pix) — **14-A:** `/caixa` modal pagamento; **PDV bip** ✅ `/pdv` + formas |
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
├── frontend-app/                 ← React (Sessões 6–11 ✅ — login, produtos, kits, clientes, estoque, vendas)
├── docker-compose.yml            ← Postgres (NÃO commitar alterações locais sem pedir)
├── CONTEXTO-OMNICORE.md          ← atalho na raiz → aponta para .cursor/
└── omnicore.code-workspace
```

**Repositório irmão (fora do git omnicore):**

```
~/omnicore-pagamento-simulador/     ← simulador dev Pix/cartão/débito (:9090)
├── README.md
└── .cursor/skills/omnicore-pagamento-simulador/
    ├── SKILL.md                    ← skill Agent para implementar o simulador
    └── reference.md                ← contrato HTTP + webhook
```

- **Porta:** `9090` · **Config Cerebro:** `omnicore.pagamento.experience.base-url=http://localhost:9090`
- **Webhook OmniCore:** `POST http://localhost:8080/api/pagamentos/webhook`
- **Status:** simulador Node ✅ · skill Cursor ✅ · webhook `permitAll` ✅
- **Workspace:** abrir `~/omnicore-pagamento-simulador/` no Cursor ou adicionar pasta ao workspace OmniCore

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
| 7.2 | Produtos: busca por nome/código de barras + UX listagem (paridade clientes) | ✅ | `856f1e0`, `54d4b56` |
| 7.3 | Produtos: thumbnail + lightbox na listagem (`urlImagem`) | ✅ | `c852fb4` |
| **8** | **Frontend: composição de pacotes (kits)** | ✅ testado browser | `07c89c2`, `6834f88`, `d11f099` |
| **9** | **Frontend + backend: clientes (CRUD, CEP, telefone internacional)** | ✅ testado browser | `7490a01` |
| **9.1** | **Clientes estrangeiros: tipo documento, busca, CPF válido, UX listagem** | ✅ | `cd60244` |
| **10** | Frontend: estoque (saldo, entrada/saída, histórico) | ✅ testado browser | `51d409e` |
| **11** | **Frontend: vendas (nova venda, listagem, cancelamento) + ajustes estoque/kit** | ✅ testado browser | `c0ae1d9` |
| **11.1** | **Cancelamento venda paga: autorização gerente + motivo (backend + modal frontend)** | ✅ testado browser | `09f36d6` |
| **10.5** | **Frontend: hooks compartilhados (DRY listagens/forms)** | ✅ entregue | `7e259ba` |
| 12 | PWA salão: manifest, offline básico, layout mobile + código de barras | ✅ entregue | `c853b62` |
| 12+ | Indicador visual estoque: coluna em Produtos + cores por faixa (Produtos/Estoque) | ✅ entregue | `647c384` |
| 12+ | Gerar/persistir código de barras + QR Code no cadastro produto | ✅ entregue | `2b164e6` |
| **11.5** | **Upload imagem produto (opcional)** | ✅ entregue | `732ef38` |
| **12.5** | **Frontend: UI kit mínimo + design tokens** | ✅ entregue | `f76cb01` |
| **13-FE** | **TanStack Query + testes Vitest (frontend)** | ✅ entregue | `abab2c9` |
| **13+ (parcial)** | **Pagar venda PENDENTE→PAGA + tela Caixa + UX salão pós-venda** | ✅ testado browser | `cd11666` |
| **13+** | **Reserva de estoque** (PENDENTE segura quantidade; saldo disponível) + UX saldo/qtd | ✅ testado browser | `58add40` |
| **13+/14 — PDV** | **Tela checkout bip contínuo** (mercado, padaria, conveniência) | ✅ entregue | `f0e442e` |
| **14-A** | **Pagamentos** — registro + porta externa + **UI Caixa/PDV/Nova Venda** (sem mock) | ✅ FE + PDV teclado | `af19b2a` |
| **14-A+** | **QR Pix na tela** + reabrir pendente (Aguardando) + **Paga no caixa** (Nova Venda) | ✅ | `51ac89a` |
| **fix** | **Linter Java** — null safety pagamento + testes (Mockito/captor) | ✅ | `91700b2` |
| 14+ | Pix PSP sandbox · TEF pinpad · fiscal/NFC-e | ⬜ | — |

### Detalhe das próximas sessões (frontend)

| Sessão | Escopo | APIs já prontas |
|--------|--------|-------------------|
| ~~**9**~~ | ~~CRUD clientes; busca por CPF; endereço via CEP; telefone internacional~~ | ✅ `7490a01` |
| ~~**10**~~ | ~~Saldo, movimentação manual, histórico paginado por produto~~ | ✅ |
| ~~**11**~~ | ~~Carrinho simples → `POST /api/vendas`; listagem com filtros; cancelar venda~~ | ✅ `c0ae1d9` |
| **10.5** | Hooks: `useUnauthorizedHandler`, `useDebouncedSearch`, `usePaginatedResource`, `useAsyncAction`; `onlyDigits` em `utils/strings.ts` | ✅ |
| **12** | `vite-plugin-pwa`; UI mobile vendedor; scan/input código de barras | ✅ |
| **11.5** | Upload imagem + Object Storage (MinIO dev) | ✅ |
| **12.5** | `components/ui/`: Button, TextField, SearchPanel, PaginationBar, tokens CSS | ✅ |
| **13-FE** | TanStack Query + Vitest/Testing Library (meta ~15–20 testes) | ✅ |

### Sessão 7.2 — busca e paginação de produtos (paridade clientes)

**Backend:** `GET /api/produtos?nome=` e `?codigoBarras=` (mín. 3 caracteres/dígitos, paginado); filtros combináveis (AND); normalização EAN só dígitos; testes em `ProdutoServiceTest` e `ProdutoControllerTest`.

**Frontend:** campos “Buscar por produto” e “Código de barras”; filtro instantâneo na página + API a partir de 3 chars; paginação sempre visível; input não perde foco durante refresh.

### Sessão 7.3 — imagem na listagem de produtos — entregue

**Frontend:** coluna/campo **Imagem** na listagem (tabela desktop + cards mobile); miniaturas 80×80 (mobile) / 96×96 (desktop); placeholder com inicial quando sem URL ou erro de carga; clique abre **lightbox** centralizado (×, Esc ou clique fora para fechar); conversão automática de URLs GitHub `/blob/` para `raw.githubusercontent.com`.

### Sessão 10 — estoque no frontend — entregue

**Frontend:** rotas `/estoque` (listagem de produtos ativos com saldo via `GET /api/estoque/saldo/{id}`) e `/estoque/:produtoId` (saldo em destaque, abas entrada/saída manual, histórico paginado); busca por nome/EAN (paridade produtos); link **Estoque** no menu; `api/estoque.ts` + `types/estoque.ts`; `apiFetch` trata respostas 201/204 sem body.

**Teste validado (24/ago):** produto id 8 (Biscoito Recheado Chocolate) — entrada +20, saída −3 (Avaria), saldo 17 — banco, API e UI conferidos.

### Sessão 11 — vendas no frontend — entregue

**Frontend — vendas:** rotas `/vendas` (listagem paginada, filtro por status, cancelamento), `/vendas/nova` (carrinho, busca produto por nome/EAN, busca cliente por documento CPF/passaporte/doc. estrangeiro, status PENDENTE ou PAGA na criação), `/vendas/:id` (detalhe + cancelar); link **Vendas** no menu; `api/vendas.ts` + `types/venda.ts`.

**Frontend — regras de estoque na venda:** `utils/produtoEstoque.ts` — só produtos com saldo disponível; kits (PACOTE) com disponibilidade = mínimo montável pelos componentes (espelha `VendaService`); label “Kits disp.” vs “Estoque”.

**Frontend — ajustes estoque/kit (pós-teste):** `/estoque` lista só **unitários** (kits não aparecem para movimentação manual); `/estoque/:id` em produto PACOTE exibe aviso + link para composição do kit; composição de kit só permite adicionar unitários com **saldo > 0**.

**Teste validado (24/ago):** Venda #5 — Rafael Castro, 10× Fanta R$ 9,50 = R$ 95,00; criada PENDENTE (sem baixa); simulação de pagamento no banco → PAGA + saída −10 (saldo Fanta 90) — UI estoque/histórico conferidos.

**Débito técnico — pagamento / caixa (parcialmente resolvido):** ✅ `PUT /api/vendas/{id}/pagar` + tela `/caixa` + detalhe venda; **formas** (Pix, débito, crédito, dinheiro, TEF) = **14+** — ver seção “Meios de pagamento e TEF”. ✅ Reserva de estoque na PENDENTE entregue (13+).

### Sessão 13+ — reserva de estoque + UX saldo em tempo real — entregue

**Backend:** entidade `ReservaEstoque` (`tb_reserva_estoque`); `ReservaEstoqueService` — criar reserva na venda **PENDENTE**, consumir no **pagar**, liberar no **cancelar**; kits reservam nos componentes; venda **PAGA** direta sem reserva (igual antes). `GET /api/estoque/saldo/{id}` retorna **disponível** (físico − reservas ATIVAS).

**Frontend:** polling silencioso de saldos a cada **4s** em `/estoque` e `/produtos` (`useProdutoSaldos` + `refetchIntervalMs`); Salão e Nova Venda exibem **estoque disp.**, qtd editável com **teto = disponível**; validação em `carrinhoVenda.ts` + testes Vitest.

**Teste validado (29/ago):** Coca-Cola saldo 45 — não aceita qtd 46 no carrinho; tela Estoque/Produtos atualiza após venda/pagamento em outro terminal sem F5.

### Sessão 13+/14 — PDV caixa (`/pdv`) — entregue

**Frontend:** rota **`/pdv`** — bip contínuo, carrinho com teto de estoque, atalhos **F3/F4/F5/F10**, finaliza **`PAGA`** direto; painel **imagem do produto** (≥1024px) ao bipar; **prévia cupom térmico** montada em tempo real (≥1024px); layout largo para monitor.

**Reutiliza:** `BarcodeField`, `carrinhoVenda`, `criarVenda`, `ClienteBuscaSection` (opcional).

**Fora do MVP v1 (14+):** formas de pagamento (Pix/débito/crédito/dinheiro), TEF, impressão cupom/NFC-e.

**Teste pendente (Roberto — tarde):** fluxo completo em monitor + leitor USB; validar painéis laterais e atalhos.

### Sessão 13+ (parcial) — salão→caixa: pagar venda — entregue

**Backend:** `PUT /api/vendas/{id}/pagar` — só **PENDENTE**; revalida produto ativo + estoque; status **PAGA** + `registrarSaidaPorVenda` (kits baixam nos filhos).

**Frontend:** rota **`/caixa`** (lista pendentes, confirmar pagamento); botão pagar no detalhe `/vendas/:id`; `pagarVenda` em `api/vendas.ts`.

**UX Salão:** após registrar venda rápida, **banner no `/salao`** (“Venda #N registrada — envie ao caixa”) em vez de redirect para admin com botão pagar.

**Teste validado (28/ago):** vendas salão #14/#15 — pagamento via Caixa; Nova Venda “Paga (caixa)” #16 liquida na hora; salão pós-registro permanece no modo vendedor.

### Planejamento — Sessão PDV (pós-reserva estoque) — acordado 28/ago

**Decisão (Roberto + Logan):** implementar **reserva de estoque (13+)** primeiro; em seguida **tela PDV** dedicada ao nicho mercado/supermercado/padaria/conveniência (alto giro, leitor USB).

**Problema:** Nova Venda e Salão atendem bem varejo geral e vendedor no chão, mas **não** são UX de caixa fixo com bip contínuo (referência: PDV tipo ERP — lista crescendo, subtotal grande, atalhos de teclado).

**Canais de venda — complementares (mesmo backend):**

| Canal | Rota atual | Público | Fluxo típico |
|-------|------------|---------|--------------|
| Salão | `/salao` | Vendedor mobile | Bip → **PENDENTE** → cliente ao caixa |
| Nova venda | `/vendas/nova` | Admin/balcão | Busca nome → PENDENTE ou **PAGA** |
| Caixa (atual) | `/caixa` | Operador caixa | Confirma pagamento de **PENDENTE** |
| **PDV (futuro)** | **`/pdv`** (provisório) | Caixa mercado/padaria | Bip contínuo → finalizar **PAGA** direto |

**Escopo MVP PDV (proposta):**

- Layout caixa: campo código de barras **sempre focado**; tabela de itens; subtotal/total em destaque
- Bip contínuo: mesmo EAN incrementa quantidade; Enter confirma leitura
- Atalhos teclado (inspirado PDV clássico): ex. F3 excluir linha, F4 quantidade, F5 nova venda, F10 finalizar
- Finalizar: `POST /api/vendas` status **PAGA** (reutiliza engine atual + baixa estoque)
- Cliente/CPF opcional na venda (fiscal completo = **14+**)
- Reaproveitar: `BarcodeField`, `carrinhoVenda`, `buscarProdutoPorCodigoBarras`, `criarVenda`

**Fora do MVP PDV (v1):** peso/KG (açougue), tecla preço, impressora cupom/gaveta, NFC-e. **Meios de pagamento reais** (Pix/cartão/TEF) = **14+** — ver seção abaixo; PDV v1 pode finalizar **PAGA** com forma registrada em modo simulado.

**Ordem no roadmap:** `13+ reserva estoque` → **`13+/14 PDV`** → **`14+ meios de pagamento + fiscal`**.

**WebSocket desconto gerente:** permanece débito 13+/14+ (não bloqueia PDV MVP).

### Planejamento — Meios de pagamento (14+) — acordado 28/ago · **revisado 31/ago**

**Decisão (Roberto + Logan — 31/ago):** OmniCore fica **preparado para receber pagamentos reais** nas formas abaixo. **Não haverá mock na tela de execução** (PDV/Caixa). Mock/fake fica **somente em testes automatizados** (JUnit/Vitest). Em **dev manual**, um **sistema interno separado** (a construir por Roberto) simula a **experiência do cliente** (telas Pix, cartão crédito, débito bancário) e **devolve o payload** de confirmação; OmniCore registra e liquida a venda normalmente.

#### Formas de pagamento — MVP 14-A

| Forma (`FormaPagamento`) | Descrição | Quem processa |
|--------------------------|-----------|---------------|
| **DINHEIRO** | Troco na gaveta | **100% OmniCore** (valor recebido + troco) |
| **PIX** | QR / chave | OmniCore orquestra → **sistema de experiência** (dev) ou PSP (prod) |
| **CREDITO** | Cartão de crédito | Idem — experiência externa devolve NSU, bandeira, parcelas |
| **DEBITO_BANCARIO** | Débito automático / débito em conta bancária | Idem — experiência externa devolve confirmação |

#### ⚠️ Cartão de débito (pinpad) ≠ débito bancário

| Conceito | O que é | No OmniCore |
|----------|---------|-------------|
| **Cartão de débito** | Cliente passa cartão no **pinpad** (TEF → adquirente) | **Fase 14-C** — forma futura `CARTAO_DEBITO`; agente local + CliSiTef |
| **Débito bancário / débito automático** | Débito **direto na conta** (convênio bancário) | **14-A** — enum `DEBITO_BANCARIO` |

No varejo físico o **pinpad de débito** é muito comum; fica **documentado e previsto** (14-C/TEF), mas **não confundir** com débito em conta do MVP 14-A.

#### Arquitetura — Port/Adapter (hexagonal)

```
React PDV/Caixa  →  OmniCore API (Java)  →  PagamentoVenda (persistência)
                              ↓
                    PaymentExperiencePort (interface)
                              ↓
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   DinheiroHandler     HttpExperienceClient   (prod) PSP / TEF agent
   (só OmniCore)       → localhost:9xxx       Efi, MP, CliSiTef…
                       (sistema interno Roberto)
```

- **PDV/Caixa:** fluxo real — escolhe forma → “Aguardando pagamento…” → resultado → venda **PAGA** se aprovado.
- **Testes unitários:** `FakePaymentExperience` in-memory — **nunca** na UI.
- **Dev manual:** `omnicore.pagamento.experience.base-url=http://localhost:9xxx` apontando para o simulador externo.

#### Contrato mínimo — sistema de experiência (dev/prod)

```http
POST {baseUrl}/experiencia/pagamentos/iniciar
{ "referenciaOmniCore", "vendaId", "forma", "valor", "parcelas"? }

→ { "experienciaPagamentoId", "status": "PENDENTE", "urlExperiencia"? }

GET  {baseUrl}/experiencia/pagamentos/{id}
POST (webhook OmniCore) { "status": "APROVADO"|"RECUSADO", "nsu", "referenciaExterna" }
```

Roberto construirá o simulador **fora** do monorepo em **`~/omnicore-pagamento-simulador/`**; OmniCore só consome o contrato. Skill Agent: `@~/omnicore-pagamento-simulador/.cursor/skills/omnicore-pagamento-simulador/SKILL.md`.

#### Fases de implementação (atualizado)

| Fase | Escopo |
|------|--------|
| **14-A — Registro + porta** | Enum `FormaPagamento`; `tb_pagamento_venda`; `PaymentExperiencePort` + HTTP client; dinheiro interno; UI PDV/Caixa **sem mock**; fake só em testes |
| **14-B — Pix produção** | PSP **Stone + Getnet**; QR na tela — PDV, Caixa, Nova Venda Paga, web |
| **14-C — Terminal integrado** | Maquininha **Stone + Getnet** — crédito/débito/Pix no device |
| **14-D — Fiscal** | NFC-e, estorno financeiro, conciliação |
| **14-E — Checkout web (B2C)** | Cliente final: Pix + cartão via API (sem maquininha) — **detalhe em `.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md`** |
| **15 — E-commerce B2C (módulo completo)** | **Último módulo** — vitrine, carrinho, checkout, entrega, balcão; ver **`ECOMMERCE-B2C-PLANEJAMENTO.md`** |

#### TEF — referência (14-C, não confundir com 14-A)

**TEF** = protocolo PDV ↔ pinpad ↔ adquirente (CliSiTef DLL, Windows). Browser React **não** fala com pinpad; exige **agente local**. SitDemo para homologação sem adquirente real.

#### Simulador dev vs maquininha real (importante)

O **`~/omnicore-pagamento-simulador/`** (:9090) **não é TEF** nem adquirente. Simula o **contrato externo** (iniciar → PENDENTE → aprovar/recusar → webhook → NSU fake) para desenvolver PDV/Caixa/estoque **sem** Stone, Cielo, pinpad ou Pix BACEN real.

| Ambiente | O que autoriza | Papel no OmniCore |
|----------|----------------|-------------------|
| **Simulador :9090** (hoje) | Botão “Aprovar” na tela web | `PaymentExperiencePort` → HTTP |
| **Pix produção (14-B)** | PSP (Efi, MP, banco…) — QR/chave SPI | Mesma porta; troca `base-url` + adapter PSP |
| **Cartão pinpad / TEF (14-C)** | Pinpad + adquirente (Cielo, Rede, Getnet…) | Agente local (CliSiTef ou SDK do fabricante) |
| **Smart POS** (Stone, SumUp, MP Point…) | App/API na própria maquininha | Adapter por provedor (API REST + webhook ou bridge TEF) |

**Fluxo de loja física (objetivo produção):** operador F10 no PDV → OmniCore registra pagamento PENDENTE → **comando vai para terminal/PSP** → cliente aproxima cartão ou lê QR **na maquininha** → provedor confirma → webhook/agente → venda **PAGA** (igual ao simulador, só que hardware/API real).

**Limitação do browser:** React no PDV **nunca** fala direto com USB/Bluetooth do pinpad; sempre há **camada intermediária** (agente Windows, smart POS com API, ou integração TEF homologada).

#### Maquininhas (Stone, Cielo, Rede, PagSeguro, SumUp, InfinitePay, Getnet…)

No varejo, a “maquininha” integrada ao PDV pode ser:

1. **Pinpad clássico + TEF** — ERP/PDV manda valor e forma; pinpad pede cartão/senha; NSU volta ao sistema. Comum em supermercados e oficinas com software desktop.
2. **Smart POS com API** — terminal Android (Stone, SumUp, MP Point…) recebe cobrança via API; cliente paga na própria maquina (Pix QR, crédito, débito); confirmação por webhook ou polling.
3. **Pix separado do cartão** — QR no display do PDV ou na maquininha; PSP notifica OmniCore (14-B).

**Dá para o OmniCore ter esses recursos?** **Sim**, em fases — a arquitetura **14-A já prepara** (`PaymentExperiencePort`, webhook, `tb_pagamento_venda`, UI “Aguardando pagamento”). O trabalho futuro é **adapter por provedor**, não refazer o PDV:

| Fase | Entrega |
|------|---------|
| **14-A** ✅ | UI + contrato + simulador dev |
| **14-B** | Pix **Stone + Getnet** — QR na tela (PDV, Caixa, Nova Venda Paga, web) |
| **14-C** | Maquininha **Stone + Getnet** — crédito/débito/Pix no terminal |
| **14-C+** | Outros terminais (SumUp, InfinitePay…) — adapter por contrato |
| **14-D** | Estorno, conciliação NSU, NFC-e |
| **14-E** | Checkout **web cliente** — Pix + cartão API (sem maquininha) |

**Decisão prática (atualizada 01/set):** piloto **Stone + Getnet (Santander)**; conta PJ + sandbox de cada um antes de codificar adapters.

#### Multi-PSP — adapters e config por loja (01/set/2026)

**Não existe API universal** Stone = Getnet = PagBank = InfinitePay. OmniCore usa **Port/Adapter**:

- **Universal (não refaz):** PDV, Caixa, Nova Venda, `PagamentoService`, webhook interno, UI QR/aguardando.
- **Por PSP:** classe adapter (`PaymentExperiencePort`) + credenciais + tradução webhook.
- **Por loja:** config `omnicore.pagamento.provider=stone|getnet|…` — estabelecimento escolhe **um** PSP ativo (MVP single-loja).
- **Pix:** OmniCore → PSP → Bacen (SPI) → app do banco do cliente; **não** integração direta com Caixa/BB/Nubank.

**Documento completo:** `@.cursor/MULTI-PSP-ADAPTERS.md` (checklist novo PSP, config alvo 14-B, fluxo Pix, prioridade Stone/Getnet → 14-B+).

**14-B+ (sob demanda):** PagSeguro/PagBank, InfinitePay, Mercado Pago — mesmo padrão adapter, sem refazer telas.

#### Decisão de produto (Roberto — 01/set/2026): pagamentos omnichannel

**Objetivo:** OmniCore atende **loja física** (gerente, vendedor, caixa) **e** **módulo web** (cliente final compra e paga). Um motor (`PagamentoService` + adapters), UX por canal.

**Provedores piloto:** **Stone** e **Getnet (Santander)**.

##### Matriz — onde cada forma aparece

| Forma | PDV | Caixa | Nova Venda Paga | Web cliente |
|-------|-----|-------|-----------------|-------------|
| Dinheiro | ✅ | ✅ | ✅ | ❌ |
| Pix QR na tela | ✅ | ✅ | ✅ | ✅ |
| Pix/cartão na maquininha | ✅ | ✅ | ✅ | ❌ |
| Cartão link/gateway | ⚠️ | ⚠️ | ⚠️ | ✅ principal |
| Débito em conta | ✅ simulador | ✅ | ✅ | futuro |

**Loja:** operador escolhe forma → QR na tela **e/ou** comando na maquininha → webhook → PAGA.

**Web:** cliente no checkout — Pix (QR/copia-e-cola) + cartão tokenizado; **sem** maquininha.

##### Arquitetura alvo

```
PagamentoService → PaymentExperiencePort
    ├── Dinheiro (interno)
    ├── PixPspAdapter (Stone, Getnet) — QR tela + API
    ├── TerminalAdapter (Stone, Getnet) — maquininha
    └── WebCheckoutAdapter (Stone, Getnet) — B2C
```

**14-E (web B2C):** catálogo público, carrinho, frete, antifraude — **módulo completo documentado em `@.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md` (Fase 15 — último módulo, após 14-B/C/D).**

#### Fase 15 — E-commerce B2C (último módulo — planejamento completo)

**Decisão (01/set/2026):** construir **somente após** loja física + pagamentos Stone/Getnet (14-B/C) estáveis. **Não confundir** com PWA Salão (vendedor).

| Documento | Conteúdo |
|-----------|----------|
| **`.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md`** | Fluxo cliente → carrinho → pagamento → balcão/entrega; telas `/loja/*`; APIs; subfases 15-A…15-G; critérios MVP |

**Resumo:** cliente navega catálogo → carrinho → checkout (endereço + frete ou retirada) → Pix/cartão web → pedido `AGUARDANDO_RETIRADA` → operador **balcão** separa e despacha → `CONCLUIDA`. Reutiliza `Venda`, `Cliente`, `PagamentoService`, estoque e status já previstos no backend.

#### Modelo de dados (14-A)

- `tb_pagamento_venda`: `venda_id`, `forma` (DINHEIRO|PIX|CREDITO|DEBITO_BANCARIO), `valor`, `valor_recebido`, `troco`, `status` (PENDENTE|APROVADO|RECUSADO|ESTORNADO), `provider` (INTERNO|EXPERIENCIA|EFI|…), `referencia_externa`, `nsu`, `experiencia_pagamento_id`, `created_at`
- Venda **PAGA** quando pagamento(s) aprovado(s) ≥ `valor_total` (MVP: pagamento único)
- `PUT /api/vendas/{id}/pagar` evolui com payload de pagamento (retrocompatível)

#### Débitos relacionados (permanecem 14+)

- Estorno financeiro no cancelamento
- Split / múltiplas formas na mesma venda
- Conciliação (NSU, extrato)
- NFC-e vinculada ao pagamento
- **Cartão débito pinpad** (`CARTAO_DEBITO`) — 14-C

**Decisão vigente (31/ago):** **14-A** entrega UI de pagamento em Caixa, PDV e Nova Venda “Paga (caixa)”; Salão permanece só PENDENTE.

**14-A — progresso (31/ago):**
- **Backend** `bad0701` — `FormaPagamento`, `PagamentoVenda`, `PagamentoService`, `PaymentExperiencePort` (HTTP + fake em testes), `PUT /pagar` com body opcional, `POST /api/pagamentos/webhook`, config `omnicore.pagamento.experience.*`.
- **Frontend** `47b04ac` — `PagamentoPanel` + `PagamentoModal`; `/caixa` modal; `/pdv` painel + `registrarVendaComPagamento`; `/vendas/nova` e `/vendas/:id` com forma; Vitest `pagamentoForm.test.ts` (48 testes).
- **Simulador externo** — `~/omnicore-pagamento-simulador/` ✅ (Node :9090, telas Pix/crédito/débito, webhook); skill Cursor ✅; teste Pix integrado ✅ (Roberto, 31/ago).
- **UX aguardando pagamento** — link “Abrir tela Pix/cartão”, polling 3s, modal fecha ao liquidar (`a54f898`).
- **PDV teclado** — 1–4 formas, F10 duas etapas, auto-refresh `/vendas` (`af19b2a`).
- **Docs** — simulador dev vs TEF/maquininhas Stone/Getnet (14-B/C); **multi-PSP adapters** (`MULTI-PSP-ADAPTERS.md`).

#### Matriz UI pagamento (14-A)

| Tela | Rota | Pagamento |
|------|------|-----------|
| Caixa | `/caixa` | Modal — `PUT /pagar` em venda PENDENTE |
| PDV | `/pdv` | Painel checkout — `POST` PENDENTE + `PUT /pagar` |
| Nova Venda | `/vendas/nova` | Painel só se “Paga (caixa)” — mesmo fluxo PDV |
| Salão | `/salao` | **Sem** pagamento — só PENDENTE → caixa |

### Sessão 11.1 — cancelamento com autorização de gerente — entregue

**Regra de negócio (não era débito técnico — era lacuna de segurança/perfil na Sessão 11):** venda **PENDENTE** → vendedor cancela sem fricção; venda **PAGA/CONCLUÍDA** → exige **motivo** + credenciais de **GERENTE** (vendedor/caixa/conferente solicita; gerente logado só informa motivo). Estorno de estoque automático mantido.

**Backend:** `PUT /api/vendas/{id}/cancelar` aceita `CancelarVendaRequestDTO` (motivo, autorizadorEmail, autorizadorSenha); `AuthService.validarCredenciaisGerente`; auditoria em `tb_venda` (`motivo_cancelamento`, `cancelado_por_colaborador_id`, `autorizado_por_colaborador_id`).

**Frontend:** modal `CancelarVendaModal` na listagem e detalhe; motivo exibido em venda cancelada.

**Dev:** gerente seed via Swagger ou `cerebro-backend/scripts/seed-gerente-dev.sh` — ex.: `ana.gerente@omnicore.local` / `senha123`.

**Teste validado (25/ago):** Venda #5 cancelada por Carlos (vendedor) com autorização Ana (gerente), motivo “Produto com defeito”, estorno +10 Fanta (saldo 100) — banco e UI conferidos.

**Débito técnico — devolução completa (futuro):** estorno financeiro (Pix/cartão/dinheiro), NFC-e, cancelamento parcial, prazo por canal — distinto desta regra operacional de autorização.

### Sessão 10.5 — hooks compartilhados (frontend) — entregue

**Objetivo:** DRY do boilerplate repetido em listagens/forms após Sessões 6–11 (401, debounce de busca, paginação, ações com loading).

**Novos módulos em `frontend-app/src/hooks/`:**
- `useUnauthorizedHandler` — 401 → logout
- `useDebouncedSearch` — busca com debounce 300 ms, flags `isShort` / `isServerSearch`
- `usePaginatedResource` — `initialLoading`, `refreshing`, `loadError`, `load()`, paginação
- `useAsyncAction` — `actionKey` + `execute()` para inativar/cancelar

**Util:** `utils/strings.ts` — `onlyDigits` (reexportado em `utils/cpf.ts` para compat).

**Páginas refatoradas:** Produtos, Clientes, Estoque, Vendas, Nova Venda; forms/detalhe usam `useUnauthorizedHandler`.

**Build:** `npm run build` + `npm run lint` OK.

### Sessão 12 — PWA salão (frontend) — entregue

**PWA:** `vite-plugin-pwa` — manifest (`start_url: /salao`, standalone, theme `#0f2744`), service worker com precache do shell + `NetworkFirst` para `/api/*`; registro em `main.tsx`; banner offline (`OfflineBanner`).

**Modo salão:** rotas `/salao` (venda rápida) e `/salao/vendas` (lista mobile) com `SalaoLayout` — header compacto, navegação inferior (Vender · Vendas · Admin).

**Código de barras:** `BarcodeField` (input leitor USB + botão Câmera); `BarcodeScannerModal` via `BarcodeDetector` nativo (fallback: digitar); lookup `buscarProdutoPorCodigoBarras` → carrinho com +/- ; venda **PENDENTE** por padrão.

**Shared:** `utils/carrinhoVenda.ts`, `useClienteBusca` + `ClienteBuscaSection` (salão e Nova Venda).

**Admin:** link **Salão** no menu principal (`Layout`).

**Pós-teste (25/ago):** busca cliente completa no salão (nome/documento/ocasional); header salão (nome + Sair sem cortar); **Venda #8** testada (Rafael Castro · Fanta ×10 + Biscoito ×3) — simulação PAGA no banco OK; Postgres Docker `TZ/PGTZ=America/Manaus`; script `simular-pagamento-venda-dev.sql`.

**Teste sugerido:** login → `/salao` → EAN → registrar venda; Add to Home Screen (PWA).

### Pós-12 — indicador visual de estoque (27/ago) — entregue

**Backend:** `GET /api/estoque/saldo/{id}/indicador` — saldo + **referência** (pico histórico de movimentações).

**Frontend:** coluna **Estoque** em `/produtos` (unitários; kits com `—`); `SaldoCell` + `useProdutoSaldos` + faixas de cor (verde 100% · azul ≥50% · laranja ≥25% · rosa piscando &lt;25% · vermelho 0) em **Produtos** e **Estoque**; tooltip com % do pico.

**Testado:** vendas #10 (Fanta → laranja) e #11 (Biscoito → rosa) após simulação PAGA.

### Pós-12 — código de barras + QR no cadastro (27/ago) — entregue

**Frontend:** `ProdutoCodigosSection` no form produto — gera EAN (jsbarcode) e QR JSON (qrcode); PNG persistido; **Baixar PNG**; reabre salvo via `GET /api/produtos/{id}/codigos`.

**Backend:** colunas `imagem_codigo_barras`, `imagem_qr_code` (TEXT data URL); `@JsonIgnore` na listagem; fix `@JsonView` que quebrava paginação.

**Testado:** produtos #1 (Coca-Cola) e #8 (Biscoito) com imagens salvas.

### Débito técnico — Etiqueta e QR do produto (futuro — pós-12.5)

| Item | MVP atual (27/ago) | Quando / observação |
|------|-------------------|---------------------|
| **Impressão de etiqueta** | Gerar PNG, salvar no banco, **Baixar PNG** | **Pós-12.5** — layout para impressora comum ou térmica (Zebra/Elgin); Roberto precisa de impressora (ou validar só layout via PDF) para testar na loja |
| **QR simples (só EAN)** | QR em JSON (`id`, nome, preço, categoria…) | Opcional futuro — QR contendo só o EAN para leitura fácil com câmera genérica do celular |

**Decisão (27/ago):** impressão de etiqueta **não bloqueia** Sessão 12.5; cadastro + leitor USB já atendidos.

### Sessão 12.5 — UI kit mínimo (frontend) — entregue

**Design tokens:** `frontend-app/src/styles/tokens.css` — variáveis `--oc-*` (cores marca, texto, superfícies, feedback, tipografia, espaçamento, raio, sombra); import em `index.css`.

**Componentes:** `frontend-app/src/components/ui/` — `Button`, `TextField`, `TextArea`, `PageHeader`, `SearchPanel`, `PaginationBar`, `StatusMessage` + `ui.module.css` compartilhado; barrel `index.ts`.

**Páginas migradas (piloto):** `LoginPage` (TextField, Button, StatusMessage); `EstoquePage` (PageHeader, SearchPanel, TextField, PaginationBar, StatusMessage). Demais telas podem adotar gradualmente.

**Build:** `npm run lint` + `npm run build` OK.

### Sessão 13-FE — TanStack Query + Vitest (frontend) — entregue

**TanStack Query:** `@tanstack/react-query`; `QueryProvider` no `App`; `src/lib/queryClient.ts` + `queryKeys.ts`; `src/queries/produtos.ts` (`useProdutosListQuery`, `useInativarProdutoMutation` com invalidação `produtos` + `estoque`).

**Piloto:** `ProdutosPage` migrada de `usePaginatedResource` para Query; hook `useQueryUnauthorized` (401 → logout).

**Vitest:** `vitest.config.ts`, `src/test/setup.ts`, script `npm run test` — **33 testes** em `api/client`, utils (`strings`, `estoqueIndicador`, `validation`, `cpf`), `queryKeys`, `useDebouncedSearch`.

**Demais listagens** (Clientes, Estoque, Vendas) podem migrar gradualmente; `usePaginatedResource` permanece disponível.

### Sessão 11.5 — upload imagem produto — entregue

**Storage:** MinIO (S3-compatible) em dev — `docker compose -f docker-compose.minio.yml up -d`; bucket `omnicore-produtos` criado automaticamente na subida do backend (política leitura pública em `produtos/*`).

**Backend:** AWS SDK S3 → `S3ObjectStorageService`; `POST /api/produtos/imagem/upload` (multipart JPG/PNG/WebP, máx. 5 MB); retorna `{ url }` para `urlImagem`; config `omnicore.storage.*` em `application.yml`.

**Frontend:** `ProdutoImagemSection` no form produto — escolher arquivo, preview, upload automático; campo URL manual mantido como alternativa; `apiUpload` + validação `utils/produtoImagem.ts`.

**Testes:** `ProdutoImagemControllerTest`; Vitest `produtoImagem.test.ts` (4 testes).

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

### Débito técnico — Imagem do produto (upload / storage — futuro)

| Item | Descrição |
|------|-----------|
| **MVP atual (entregue)** | Campo opcional `urlImagem` no backend + input “URL da imagem” no form React — **sem upload de arquivo** |
| **Fluxo alvo (PDF Gemini)** | Usuário escolhe `.jpg`/`.png` no React → API Java recebe arquivo → upload para **Object Storage** (S3, Cloudinary, Supabase Storage ou MinIO) → storage devolve URL pública → Java persiste só a `String` no banco |
| **Por que adiar upload** | Binário no PostgreSQL degrada performance; upload exige **serviço externo ou MinIO** (conta, credenciais, bucket, política pública) — fora do escopo Sessões 1–10 |
| **Dev/teste hoje** | URLs manuais (Git raw, CDN, link público) coladas no cadastro |
| **Melhorias sem storage** | ~~Thumbnail + lightbox na listagem~~ ✅ (Sessão 7.3); preview no form ainda opcional |
| **Dependências para upload real** | Provedor escolhido + credenciais; endpoint `POST` multipart no backend; biblioteca AWS SDK / Cloudinary / MinIO client; input `type="file"` + progresso no frontend; limites de tamanho/tipo MIME |
| **Momento sugerido** | **Após Sessão 11** (vendas no frontend) e **antes da Sessão 12** (PWA salão / vitrine e-commerce) — sessão dedicada tipo **11.5**; até lá, URL manual no cadastro e (opcional) preview/thumbnail sem storage |

**Decisão vigente (PDF Gemini):** preparar o model com `url_imagem`; **upload + nuvem ficam para sessão dedicada** quando o cadastro deixar de ser só operação interna e virar catálogo que cliente/vendedor enxerga — **ideal: entre Vendas (11) e PWA/E-commerce (12)**. Pode adiar até Fase 4–6 se produtos continuarem sendo seedados por dev com URL do Git.

### Débito técnico — Catálogo, precificação, fornecedor e NF-e (futuro)

| Item | Descrição |
|------|-----------|
| **MVP atual (entregue)** | `Produto` enxuto: EAN, nome, descrição, `precoVenda` livre, categoria (texto), `tipoProduto`, `indicadorTamanho`, `urlImagem` — **propositalmente simples** para a fase engine (Sessões 1–10) |
| **Cadastro ≠ estoque** | Criar produto (`POST /api/produtos`) **não** define quantidade; saldo inicia em 0 e vem de **movimentações** (`POST /api/estoque/entrada`) — Sessão 10 expõe isso no frontend |
| **Precificação hoje** | Só `precoVenda` manual; **sem** `precoCusto`, margem, markup, custo médio ponderado nem alerta de preço abaixo do custo |
| **Precificação alvo** | `precoCusto` (última compra ou médio), margem mínima por categoria, `precoSugerido` (ex.: custo ÷ (1 − margem%)); gerente pode manter preço livre com aviso se violar margem |
| **Fornecedores** | Produto pode ser comprado de **N fornecedores** (tabela Produto↔Fornecedor: código no fornecedor, preço compra, prazo, preferencial) — **não implementado** |
| **NF-e de entrada** | Compra gera NF-e → entrada automática no estoque + atualização de custo — módulo **Compras + Fiscal** (Fase 6+) — **não implementado**; hoje simula-se com entrada manual + justificativa |
| **Multissetorial (PDF)** | Grade Pai/Filho (moda), unidade KG/L + peso decimal (supermercado), marca/garantia (eletro), validade/perecível — evoluções futuras sobre o mesmo catálogo |
| **Momento sugerido — precificação básica** | **Após Sessão 11** (vendas UI ok): `precoCusto` + margem + sugestão, ainda sem NF-e |
| **Momento sugerido — fornecedor + NF-e** | **Fase 6 / Sessão 13+** (Compras + integração fiscal), amarrando estoque e custo na entrada da nota |

**Decisão vigente (Roberto + PDF):** cadastro simples **não bloqueia** Sessão 10; visão multissetorial exige evoluir catálogo + compras + formação de preço **depois** do core operacional (estoque + vendas no frontend).

### Roadmap — Evolução arquitetura frontend (futuro)

**Situação atual (Sessão 10):** frontend **organizado para MVP** — camadas `api/`, `types/`, `pages/`, `auth/`, `utils/`, CSS Modules, TypeScript. **Não é bagunça**; há duplicação controlada (`handleUnauthorized`, debounce de busca, paginação) repetida em Produtos/Clientes/Estoque.

**Princípio:** refatorar **depois que o padrão se repetir 3+ vezes** — **não bloqueia Sessão 11**. Disparar **10.5** se a listagem de vendas copiar o mesmo boilerplate.

| Sessão | Nome | Entregáveis | Momento |
|--------|------|-------------|---------|
| **10.5** | Hooks compartilhados | `src/hooks/`: `useUnauthorizedHandler`, `useDebouncedSearch`, `usePaginatedResource`, `useAsyncAction`; `onlyDigits` centralizado em `utils/strings.ts` | **Após Sessão 11** |
| **11.5** | Upload imagem (opcional) | MinIO dev + endpoint multipart + UI upload | ✅ |
| **12.5** | UI kit mínimo | `components/ui/`: Button, TextField, TextArea, SearchPanel, PaginationBar, StatusMessage, PageHeader; `styles/tokens.css` | ✅ |
| **13-FE** | Query + testes | TanStack Query (`useQuery`/`useMutation`, invalidação estoque↔vendas); Vitest + Testing Library (prioridade: `api/client`, utils, hooks) | ✅ |

**Não fazer ainda:** pastas `features/` (só com 20+ telas), Redux/Zustand, micro-frontends, refatorar todo CSS de uma vez.

**Ordem acordada:** `11 Vendas` → `10.5 Hooks` → `12 PWA` → `12.5 UI kit` → `13-FE Query+Testes` (11.5 upload opcional entre 11 e 12).

### Sessão 9 — entregue (`7490a01`)

**Backend:** endereço estruturado (cep, logradouro, numero, bairro, cidade, estado); `codigoPais` ISO (BR); validação celular com libphonenumber; `GET /api/cep/{cep}` (ViaCEP).

**Frontend:** listagem paginada + busca CPF; form cadastro/edição; máscaras CPF/CEP; combo países + celular dinâmico (libphonenumber-js); rotas `/clientes/*`.

### Fases PDF Gemini (progresso)

```
Fase 1 – Infra & base          ~95% ✅
Fase 2 – Cadastro & Estoque    ~95% ✅ (backend); frontend ~50% 🔄 (estoque UI ok)
Fase 3 – Vendas & Regras       ~65% 🔄 (backend ok; falta UI vendas)
Fase 4–5 – React               ~50% 🔄 (Sessões 6–10 feitas)
Fase 6 – Fiscal/deploy         ~15% (CI backend ok; frontend/deploy pendente)
```

### Backend avançado (PDF — pendente)

- ~~Fluxo salão → caixa (pagar PENDENTE)~~ ✅ parcial (28/ago)
- Reserva temporária de estoque
- WebSockets (desconto gerente)
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
- **Fechar sessão:** sempre atualizar `.cursor/CONTEXTO-OMNICORE.md`, **`README.md` (raiz)**, `omnicore-projeto.mdc` e atalho `CONTEXTO-OMNICORE.md` (idealmente no mesmo commit da sessão)
- **Clientes estrangeiros (9.1):** passaporte/doc. estrangeiro OK; entrega **somente Brasil** — endereço BR obrigatório para não-CPF (Fase B = entrega internacional, ver débito técnico)
- **Imagem do produto:** MVP = **só URL opcional** (`urlImagem`); upload de arquivo + Object Storage = débito técnico (ver seção acima)
- **Catálogo / precificação / compras:** MVP = cadastro enxuto + `precoVenda` livre; estoque **separado** do cadastro (entrada manual → Sessão 10); fornecedor, NF-e entrada, custo/margem/preço sugerido = débito técnico (ver seção acima)
- **Frontend arquitetura:** MVP saudável (`api/` + `types/` + pages); evolução planejada **10.5 hooks → 12.5 UI kit → 13-FE Query+testes** — ver roadmap no CONTEXTO; **não bloqueia Sessão 11**

---

## Próximo passo acordado

1. **14-B/C** — adapters **Stone + Getnet** (Pix QR tela + maquininha) — credencial sandbox Roberto.
2. **14-D** — fiscal/conciliação conforme prioridade loja.
3. **Fase 15** — E-commerce B2C (`@.cursor/ECOMMERCE-B2C-PLANEJAMENTO.md`) — **último módulo**.

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
Próximo: simulador em ~/omnicore-pagamento-simulador/ (skill pronta, porta 9090).
Workspace: ~/omnicore/. Não commitar docker-compose.yml.
```

---

*Última atualização: 03/set/2026 — QR Pix tela + Paga no caixa `51ac89a`; simulador `132d412`; próximo: 14-B/C.*
