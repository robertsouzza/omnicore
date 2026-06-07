package com.omnicore.cerebro_backend.exception;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice // Indica ao Spring que esta classe interceptará exceções de todos os Controllers
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusinessException(BusinessException ex, WebRequest request) {
        // Monta uma estrutura de resposta limpa e profissional para o cliente
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Regra de Negócio Violada");
        body.put("message", ex.getMessage()); // Carrega a sua mensagem customizada do Service
        body.put("path", request.getDescription(false).replace("uri=", ""));

        // Devolve o status 400 Bad Request de forma limpa, sumindo com o erro 500 do console
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

}
