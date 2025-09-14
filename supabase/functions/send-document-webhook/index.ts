import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Lindy.ai webhook configuration
const LINDY_WEBHOOK_URL = "https://public.lindy.ai/api/v1/webhooks/lindy/6abf084d-f586-4755-b450-0b6bf6563462";
const LINDY_WEBHOOK_SECRET = "65a570b73d130c74eda80a418fdf6a1769ce68c085e25f9580bdf65f752b0f85";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { filePath, filename, userId, handoverId } = await req.json();

    if (!filePath || !filename) {
      return new Response(JSON.stringify({ error: "Missing filePath or filename" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the document from Supabase storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('handover-documents')
      .download(filePath);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${downloadError?.message || 'File not found'}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Prepare webhook payload with user and handover context
    const webhookPayload = {
      filePath,
      filename,
      content: base64Data,
      contentType: fileData.type || 'application/octet-stream',
      metadata: {
        userId,
        handoverId,
        timestamp: new Date().toISOString()
      }
    };

    // Send to Lindy.ai webhook
    const webhookResponse = await fetch(LINDY_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINDY_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      return new Response(
        JSON.stringify({ 
          error: `Webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}`,
          details: errorText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
