-- Migração: coluna cpf → tipo_documento + numero_documento
-- Executar uma vez no Postgres após deploy da entity Cliente (Sessão 9.1).

ALTER TABLE tb_cliente ADD COLUMN IF NOT EXISTS tipo_documento varchar(30) NOT NULL DEFAULT 'CPF';
ALTER TABLE tb_cliente ADD COLUMN IF NOT EXISTS numero_documento varchar(30);

UPDATE tb_cliente
SET tipo_documento = 'CPF',
    numero_documento = cpf
WHERE numero_documento IS NULL
  AND cpf IS NOT NULL;

ALTER TABLE tb_cliente ALTER COLUMN numero_documento SET NOT NULL;

ALTER TABLE tb_cliente DROP CONSTRAINT IF EXISTS ukjgra977gi05fur83l225x4qkr;
ALTER TABLE tb_cliente DROP COLUMN IF EXISTS cpf;

-- Legado da Sessão 9 (endereço em texto único)
ALTER TABLE tb_cliente DROP COLUMN IF EXISTS endereco_entrega_padrao;
