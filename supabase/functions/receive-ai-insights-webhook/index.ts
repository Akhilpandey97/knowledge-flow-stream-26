import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  handover_id: string;
  insights: unknown;
  user_id?: string;
  file_path?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload: WebhookPayload = await req.json();

    // Validate required fields
    if (!payload.handover_id || !payload.insights) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: handover_id and insights are required" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare the insert data
    const insertData: Record<string, unknown> = {
      handover_id: payload.handover_id,
      insights: payload.insights,
      created_at: new Date().toISOString(),
    };

    // Add optional fields if present
    if (payload.user_id) {
      insertData.user_id = payload.user_id;
    }
    
    if (payload.file_path) {
      insertData.file_path = payload.file_path;
    }

    // Insert into ai_knowledge_insights_complex table
    const { data, error } = await supabase
      .from('ai_knowledge_insights_complex')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to insert AI insights",
          details: error.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "AI insights received and stored successfully",
      data: data
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: err.message || "Unknown error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});