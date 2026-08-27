package com.omnicore.cerebro_backend.exception;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<Object> handleAuthenticationFailed(AuthenticationFailedException ex, WebRequest request) {
        Map<String, Object> body = corpoBase(HttpStatus.UNAUTHORIZED, "Credenciais Inválidas", request);
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusinessException(BusinessException ex, WebRequest request) {
        Map<String, Object> body = corpoBase(HttpStatus.BAD_REQUEST, "Regra de Negócio Violada", request);
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Object> handleMaxUploadSize(MaxUploadSizeExceededException ex, WebRequest request) {
        Map<String, Object> body = corpoBase(HttpStatus.BAD_REQUEST, "Arquivo muito grande", request);
        body.put("message", "A imagem excede o tamanho máximo de 5 MB.");
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(erro ->
                campos.put(erro.getField(), erro.getDefaultMessage()));

        Map<String, Object> body = corpoBase(HttpStatus.BAD_REQUEST, "Erro de Validação", request);
        body.put("message", "Um ou mais campos estão inválidos.");
        body.put("fields", campos);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex, WebRequest request) {
        Map<String, Object> body = corpoBase(HttpStatus.CONFLICT, "Conflito de Dados", request);
        body.put("message", mensagemIntegridade(ex));
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception ex, WebRequest request) {
        Map<String, Object> body = corpoBase(HttpStatus.INTERNAL_SERVER_ERROR, "Erro Interno", request);
        body.put("message", "Ocorreu um erro inesperado. Tente novamente em instantes.");
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String mensagemIntegridade(DataIntegrityViolationException ex) {
        String detalhe = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        if (detalhe == null) {
            return "Não foi possível salvar os dados. Verifique se já existe um registro com as mesmas informações.";
        }

        String lower = detalhe.toLowerCase();
        if (lower.contains("duplicate") || lower.contains("unique") || lower.contains("already exists")) {
            return "Já existe um registro com estas informações (documento ou e-mail duplicado).";
        }
        if (lower.contains("violates not-null constraint")) {
            return "Faltam dados obrigatórios para concluir o cadastro. Verifique os campos e tente novamente.";
        }
        if (lower.contains("violates foreign key constraint")) {
            return "Referência inválida em um dos campos informados.";
        }

        return "Não foi possível salvar os dados. Verifique se já existe um registro com as mesmas informações.";
    }

    private Map<String, Object> corpoBase(HttpStatus status, String error, WebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("path", extrairPath(request));
        return body;
    }

    private String extrairPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
