import axios from 'axios';
import { config } from '../config/config';
import logger from '../config/logger';
import { DMVVehicleData } from '../types';

/**
 * DMV API Service - Integrates with real DMV data sources
 * Uses NHTSA (National Highway Traffic Safety Administration) API for vehicle data
 * and state DMV APIs where available
 */
class DMVService {
  private baseUrl: string;
  private apiKey: string;
  private nhtsaBaseUrl: string;

  constructor() {
    this.baseUrl = config.dmv.baseUrl;
    this.apiKey = config.dmv.apiKey;
    this.nhtsaBaseUrl = 'https://vpic.nhtsa.dot.gov/api';
  }

  /**
   * Get vehicle information by VIN using NHTSA database
   */
  async getVehicleByVIN(vin: string): Promise<DMVVehicleData> {
    try {
      logger.info(`Fetching vehicle data for VIN: ${vin}`);

      if (!this.validateVIN(vin)) {
        throw new Error('Invalid VIN format');
      }

      // Use NHTSA VIN Decoder API (free, no API key required)
      const nhtsaResponse = await axios.get(
        `${this.nhtsaBaseUrl}/vehicles/DecodeVinValues/${vin}?format=json`,
        {
          timeout: 10000,
        }
      );

      const nhtsaData = nhtsaResponse.data.Results[0];

      if (!nhtsaData || nhtsaData.ErrorCode !== '0') {
        throw new Error('Vehicle not found in NHTSA database');
      }

      // If state DMV API is configured, fetch additional data
      let registrationData: any = {};
      if (this.apiKey && this.baseUrl) {
        try {
          const dmvResponse = await axios.get(`${this.baseUrl}/vehicles/${vin}`, {
            headers: { 'X-API-Key': this.apiKey },
            timeout: 10000,
          });
          registrationData = dmvResponse.data;
        } catch (error) {
          logger.warn('State DMV API not available, using NHTSA data only');
        }
      }

      // Combine NHTSA data with state DMV data
      return {
        vin,
        make: nhtsaData.Make || 'Unknown',
        model: nhtsaData.Model || 'Unknown',
        year: parseInt(nhtsaData.ModelYear) || new Date().getFullYear(),
        color: registrationData.color || undefined,
        registration_status: registrationData.registration_status || 'inactive',
        registration_expiry: registrationData.registration_expiry || undefined,
        owner_name: registrationData.owner_name || undefined,
        owner_address: registrationData.owner_address || undefined,
        is_stolen: registrationData.is_stolen || false,
        previous_owners: registrationData.previous_owners || [],
        title_info: registrationData.title_info || {
          title_number: '',
          issue_date: '',
        },
      };
    } catch (error: any) {
      logger.error('Error fetching vehicle from DMV:', error);
      throw new Error(error.message || 'Failed to fetch vehicle data from DMV');
    }
  }


  /**
   * Get vehicle information by license plate using state DMV API
   */
  async getVehicleByPlate(plate: string, state: string): Promise<DMVVehicleData> {
    try {
      logger.info(`Fetching vehicle data for plate: ${plate}, state: ${state}`);

      if (!this.apiKey || !this.baseUrl) {
        throw new Error('State DMV API not configured');
      }

      const response = await axios.get(`${this.baseUrl}/vehicles/plate/${state}/${plate}`, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error fetching vehicle by plate:', error);
      throw new Error(error.message || 'Failed to fetch vehicle data by plate');
    }
  }

  /**
   * Check if vehicle is reported stolen using NCIC/state database
   */
  async checkStolenStatus(vin: string): Promise<boolean> {
    try {
      logger.info(`Checking stolen status for VIN: ${vin}`);

      if (!this.apiKey || !this.baseUrl) {
        logger.warn('Stolen vehicle check not available - DMV API not configured');
        return false;
      }

      const response = await axios.get(`${this.baseUrl}/vehicles/${vin}/stolen-status`, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 5000,
      });

      return response.data.is_stolen || false;
    } catch (error) {
      logger.error('Error checking stolen status:', error);
      return false;
    }
  }

  /**
   * Get registration fees for a vehicle from state DMV
   */
  async getRegistrationFees(
    vin: string,
    registrationType: 'new' | 'renewal' | 'transfer'
  ): Promise<{ baseFee: number; taxes: number; totalFee: number }> {
    try {
      logger.info(`Calculating registration fees for VIN: ${vin}, type: ${registrationType}`);

      // Try to get state-specific fees from DMV API
      if (this.apiKey && this.baseUrl) {
        try {
          const response = await axios.get(
            `${this.baseUrl}/fees/registration/${registrationType}`,
            {
              headers: { 'X-API-Key': this.apiKey },
              params: { vin },
              timeout: 5000,
            }
          );

          return response.data;
        } catch (error) {
          logger.warn('State fee API not available, using standard rates');
        }
      }

      // Fallback to standard state rates (typical California fees)
      const baseFees = {
        new: 150.0,
        renewal: 75.0,
        transfer: 95.0,
      };

      const baseFee = baseFees[registrationType];
      const taxes = baseFee * 0.0725; // 7.25% standard sales tax
      const totalFee = baseFee + taxes;

      return { baseFee, taxes, totalFee };
    } catch (error) {
      logger.error('Error calculating fees:', error);
      throw new Error('Failed to calculate registration fees');
    }
  }

  /**
   * Get title transfer fees from state DMV
   */
  async getTitleTransferFees(
    transferType: 'standard' | 'out_of_state' | 'family',
    fromState?: string,
    toState?: string
  ): Promise<{ transferFee: number; taxes: number; totalFee: number }> {
    try {
      logger.info(`Calculating title transfer fees for type: ${transferType}`);

      // Try to get state-specific fees from DMV API
      if (this.apiKey && this.baseUrl) {
        try {
          const response = await axios.get(
            `${this.baseUrl}/fees/title-transfer/${transferType}`,
            {
              headers: { 'X-API-Key': this.apiKey },
              params: { fromState, toState },
              timeout: 5000,
            }
          );

          return response.data;
        } catch (error) {
          logger.warn('State transfer fee API not available, using standard rates');
        }
      }

      // Fallback to standard state rates (typical fees)
      const baseFees = {
        standard: 95.0,
        out_of_state: 125.0,
        family: 25.0,
      };

      let transferFee = baseFees[transferType];

      // Add extra fees for out-of-state transfers
      if (transferType === 'out_of_state' && fromState && toState) {
        transferFee += 30.0; // Additional processing fee
      }

      const taxes = transferFee * 0.08; // 8% tax
      const totalFee = transferFee + taxes;

      return { transferFee, taxes, totalFee };
    } catch (error) {
      logger.error('Error calculating transfer fees:', error);
      throw new Error('Failed to calculate title transfer fees');
    }
  }

  /**
   * Validate VIN format (17 characters, no I, O, Q) with check digit validation
   */
  validateVIN(vin: string): boolean {
    // Check basic format (17 characters, no I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    if (!vinRegex.test(vin)) {
      return false;
    }

    // Validate check digit (9th position)
    return this.validateVINCheckDigit(vin);
  }

  /**
   * Validate VIN check digit (9th position) according to NHTSA standard
   */
  private validateVINCheckDigit(vin: string): boolean {
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const transliteration: { [key: string]: number } = {
      A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
      J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
      S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
      '6': 6, '7': 7, '8': 8, '9': 9
    };

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = vin[i].toUpperCase();
      const value = transliteration[char];
      if (value === undefined) {
        return false;
      }
      sum += value * weights[i];
    }

    const checkDigit = sum % 11;
    const expectedCheckChar = checkDigit === 10 ? 'X' : checkDigit.toString();
    const actualCheckChar = vin[8].toUpperCase();

    return actualCheckChar === expectedCheckChar;
  }
}

export default new DMVService();
