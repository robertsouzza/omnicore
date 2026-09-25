package com.omnicore.cerebro_backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.enums.StatusVenda;
import com.omnicore.cerebro_backend.exception.AccessDeniedException;
import com.omnicore.cerebro_backend.model.Venda;

public final class ColaboradorAutorizacao {

    private ColaboradorAutorizacao() {
    }

    public static AuthenticatedColaborador resolver(AuthenticatedColaborador colaborador) {
        if (colaborador != null) {
            return colaborador;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedColaborador autenticado) {
            return autenticado;
        }
        throw new AccessDeniedException("Colaborador autenticado não identificado.");
    }

    public static void exigirAutenticado(AuthenticatedColaborador colaborador) {
        resolver(colaborador);
    }

    public static void exigirPerfil(AuthenticatedColaborador colaborador, PerfilColaborador... permitidos) {
        AuthenticatedColaborador autenticado = resolver(colaborador);
        for (PerfilColaborador perfil : permitidos) {
            if (autenticado.perfil() == perfil) {
                return;
            }
        }
        throw new AccessDeniedException("Seu perfil não tem permissão para esta operação.");
    }

    public static void exigirGerenciarColaboradores(AuthenticatedColaborador colaborador) {
        exigirPerfil(colaborador, PerfilColaborador.GERENTE);
    }

    public static void exigirEditarCatalogo(AuthenticatedColaborador colaborador) {
        exigirPerfil(colaborador, PerfilColaborador.CONFERENTE, PerfilColaborador.GERENTE);
    }

    public static void exigirMovimentarEstoque(AuthenticatedColaborador colaborador) {
        exigirPerfil(colaborador, PerfilColaborador.CONFERENTE, PerfilColaborador.GERENTE);
    }

    public static void exigirModuloClientes(AuthenticatedColaborador colaborador) {
        exigirPerfil(
                colaborador,
                PerfilColaborador.VENDEDOR,
                PerfilColaborador.CAIXA,
                PerfilColaborador.GERENTE);
    }

    public static void exigirRegistrarVenda(AuthenticatedColaborador colaborador) {
        exigirPerfil(
                colaborador,
                PerfilColaborador.VENDEDOR,
                PerfilColaborador.CAIXA,
                PerfilColaborador.GERENTE);
    }

    public static void exigirPagarVenda(AuthenticatedColaborador colaborador) {
        exigirPerfil(
                colaborador,
                PerfilColaborador.VENDEDOR,
                PerfilColaborador.CAIXA,
                PerfilColaborador.GERENTE);
    }

    public static void exigirListarVendas(AuthenticatedColaborador colaborador) {
        exigirPerfil(
                colaborador,
                PerfilColaborador.VENDEDOR,
                PerfilColaborador.CAIXA,
                PerfilColaborador.GERENTE);
    }

    public static Long resolverVendedorIdFiltro(AuthenticatedColaborador colaborador, Long vendedorIdInformado) {
        AuthenticatedColaborador autenticado = resolver(colaborador);
        exigirListarVendas(autenticado);
        if (autenticado.perfil() == PerfilColaborador.VENDEDOR) {
            return autenticado.id();
        }
        if (autenticado.perfil() == PerfilColaborador.CAIXA) {
            return vendedorIdInformado;
        }
        return vendedorIdInformado;
    }

    public static StatusVenda resolverStatusFiltroListagem(
            AuthenticatedColaborador colaborador, StatusVenda statusInformado) {
        AuthenticatedColaborador autenticado = resolver(colaborador);
        if (autenticado.perfil() == PerfilColaborador.CAIXA) {
            if (statusInformado != null && statusInformado != StatusVenda.PENDENTE) {
                throw new AccessDeniedException("Caixa só consulta vendas pendentes na fila.");
            }
            return statusInformado != null ? statusInformado : StatusVenda.PENDENTE;
        }
        return statusInformado;
    }

    public static void exigirLeituraVenda(AuthenticatedColaborador colaborador, Venda venda) {
        AuthenticatedColaborador autenticado = resolver(colaborador);
        if (autenticado.perfil() == PerfilColaborador.GERENTE) {
            return;
        }
        if (autenticado.perfil() == PerfilColaborador.CAIXA && venda.getStatus() == StatusVenda.PENDENTE) {
            return;
        }
        if (autenticado.perfil() == PerfilColaborador.VENDEDOR
                && autenticado.id().equals(venda.getVendedorId())) {
            return;
        }
        throw new AccessDeniedException("Sem permissão para acessar esta venda.");
    }

    public static void exigirVendedorDaVenda(AuthenticatedColaborador colaborador, Venda venda) {
        AuthenticatedColaborador autenticado = resolver(colaborador);
        if (autenticado.perfil() == PerfilColaborador.VENDEDOR
                && !autenticado.id().equals(venda.getVendedorId())) {
            throw new AccessDeniedException("Vendedor só acessa vendas registradas em seu nome.");
        }
    }
}
