import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { toast } from "sonner";

export type Priority = "high" | "medium" | "low";

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  assignees: string[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  assignees: string[];
  priority: Priority;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export function useRealtimeTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      // fetches the tasks from the database
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*");

      if (tasksError) throw tasksError;

      // fetches the sub tasks of the prime/root task
      const { data: subtasksData, error: subtasksError } = await supabase
        .from("subtasks")
        .select("*");

      if (subtasksError) throw subtasksError;

      const tasksWithSubtasks = (tasksData || []).map((task: any) => ({
        ...task,
        subtasks: (subtasksData || []).filter(
          (st: any) => st.task_id === task.id,
        ),
      }));

      setTasks(tasksWithSubtasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    // Subscribe to realtime changes for tasks
    const tasksChannel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [{ ...payload.new, subtasks: [] }, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? { ...t, ...payload.new } : t,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    // Subscribe to realtime changes for subtasks
    const subtasksChannel = supabase
      .channel("subtasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtasks" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new.task_id
                  ? { ...t, subtasks: [...t.subtasks, payload.new] }
                  : t,
              ),
            );
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new.task_id
                  ? {
                      ...t,
                      subtasks: t.subtasks.map((st) =>
                        st.id === payload.new.id ? payload.new : st,
                      ),
                    }
                  : t,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.map((t) => ({
                ...t,
                subtasks: t.subtasks.filter((st) => st.id !== payload.old.id),
              })),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(subtasksChannel);
    };
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, "id" | "subtasks">) => {
    try {
      const { error } = await supabase.from("tasks").insert({
        title: task.title,
        description: task.description,
        progress: task.progress,
        start_date: task.start_date,
        due_date: task.due_date,
        assignees: task.assignees,
        priority: task.priority,
        created_by: task.created_by,
      });

      if (error) throw error;
      toast.success("Task created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { subtasks, ...taskUpdates } = updates;
      const { error } = await supabase
        .from("tasks")
        .update(taskUpdates)
        .eq("id", taskId);

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      toast.success("Task deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
      throw error;
    }
  };

  const addSubtask = async (taskId: string, title: string) => {
    try {
      const { error } = await supabase.from("subtasks").insert({
        task_id: taskId,
        title,
        priority: "medium",
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to add subtask");
      throw error;
    }
  };

  const updateSubtask = async (
    subtaskId: string,
    updates: Partial<Subtask>,
  ) => {
    try {
      const { error } = await supabase
        .from("subtasks")
        .update(updates)
        .eq("id", subtaskId);

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to update subtask");
      throw error;
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    await updateSubtask(subtaskId, { completed: !completed });
  };

  const removeSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from("subtasks")
        .delete()
        .eq("id", subtaskId);
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to remove subtask");
      throw error;
    }
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    toggleSubtask,
    removeSubtask,
    refetch: fetchTasks,
  };
}
