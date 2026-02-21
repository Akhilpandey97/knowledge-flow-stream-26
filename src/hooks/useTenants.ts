import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  plan: string;
  status: string;
  max_users: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTenants((data || []) as Tenant[]);
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
      toast({ title: 'Error', description: 'Failed to load tenants', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  const createTenant = async (tenant: { name: string; domain?: string; plan?: string; max_users?: number }) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenant.name,
          domain: tenant.domain || null,
          plan: tenant.plan || 'starter',
          max_users: tenant.max_users || 50,
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Tenant Created', description: `${tenant.name} has been created successfully.` });
      fetchTenants();
      return data as Tenant;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to create tenant', variant: 'destructive' });
      throw err;
    }
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    try {
      const { error } = await supabase.from('tenants').update(updates).eq('id', id);
      if (error) throw error;
      toast({ title: 'Tenant Updated', description: 'Tenant has been updated successfully.' });
      fetchTenants();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update tenant', variant: 'destructive' });
      throw err;
    }
  };

  const deleteTenant = async (id: string) => {
    try {
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Tenant Deleted', description: 'Tenant has been removed.' });
      fetchTenants();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete tenant', variant: 'destructive' });
      throw err;
    }
  };

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  return { tenants, loading, fetchTenants, createTenant, updateTenant, deleteTenant };
};
