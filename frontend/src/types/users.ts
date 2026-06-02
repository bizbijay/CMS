export type UserType = "admin" | "driver";

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  type: UserType;
  vehicleId?: number | null;
  assignedVehicleName?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
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
  type: UserType;
  vehicleId?: number | null;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  type: UserType;
  vehicleId?: number | null;
  password?: string;
}
