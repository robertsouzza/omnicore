# OmniCore — Multi-PSP: adapters e config por loja

> **Decisão (Roberto — 01/set/2026):** não existe API universal no Brasil para Stone, Getnet, PagBank, InfinitePay etc. O OmniCore usa **uma interface interna** (`PaymentExperiencePort`) e **um adapter por PSP**. Cada **estabelecimento** escolhe o provedor dele via **configuração** — sem refazer PDV/Caixa/web.

**Relacionado:** `@.cursor/CONTEXTO-OMNICORE.md` (14-B/C) · Pix SPI via PSP (não fala direto com app do banco do cliente)

---

## 1. Resposta curta

| Pergunta | Resposta |
|----------|----------|
| Preciso reprogramar o PDV para cada PSP? | **Não** — só o **adapter** + **config** |
| Stone e Getnet usam o mesmo código de integração? | **Não** — APIs diferentes; **mesma porta** Java |
| Loja A Stone, loja B PagBank? | **Sim** — mesma instalação OmniCore, **config diferente** (futuro multi-loja) |
| Dá API única para todos os PSPs do mercado? | **Não** — adapter por provedor (ou orquestrador terceiro = outro fornecedor) |
| Cliente paga Pix no app do banco dele? | **Sim** — PSP + Bacen; OmniCore só gera QR e recebe webhook |

---

## 2. O que é universal no OmniCore (não muda por PSP)

| Camada | Componentes |
|--------|-------------|
| **UI loja** | PDV, Caixa, Nova Venda Paga — QR/copia-e-cola, “Aguardando Pix”, polling |
| **Regra de negócio** | `PagamentoService`, liquidar venda, estoque, `tb_pagamento_venda` |
| **Webhook interno** | `POST /api/pagamentos/webhook` — payload **normalizado** após adapter |
| **Contrato interno** | `PaymentExperiencePort.iniciar()` / `consultar()` |
| **Formas** | `DINHEIRO`, `PIX`, `CREDITO`, `DEBITO_BANCARIO` (+ `CARTAO_DEBITO` pinpad 14-C) |

---

## 3. O que muda por PSP (adapter)

Cada provedor implementa (ou traduz para) o contrato interno:

```java
// Já existe — cerebro-backend
public interface PaymentExperiencePort {
    ExperienciaPagamentoResultado iniciar(IniciarExperienciaRequest request);
    ExperienciaPagamentoResultado consultar(String experienciaPagamentoId);
}
```

| Adapter | PSP | Fase | Pix QR tela | Maquininha | Cartão web |
|---------|-----|------|-------------|------------|------------|
| `HttpPaymentExperienceService` | Simulador dev :9090 | 14-A ✅ | ✅ fake | ✅ fake | — |
| `StonePixAdapter` | Stone | 14-B | ✅ | — | futuro |
| `GetnetPixAdapter` | Getnet | 14-B | ✅ | — | futuro |
| `StoneTerminalAdapter` | Stone | 14-C | ✅ device | ✅ | — |
| `GetnetTerminalAdapter` | Getnet | 14-C | ✅ device | ✅ | — |
| `PagSeguroAdapter` | PagBank/PagSeguro | 14-B+ | sob demanda | sob demanda | sob demanda |
| `InfinitePayAdapter` | InfinitePay | 14-B+ | sob demanda | sob demanda | — |

**Implementar Stone não libera Getnet automaticamente** — são **dois adapters**, mas o **segundo copia o padrão** do primeiro.

---

## 4. Fluxo Pix — quem fala com o banco do cliente

```
Operador PDV/Caixa → OmniCore → Adapter PSP (Stone/Getnet)
                                      ↓
                              Cobrança Pix + QR EMV
                                      ↓
                              Rede Pix (BACEN / SPI)
                                      ↓
                    App do cliente (Caixa, BB, Nubank, Santander…)
                                      ↓
                              Pagamento liquidado
                                      ↓
                              Webhook PSP → OmniCore
                                      ↓
                              Venda PAGA
```

- OmniCore **não integra** cada banco brasileiro.
- **Um contrato PSP** cobre **todos** os apps Pix do cliente.
- Na tela do PDV: **QR + copia e cola** (mesma UX do simulador, QR real em produção).

---

## 5. Configuração por estabelecimento (evolução)

### Hoje (14-A — single loja dev)

```yaml
omnicore:
  pagamento:
    experience:
      enabled: true
      base-url: http://localhost:9090   # simulador
```

### Alvo (14-B — escolha de PSP)

```yaml
omnicore:
  pagamento:
    provider: stone          # stone | getnet | pagseguro | experience (simulador)
    stone:
      sandbox: true
      client-id: ${STONE_CLIENT_ID}
      client-secret: ${STONE_CLIENT_SECRET}
      webhook-secret: ${STONE_WEBHOOK_SECRET}
    getnet:
      sandbox: true
      client-id: ${GETNET_CLIENT_ID}
      client-secret: ${GETNET_CLIENT_SECRET}
```

**Regra:** apenas **um** `provider` ativo por instalação/loja no MVP. Multi-loja multi-PSP = tabela `tb_loja_config` (futuro SaaS).

### Bean Spring (desenho)

```
PagamentoConfig
  → if provider == experience → HttpPaymentExperienceService (simulador)
  → if provider == stone     → StonePaymentExperienceAdapter
  → if provider == getnet    → GetnetPaymentExperienceAdapter
```

`PagamentoService` injeta sempre `PaymentExperiencePort` — **não conhece** Stone vs Getnet.

---

## 6. Webhook — normalização

Cada PSP envia JSON diferente. **Adapter ou controller dedicado** traduz para DTO interno existente:

```java
PagamentoWebhookRequestDTO(
    experienciaPagamentoId,  // ou txid Pix mapeado
    status,                  // APROVADO | RECUSADO
    nsu,
    referenciaExterna
)
```

Endpoint único: `POST /api/pagamentos/webhook`  
Opcional produção: rotas por PSP `/api/pagamentos/webhook/stone`, `/getnet` — ou header HMAC por provedor.

**Persistência:** `tb_pagamento_venda.provider` = `STONE`, `GETNET`, `EXPERIENCIA`, `PAGSEGURO`…

---

## 7. Contrato interno enriquecido (14-B — Pix QR na tela)

Evolução de `ExperienciaPagamentoResultado` (sem quebrar simulador):

| Campo | Uso |
|-------|-----|
| `experienciaPagamentoId` | ID interno + id externo PSP |
| `status` | PENDENTE |
| `urlExperiencia` | Opcional (simulador); produção Pix pode ser null |
| **`qrCodeBase64`** | Imagem QR na tela PDV (novo 14-B) |
| **`pixCopiaECola`** | EMV string (novo 14-B) |
| `nsu` / `referenciaExterna` | Quando já disponível |

Frontend: se `pixCopiaECola` presente → painel QR nativo OmniCore; se `urlExperiencia` → link simulador (dev).

---

## 8. Checklist — adicionar novo PSP (ex. InfinitePay)

1. Conta sandbox + credenciais + doc oficial.
2. Classe `XxxPaymentExperienceAdapter implements PaymentExperiencePort`.
3. Mapear `iniciar(PIX)` → cobrança + QR + copia e cola.
4. Mapear webhook PSP → `PagamentoWebhookRequestDTO`.
5. Testes unitários com payloads reais (JSON fixture).
6. Teste manual: PDV → QR → pagar sandbox → venda PAGA.
7. Registrar em `ProviderPagamento` enum se necessário.
8. Documentar config `omnicore.pagamento.provider=xxx`.
9. **Não alterar** `PagamentoService`, PDV, Caixa (salvo exibir QR inline).

---

## 9. Prioridade de provedores (Roberto)

| Ordem | PSP | Motivo |
|-------|-----|--------|
| 1 | **Simulador** | Dev ✅ |
| 2 | **Stone** | Comum no varejo físico |
| 3 | **Getnet (Santander)** | Comum no varejo |
| 4+ | PagSeguro/PagBank, InfinitePay, Mercado Pago, Cielo | **14-B+** quando cliente OmniCore exigir |

**Não implementar todos upfront** — adapter sob demanda comercial.

---

## 10. Orquestrador terceiro (alternativa — fora do MVP)

Gateways agregadores (ex. alguns players “multi-adquirente”) expõem **uma** API e roteiam para adquirentes. Prós: uma integração. Contras: custo, dependência, menos controle, homologação própria.

**Decisão OmniCore MVP:** adapters **diretos** Stone/Getnet; reavaliar orquestrador só se muitos clientes exigirem PSPs diferentes sem budget de adapters.

---

## 11. Multi-loja (futuro)

Quando OmniCore atender **várias lojas** (multi-tenant):

```
tb_estabelecimento
  id, nome, pagamento_provider, pagamento_config_json (secrets via vault)
```

Cada loja: um PSP. Código OmniCore compartilhado; config isolada por tenant.

---

## 12. Teste 14-B (primeiro adapter real)

1. Config `provider=stone` (sandbox).
2. PDV → Pix → `iniciar` → QR na tela.
3. Pagar com app/conta teste Stone/Getnet sandbox.
4. Webhook → venda PAGA sem F5.
5. Repetir com `provider=getnet` — **mesma UI**, adapter diferente.

---

## 13. Referências no código

| Arquivo | Papel |
|---------|-------|
| `PaymentExperiencePort.java` | Interface adapter |
| `HttpPaymentExperienceService.java` | Simulador HTTP (14-A) |
| `FakePaymentExperienceService.java` | Testes JUnit |
| `PagamentoExperienceProperties.java` | Config atual (evoluir 14-B) |
| `PagamentoService.java` | Orquestração — **não muda por PSP** |
| `PagamentoWebhookRequestDTO.java` | Payload normalizado pós-pagamento |

---

*Criado: 01/set/2026 — Roberto + Logan.*
