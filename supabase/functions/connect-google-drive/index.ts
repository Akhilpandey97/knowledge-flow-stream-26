import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For demo purposes, we'll create a mock integration record
    // In a real implementation, this would redirect to Google OAuth
    const { data, error } = await supabaseClient
      .from('integrations')
      .upsert({
        user_id: userId,
        integration_type: 'google-drive',
        integration_name: 'Google Drive',
        status: 'connected',
        metadata: {
          connected_at: new Date().toISOString(),
          mock: true,
          folders_synced: 5,
          files_synced: 42
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await supabaseClient.rpc('log_activity', {
      p_user_id: userId,
      p_action: 'integration_connected',
      p_resource_type: 'integration',
      p_resource_id: data.id,
      p_details: {
        integration_name: 'Google Drive',
        integration_type: 'google-drive'
      }
    });

    return new Response(
      JSON.stringify({ success: true, integration: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error connecting Google Drive:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});