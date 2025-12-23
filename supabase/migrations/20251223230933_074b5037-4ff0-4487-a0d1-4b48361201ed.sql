-- Criar trigger para sincronizar status do orçamento com oportunidade
DROP TRIGGER IF EXISTS trg_sync_orcamento_to_oportunidade ON orcamentos;
CREATE TRIGGER trg_sync_orcamento_to_oportunidade
AFTER UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION sync_orcamento_to_oportunidade();

-- Criar trigger para criar oportunidade automaticamente ao inserir orçamento
DROP TRIGGER IF EXISTS trg_auto_create_oportunidade ON orcamentos;
CREATE TRIGGER trg_auto_create_oportunidade
AFTER INSERT ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION auto_create_oportunidade_from_orcamento();

-- Criar trigger para processar solicitação de visita no CRM
DROP TRIGGER IF EXISTS trg_process_visit_to_crm ON solicitacoes_visita;
CREATE TRIGGER trg_process_visit_to_crm
AFTER UPDATE ON solicitacoes_visita
FOR EACH ROW
EXECUTE FUNCTION process_visit_request_to_crm();