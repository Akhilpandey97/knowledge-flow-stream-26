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
  password: string;
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

    const { email, role, department, password }: SignupEmailRequest = await req.json();

    console.log("Creating user account for:", email, "with role:", role);

    const roleTitle = role === 'exiting' ? 'Exiting Employee' : 
                     role === 'successor' ? 'Successor' : 
                     'Employee';

    // Use Supabase Admin API to create user with password
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email so they can login immediately
      user_metadata: {
        role: role,
        department: department
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    console.log("User created successfully:", userData);

    // Ensure user record exists in users table with correct Auth ID
    if (userData.user) {
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userData.user.id, // Use the Auth user ID
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
      message: `User account created successfully for ${email}`,
      user: userData 
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