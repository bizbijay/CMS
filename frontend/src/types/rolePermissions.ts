export interface RolePermissions {
  roleId: number;
  roleName: string;
  permissionIds: number[];
}

export interface SetRolePermissionsRequest {
  permissionIds: number[];
}
