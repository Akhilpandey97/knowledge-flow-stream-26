// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const demoUsers = [
      { email: 'ap79020@gmail.com', password: 'demo123', dbRole: 'hr-manager' },
      { email: 'arbaaz.jawed@gmail.com', password: 'demo123', dbRole: 'successor' },
      { email: 'john.doe@company.com', password: 'demo123', dbRole: 'exiting' },
    ] as const;

    // Helper to find existing auth user by email
    const findAuthUserByEmail = async (email: string) => {
      const users: any[] = [];
      let page = 1;
      const perPage = 200;
      while (page < 10) { // safety cap
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        if (!data?.users?.length) break;
        users.push(...data.users);
        page++;
      }
      return users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
    };

    const ensuredUsers: Record<string, { id: string; email: string; role: string }> = {};

    for (const du of demoUsers) {
      let authUser = await findAuthUserByEmail(du.email);
      if (!authUser) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: du.email,
          password: du.password,
          email_confirm: true,
        });
        if (createErr) throw createErr;
        authUser = created.user;
      } else {
        // Reset password and confirm email for existing users
        const { error: updateErr } = await admin.auth.admin.updateUserById(authUser.id, {
          password: du.password,
          email_confirm: true,
        });
        if (updateErr) console.warn(`Warning: Could not update password for ${du.email}:`, updateErr.message);
      }

      // Upsert into public.users with the AUTH user id
      const { error: upsertErr } = await admin.from('users')
        .upsert({ id: authUser.id, email: du.email, role: du.dbRole })
        .eq('id', authUser.id);
      if (upsertErr) throw upsertErr;

      ensuredUsers[du.email] = { id: authUser.id, email: du.email, role: du.dbRole };
    }

    // Create a primary handover between John (employee) and Arbaaz (successor)
    const john = ensuredUsers['john.doe@company.com'];
    const arbaaz = ensuredUsers['arbaaz.jawed@gmail.com'];

    // Try to find an existing handover for this pair
    const { data: existingHandover, error: findHandoverErr } = await admin
      .from('handovers')
      .select('*')
      .eq('employee_id', john.id)
      .eq('successor_id', arbaaz.id)
      .maybeSingle();
    if (findHandoverErr && findHandoverErr.code !== 'PGRST116') throw findHandoverErr;

    let handoverId: string;
    if (!existingHandover) {
      const { data: handoverIns, error: handoverErr } = await admin
        .from('handovers')
        .insert({ employee_id: john.id, successor_id: arbaaz.id, progress: 68 })
        .select()
        .single();
      if (handoverErr) throw handoverErr;
      handoverId = handoverIns.id as string;
    } else {
      handoverId = existingHandover.id as string;
    }

    // Clean up existing tasks/notes/messages for idempotency
    const { data: taskRows } = await admin.from('tasks').select('id').eq('handover_id', handoverId);
    const taskIds = (taskRows || []).map((t: any) => t.id);
    if (taskIds.length) {
      await admin.from('notes').delete().in('task_id', taskIds);
    }
    await admin.from('messages').delete().eq('handover_id', handoverId);
    await admin.from('tasks').delete().eq('handover_id', handoverId);

    // Insert tasks
    const tasksToInsert = [
      {
        title: 'Client Account Handover - TechCorp',
        description: 'Transfer all TechCorp account details, meeting notes, and contact information',
        status: 'done',
        handover_id: handoverId,
      },
      {
        title: 'CRM Workflow Documentation',
        description: 'Document the custom CRM workflows and automation rules',
        status: 'done',
        handover_id: handoverId,
      },
      {
        title: 'Renewal Risk Assessment',
        description: 'Identify accounts at risk for renewal and provide mitigation strategies',
        status: 'critical',
        handover_id: handoverId,
      },
      {
        title: 'Team Introduction Sessions',
        description: 'Introduce successor to key team members and stakeholders',
        status: 'pending',
        handover_id: handoverId,
      },
    ];

    const { data: insertedTasks, error: tasksErr } = await admin
      .from('tasks')
      .insert(tasksToInsert)
      .select('*');
    if (tasksErr) throw tasksErr;

    const taskByTitle: Record<string, string> = {};
    for (const t of insertedTasks || []) taskByTitle[t.title] = t.id;

    // Insert notes
    const notesToInsert = [
      {
        task_id: taskByTitle['Client Account Handover - TechCorp'],
        content: 'Successfully completed client handover meeting. Next steps documented in shared folder.',
        created_by: john.id,
      },
      {
        task_id: taskByTitle['CRM Workflow Documentation'],
        content: 'CRM workflows documented in wiki. Screenshots added for complex rules.',
        created_by: john.id,
      },
    ];
    const { error: notesErr } = await admin.from('notes').insert(notesToInsert);
    if (notesErr) throw notesErr;

    // Insert messages
    const messagesToInsert = [
      {
        handover_id: handoverId,
        sender_id: john.id,
        content: "Hi Arbaaz! I've completed the TechCorp account handover. All docs are shared.",
      },
      {
        handover_id: handoverId,
        sender_id: arbaaz.id,
        content: 'Thanks John! Can we schedule a call to discuss the renewal risk assessment?'
      },
    ];
    const { error: msgErr } = await admin.from('messages').insert(messagesToInsert);
    if (msgErr) throw msgErr;

    return new Response(
      JSON.stringify({
        ok: true,
        users: ensuredUsers,
        handoverId,
        insertedTasks: (insertedTasks || []).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('seed_demo error', e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
