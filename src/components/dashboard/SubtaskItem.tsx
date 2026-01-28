import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Users, 
  Flag, 
  X,
  FileText
} from 'lucide-react';
import { useDataContext, Subtask, Priority } from '@/contexts/DataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SubtaskItemProps {
  subtask: Subtask;
  taskId: string;
  isReadOnly?: boolean;
}

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-priority-high' },
  { value: 'medium', label: 'Medium', color: 'bg-priority-medium' },
  { value: 'low', label: 'Low', color: 'bg-priority-low' },
];

export default function SubtaskItem({ subtask, taskId, isReadOnly }: SubtaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toggleSubtask, updateSubtask, removeSubtask, users } = useDataContext();

  const handleAssigneeToggle = async (userId: string) => {
    if (isReadOnly) return;
    const newAssignees = (subtask.assignees || []).includes(userId)
      ? (subtask.assignees || []).filter(id => id !== userId)
      : [...(subtask.assignees || []), userId];
    await updateSubtask(subtask.id, { assignees: newAssignees });
  };

  const handleToggle = async () => {
    if (!isReadOnly) {
      await toggleSubtask(subtask.id, subtask.completed);
    }
  };

  const handleRemove = async () => {
    await removeSubtask(subtask.id);
  };

  const handleUpdateSubtask = async (updates: Partial<Subtask>) => {
    await updateSubtask(subtask.id, updates);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-border bg-secondary/30 overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex items-center gap-3 p-3 group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-secondary rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        <Checkbox
          checked={subtask.completed}
          onCheckedChange={handleToggle}
          disabled={isReadOnly}
          className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        
        <Input
          value={subtask.title}
          onChange={(e) => handleUpdateSubtask({ title: e.target.value })}
          disabled={isReadOnly}
          className={`flex-1 bg-transparent border-none p-0 h-auto text-sm focus-visible:ring-0 disabled:opacity-100 ${
            subtask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
        />

        {/* Quick Info Badges */}
        <div className="flex items-center gap-2">
          {subtask.priority && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              priorities.find(p => p.value === subtask.priority)?.color
            } text-primary-foreground`}>
              {subtask.priority.charAt(0).toUpperCase()}
            </span>
          )}
          {subtask.due_date && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(subtask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {(subtask.assignees || []).length > 0 && (
            <div className="flex -space-x-1">
              {(subtask.assignees || []).slice(0, 2).map((userId) => {
                const user = users.find(u => u.user_id === userId);
                return (
                  <div
                    key={userId}
                    className="w-5 h-5 rounded-full bg-primary/20 border border-card flex items-center justify-center text-[8px] font-medium text-primary"
                    title={user?.name}
                  >
                    {user?.avatar || user?.name?.substring(0, 2).toUpperCase()}
                  </div>
                );
              })}
              {(subtask.assignees || []).length > 2 && (
                <div className="w-5 h-5 rounded-full bg-secondary border border-card flex items-center justify-center text-[8px] text-muted-foreground">
                  +{(subtask.assignees || []).length - 2}
                </div>
              )}
            </div>
          )}
        </div>

        {!isReadOnly && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  <span>Description</span>
                </div>
                <Textarea
                  value={subtask.description || ''}
                  onChange={(e) => handleUpdateSubtask({ description: e.target.value })}
                  disabled={isReadOnly}
                  className="bg-card/50 border-border resize-none min-h-[60px] text-sm disabled:opacity-100"
                  placeholder="Add a description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Due Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Due Date</span>
                  </div>
                  <Input
                    type="date"
                    value={subtask.due_date || ''}
                    onChange={(e) => handleUpdateSubtask({ due_date: e.target.value })}
                    disabled={isReadOnly}
                    className="bg-card border-border text-sm disabled:opacity-100"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Flag className="w-3 h-3" />
                    <span>Priority</span>
                  </div>
                  <div className="flex gap-1">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => !isReadOnly && handleUpdateSubtask({ priority: p.value })}
                        disabled={isReadOnly}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                          subtask.priority === p.value
                            ? `${p.color} text-primary-foreground`
                            : 'bg-card text-muted-foreground hover:bg-card/80'
                        } disabled:cursor-default`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignees */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>Assignees</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {users.filter(u => u.role !== 'client').map((user) => (
                      <button
                        key={user.user_id}
                        onClick={() => handleAssigneeToggle(user.user_id)}
                        disabled={isReadOnly}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium transition-all ${
                          (subtask.assignees || []).includes(user.user_id)
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                            : 'bg-card text-muted-foreground hover:bg-card/80'
                        } disabled:cursor-default`}
                        title={user.name}
                      >
                        {user.avatar || user.name?.substring(0, 2).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
