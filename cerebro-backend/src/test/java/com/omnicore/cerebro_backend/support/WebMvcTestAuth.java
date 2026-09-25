package com.omnicore.cerebro_backend.support;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.omnicore.cerebro_backend.enums.PerfilColaborador;
import com.omnicore.cerebro_backend.security.AuthenticatedColaborador;

public final class WebMvcTestAuth {

    public static final AuthenticatedColaborador GERENTE = new AuthenticatedColaborador(
            99L, "Gerente Teste", "gerente@test.local", PerfilColaborador.GERENTE);

    public static final AuthenticatedColaborador CONFERENTE = new AuthenticatedColaborador(
            98L, "Conferente Teste", "conferente@test.local", PerfilColaborador.CONFERENTE);

    public static final AuthenticatedColaborador VENDEDOR = new AuthenticatedColaborador(
            1L, "Vendedor Teste", "vendedor@test.local", PerfilColaborador.VENDEDOR);

    private WebMvcTestAuth() {
    }

    public static RequestPostProcessor asGerente() {
        return SecurityMockMvcRequestPostProcessors.authentication(
                new UsernamePasswordAuthenticationToken(GERENTE, null, GERENTE.getAuthorities()));
    }

    public static RequestPostProcessor asConferente() {
        return SecurityMockMvcRequestPostProcessors.authentication(
                new UsernamePasswordAuthenticationToken(CONFERENTE, null, CONFERENTE.getAuthorities()));
    }

    public static RequestPostProcessor asVendedor() {
        return SecurityMockMvcRequestPostProcessors.authentication(
                new UsernamePasswordAuthenticationToken(VENDEDOR, null, VENDEDOR.getAuthorities()));
    }

    public static void setGerenteNoContexto() {
        autenticar(GERENTE);
    }

    public static void autenticar(AuthenticatedColaborador colaborador) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(
                        colaborador, null, colaborador.getAuthorities()));
    }

    public static void limparContexto() {
        SecurityContextHolder.clearContext();
    }
}
