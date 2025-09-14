import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  handover_id?: string;
  insights: unknown;
  user_id?: string;
  file_path?: string;
  metadata?: {
    userId?: string;
    handoverId?: string;
    timestamp?: string;
  };
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
    if (!payload.insights) {
      return new Response(JSON.stringify({ 
        error: "Missing required field: insights" 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine handover_id and user_id with fallbacks
    let handoverId = payload.handover_id;
    let userId = payload.user_id;

    // If missing, try to derive from metadata
    if (payload.metadata) {
      handoverId = handoverId || payload.metadata.handoverId;
      userId = userId || payload.metadata.userId;
    }

    // Normalize userId: if it's an email, convert it to UUID
    if (userId && userId.includes('@')) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', userId)
        .limit(1)
        .maybeSingle();
      
      if (userData) {
        userId = userData.id;
      } else {
        console.warn(`User not found for email: ${userId}`);
      }
    }

    // If still no handover_id, try to derive from user_id (employee or successor)
    if (!handoverId && userId) {
      // First try employee
      let { data: handoverData } = await supabase
        .from('handovers')
        .select('id')
        .eq('employee_id', userId)
        .limit(1)
        .maybeSingle();

      if (handoverData) {
        handoverId = handoverData.id;
      } else {
        // Then try successor
        const res2 = await supabase
          .from('handovers')
          .select('id')
          .eq('successor_id', userId)
          .limit(1)
          .maybeSingle();
        if (res2.data) {
          handoverId = res2.data.id;
        }
      }
    }

    // If still no handover_id and we have file_path, try to extract user_id from path
    if (!handoverId && payload.file_path) {
      const pathUserId = payload.file_path.split('/')[0];
      if (pathUserId && pathUserId.length === 36) { // UUID length check
        // Try employee match first, then successor
        let { data: h1 } = await supabase
          .from('handovers')
          .select('id')
          .eq('employee_id', pathUserId)
          .limit(1)
          .maybeSingle();
        if (h1) {
          handoverId = h1.id;
          userId = userId || pathUserId;
        } else {
          const res3 = await supabase
            .from('handovers')
            .select('id')
            .eq('successor_id', pathUserId)
            .limit(1)
            .maybeSingle();
          if (res3.data) {
            handoverId = res3.data.id;
            userId = userId || pathUserId;
          }
        }
      }
    }

    // Prepare the insert data
    const computeInsightText = () => {
      try {
        if (typeof payload.insights === 'string') return payload.insights;
        if (Array.isArray(payload.insights)) return JSON.stringify(payload.insights[0] ?? payload.insights);
        if (typeof payload.insights === 'object' && payload.insights !== null) return JSON.stringify(payload.insights);
        return String(payload.insights);
      } catch (_) {
        return 'AI insight received';
      }
    };

    const insertData: Record<string, unknown> = {
      insights: typeof payload.insights === 'string' ? payload.insights : JSON.stringify(payload.insights),
      insight: computeInsightText(),
      created_at: new Date().toISOString(),
    };

    // Add optional fields if present
    if (handoverId) {
      insertData.handover_id = handoverId;
    }
    
    if (userId) {
      insertData.user_id = userId;
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