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
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleListItem,
} from "../types/vehicles";
import type { CreateMaterialRequest, UpdateMaterialRequest, MaterialListItem } from "../types/materials";
import type { CreateFuelRequest, UpdateFuelRequest, FuelListItem } from "../types/fuels";
import type { CreateRoleRequest, UpdateRoleRequest, RoleListItem } from "../types/roles";
import type { CreatePermissionRequest, UpdatePermissionRequest, PermissionListItem } from "../types/permissions";
import type { RolePermissions, SetRolePermissionsRequest } from "../types/rolePermissions";
import type { CreateFuelLogRequest, UpdateFuelLogRequest, FuelLogListItem } from "../types/fuelLog";
import type { CreateTransportationRequest, UpdateTransportationRequest, TransportationListItem } from "../types/transportation";
import type { CreateDozerLogRequest, UpdateDozerLogRequest, DozerLogListItem } from "../types/dozerLog";
import type { CreateVendorRequest, UpdateVendorRequest, VendorListItem } from "../types/vendors";
import type { CreateProjectRequest, UpdateProjectRequest, ProjectListItem, ProjectExpenseSummary } from "../types/projects";
import type { CreateSalarySetupRequest, UpdateSalarySetupRequest, SalarySetupListItem } from "../types/salarySetup";
import type { MonthlySalaryRow, SaveMonthlySalaryRequest } from "../types/monthlySalary";
import type { SalaryPaymentListItem, CreateSalaryPaymentRequest, UpdateSalaryPaymentRequest } from "../types/salaryPayment";
import type { SalaryDetailDto, SalaryBreakdownDto } from "../types/salaryDetail";
import type { ProjectExpenseListItem, CreateProjectExpenseRequest, UpdateProjectExpenseRequest } from "../types/projectExpenses";
import type { ProjectWageListItem, CreateProjectWageRequest, UpdateProjectWageRequest } from "../types/projectWages";
import type { GovernmentOfficeListItem, CreateGovernmentOfficeRequest, UpdateGovernmentOfficeRequest } from "../types/governmentOffice";
import type { ProjectCommissionListItem, CreateProjectCommissionRequest, UpdateProjectCommissionRequest } from "../types/projectCommissions";

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
    if (res.status === 401) {
      const hadToken = !!getToken();
      clearAuth();
      if (hadToken) {
        window.dispatchEvent(new CustomEvent("cms:unauthorized"));
        return undefined as T;
      }
      throw new Error("Invalid username or password.");
    }

    if (res.status === 403) {
      throw new Error("You don't have permission to perform this action.");
    }

    let message = `Request failed (${res.status})`;
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

  myPermissions: () =>
    request<string[]>("/api/auth/my-permissions", { method: "GET" }),

  changePassword: (body: ChangePasswordRequest) =>
    request<void>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const usersApi = {
  list: () => request<UserListItem[]>("/api/users", { method: "GET" }),

  drivers: () => request<UserListItem[]>("/api/users/drivers", { method: "GET" }),
  dozerDrivers: () => request<UserListItem[]>("/api/users/dozer-drivers", { method: "GET" }),

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

export const fuelLogsApi = {
  list: () => request<FuelLogListItem[]>("/api/fuellogs", { method: "GET" }),
  create: (body: CreateFuelLogRequest) =>
    request<FuelLogListItem>("/api/fuellogs", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateFuelLogRequest) =>
    request<FuelLogListItem>(`/api/fuellogs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/fuellogs/${id}`, { method: "DELETE" }),
};

export const rolesApi = {
  list: () => request<RoleListItem[]>("/api/roles", { method: "GET" }),
  create: (body: CreateRoleRequest) =>
    request<RoleListItem>("/api/roles", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateRoleRequest) =>
    request<RoleListItem>(`/api/roles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/roles/${id}`, { method: "DELETE" }),
};

export const permissionsApi = {
  list: () => request<PermissionListItem[]>("/api/permissions", { method: "GET" }),
  create: (body: CreatePermissionRequest) =>
    request<PermissionListItem>("/api/permissions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdatePermissionRequest) =>
    request<PermissionListItem>(`/api/permissions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/permissions/${id}`, { method: "DELETE" }),
};

export const rolePermissionsApi = {
  getByRole: (roleId: number) =>
    request<RolePermissions>(`/api/role-permissions/${roleId}`, { method: "GET" }),
  set: (roleId: number, body: SetRolePermissionsRequest) =>
    request<RolePermissions>(`/api/role-permissions/${roleId}`, { method: "PUT", body: JSON.stringify(body) }),
};

export const fuelsApi = {
  list: () => request<FuelListItem[]>("/api/fuels", { method: "GET" }),
  create: (body: CreateFuelRequest) =>
    request<FuelListItem>("/api/fuels", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateFuelRequest) =>
    request<FuelListItem>(`/api/fuels/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/fuels/${id}`, { method: "DELETE" }),
};

export const transportationsApi = {
  list: () => request<TransportationListItem[]>("/api/transportations", { method: "GET" }),
  listByProject: (projectId: number) =>
    request<TransportationListItem[]>(`/api/transportations?projectId=${projectId}`, { method: "GET" }),
  create: (body: CreateTransportationRequest) =>
    request<TransportationListItem>("/api/transportations", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateTransportationRequest) =>
    request<TransportationListItem>(`/api/transportations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/transportations/${id}`, { method: "DELETE" }),
};

export const vendorsApi = {
  list: () => request<VendorListItem[]>("/api/vendors", { method: "GET" }),
  create: (body: CreateVendorRequest) =>
    request<VendorListItem>("/api/vendors", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateVendorRequest) =>
    request<VendorListItem>(`/api/vendors/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/vendors/${id}`, { method: "DELETE" }),
};

export const projectsApi = {
  list: () => request<ProjectListItem[]>("/api/projects", { method: "GET" }),
  create: (body: CreateProjectRequest) =>
    request<ProjectListItem>("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateProjectRequest) =>
    request<ProjectListItem>(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  expenseSummary: () => request<ProjectExpenseSummary[]>("/api/projects/expense-summary", { method: "GET" }),
};

export const monthlySalaryApi = {
  getForMonth: (month: number, year: number) =>
    request<MonthlySalaryRow[]>(`/api/monthly-salary?month=${month}&year=${year}`, { method: "GET" }),
  save: (body: SaveMonthlySalaryRequest) =>
    request<MonthlySalaryRow>("/api/monthly-salary", { method: "POST", body: JSON.stringify(body) }),
  verifyAll: (month: number, year: number) =>
    request<MonthlySalaryRow[]>("/api/monthly-salary/verify-all", { method: "POST", body: JSON.stringify({ month, year }) }),
};

export const salaryPaymentApi = {
  list: () =>
    request<SalaryPaymentListItem[]>("/api/salary-payments", { method: "GET" }),
  create: (body: CreateSalaryPaymentRequest) =>
    request<SalaryPaymentListItem>("/api/salary-payments", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateSalaryPaymentRequest) =>
    request<SalaryPaymentListItem>(`/api/salary-payments/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    request<void>(`/api/salary-payments/${id}`, { method: "DELETE" }),
};

export const salaryDetailApi = {
  list: () => request<SalaryDetailDto[]>("/api/salary-details", { method: "GET" }),
  breakdown: (userId: number) => request<SalaryBreakdownDto>(`/api/salary-details/${userId}/breakdown`, { method: "GET" }),
};

export const salarySetupApi = {
  list: () => request<SalarySetupListItem[]>("/api/salary-setup", { method: "GET" }),
  create: (body: CreateSalarySetupRequest) =>
    request<SalarySetupListItem>("/api/salary-setup", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateSalarySetupRequest) =>
    request<SalarySetupListItem>(`/api/salary-setup/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/salary-setup/${id}`, { method: "DELETE" }),
};

export const dozerLogsApi = {
  list: () => request<DozerLogListItem[]>("/api/dozerlogs", { method: "GET" }),
  create: (body: CreateDozerLogRequest) =>
    request<DozerLogListItem>("/api/dozerlogs", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateDozerLogRequest) =>
    request<DozerLogListItem>(`/api/dozerlogs/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) => request<void>(`/api/dozerlogs/${id}`, { method: "DELETE" }),
};

export const materialsApi = {
  list: () => request<MaterialListItem[]>("/api/materials", { method: "GET" }),

  create: (body: CreateMaterialRequest) =>
    request<MaterialListItem>("/api/materials", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateMaterialRequest) =>
    request<MaterialListItem>(`/api/materials/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  remove: (id: number) =>
    request<void>(`/api/materials/${id}`, { method: "DELETE" }),
};

export const vehiclesApi = {
  list: () => request<VehicleListItem[]>("/api/vehicles", { method: "GET" }),

  create: (body: CreateVehicleRequest) =>
    request<VehicleListItem>("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateVehicleRequest) =>
    request<VehicleListItem>(`/api/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  remove: (id: number) =>
    request<void>(`/api/vehicles/${id}`, { method: "DELETE" }),
};

export const fuelPricesApi = {
  getCurrentPrice: (fuelType: string) =>
    request<{ price: number }>(`/api/fuel-prices/current?fuelType=${encodeURIComponent(fuelType)}`),
};

export const projectExpensesApi = {
  listByProject: (projectId: number) =>
    request<ProjectExpenseListItem[]>(`/api/project-expenses?projectId=${projectId}`, { method: "GET" }),
  create: (body: CreateProjectExpenseRequest) =>
    request<ProjectExpenseListItem>("/api/project-expenses", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateProjectExpenseRequest) =>
    request<ProjectExpenseListItem>(`/api/project-expenses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    request<void>(`/api/project-expenses/${id}`, { method: "DELETE" }),
};

export const projectWagesApi = {
  listByProject: (projectId: number) =>
    request<ProjectWageListItem[]>(`/api/project-wages?projectId=${projectId}`, { method: "GET" }),
  create: (body: CreateProjectWageRequest) =>
    request<ProjectWageListItem>("/api/project-wages", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateProjectWageRequest) =>
    request<ProjectWageListItem>(`/api/project-wages/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    request<void>(`/api/project-wages/${id}`, { method: "DELETE" }),
};

export const governmentOfficesApi = {
  list: () => request<GovernmentOfficeListItem[]>("/api/government-offices", { method: "GET" }),
  create: (body: CreateGovernmentOfficeRequest) =>
    request<GovernmentOfficeListItem>("/api/government-offices", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateGovernmentOfficeRequest) =>
    request<GovernmentOfficeListItem>(`/api/government-offices/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    request<void>(`/api/government-offices/${id}`, { method: "DELETE" }),
};

export const projectCommissionsApi = {
  listByProject: (projectId: number) =>
    request<ProjectCommissionListItem[]>(`/api/project-commissions?projectId=${projectId}`, { method: "GET" }),
  create: (body: CreateProjectCommissionRequest) =>
    request<ProjectCommissionListItem>("/api/project-commissions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateProjectCommissionRequest) =>
    request<ProjectCommissionListItem>(`/api/project-commissions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: number) =>
    request<void>(`/api/project-commissions/${id}`, { method: "DELETE" }),
};
