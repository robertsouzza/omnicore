package com.omnicore.cerebro_backend.util;

public final class CpfValidator {

    private CpfValidator() {
    }

    public static boolean isValido(String cpf) {
        if (cpf == null) {
            return false;
        }

        String digits = cpf.replaceAll("\\D", "");
        if (digits.length() != 11) {
            return false;
        }

        if (digits.chars().distinct().count() == 1) {
            return false;
        }

        int primeiroDigito = calcularDigito(digits.substring(0, 9), 10);
        if (primeiroDigito != Character.getNumericValue(digits.charAt(9))) {
            return false;
        }

        int segundoDigito = calcularDigito(digits.substring(0, 10), 11);
        return segundoDigito == Character.getNumericValue(digits.charAt(10));
    }

    private static int calcularDigito(String base, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < base.length(); i++) {
            soma += Character.getNumericValue(base.charAt(i)) * (pesoInicial - i);
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
