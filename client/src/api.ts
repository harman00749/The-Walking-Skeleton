import { clearToken, getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type User = { id: string; name: string; email: string };
type AuthResponse = { user: User; token: string };
export type Task = { id: string; title: string; status: string; priority: string };

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

  const payload = await response.json() as { success: boolean; data?: T; error?: { message?: string } };
  if (!response.ok || !payload.success || !payload.data) {
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
