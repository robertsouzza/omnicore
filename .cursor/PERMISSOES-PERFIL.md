# Permissões por perfil (RBAC MVP)

Matriz acordada (Roberto + Logan — set/2026). **Backend** aplica regras em `ColaboradorAutorizacao` + **services** (controllers finos); **frontend** espelha em `frontend-app/src/auth/permissoes.ts` (menu, rotas, botões).

## Perfis

| Perfil | Papel |
|--------|--------|
| **VENDEDOR** | Salão, vendas **próprias**, PDV, clientes; produtos/estoque **leitura**; **sem Caixa** |
| **CAIXA** | Fila **/caixa**, PDV, clientes; produtos/estoque leitura; listagem API de vendas = **só PENDENTE** |
| **CONFERENTE** | Cadastro/edição **produtos**, **movimentação estoque**; sem vendas/PDV/caixa/clientes |
| **GERENTE** | **Tudo**, filtro de vendas por vendedor, colaboradores |

## API (resumo)

| Recurso | VENDEDOR | CAIXA | CONFERENTE | GERENTE |
|---------|----------|-------|------------|---------|
| `GET /api/vendas` | só `vendedorId` = eu | só status PENDENTE | 403 | todos + filtros |
| `GET /api/vendas/{id}` | próprias | pendentes | 403 | todas |
| `POST /api/vendas` | sim (vendedorId = eu) | sim | 403 | sim |
| `PUT .../pagar` | sim | sim | 403 | sim |
| `GET/POST produtos` leitura | sim | sim | sim | sim |
| `POST/PUT/DELETE produtos` | 403 | 403 | sim | sim |
| `POST /api/estoque/*` | 403 | 403 | sim | sim |
| `GET /api/estoque/*` | sim | sim | sim | sim |
| Clientes (escrita) | sim | sim | 403 | sim |
| `/api/colaboradores` | 403 | 403 | 403 | sim |

Respostas de permissão: **403** + `AccessDeniedException` (`GlobalExceptionHandler`).

## Dev — logins de teste

| E-mail | Senha | Perfil |
|--------|-------|--------|
| `carlos.vendedor@omnicore.local` | `senha123` | VENDEDOR |
| `ana.gerente@omnicore.local` | `senha123` | GERENTE |
| `conferente@omnicore.local` | `senha123` | CONFERENTE |
| `caixa@omnicore.local` | `senha123` | CAIXA |

Criar conferente/caixa: `cerebro-backend/scripts/seed-perfis-dev.sh` (token de gerente).

## Tela gerente (frontend)

Menu **Equipe** (só GERENTE):

- **`/equipe`** — CRUD colaboradores: listar, **+ Novo**, **Editar**, **Inativar** (exclusão lógica; API `DELETE /api/colaboradores/{id}`).
- **`/equipe/novo`**, **`/equipe/:id/editar`** — formulário (nome, CPF, e-mail, senha, perfil, limite desconto).
- **`/equipe/permissoes`** — matriz visual e troca rápida de perfil + modelos Vendedor/Caixa/Conferente.

## Evolução — perfil + permissões extras (planejado, pós 14-B/C)

**Decisão (Roberto + Logan — out/2026):** manter o default **como hoje** (1 perfil = pacote fixo). Gerente poderá conceder **permissões extras** por colaborador, sem trocar o perfil. **Não** implementado ainda — sessão dedicada.

### Comportamento desejado

| Camada | Regra |
|--------|--------|
| **Base** | Matriz do perfil (`VENDEDOR`, `CAIXA`, `CONFERENTE`, `GERENTE`) — inalterada. |
| **Extras** | Gerente liga módulos que o perfil **não** inclui (ex.: vendedor + movimentar estoque). |
| **Efetivo** | API e menu: `perfil OR extra`. |
| **Gerente** | Pacote total fixo; esta tela **não** altera outro gerente. |
| **Fase 2** | **Revogar** linha que o perfil já dá (ex.: caixa sem PDV) = lista de negações — depois dos extras positivos. |

### UI (`/equipe/permissoes`)

- Itens **já do perfil:** checkbox marcado e **somente leitura** (“vem do perfil”).
- Itens **extras:** checkbox **editável** + **Salvar permissões extras**.
- Modelos Vendedor/Caixa/Conferente continuam trocando o **perfil** inteiro.

### Lista branca (extras permitidos)

Só códigos do catálogo (`permissoesCatalogo.ts`) que **não** são exclusivos de gerente. **Proibido** como extra:

- `colaboradores` (Equipe)
- `vendas_filtro_vendedor`

Demais módulos (produtos editar, estoque movimentar, caixa, vendas, etc.) — definir na implementação com validação no backend.

### Backend (escopo técnico)

- Persistência: coluna JSON `permissoes_extras` em `tb_colaborador` ou tabela `colaborador_permissao_extra`.
- Refatorar `ColaboradorAutorizacao`: checagem por **código** (`temPermissao`) = matriz do perfil **ou** extra gravado.
- Login/JWT ou filter: incluir extras para o front espelhar (`permissoes.ts`); após salvar extras, **rel login** ou refresh de sessão.
- Endpoint: `PUT /api/colaboradores/{id}/permissoes-extras` (só GERENTE) ou campo no DTO de update com validação.

### Estado atual (MVP)

Permissões **módulo a módulo** editáveis na UI **não** existem; checkboxes em `/equipe/permissoes` são **readOnly** e refletem só o perfil. Trocar acesso = alterar **perfil** + Salvar.
