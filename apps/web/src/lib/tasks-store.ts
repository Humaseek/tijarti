"use client";

/**
 * Tasks store — localStorage-backed simple to-do list tied to store entities.
 */

import { useEffect, useState } from "react";

export type TaskStatus = "pending" | "done";
export type TaskLinkKind = "customer" | "supplier" | "product" | "invoice" | "check" | "debt" | "none";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  due_date?: string | null;
  status: TaskStatus;
  link?: { kind: TaskLinkKind; id: string; label: string };
  created_at: string;
  completed_at?: string;
}

const KEY = "tj_tasks_v1";

function load(): Task[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

function save(list: Task[]) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(load());
  }, []);

  const add = (t: Omit<Task, "id" | "created_at" | "status"> & { status?: TaskStatus }) => {
    const n: Task = {
      ...t,
      id: `task_${Date.now()}`,
      status: t.status ?? "pending",
      created_at: new Date().toISOString(),
    };
    const next = [n, ...tasks];
    setTasks(next);
    save(next);
    return n;
  };

  const toggle = (id: string) => {
    const next = tasks.map((t) =>
      t.id === id
        ? { ...t, status: t.status === "pending" ? ("done" as const) : ("pending" as const), completed_at: t.status === "pending" ? new Date().toISOString() : undefined }
        : t
    );
    setTasks(next);
    save(next);
  };

  const remove = (id: string) => {
    const next = tasks.filter((t) => t.id !== id);
    setTasks(next);
    save(next);
  };

  const update = (id: string, patch: Partial<Task>) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTasks(next);
    save(next);
  };

  return { tasks, add, toggle, remove, update };
}
