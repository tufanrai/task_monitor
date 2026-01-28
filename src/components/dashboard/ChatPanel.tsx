import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Users, Briefcase } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function ChatPanel() {
  const { profile, user } = useAuthContext();
  const { messages, chatChannel, setChatChannel, sendMessage } = useDataContext();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(m => m.channel === chatChannel);
  const isAdmin = profile?.role === 'admin';
  const isClient = profile?.role === 'client';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSend = async () => {
    if (newMessage.trim() && user) {
      await sendMessage(newMessage.trim(), chatChannel, user.id);
      setNewMessage('');
    }
  };

  const getChannelTitle = () => {
    if (isClient) return 'Support Chat';
    if (chatChannel === 'team') return 'Team Chat';
    return 'Client Chat';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="w-full xl:w-80 h-full xl:h-screen bg-card xl:border-l border-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {chatChannel === 'team' ? (
              <Users className="w-5 h-5 text-primary" />
            ) : (
              <Briefcase className="w-5 h-5 text-primary" />
            )}
            <h3 className="font-semibold text-foreground">{getChannelTitle()}</h3>
          </div>
          
          {/* Admin Toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className={`text-xs ${chatChannel === 'team' ? 'text-primary' : 'text-muted-foreground'}`}>
                Team
              </span>
              <Switch
                checked={chatChannel === 'client'}
                onCheckedChange={(checked) => setChatChannel(checked ? 'client' : 'team')}
                className={chatChannel === 'client' ? 'data-[state=checked]:bg-red-500' : 'data-[state=checked]:bg-primary'}
              />
              <span className={`text-xs ${chatChannel === 'client' ? 'text-red-500' : 'text-muted-foreground'}`}>
                Client
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <AnimatePresence initial={false}>
          {filteredMessages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground mb-1 block">{message.sender_name}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-chat-other text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className={`text-xs text-muted-foreground mt-1 block ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTimestamp(message.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="bg-secondary border-none"
          />
          <Button onClick={handleSend} size="icon" variant="glow" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
