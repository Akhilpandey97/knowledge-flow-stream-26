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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_insight_config: {
        Row: {
          created_at: string
          critical_title: string
          department: string
          id: string
          playbook_title: string
          revenue_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          critical_title?: string
          department: string
          id?: string
          playbook_title?: string
          revenue_title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          critical_title?: string
          department?: string
          id?: string
          playbook_title?: string
          revenue_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_knowledge_insights_complex: {
        Row: {
          created_at: string | null
          file_path: string | null
          handover_id: string | null
          id: number
          insight: string
          insights: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_path?: string | null
          handover_id?: string | null
          id?: number
          insight: string
          insights?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string | null
          handover_id?: string | null
          id?: number
          insight?: string
          insights?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_task_insights: {
        Row: {
          created_at: string
          has_next_actions: boolean
          id: string
          insights: string
          next_action_items: Json
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_next_actions?: boolean
          id?: string
          insights: string
          next_action_items?: Json
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_next_actions?: boolean
          id?: string
          insights?: string
          next_action_items?: Json
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_task_insights_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          priority: string
          template_id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          priority?: string
          template_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          priority?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      handovers: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          progress: number | null
          successor_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          progress?: number | null
          successor_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          progress?: number | null
          successor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handovers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handovers_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          created_at: string
          handover_id: string
          id: string
          message: string
          request_type: string
          requester_id: string
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          handover_id: string
          id?: string
          message: string
          request_type: string
          requester_id: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          handover_id?: string
          id?: string
          message?: string
          request_type?: string
          requester_id?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handovers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_form_fields: {
        Row: {
          created_at: string
          field_label: string
          field_options: Json | null
          field_placeholder: string | null
          field_type: string
          id: string
          is_required: boolean
          order_index: number
          template_id: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          field_label: string
          field_options?: Json | null
          field_placeholder?: string | null
          field_type: string
          id?: string
          is_required?: boolean
          order_index?: number
          template_id: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          field_label?: string
          field_options?: Json | null
          field_placeholder?: string | null
          field_type?: string
          id?: string
          is_required?: boolean
          order_index?: number
          template_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_form_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "insight_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_form_templates: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          integration_name: string
          integration_type: string
          metadata: Json | null
          refresh_token: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          integration_name: string
          integration_type: string
          metadata?: Json | null
          refresh_token?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          integration_name?: string
          integration_type?: string
          metadata?: Json | null
          refresh_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lindi_responses: {
        Row: {
          created_at: string | null
          id: string
          query: string | null
          response: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query?: string | null
          response?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string | null
          response?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          handover_id: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          handover_id?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          handover_id?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handovers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          task_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          task_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          handover_id: string | null
          id: string
          status: string | null
          successor_acknowledged: boolean | null
          successor_acknowledged_at: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          handover_id?: string | null
          id?: string
          status?: string | null
          successor_acknowledged?: boolean | null
          successor_acknowledged_at?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          handover_id?: string | null
          id?: string
          status?: string | null
          successor_acknowledged?: boolean | null
          successor_acknowledged_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_handover_id_fkey"
            columns: ["handover_id"]
            isOneToOne: false
            referencedRelation: "handovers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_document_uploads: {
        Row: {
          created_at: string
          file_path: string
          filename: string
          id: string
          uploaded_at: string
          user_id: string
          webhook_sent: boolean | null
        }
        Insert: {
          created_at?: string
          file_path: string
          filename: string
          id?: string
          uploaded_at?: string
          user_id: string
          webhook_sent?: boolean | null
        }
        Update: {
          created_at?: string
          file_path?: string
          filename?: string
          id?: string
          uploaded_at?: string
          user_id?: string
          webhook_sent?: boolean | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_checklist_template: {
        Args: { p_handover_id: string; p_template_id: string }
        Returns: undefined
      }
      get_current_user_role: { Args: never; Returns: string }
      is_admin: { Args: { uid: string }; Returns: boolean }
      list_successor_candidates: {
        Args: never
        Returns: {
          email: string
          id: string
          role: string
        }[]
      }
      log_activity: {
        Args: {
          p_action?: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      department_type:
        | "Sales"
        | "Engineering"
        | "HR"
        | "Marketing"
        | "Finance"
        | "Operations"
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
      department_type: [
        "Sales",
        "Engineering",
        "HR",
        "Marketing",
        "Finance",
        "Operations",
      ],
    },
  },
} as const
