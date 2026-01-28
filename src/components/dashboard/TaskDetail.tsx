import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Flag, 
  Plus, 
  Trash2, 
  Save,
  Check
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext, Priority, Task } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import SubtaskItem from './SubtaskItem';

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-priority-high' },
  { value: 'medium', label: 'Medium', color: 'bg-priority-medium' },
  { value: 'low', label: 'Low', color: 'bg-priority-low' },
];

interface TaskDetailProps {
  taskId: string;
  onDelete: () => void;
}

export default function TaskDetail({ taskId, onDelete }: TaskDetailProps) {
  const { profile } = useAuthContext();
  const { tasks, users, updateTask, deleteTask, addSubtask } = useDataContext();
  const [newSubtask, setNewSubtask] = useState('');
  
  const task = tasks.find(t => t.id === taskId);
  const isReadOnly = profile?.role === 'client';
  
  if (!task) return null;

  const handleAddSubtask = async () => {
    if (newSubtask.trim() && taskId) {
      await addSubtask(taskId, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleUpdateTask = async (updates: Partial<Task>) => {
    await updateTask(taskId, updates);
  };

  const handleDeleteTask = async () => {
    await deleteTask(taskId);
    onDelete();
  };

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;

  return (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 p-6 overflow-y-auto scrollbar-thin"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Input
            value={task.title}
            onChange={(e) => handleUpdateTask({ title: e.target.value })}
            disabled={isReadOnly}
            className="text-2xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0 disabled:opacity-100"
            placeholder="Task title"
          />
          <Textarea
            value={task.description || ''}
            onChange={(e) => handleUpdateTask({ description: e.target.value })}
            disabled={isReadOnly}
            className="bg-card/50 border-border resize-none min-h-[100px] disabled:opacity-100"
            placeholder="Add a description..."
          />
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Progress */}
          <div className="col-span-2 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-semibold text-primary">{task.progress}%</span>
            </div>
            <Slider
              value={[task.progress]}
              onValueChange={([value]) => handleUpdateTask({ progress: value })}
              disabled={isReadOnly}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.bg-primary]:bg-primary"
            />
          </div>

          {/* Start Date */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Start Date</span>
            </div>
            <Input
              type="date"
              value={task.start_date || ''}
              onChange={(e) => handleUpdateTask({ start_date: e.target.value })}
              disabled={isReadOnly}
              className={`bg-secondary border-none disabled:opacity-100 ${isReadOnly ? 'text-white' : ''}`}
            />
          </div>

          {/* Due Date */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Due Date</span>
            </div>
            <Input
              type="date"
              value={task.due_date || ''}
              onChange={(e) => handleUpdateTask({ due_date: e.target.value })}
              disabled={isReadOnly}
              className={`bg-secondary border-none disabled:opacity-100 ${isReadOnly ? 'text-white' : ''}`}
            />
          </div>

          {/* Assignees */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Assignees</span>
            </div>
            <div className="flex -space-x-2">
              {(task.assignees || []).map((userId) => {
                const user = users.find(u => u.user_id === userId);
                return (
                  <div
                    key={userId}
                    className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                    title={user?.name}
                  >
                    {user?.avatar || user?.name?.substring(0, 2).toUpperCase()}
                  </div>
                );
              })}
              {(!task.assignees || task.assignees.length === 0) && (
                <span className="text-sm text-muted-foreground">No assignees</span>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Priority</span>
            </div>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => !isReadOnly && handleUpdateTask({ priority: p.value })}
                  disabled={isReadOnly}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    task.priority === p.value
                      ? `${p.color} text-primary-foreground`
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  } disabled:cursor-default`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Subtasks</span>
              <span className="px-2 py-0.5 text-xs bg-secondary rounded-md text-muted-foreground">
                {completedSubtasks}/{task.subtasks.length}
              </span>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  taskId={task.id}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </AnimatePresence>

          {!isReadOnly && (
            <div className="flex gap-2 mt-4">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
                className="bg-secondary border-none"
              />
              <Button onClick={handleAddSubtask} size="icon" variant="secondary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Task
            </Button>
            <Button variant="glow" className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
