-- Criar índice único para prevenir contatos duplicados por telefone dentro da mesma organização
CREATE UNIQUE INDEX idx_contatos_telefone_org_unique 
ON contatos (telefone, organization_id) 
WHERE telefone IS NOT NULL AND telefone <> '';