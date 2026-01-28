import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'employee' | 'client';

export interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar: string | null;
  contact: string | null;
  representative: string | null;
  role?: AppRole;
}

export function useRealtimeUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      // Fetch roles for all users
      const userIds = (usersData || []).map((u: any) => u.user_id);
      
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = new Map((rolesData || []).map((r: any) => [r.user_id, r.role]));

      const usersWithRoles = (usersData || []).map((u: any) => ({
        ...u,
        role: roleMap.get(u.user_id) || 'client',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Subscribe to realtime changes for users
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            setUsers((prev) => [...prev, { ...payload.new, role: 'client' }]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === payload.new.id ? { ...u, ...payload.new } : u
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  return {
    users,
    loading,
    refetch: fetchUsers,
  };
}
