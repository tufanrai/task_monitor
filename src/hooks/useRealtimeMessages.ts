import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type ChatChannel = 'team' | 'client';

export interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  channel: ChatChannel;
  created_at: string;
}

export function useRealtimeMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch sender names
      const senderIds = [...new Set((messagesData || []).map((m: any) => m.sender_id))];
      
      const { data: usersData } = await supabase
        .from('users')
        .select('user_id, name')
        .in('user_id', senderIds);

      const userMap = new Map((usersData || []).map((u: any) => [u.user_id, u.name]));

      const messagesWithNames = (messagesData || []).map((m: any) => ({
        ...m,
        sender_name: userMap.get(m.sender_id) || 'Unknown',
      }));

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime changes for messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === 'INSERT') {
            // Fetch sender name for new message
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('user_id', payload.new.sender_id)
              .maybeSingle();

            const messageWithName = {
              ...payload.new,
              sender_name: userData?.name || 'Unknown',
            };

            setMessages((prev) => [...prev, messageWithName]);
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const sendMessage = async (content: string, channel: ChatChannel, senderId: string) => {
    try {
      const { error } = await supabase.from('messages').insert({
        content,
        channel,
        sender_id: senderId,
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
}
