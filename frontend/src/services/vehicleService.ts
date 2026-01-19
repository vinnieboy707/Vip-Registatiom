import api from './api';
import { Vehicle, RegistrationRecord, OwnershipHistory } from '../types';

export const vehicleService = {
  async getVehicleByVIN(vin: string, refresh = false): Promise<{
    vehicle: Vehicle;
    ownershipHistory: OwnershipHistory[];
  }> {
    const response = await api.get(`/vehicles/vin/${vin}`, {
      params: { refresh },
    });
    return response.data;
  },

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const response = await api.get('/vehicles/search', {
      params: { q: query },
    });
    return response.data.vehicles;
  },

  async getRegistrationStatus(vin: string): Promise<{
    vin: string;
    status: string;
    expiry?: string;
    licensePlate?: string;
    records: RegistrationRecord[];
  }> {
    const response = await api.get(`/vehicles/vin/${vin}/registration-status`);
    return response.data;
  },

  async getRegistrationFees(
    vin: string,
    type: 'new' | 'renewal' | 'transfer'
  ): Promise<{
    baseFee: number;
    taxes: number;
    totalFee: number;
  }> {
    const response = await api.get(`/vehicles/vin/${vin}/registration-fees`, {
      params: { type },
    });
    return response.data;
  },

  async createRegistration(data: {
    vin: string;
    registrationType: 'new' | 'renewal' | 'transfer';
    locationFiled?: string;
    notes?: string;
  }): Promise<RegistrationRecord> {
    const response = await api.post('/vehicles/registration', data);
    return response.data.registration;
  },

  async getOwnershipHistory(vin: string): Promise<{
    vin: string;
    currentOwner?: string;
    history: OwnershipHistory[];
  }> {
    const response = await api.get(`/vehicles/vin/${vin}/ownership-history`);
    return response.data;
  },
};
