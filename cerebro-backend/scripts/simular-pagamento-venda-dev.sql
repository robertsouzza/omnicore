-- Simula pagamento PENDENTE → PAGA + saídas de estoque (dev).
-- Uso: substitua :venda_id pelo ID da venda.
-- Requer Postgres com TZ=America/Manaus (docker-compose) para NOW() bater com a API Java.
--
-- Exemplo:
--   docker exec -i omnicore-postgres-db psql -U admin -d omnicore_management \
--     -v venda_id=8 -f - < cerebro-backend/scripts/simular-pagamento-venda-dev.sql

BEGIN;

UPDATE tb_venda
SET status = 'PAGA'
WHERE id = :venda_id
  AND status = 'PENDENTE';

INSERT INTO tb_movimentacao_estoque (produto_id, tipo, quantidade, data_hora, justificativa, venda_id)
SELECT iv.produto_id,
       'SAIDA',
       iv.quantidade,
       NOW(),
       'Saída por venda automatizada. Pedido #' || :venda_id,
       :venda_id
FROM tb_item_venda iv
WHERE iv.venda_id = :venda_id
  AND NOT EXISTS (
    SELECT 1
    FROM tb_movimentacao_estoque m
    WHERE m.venda_id = :venda_id
      AND m.tipo = 'SAIDA'
  );

COMMIT;

-- Conferência rápida (opcional):
-- SELECT status FROM tb_venda WHERE id = :venda_id;
-- SELECT * FROM tb_movimentacao_estoque WHERE venda_id = :venda_id ORDER BY id;
