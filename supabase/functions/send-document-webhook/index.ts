import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { filePath, fileName, userId } = await req.json();

    console.log('Processing webhook request:', { filePath, fileName, userId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('handover-documents')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to base64 for webhook
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Get webhook URL and secret
    const webhookUrl = 'https://public.lindy.ai/api/v1/webhooks/lindy/f9932f28-d25e-4eb2-aad8-7a1d2daac746';
    const webhookSecret = Deno.env.get('LINDY_WEBHOOK_SECRET')!;

    // Prepare webhook payload
    const webhookPayload = {
      timestamp: new Date().toISOString(),
      userId: userId,
      fileName: fileName,
      filePath: filePath,
      fileContent: base64Content,
      contentType: fileData.type || 'application/octet-stream'
    };

    console.log('Sending webhook to:', webhookUrl);

    // Send webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log('Webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook failed:', errorText);
      throw new Error(`Webhook failed with status ${webhookResponse.status}: ${errorText}`);
    }

    // Update database to mark webhook as sent
    const { error: updateError } = await supabase
      .from('user_document_uploads')
      .update({ webhook_sent: true })
      .eq('user_id', userId)
      .eq('file_path', filePath);

    if (updateError) {
      console.error('Error updating webhook status:', updateError);
      // Don't throw here as webhook was successful
    }

    const responseText = await webhookResponse.text();
    console.log('Webhook response:', responseText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed and webhook sent successfully',
        webhookResponse: responseText 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in send-document-webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});