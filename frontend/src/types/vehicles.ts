export type VehicleType = "tipper" | "jcb" | "nissan";
export type VehicleOwnership = "owned" | "partnered";

export interface VehicleListItem {
  id: number;
  name: string;
  numberPlate: string;
  type: VehicleType;
  ownership: VehicleOwnership;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
}

export interface CreateVehicleRequest {
  name: string;
  numberPlate: string;
  type: VehicleType;
  ownership: VehicleOwnership;
}

export interface UpdateVehicleRequest {
  name: string;
  numberPlate: string;
  type: VehicleType;
  ownership: VehicleOwnership;
}
