package com.omnicore.cerebro_backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.omnicore.cerebro_backend.dto.LoginRequestDTO;
import com.omnicore.cerebro_backend.dto.LoginResponseDTO;
import com.omnicore.cerebro_backend.exception.AuthenticationFailedException;
import com.omnicore.cerebro_backend.exception.BusinessException;
import com.omnicore.cerebro_backend.model.Colaborador;
import com.omnicore.cerebro_backend.repository.ColaboradorRepository;
import com.omnicore.cerebro_backend.security.JwtService;

@Service
public class AuthService {

    private final ColaboradorRepository colaboradorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(ColaboradorRepository colaboradorRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.colaboradorRepository = colaboradorRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO login(LoginRequestDTO dto) {
        Colaborador colaborador = colaboradorRepository.findByEmail(dto.email())
                .orElseThrow(() -> new AuthenticationFailedException("E-mail ou senha inválidos."));

        if (Boolean.FALSE.equals(colaborador.getAtivo())) {
            throw new BusinessException("O colaborador '" + colaborador.getNome() + "' está inativo.");
        }

        if (!passwordEncoder.matches(dto.senha(), colaborador.getSenhaHash())) {
            throw new AuthenticationFailedException("E-mail ou senha inválidos.");
        }

        String token = jwtService.gerarToken(colaborador);

        return new LoginResponseDTO(
                token,
                "Bearer",
                colaborador.getId(),
                colaborador.getNome(),
                colaborador.getEmail(),
                colaborador.getPerfil());
    }
}
