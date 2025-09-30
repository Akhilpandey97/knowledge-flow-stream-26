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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Get the authorization header to verify the calling user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    // Create a client with the user's token to verify their role
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Verify the user is authenticated and has admin role
    const { data: { user: authUser }, error: authError } = await userSupabase.auth.getUser()
    if (authError || !authUser) {
      throw new Error('Invalid authentication')
    }

    // Check if user has admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (profileError || userProfile?.role !== 'admin') {
      throw new Error('Admin privileges required')
    }

    const { action, email, role, department, password, userId } = await req.json()

    console.log(`Admin action: ${action} for email: ${email}`)

    switch (action) {
      case 'create': {
        // Validate required fields
        if (!email || !role || !password) {
          throw new Error('Email, role, and password are required for user creation')
        }

        // Validate password length  
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format')
        }

        // Validate role
        const validRoles = ['exiting', 'successor', 'hr-manager', 'admin']
        if (!validRoles.includes(role)) {
          throw new Error('Invalid role. Must be one of: ' + validRoles.join(', '))
        }

        // Check if user already exists
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const userExists = existingUser?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())
        if (userExists) {
          throw new Error('User with this email already exists')
        }
        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        })

        if (authError) {
          console.error('Auth error:', authError)
          throw new Error(`Failed to create auth user: ${authError.message}`)
        }

        console.log('Auth user created:', authUser.user?.id)

        // Create user profile in public.users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.user.id,
              email,
              role,
              department: department || null
            }
          ])
          .select()

        if (profileError) {
          console.error('Profile error:', profileError)
          // If profile creation fails, clean up auth user
          await supabase.auth.admin.deleteUser(authUser.user.id)
          throw new Error(`Failed to create user profile: ${profileError.message}`)
        }

        console.log('Profile created successfully')

        // Ensure handover consistency for this user
        try {
          const { error: handoverSyncError } = await supabase.rpc('ensure_handover_auth_consistency', {
            user_email: email,
            auth_user_id: authUser.user.id
          })
          
          if (handoverSyncError) {
            console.warn('Warning: Could not sync handover Auth IDs:', handoverSyncError)
            // Don't fail user creation for this, just log the warning
          } else {
            console.log('Handover Auth ID consistency ensured for new user')
          }
        } catch (syncError) {
          console.warn('Warning: Handover sync failed but user was created:', syncError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: profileData[0],
            message: 'User created successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'reset-password': {
        if (!userId) {
          throw new Error('User ID is required for password reset')
        }

        // Use provided password or generate a random one
        const newPassword = password || (Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8))

        // Validate password length
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }

        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: newPassword
        })

        if (error) {
          console.error('Password reset error:', error)
          throw new Error(`Failed to reset password: ${error.message}`)
        }

        console.log('Password reset successful for user:', userId)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Password reset successfully',
            newPassword 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'delete': {
        if (!userId) {
          throw new Error('User ID is required for deletion')
        }

        // Delete from auth (this will cascade to users table if foreign key exists)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)

        if (authError) {
          console.error('Auth deletion error:', authError)
          throw new Error(`Failed to delete user: ${authError.message}`)
        }

        // Also delete from users table to be safe
        const { error: profileError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (profileError) {
          console.error('Profile deletion error:', profileError)
        }

        console.log('User deleted successfully:', userId)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in admin-user-management:', error)
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