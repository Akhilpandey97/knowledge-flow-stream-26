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

    // Parse the webhook response to extract insights
    const webhookResponseData = await webhookResponse.json();
    console.log('Webhook response data:', JSON.stringify(webhookResponseData, null, 2));

    // Extract insights from response (fallback to entire response if no "insights" field)
    const insights = webhookResponseData.insights || webhookResponseData;

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.4');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id from user_document_uploads via file_path
    const { data: uploadData, error: uploadError } = await supabase
      .from('user_document_uploads')
      .select('user_id')
      .eq('file_path', filePath)
      .single();

    if (uploadError) {
      console.error('Error fetching user_id from uploads:', uploadError);
      throw new Error(`Failed to get user_id: ${uploadError.message}`);
    }

    if (!uploadData?.user_id) {
      console.error('No user_id found for file_path:', filePath);
      throw new Error(`No user_id found for file_path: ${filePath}`);
    }

    // Store insights in ai_knowledge_insights_complex table
    const { error: insightsError } = await supabase
      .from('ai_knowledge_insights_complex')
      .insert({
        user_id: uploadData.user_id,
        file_path: filePath,
        insights: insights
      });

    if (insightsError) {
      console.error('Error storing AI insights:', insightsError);
      // Don't fail the entire process if insights storage fails
    } else {
      console.log('AI insights stored successfully for user:', uploadData.user_id);
    }

    // Update database to mark webhook as sent
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