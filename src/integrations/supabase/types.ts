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
      cortina_items: {
        Row: {
          altura: number
          ambiente: string | null
          barra_cm: number | null
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
          orcamento_id: string
          pontos_instalacao: number | null
          precisa_instalacao: boolean
          preco_unitario: number | null
          preco_venda: number | null
          quantidade: number
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
          orcamento_id: string
          pontos_instalacao?: number | null
          precisa_instalacao?: boolean
          preco_unitario?: number | null
          preco_venda?: number | null
          quantidade?: number
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
          orcamento_id?: string
          pontos_instalacao?: number | null
          precisa_instalacao?: boolean
          preco_unitario?: number | null
          preco_venda?: number | null
          quantidade?: number
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
      materiais: {
        Row: {
          ativo: boolean
          categoria: string
          codigo_item: string | null
          created_at: string
          id: string
          largura_metro: number | null
          margem_tabela_percent: number
          nome: string
          perda_percent: number | null
          preco_custo: number
          preco_tabela: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          codigo_item?: string | null
          created_at?: string
          id?: string
          largura_metro?: number | null
          margem_tabela_percent?: number
          nome: string
          perda_percent?: number | null
          preco_custo: number
          preco_tabela: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          codigo_item?: string | null
          created_at?: string
          id?: string
          largura_metro?: number | null
          margem_tabela_percent?: number
          nome?: string
          perda_percent?: number | null
          preco_custo?: number
          preco_tabela?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_nome: string
          cliente_telefone: string
          codigo: string
          created_at: string
          created_by_user_id: string
          custo_total: number | null
          endereco: string
          id: string
          margem_percent: number
          margem_tipo: string
          observacoes: string | null
          status: string
          subtotal_instalacao: number | null
          subtotal_mao_obra_costura: number | null
          subtotal_materiais: number | null
          total_geral: number | null
          updated_at: string
          validade_dias: number | null
        }
        Insert: {
          cliente_nome: string
          cliente_telefone: string
          codigo: string
          created_at?: string
          created_by_user_id: string
          custo_total?: number | null
          endereco?: string
          id?: string
          margem_percent: number
          margem_tipo: string
          observacoes?: string | null
          status?: string
          subtotal_instalacao?: number | null
          subtotal_mao_obra_costura?: number | null
          subtotal_materiais?: number | null
          total_geral?: number | null
          updated_at?: string
          validade_dias?: number | null
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string
          codigo?: string
          created_at?: string
          created_by_user_id?: string
          custo_total?: number | null
          endereco?: string
          id?: string
          margem_percent?: number
          margem_tipo?: string
          observacoes?: string | null
          status?: string
          subtotal_instalacao?: number | null
          subtotal_mao_obra_costura?: number | null
          subtotal_materiais?: number | null
          total_geral?: number | null
          updated_at?: string
          validade_dias?: number | null
        }
        Relationships: []
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
      gerar_codigo_orcamento: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
