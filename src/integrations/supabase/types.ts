export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      atividades_crm: {
        Row: {
          concluida: boolean
          contato_id: string | null
          created_at: string
          created_by_user_id: string
          data_atividade: string
          data_lembrete: string | null
          descricao: string | null
          id: string
          oportunidade_id: string | null
          orcamento_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          contato_id?: string | null
          created_at?: string
          created_by_user_id: string
          data_atividade?: string
          data_lembrete?: string | null
          descricao?: string | null
          id?: string
          oportunidade_id?: string | null
          orcamento_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          contato_id?: string | null
          created_at?: string
          created_by_user_id?: string
          data_atividade?: string
          data_lembrete?: string | null
          descricao?: string | null
          id?: string
          oportunidade_id?: string | null
          orcamento_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_crm_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_crm_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_crm_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          created_at: string
          created_by_user_id: string
          data_pagamento: string | null
          id: string
          observacoes: string | null
          orcamento_id: string | null
          percentual: number
          status: string
          updated_at: string
          valor_base: number
          valor_comissao: number
          vendedor_nome: string
          vendedor_user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          data_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          percentual?: number
          status?: string
          updated_at?: string
          valor_base: number
          valor_comissao: number
          vendedor_nome: string
          vendedor_user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          data_pagamento?: string | null
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          percentual?: number
          status?: string
          updated_at?: string
          valor_base?: number
          valor_comissao?: number
          vendedor_nome?: string
          vendedor_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      comprovantes_pagamento: {
        Row: {
          arquivo_url: string
          conta_pagar_id: string | null
          created_at: string
          id: string
          lancamento_id: string | null
          nome_arquivo: string
          parcela_receber_id: string | null
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          uploaded_by_user_id: string
        }
        Insert: {
          arquivo_url: string
          conta_pagar_id?: string | null
          created_at?: string
          id?: string
          lancamento_id?: string | null
          nome_arquivo: string
          parcela_receber_id?: string | null
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          uploaded_by_user_id: string
        }
        Update: {
          arquivo_url?: string
          conta_pagar_id?: string | null
          created_at?: string
          id?: string
          lancamento_id?: string | null
          nome_arquivo?: string
          parcela_receber_id?: string | null
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprovantes_pagamento_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprovantes_pagamento_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprovantes_pagamento_parcela_receber_id_fkey"
            columns: ["parcela_receber_id"]
            isOneToOne: false
            referencedRelation: "parcelas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          updated_at: string | null
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: Json
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: Json
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          conta_origem_id: string | null
          created_at: string
          created_by_user_id: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento_id: string | null
          fornecedor: string | null
          frequencia_recorrencia: string | null
          id: string
          numero_documento: string | null
          observacoes: string | null
          orcamento_id: string | null
          recorrente: boolean
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          created_by_user_id: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento_id?: string | null
          fornecedor?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          recorrente?: boolean
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          conta_origem_id?: string | null
          created_at?: string
          created_by_user_id?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento_id?: string | null
          fornecedor?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          recorrente?: boolean
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_conta_origem_id_fkey"
            columns: ["conta_origem_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          created_by_user_id: string
          data_vencimento: string
          descricao: string
          id: string
          numero_parcelas: number
          observacoes: string | null
          orcamento_id: string | null
          status: string
          updated_at: string
          valor_pago: number
          valor_total: number
        }
        Insert: {
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          created_by_user_id: string
          data_vencimento: string
          descricao: string
          id?: string
          numero_parcelas?: number
          observacoes?: string | null
          orcamento_id?: string | null
          status?: string
          updated_at?: string
          valor_pago?: number
          valor_total: number
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          created_by_user_id?: string
          data_vencimento?: string
          descricao?: string
          id?: string
          numero_parcelas?: number
          observacoes?: string | null
          orcamento_id?: string | null
          status?: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos: {
        Row: {
          cidade: string | null
          created_at: string
          created_by_user_id: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          tags: string[] | null
          telefone: string | null
          telefone_secundario: string | null
          tipo: string
          updated_at: string
          valor_total_gasto: number | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          created_by_user_id: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          tags?: string[] | null
          telefone?: string | null
          telefone_secundario?: string | null
          tipo?: string
          updated_at?: string
          valor_total_gasto?: number | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          created_by_user_id?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          tags?: string[] | null
          telefone?: string | null
          telefone_secundario?: string | null
          tipo?: string
          updated_at?: string
          valor_total_gasto?: number | null
        }
        Relationships: []
      }
      cortina_items: {
        Row: {
          altura: number
          ambiente: string | null
          barra_cm: number | null
          barra_forro_cm: number | null
          created_at: string
          custo_acessorios: number | null
          custo_costura: number | null
          custo_forro: number | null
          custo_instalacao: number | null
          custo_tecido: number | null
          custo_total: number | null
          custo_trilho: number | null
          descricao: string | null
          fabrica: string | null
          forro_id: string | null
          id: string
          is_outro: boolean | null
          largura: number
          material_principal_id: string | null
          motorizada: boolean | null
          nome_identificacao: string
          observacoes_internas: string | null
          orcamento_id: string
          pontos_instalacao: number | null
          precisa_instalacao: boolean
          preco_unitario: number | null
          preco_venda: number | null
          quantidade: number
          servicos_adicionais_ids: string[] | null
          tecido_id: string | null
          tipo_cortina: string
          tipo_produto: string | null
          trilho_id: string | null
          updated_at: string
        }
        Insert: {
          altura: number
          ambiente?: string | null
          barra_cm?: number | null
          barra_forro_cm?: number | null
          created_at?: string
          custo_acessorios?: number | null
          custo_costura?: number | null
          custo_forro?: number | null
          custo_instalacao?: number | null
          custo_tecido?: number | null
          custo_total?: number | null
          custo_trilho?: number | null
          descricao?: string | null
          fabrica?: string | null
          forro_id?: string | null
          id?: string
          is_outro?: boolean | null
          largura: number
          material_principal_id?: string | null
          motorizada?: boolean | null
          nome_identificacao: string
          observacoes_internas?: string | null
          orcamento_id: string
          pontos_instalacao?: number | null
          precisa_instalacao?: boolean
          preco_unitario?: number | null
          preco_venda?: number | null
          quantidade?: number
          servicos_adicionais_ids?: string[] | null
          tecido_id?: string | null
          tipo_cortina: string
          tipo_produto?: string | null
          trilho_id?: string | null
          updated_at?: string
        }
        Update: {
          altura?: number
          ambiente?: string | null
          barra_cm?: number | null
          barra_forro_cm?: number | null
          created_at?: string
          custo_acessorios?: number | null
          custo_costura?: number | null
          custo_forro?: number | null
          custo_instalacao?: number | null
          custo_tecido?: number | null
          custo_total?: number | null
          custo_trilho?: number | null
          descricao?: string | null
          fabrica?: string | null
          forro_id?: string | null
          id?: string
          is_outro?: boolean | null
          largura?: number
          material_principal_id?: string | null
          motorizada?: boolean | null
          nome_identificacao?: string
          observacoes_internas?: string | null
          orcamento_id?: string
          pontos_instalacao?: number | null
          precisa_instalacao?: boolean
          preco_unitario?: number | null
          preco_venda?: number | null
          quantidade?: number
          servicos_adicionais_ids?: string[] | null
          tecido_id?: string | null
          tipo_cortina?: string
          tipo_produto?: string | null
          trilho_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cortina_items_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          max_parcelas: number | null
          nome: string
          permite_parcelamento: boolean
          taxa_percentual: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_parcelas?: number | null
          nome: string
          permite_parcelamento?: boolean
          taxa_percentual?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          max_parcelas?: number | null
          nome?: string
          permite_parcelamento?: boolean
          taxa_percentual?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico_descontos: {
        Row: {
          created_at: string
          desconto_tipo_anterior: string | null
          desconto_tipo_novo: string | null
          desconto_valor_anterior: number | null
          desconto_valor_novo: number | null
          id: string
          motivo: string | null
          orcamento_id: string
          usuario_id: string
          usuario_nome: string
        }
        Insert: {
          created_at?: string
          desconto_tipo_anterior?: string | null
          desconto_tipo_novo?: string | null
          desconto_valor_anterior?: number | null
          desconto_valor_novo?: number | null
          id?: string
          motivo?: string | null
          orcamento_id: string
          usuario_id: string
          usuario_nome: string
        }
        Update: {
          created_at?: string
          desconto_tipo_anterior?: string | null
          desconto_tipo_novo?: string | null
          desconto_valor_anterior?: number | null
          desconto_valor_novo?: number | null
          id?: string
          motivo?: string | null
          orcamento_id?: string
          usuario_id?: string
          usuario_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_descontos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_producao: {
        Row: {
          data_evento: string
          descricao: string
          id: string
          item_pedido_id: string | null
          pedido_id: string
          status_anterior: string | null
          status_novo: string | null
          tipo_evento: string
          usuario_id: string
          usuario_nome: string
        }
        Insert: {
          data_evento?: string
          descricao: string
          id?: string
          item_pedido_id?: string | null
          pedido_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo_evento: string
          usuario_id: string
          usuario_nome: string
        }
        Update: {
          data_evento?: string
          descricao?: string
          id?: string
          item_pedido_id?: string | null
          pedido_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          tipo_evento?: string
          usuario_id?: string
          usuario_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_producao_item_pedido_id_fkey"
            columns: ["item_pedido_id"]
            isOneToOne: false
            referencedRelation: "itens_pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_producao_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      instalacoes: {
        Row: {
          cidade: string | null
          created_at: string
          created_by_user_id: string
          data_agendada: string
          data_realizada: string | null
          endereco: string
          id: string
          instalador: string | null
          observacoes: string | null
          pedido_id: string
          status: string
          turno: string
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          created_by_user_id: string
          data_agendada: string
          data_realizada?: string | null
          endereco: string
          id?: string
          instalador?: string | null
          observacoes?: string | null
          pedido_id: string
          status?: string
          turno?: string
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          created_by_user_id?: string
          data_agendada?: string
          data_realizada?: string | null
          endereco?: string
          id?: string
          instalador?: string | null
          observacoes?: string | null
          pedido_id?: string
          status?: string
          turno?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instalacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          cortina_item_id: string
          created_at: string
          data_fim_corte: string | null
          data_fim_costura: string | null
          data_finalizacao: string | null
          data_inicio_corte: string | null
          data_inicio_costura: string | null
          id: string
          observacoes: string | null
          pedido_id: string
          responsavel: string | null
          status_item: string
          updated_at: string
        }
        Insert: {
          cortina_item_id: string
          created_at?: string
          data_fim_corte?: string | null
          data_fim_costura?: string | null
          data_finalizacao?: string | null
          data_inicio_corte?: string | null
          data_inicio_costura?: string | null
          id?: string
          observacoes?: string | null
          pedido_id: string
          responsavel?: string | null
          status_item?: string
          updated_at?: string
        }
        Update: {
          cortina_item_id?: string
          created_at?: string
          data_fim_corte?: string | null
          data_fim_costura?: string | null
          data_finalizacao?: string | null
          data_inicio_corte?: string | null
          data_inicio_costura?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string
          responsavel?: string | null
          status_item?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_cortina_item_id_fkey"
            columns: ["cortina_item_id"]
            isOneToOne: false
            referencedRelation: "cortina_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          categoria_id: string | null
          conta_pagar_id: string | null
          created_at: string
          created_by_user_id: string
          data_competencia: string | null
          data_lancamento: string
          descricao: string
          forma_pagamento_id: string | null
          id: string
          observacoes: string | null
          parcela_receber_id: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          conta_pagar_id?: string | null
          created_at?: string
          created_by_user_id: string
          data_competencia?: string | null
          data_lancamento?: string
          descricao: string
          forma_pagamento_id?: string | null
          id?: string
          observacoes?: string | null
          parcela_receber_id?: string | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          conta_pagar_id?: string | null
          created_at?: string
          created_by_user_id?: string
          data_competencia?: string | null
          data_lancamento?: string
          descricao?: string
          forma_pagamento_id?: string | null
          id?: string
          observacoes?: string | null
          parcela_receber_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_parcela_receber_id_fkey"
            columns: ["parcela_receber_id"]
            isOneToOne: false
            referencedRelation: "parcelas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          aplicacao: string | null
          area_min_fat: number | null
          ativo: boolean
          categoria: string
          codigo_item: string | null
          cor: string | null
          created_at: string
          fornecedor: string | null
          id: string
          largura_metro: number | null
          linha: string | null
          margem_tabela_percent: number
          nome: string
          perda_percent: number | null
          potencia: string | null
          preco_custo: number
          preco_tabela: number
          tipo: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          aplicacao?: string | null
          area_min_fat?: number | null
          ativo?: boolean
          categoria: string
          codigo_item?: string | null
          cor?: string | null
          created_at?: string
          fornecedor?: string | null
          id?: string
          largura_metro?: number | null
          linha?: string | null
          margem_tabela_percent?: number
          nome: string
          perda_percent?: number | null
          potencia?: string | null
          preco_custo: number
          preco_tabela: number
          tipo?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          aplicacao?: string | null
          area_min_fat?: number | null
          ativo?: boolean
          categoria?: string
          codigo_item?: string | null
          cor?: string | null
          created_at?: string
          fornecedor?: string | null
          id?: string
          largura_metro?: number | null
          linha?: string | null
          margem_tabela_percent?: number
          nome?: string
          perda_percent?: number | null
          potencia?: string | null
          preco_custo?: number
          preco_tabela?: number
          tipo?: string | null
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          data_lembrete: string | null
          expires_at: string | null
          id: string
          lida: boolean
          link_acao: string | null
          mensagem: string
          prioridade: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_lembrete?: string | null
          expires_at?: string | null
          id?: string
          lida?: boolean
          link_acao?: string | null
          mensagem: string
          prioridade?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_lembrete?: string | null
          expires_at?: string | null
          id?: string
          lida?: boolean
          link_acao?: string | null
          mensagem?: string
          prioridade?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      oportunidades: {
        Row: {
          contato_id: string | null
          created_at: string
          created_by_user_id: string
          data_previsao_fechamento: string | null
          etapa: string
          id: string
          motivo_perda: string | null
          observacoes: string | null
          orcamento_id: string | null
          origem: string | null
          temperatura: string | null
          titulo: string
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          created_by_user_id: string
          data_previsao_fechamento?: string | null
          etapa?: string
          id?: string
          motivo_perda?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          origem?: string | null
          temperatura?: string | null
          titulo: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          created_by_user_id?: string
          data_previsao_fechamento?: string | null
          etapa?: string
          id?: string
          motivo_perda?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          origem?: string | null
          temperatura?: string | null
          titulo?: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cidade: string | null
          cliente_nome: string
          cliente_telefone: string
          codigo: string
          contato_id: string | null
          created_at: string
          created_by_user_id: string
          custo_total: number | null
          desconto_tipo: string | null
          desconto_valor: number | null
          endereco: string
          id: string
          margem_percent: number
          margem_tipo: string
          observacoes: string | null
          status: string
          status_updated_at: string | null
          subtotal_instalacao: number | null
          subtotal_mao_obra_costura: number | null
          subtotal_materiais: number | null
          total_com_desconto: number | null
          total_geral: number | null
          updated_at: string
          validade_dias: number | null
        }
        Insert: {
          cidade?: string | null
          cliente_nome: string
          cliente_telefone: string
          codigo: string
          contato_id?: string | null
          created_at?: string
          created_by_user_id: string
          custo_total?: number | null
          desconto_tipo?: string | null
          desconto_valor?: number | null
          endereco?: string
          id?: string
          margem_percent: number
          margem_tipo: string
          observacoes?: string | null
          status?: string
          status_updated_at?: string | null
          subtotal_instalacao?: number | null
          subtotal_mao_obra_costura?: number | null
          subtotal_materiais?: number | null
          total_com_desconto?: number | null
          total_geral?: number | null
          updated_at?: string
          validade_dias?: number | null
        }
        Update: {
          cidade?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          codigo?: string
          contato_id?: string | null
          created_at?: string
          created_by_user_id?: string
          custo_total?: number | null
          desconto_tipo?: string | null
          desconto_valor?: number | null
          endereco?: string
          id?: string
          margem_percent?: number
          margem_tipo?: string
          observacoes?: string | null
          status?: string
          status_updated_at?: string | null
          subtotal_instalacao?: number | null
          subtotal_mao_obra_costura?: number | null
          subtotal_materiais?: number | null
          total_com_desconto?: number | null
          total_geral?: number | null
          updated_at?: string
          validade_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas_receber: {
        Row: {
          conta_receber_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          forma_pagamento_id: string | null
          id: string
          numero_parcela: number
          observacoes: string | null
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          conta_receber_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          forma_pagamento_id?: string | null
          id?: string
          numero_parcela: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          conta_receber_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          forma_pagamento_id?: string | null
          id?: string
          numero_parcela?: number
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_receber_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_receber_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "formas_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string
          created_by_user_id: string
          data_entrada: string
          data_pronto: string | null
          id: string
          numero_pedido: string
          observacoes_producao: string | null
          orcamento_id: string
          previsao_entrega: string | null
          prioridade: string
          status_producao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          data_entrada?: string
          data_pronto?: string | null
          id?: string
          numero_pedido: string
          observacoes_producao?: string | null
          orcamento_id: string
          previsao_entrega?: string | null
          prioridade?: string
          status_producao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          data_entrada?: string
          data_pronto?: string | null
          id?: string
          numero_pedido?: string
          observacoes_producao?: string | null
          orcamento_id?: string
          previsao_entrega?: string | null
          prioridade?: string
          status_producao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_confeccao: {
        Row: {
          ativo: boolean
          codigo_item: string | null
          created_at: string
          id: string
          margem_tabela_percent: number
          nome_modelo: string
          preco_custo: number
          preco_tabela: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_item?: string | null
          created_at?: string
          id?: string
          margem_tabela_percent?: number
          nome_modelo: string
          preco_custo: number
          preco_tabela: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_item?: string | null
          created_at?: string
          id?: string
          margem_tabela_percent?: number
          nome_modelo?: string
          preco_custo?: number
          preco_tabela?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      servicos_instalacao: {
        Row: {
          ativo: boolean
          codigo_item: string | null
          created_at: string
          id: string
          margem_tabela_percent: number
          nome: string
          preco_custo_por_ponto: number
          preco_tabela_por_ponto: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_item?: string | null
          created_at?: string
          id?: string
          margem_tabela_percent?: number
          nome: string
          preco_custo_por_ponto: number
          preco_tabela_por_ponto: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_item?: string | null
          created_at?: string
          id?: string
          margem_tabela_percent?: number
          nome?: string
          preco_custo_por_ponto?: number
          preco_tabela_por_ponto?: number
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes_visita: {
        Row: {
          cidade: string
          complemento: string | null
          created_at: string
          data_agendada: string
          email: string
          endereco: string | null
          horario_agendado: string
          id: string
          mensagem: string | null
          nome: string
          observacoes_internas: string | null
          status: string
          telefone: string
          updated_at: string
          visualizada: boolean
          visualizada_em: string | null
          visualizada_por: string | null
        }
        Insert: {
          cidade: string
          complemento?: string | null
          created_at?: string
          data_agendada: string
          email: string
          endereco?: string | null
          horario_agendado: string
          id?: string
          mensagem?: string | null
          nome: string
          observacoes_internas?: string | null
          status?: string
          telefone: string
          updated_at?: string
          visualizada?: boolean
          visualizada_em?: string | null
          visualizada_por?: string | null
        }
        Update: {
          cidade?: string
          complemento?: string | null
          created_at?: string
          data_agendada?: string
          email?: string
          endereco?: string | null
          horario_agendado?: string
          id?: string
          mensagem?: string | null
          nome?: string
          observacoes_internas?: string | null
          status?: string
          telefone?: string
          updated_at?: string
          visualizada?: boolean
          visualizada_em?: string | null
          visualizada_por?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_contas_atrasadas: { Args: never; Returns: undefined }
      gerar_codigo_orcamento: { Args: never; Returns: string }
      gerar_numero_pedido: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      truncate_materials_and_services: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
