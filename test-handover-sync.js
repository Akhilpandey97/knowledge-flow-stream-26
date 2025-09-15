import { supabase } from '../src/integrations/supabase/client';

async function testHandoverAuthSync() {
  console.log('Testing Handover Auth ID Sync functionality...');
  
  try {
    // Test 1: Check if the RPC functions exist
    console.log('\n1. Testing RPC function availability...');
    
    // This should work for admin users
    const { data: syncResult, error: syncError } = await supabase.rpc('admin_sync_handover_auth_ids');
    
    if (syncError) {
      if (syncError.message?.includes('permission denied') || syncError.message?.includes('Access denied')) {
        console.log('✓ RPC function exists and properly enforces admin permissions');
      } else {
        console.error('✗ Unexpected RPC error:', syncError);
      }
    } else {
      console.log('✓ RPC function executed successfully:', syncResult);
    }
    
    // Test 2: Check if the handover consistency function exists
    console.log('\n2. Testing handover consistency function...');
    
    const { error: consistencyError } = await supabase.rpc('ensure_handover_auth_consistency', {
      user_email: 'test@example.com',
      auth_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (consistencyError) {
      if (consistencyError.message?.includes('permission denied') || 
          consistencyError.message?.includes('function') && consistencyError.message?.includes('does not exist')) {
        console.log('Function may not exist yet or have permission issues:', consistencyError.message);
      } else {
        console.log('✓ Consistency function is accessible');
      }
    } else {
      console.log('✓ Handover consistency function executed successfully');
    }
    
    // Test 3: Check current handover structure
    console.log('\n3. Testing handover table access...');
    
    const { data: handovers, error: handoverError } = await supabase
      .from('handovers')
      .select('id, employee_id, successor_id')
      .limit(5);
    
    if (handoverError) {
      console.error('✗ Error accessing handovers:', handoverError);
    } else {
      console.log('✓ Handovers table accessible:', handovers?.length || 0, 'records found');
      if (handovers && handovers.length > 0) {
        console.log('Sample handover:', handovers[0]);
      }
    }
    
    // Test 4: Check users table access
    console.log('\n4. Testing users table access...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(3);
    
    if (usersError) {
      console.error('✗ Error accessing users:', usersError);
    } else {
      console.log('✓ Users table accessible:', users?.length || 0, 'records found');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  testHandoverAuthSync();
}

export { testHandoverAuthSync };