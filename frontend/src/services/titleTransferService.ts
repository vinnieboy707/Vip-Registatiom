import api from './api';
import { TitleTransfer } from '../types';

export const titleTransferService = {
  async getTitleTransferFees(
    type: 'standard' | 'out_of_state' | 'family',
    fromState?: string,
    toState?: string
  ): Promise<{
    transferFee: number;
    taxes: number;
    totalFee: number;
  }> {
    const response = await api.get('/title-transfers/fees', {
      params: { type, fromState, toState },
    });
    return response.data;
  },

  async createTitleTransfer(data: {
    vin: string;
    transferType: 'standard' | 'out_of_state' | 'family';
    fromOwner: string;
    toOwner: string;
    fromState?: string;
    toState?: string;
    isFamilyTransfer: boolean;
  }): Promise<{
    transfer: TitleTransfer;
    fees: any;
  }> {
    const response = await api.post('/title-transfers', data);
    return response.data;
  },

  async getTitleTransfers(vin: string): Promise<{
    vin: string;
    transfers: TitleTransfer[];
  }> {
    const response = await api.get(`/title-transfers/vehicle/${vin}`);
    return response.data;
  },
};
