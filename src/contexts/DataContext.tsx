import { createContext, useContext, useState, ReactNode } from 'react';
import { useRealtimeTasks, Task, Subtask, Priority } from '@/hooks/useRealtimeTasks';
import { useRealtimeMessages, Message, ChatChannel } from '@/hooks/useRealtimeMessages';
import { useRealtimeUsers, UserWithRole } from '@/hooks/useRealtimeUsers';

interface DataContextType {
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'subtasks'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (subtaskId: string, updates: Partial<Subtask>) => Promise<void>;
  toggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>;
  removeSubtask: (subtaskId: string) => Promise<void>;
  
  // Messages
  messages: Message[];
  messagesLoading: boolean;
  sendMessage: (content: string, channel: ChatChannel, senderId: string) => Promise<void>;
  
  // Users
  users: UserWithRole[];
  usersLoading: boolean;
  
  // UI State
  selectedTaskId: string | null;
  selectTask: (taskId: string | null) => void;
  chatChannel: ChatChannel;
  setChatChannel: (channel: ChatChannel) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [chatChannel, setChatChannel] = useState<ChatChannel>('team');
  
  const {
    tasks,
    loading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    removeSubtask,
  } = useRealtimeTasks();
  
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
  } = useRealtimeMessages();
  
  const {
    users,
    loading: usersLoading,
  } = useRealtimeUsers();

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  return (
    <DataContext.Provider
      value={{
        tasks,
        tasksLoading,
        addTask,
        updateTask,
        deleteTask: handleDeleteTask,
        addSubtask,
        updateSubtask,
        toggleSubtask,
        removeSubtask,
        messages,
        messagesLoading,
        sendMessage,
        users,
        usersLoading,
        selectedTaskId,
        selectTask: setSelectedTaskId,
        chatChannel,
        setChatChannel,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}

export type { Task, Subtask, Priority, Message, ChatChannel, UserWithRole };
