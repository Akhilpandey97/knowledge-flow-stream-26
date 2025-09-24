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
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Handle OAuth callback
    if (searchParams.has('code')) {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      const userId = state; // We pass userId as state parameter

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Exchange authorization code for access token
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/connect-google-drive`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Token exchange error:', tokenData);
        throw new Error('Failed to exchange authorization code for tokens');
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const userInfo = await userInfoResponse.json();

      // Store integration with real tokens
      const { data, error } = await supabaseClient
        .from('integrations')
        .upsert({
          user_id: userId,
          integration_type: 'google-drive',
          integration_name: 'Google Drive',
          status: 'connected',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          metadata: {
            connected_at: new Date().toISOString(),
            user_email: userInfo.email,
            user_name: userInfo.name,
            scope: tokenData.scope,
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
          integration_type: 'google-drive',
          user_email: userInfo.email,
        }
      });

      // Redirect back to the app with success
      const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || '';
      const redirectUrl = `${appUrl.replace('https://', 'https://')}.lovableproject.com/?integration=success`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': redirectUrl,
        },
      });
    }

    // Handle initial OAuth request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Create Google OAuth URL
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/connect-google-drive`;
    
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId!);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', userId); // Pass userId as state

    console.log('Generated OAuth URL:', authUrl.toString());

    return new Response(
      JSON.stringify({ 
        success: true, 
        authUrl: authUrl.toString(),
        requiresRedirect: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in Google Drive connection:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});