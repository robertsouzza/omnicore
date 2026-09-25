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

## Evolução

Permissões **módulo a módulo** editáveis sem trocar perfil (exceções por pessoa ou matriz gravada no banco) = próxima fase; hoje **1 perfil = 1 conjunto fixo** (API + `permissoes.ts`).
