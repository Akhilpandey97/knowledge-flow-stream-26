import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Setting password for admin user ap79020@gmail.com')

    // First, get the user by email from the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'ap79020@gmail.com')
      .single()

    if (userError || !user) {
      console.error('User lookup error:', userError)
      throw new Error('Admin user not found')
    }

    console.log('Found user ID:', user.id)

    // Update the password using Admin API
    const { error: passwordError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'Login@12'
    })

    if (passwordError) {
      console.error('Password update error:', passwordError)
      throw new Error(`Failed to update password: ${passwordError.message}`)
    }

    console.log('Password updated successfully for admin user')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin password set successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in set-admin-password:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})