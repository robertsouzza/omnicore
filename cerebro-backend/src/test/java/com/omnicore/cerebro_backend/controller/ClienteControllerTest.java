package com.omnicore.cerebro_backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.exception.GlobalExceptionHandler;
import com.omnicore.cerebro_backend.model.Cliente;
import com.omnicore.cerebro_backend.service.ClienteService;

@WebMvcTest(controllers = ClienteController.class, excludeAutoConfiguration = SecurityAutoConfiguration.class)
@ActiveProfiles("test")
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class ClienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClienteService clienteService;

    private static final String PAYLOAD = """
            {
                "nomeCompleto": "Maria Silva",
                "cpf": "12345678909",
                "email": "maria@email.com",
                "codigoPais": "BR",
                "celular": "11999998888",
                "cep": "69309209",
                "logradouro": "Rua A",
                "numero": "100",
                "bairro": "Centro",
                "cidade": "Boa Vista",
                "estado": "RR"
            }
            """;

    @Test
    @DisplayName("POST /api/clientes deve retornar 201 Created")
    void deveCadastrarCliente() throws Exception {
        Cliente cliente = Cliente.builder().id(1L).nomeCompleto("Maria Silva").cpf("12345678909").build();
        when(clienteService.cadastrar(any())).thenReturn(cliente);

        mockMvc.perform(post("/api/clientes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/clientes/cpf/{cpf} deve retornar 200 OK")
    void deveBuscarPorCpf() throws Exception {
        Cliente cliente = Cliente.builder().id(1L).cpf("12345678909").nomeCompleto("Maria").build();
        when(clienteService.buscarPorCpf("12345678909")).thenReturn(cliente);

        mockMvc.perform(get("/api/clientes/cpf/{cpf}", "12345678909"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cpf").value("12345678909"));
    }

    @Test
    @DisplayName("GET /api/clientes deve listar paginado")
    void deveListarClientes() throws Exception {
        when(clienteService.listar(any(Pageable.class), eq(false)))
                .thenReturn(new PageImpl<>(java.util.List.of(Cliente.builder().id(1L).build())));

        mockMvc.perform(get("/api/clientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @DisplayName("DELETE /api/clientes/{id} deve retornar 204")
    void deveInativarCliente() throws Exception {
        doNothing().when(clienteService).inativar(1L);

        mockMvc.perform(delete("/api/clientes/{id}", 1L))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/clientes/{id} deve retornar 400 se não existir")
    void deveRetornar400ClienteInexistente() throws Exception {
        when(clienteService.buscarPorId(99L)).thenThrow(new BusinessException("Cliente com ID 99 não encontrado."));

        mockMvc.perform(get("/api/clientes/{id}", 99L))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/clientes/{id} deve atualizar")
    void deveAtualizarCliente() throws Exception {
        Cliente atualizado = Cliente.builder().id(1L).nomeCompleto("Maria Silva").build();
        when(clienteService.atualizar(eq(1L), any())).thenReturn(atualizado);

        mockMvc.perform(put("/api/clientes/{id}", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(PAYLOAD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeCompleto").value("Maria Silva"));
    }
}
