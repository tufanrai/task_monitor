import { motion } from 'framer-motion';
import { Layers, LayoutDashboard, CheckSquare, LogOut, Plus, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const priorityColors = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

interface SidebarProps {
  onTaskSelect?: () => void;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

export default function Sidebar({ onTaskSelect, selectedTaskId, onSelectTask }: SidebarProps) {
  const { profile, signOut } = useAuthContext();
  const { tasks, tasksLoading, addTask } = useDataContext();
  const navigate = useNavigate();
  const isClient = profile?.role === 'client';

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddTask = async () => {
    if (isClient) return;
    try {
      await addTask({
        title: 'New Task',
        description: 'Add description here...',
        progress: 0,
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assignees: [],
        priority: 'medium',
        created_by: profile?.user_id || null,
      });
      onTaskSelect?.();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSelectTask = (taskId: string) => {
    onSelectTask(taskId);
    onTaskSelect?.();
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-72 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo - Hidden on mobile (shown in header) */}
      <div className="p-5 border-b border-sidebar-border hidden lg:block">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 glow-primary">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-gradient">TaskFlow</span>
        </div>
      </div>

      {/* Mobile spacer for sheet header */}
      <div className="h-4 lg:hidden" />

      {/* Navigation */}
      <nav className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
      </nav>

      {/* Tasks Section */}
      <div className="flex-1 flex flex-col min-h-0 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
            <span className="px-1.5 py-0.5 text-xs bg-secondary rounded-md">{tasks.length}</span>
          </div>
          {!isClient && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
              onClick={handleAddTask}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            tasks.map((task) => (
              <motion.button
                key={task.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectTask(task.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                  selectedTaskId === task.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-sidebar-accent border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${priorityColors[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedTaskId === task.id ? 'text-primary' : 'text-foreground'
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
            {profile?.avatar || profile?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
