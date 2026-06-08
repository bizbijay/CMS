export type VehicleType = "tipper" | "jcb" | "nissan";

export interface VehicleListItem {
  id: number;
  name: string;
  numberPlate: string;
  type: VehicleType;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
}

export interface CreateVehicleRequest {
  name: string;
  numberPlate: string;
  type: VehicleType;
}

export interface UpdateVehicleRequest {
  name: string;
  numberPlate: string;
  type: VehicleType;
}
