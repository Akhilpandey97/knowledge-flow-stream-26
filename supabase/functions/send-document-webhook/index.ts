import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, filename } = await req.json();
    
    if (!filePath || !filename) {
      return new Response(
        JSON.stringify({ error: 'Missing filePath or filename' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing document: ${filename} at path: ${filePath}`);

    // Get the document content from Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const storageResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/handover-documents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!storageResponse.ok) {
      throw new Error(`Failed to fetch document: ${storageResponse.statusText}`);
    }

    const documentBuffer = await storageResponse.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(documentBuffer)));

    // Prepare webhook payload
    const webhookPayload = {
      filename: filename,
      content: base64Content,
      filePath: filePath,
      timestamp: new Date().toISOString(),
      source: 'handover-system'
    };

    // Send to webhook
    const webhookUrl = 'https://public.lindy.ai/api/v1/webhooks/lindy/f9932f28-d25e-4eb2-aad8-7a1d2daac746';
    const webhookSecret = Deno.env.get('LINDY_WEBHOOK_SECRET')!;

    console.log('Sending webhook to:', webhookUrl);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('Webhook response status:', webhookResponse.status);
    
    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook failed:', errorText);
      throw new Error(`Webhook failed: ${webhookResponse.status} - ${errorText}`);
    }

    // Update database to mark webhook as sent
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('user_document_uploads')
      .update({ webhook_sent: true })
      .eq('file_path', filePath);

    if (updateError) {
      console.error('Error updating webhook status:', updateError);
    }

    console.log('Document webhook sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document webhook sent successfully',
        filename: filename
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-document-webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});