import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SignupEmailRequest {
  email: string;
  role: string;
  department: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? '',
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { email, role, department }: SignupEmailRequest = await req.json();

    console.log("Sending signup invite to:", email, "with role:", role);

    const roleTitle = role === 'exiting' ? 'Exiting Employee' : 
                     role === 'successor' ? 'Successor' : 
                     'Employee';

    // Use Supabase Admin API to send real invite email
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role: role,
          department: department
        },
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'supabase.co')}/auth/callback`
      }
    );

    if (inviteError) {
      console.error("Error sending invite:", inviteError);
      throw inviteError;
    }

    console.log("Invite sent successfully:", inviteData);

    // Ensure user record exists in users table with correct Auth ID
    if (inviteData.user) {
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: inviteData.user.id, // Use the Auth user ID
          email: email,
          role: role,
          department: department
        }, {
          onConflict: 'id'
        });

      if (userInsertError) {
        console.error("Error creating user profile:", userInsertError);
        // Don't throw here - the invite was successful, just log the profile error
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Signup invite sent successfully to ${email}`,
      user: inviteData 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-signup-email function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);