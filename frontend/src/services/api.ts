import type {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UserDto,
} from "../types/auth";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserListItem,
} from "../types/users";

// Vite dev server proxies /api to the backend (see vite.config.ts).
// For production builds, set VITE_API_BASE_URL to your API origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const TOKEN_KEY = "cms.token";
const USER_KEY = "cms.user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserDto | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserDto) : null;
}

export function saveAuth(res: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem(USER_KEY, JSON.stringify(res.user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
      else if (data?.title) message = data.title;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const authApi = {
  register: (body: RegisterRequest) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: LoginRequest) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<UserDto>("/api/auth/me", { method: "GET" }),

  changePassword: (body: ChangePasswordRequest) =>
    request<void>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const usersApi = {
  list: () => request<UserListItem[]>("/api/users", { method: "GET" }),

  create: (body: CreateUserRequest) =>
    request<UserListItem>("/api/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateUserRequest) =>
    request<UserListItem>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  remove: (id: number) =>
    request<void>(`/api/users/${id}`, { method: "DELETE" }),
};
