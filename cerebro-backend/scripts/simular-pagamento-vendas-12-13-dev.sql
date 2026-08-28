-- Simula PAGA vendas #12 (unitários) e #13 (kit) — 28/ago/2026
BEGIN;

UPDATE tb_venda SET status = 'PAGA' WHERE id = 12 AND status = 'PENDENTE';

INSERT INTO tb_movimentacao_estoque (produto_id, tipo, quantidade, data_hora, justificativa, venda_id)
SELECT iv.produto_id, 'SAIDA', iv.quantidade, NOW(),
       'Saída por venda automatizada. Pedido #12', 12
FROM tb_item_venda iv
WHERE iv.venda_id = 12
  AND NOT EXISTS (SELECT 1 FROM tb_movimentacao_estoque m WHERE m.venda_id = 12 AND m.tipo = 'SAIDA');

UPDATE tb_venda SET status = 'PAGA' WHERE id = 13 AND status = 'PENDENTE';

INSERT INTO tb_movimentacao_estoque (produto_id, tipo, quantidade, data_hora, justificativa, venda_id)
SELECT cp.produto_filho_id, 'SAIDA',
       (cp.quantidade * iv.quantidade)::integer,
       NOW(),
       'Saída por venda automatizada. Pedido #13 — componente do pacote ''' || pk.nome || '''',
       13
FROM tb_item_venda iv
JOIN tb_produto pk ON pk.id = iv.produto_id AND pk.tipo_produto = 'PACOTE'
JOIN tb_composicao_pacote cp ON cp.pacote_id = iv.produto_id
WHERE iv.venda_id = 13
  AND NOT EXISTS (SELECT 1 FROM tb_movimentacao_estoque m WHERE m.venda_id = 13 AND m.tipo = 'SAIDA');

COMMIT;
