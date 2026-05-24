export interface UserListItem {
  id: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  // Optional — leave undefined to keep existing password.
  password?: string;
}
