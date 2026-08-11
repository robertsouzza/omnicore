package com.omnicore.cerebro_backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.omnicore.cerebro_backend.config.JwtProperties;
import com.omnicore.cerebro_backend.model.Colaborador;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String gerarToken(Colaborador colaborador) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plus(jwtProperties.expirationHours(), ChronoUnit.HOURS);

        return Jwts.builder()
                .subject(colaborador.getEmail())
                .claim("colaboradorId", colaborador.getId())
                .claim("nome", colaborador.getNome())
                .claim("perfil", colaborador.getPerfil().name())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiracao))
                .signWith(secretKey)
                .compact();
    }

    public AuthenticatedColaborador validarToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return new AuthenticatedColaborador(
                claims.get("colaboradorId", Long.class),
                claims.get("nome", String.class),
                claims.getSubject(),
                com.omnicore.cerebro_backend.enums.PerfilColaborador.valueOf(claims.get("perfil", String.class)));
    }
}
