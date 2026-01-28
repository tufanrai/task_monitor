import { create } from 'zustand';

export type UserRole = 'admin' | 'employee' | 'client';
export type Priority = 'high' | 'medium' | 'low';
export type ChatChannel = 'team' | 'client';

export interface Subtask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  dueDate: string;
  assignees: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  startDate: string;
  dueDate: string;
  assignees: string[];
  priority: Priority;
  subtasks: Subtask[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  channel: ChatChannel;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
}

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  selectedTaskId: string | null;
  tasks: Task[];
  messages: Message[];
  chatChannel: ChatChannel;
  users: User[];
  
  // Actions
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  selectTask: (taskId: string | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  sendMessage: (content: string) => void;
  setChatChannel: (channel: ChatChannel) => void;
}

const demoUsers: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@taskflow.io', avatar: 'AJ', role: 'admin' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@taskflow.io', avatar: 'SC', role: 'employee' },
  { id: '3', name: 'Mike Wilson', email: 'mike@taskflow.io', avatar: 'MW', role: 'employee' },
  { id: '4', name: 'Client Corp', email: 'contact@client.com', avatar: 'CC', role: 'client' },
];

const demoTasks: Task[] = [
  {
    id: '1',
    title: 'Design System Overhaul',
    description: 'Complete redesign of the component library with new tokens and variants. Focus on accessibility and dark mode support.',
    progress: 75,
    startDate: '2024-01-15',
    dueDate: '2024-02-15',
    assignees: ['1', '2'],
    priority: 'high',
    subtasks: [
      { id: 's1', title: 'Color token definition', description: 'Define all color tokens for the design system', completed: true, priority: 'high', dueDate: '2024-01-20', assignees: ['1'] },
      { id: 's2', title: 'Typography scale', description: 'Create typography scale with responsive sizes', completed: true, priority: 'medium', dueDate: '2024-01-25', assignees: ['2'] },
      { id: 's3', title: 'Component variants', description: 'Build all component variants following the new tokens', completed: false, priority: 'high', dueDate: '2024-02-05', assignees: ['1', '2'] },
      { id: 's4', title: 'Documentation', description: 'Write comprehensive documentation for all components', completed: false, priority: 'low', dueDate: '2024-02-15', assignees: ['2'] },
    ],
  },
  {
    id: '2',
    title: 'API Integration',
    description: 'Integrate third-party APIs for payment processing and analytics tracking.',
    progress: 40,
    startDate: '2024-01-20',
    dueDate: '2024-02-28',
    assignees: ['3'],
    priority: 'medium',
    subtasks: [
      { id: 's5', title: 'Payment gateway setup', description: 'Integrate Stripe payment gateway', completed: true, priority: 'high', dueDate: '2024-02-01', assignees: ['3'] },
      { id: 's6', title: 'Webhook handlers', description: 'Set up webhook handlers for payment events', completed: false, priority: 'medium', dueDate: '2024-02-15', assignees: ['3'] },
      { id: 's7', title: 'Error handling', description: 'Implement comprehensive error handling and logging', completed: false, priority: 'medium', dueDate: '2024-02-20', assignees: ['3'] },
    ],
  },
  {
    id: '3',
    title: 'User Testing Phase',
    description: 'Conduct user testing sessions with beta testers and gather feedback.',
    progress: 10,
    startDate: '2024-02-01',
    dueDate: '2024-03-01',
    assignees: ['1', '2', '3'],
    priority: 'low',
    subtasks: [
      { id: 's8', title: 'Recruit testers', description: 'Find and recruit 10 beta testers', completed: true, priority: 'high', dueDate: '2024-02-05', assignees: ['1'] },
      { id: 's9', title: 'Prepare test scripts', description: 'Create comprehensive test scripts and scenarios', completed: false, priority: 'medium', dueDate: '2024-02-10', assignees: ['2'] },
    ],
  },
];

const demoMessages: Message[] = [
  { id: 'm1', senderId: '2', senderName: 'Sarah Chen', content: 'Just pushed the new components!', timestamp: '10:30 AM', channel: 'team' },
  { id: 'm2', senderId: '3', senderName: 'Mike Wilson', content: 'Looking great! Testing now.', timestamp: '10:32 AM', channel: 'team' },
  { id: 'm3', senderId: '1', senderName: 'Alex Johnson', content: 'Perfect, lets review at 2pm', timestamp: '10:35 AM', channel: 'team' },
  { id: 'm4', senderId: '4', senderName: 'Client Corp', content: 'When can we expect the demo?', timestamp: '9:00 AM', channel: 'client' },
  { id: 'm5', senderId: '1', senderName: 'Alex Johnson', content: 'We\'ll have it ready by Friday!', timestamp: '9:15 AM', channel: 'client' },
];

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  selectedTaskId: null,
  tasks: demoTasks,
  messages: demoMessages,
  chatChannel: 'team',
  users: demoUsers,

  login: (email, role) => {
    const user: User = {
      id: Date.now().toString(),
      name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email,
      avatar: email.substring(0, 2).toUpperCase(),
      role,
    };
    set({ currentUser: user, isAuthenticated: true, chatChannel: role === 'client' ? 'client' : 'team' });
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, selectedTaskId: null });
  },

  selectTask: (taskId) => {
    set({ selectedTaskId: taskId });
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  },

  addTask: (task) => {
    set((state) => ({ tasks: [...state.tasks, task] }));
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
      selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
    }));
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : task
      ),
    }));
  },

  addSubtask: (taskId, title) => {
    const newSubtask: Subtask = {
      id: `st-${Date.now()}`,
      title,
      description: '',
      completed: false,
      priority: 'medium',
      dueDate: '',
      assignees: [],
    };
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...task.subtasks, newSubtask] }
          : task
      ),
    }));
  },

  updateSubtask: (taskId, subtaskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, ...updates } : st
              ),
            }
          : task
      ),
    }));
  },

  removeSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.filter((st) => st.id !== subtaskId) }
          : task
      ),
    }));
  },

  sendMessage: (content) => {
    const { currentUser, chatChannel } = get();
    if (!currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: chatChannel,
    };
    set((state) => ({ messages: [...state.messages, newMessage] }));
  },

  setChatChannel: (channel) => {
    set({ chatChannel: channel });
  },
}));
