export type Role = "admin" | "user";
export type ProfileStatus = "pending" | "approved" | "rejected";
export type ComponentStatus = "in_stock" | "assigned" | "retired";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: ProfileStatus;
  created_at: string;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  serial_number: string | null;
  status: ComponentStatus;
  current_owner_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnershipTransfer {
  id: string;
  component_id: string;
  from_owner_id: string | null;
  to_owner_id: string | null;
  transferred_by: string | null;
  notes: string | null;
  transferred_at: string;
}
