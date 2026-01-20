export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'agent' | 'customer';
  phone?: string;
}

export interface Vehicle {
  id: number;
  vin: string;
  license_plate?: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  current_owner_name?: string;
  current_owner_address?: string;
  registration_status: 'active' | 'inactive' | 'expired' | 'suspended';
  registration_expiry?: string;
  is_stolen: boolean;
}

export interface RegistrationRecord {
  id: number;
  vehicle_id: number;
  registration_type: 'new' | 'renewal' | 'transfer';
  registration_date: string;
  expiry_date: string;
  base_fee: number;
  transfer_fee: number;
  total_fee: number;
  payment_status: 'pending' | 'paid' | 'failed';
  location_filed?: string;
  notes?: string;
}

export interface TitleTransfer {
  id: number;
  vehicle_id: number;
  transfer_type: 'standard' | 'out_of_state' | 'family';
  from_owner: string;
  to_owner: string;
  from_state?: string;
  to_state?: string;
  transfer_date: string;
  transfer_fee: number;
  is_family_transfer: boolean;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
}

export interface OwnershipHistory {
  id: number;
  vehicle_id: number;
  owner_name: string;
  owner_address?: string;
  start_date: string;
  end_date?: string;
}

export interface Fee {
  id: number;
  fee_type: string;
  description?: string;
  amount: number;
  is_active: boolean;
}
