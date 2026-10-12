import { clearToken, getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export type User = { id: string; name: string; email: string };
type AuthResponse = { user: User; token: string };

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
};

type ApiPayload<T> = { success: boolean; data?: T; error?: { message?: string } };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let payload: ApiPayload<T>;
  try {
    payload = await response.json() as ApiPayload<T>;
  } catch {
    throw new Error("The API returned an unreadable response.");
  }

  if (!response.ok || !payload.success || payload.data === undefined) {
    if (response.status === 401 && token) clearToken();
    throw new Error(payload.error?.message || "The request could not be completed.");
  }
  return payload.data;
}

export function registerAccount(input: { name: string; email: string; password: string }) {
  return request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export function loginAccount(input: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function getCurrentUser() {
  return request<{ user: User }>("/auth/me");
}

export function getTasks() {
  return request<{ tasks: Task[] }>("/tasks");
}

export function getTask(taskId: string) {
  return request<{ task: Task }>(`/tasks/${taskId}`);
}

export function createTask(input: TaskInput) {
  return request<{ task: Task }>("/tasks", { method: "POST", body: JSON.stringify(input) });
}

export function updateTask(taskId: string, input: Partial<TaskInput>) {
  return request<{ task: Task }>(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteTask(taskId: string) {
  return request<{ deletedTaskId: string }>(`/tasks/${taskId}`, { method: "DELETE" });
}

export function createCheckoutSession() {
  return request<{ sessionId: string; url: string }>("/payments/create-checkout-session", { method: "POST" });
}

export function getCheckoutSession(sessionId: string) {
  return request<{ session: { id: string; status: string | null; paymentStatus: string; customerEmail: string | null } }>(
    `/payments/sessions/${encodeURIComponent(sessionId)}`,
  );
}
