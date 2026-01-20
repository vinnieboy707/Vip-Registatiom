import axios from 'axios';
import logger from '../config/logger';

/**
 * Recall Service - Integrates with NHTSA Recall API for real vehicle recall data
 * API Documentation: https://one.nhtsa.gov/webapi/Default.aspx?Recalls/API/83
 */
class RecallService {
  private nhtsaBaseUrl: string;

  constructor() {
    this.nhtsaBaseUrl = 'https://api.nhtsa.gov/recalls';
  }

  /**
   * Get all recalls for a specific VIN from NHTSA database
   */
  async getRecallsByVIN(vin: string): Promise<any[]> {
    try {
      logger.info(`Fetching recall data for VIN: ${vin}`);

      const response = await axios.get(
        `${this.nhtsaBaseUrl}/recallsByVehicle?vin=${vin}`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.results) {
        logger.info(`Found ${response.data.results.length} recalls for VIN: ${vin}`);
        return response.data.results;
      }

      return [];
    } catch (error: any) {
      logger.error('Error fetching recalls by VIN:', error);
      // Don't throw - return empty array if service unavailable
      return [];
    }
  }

  /**
   * Get recalls by make, model, and year from NHTSA database
   */
  async getRecallsByVehicle(make: string, model: string, year: number): Promise<any[]> {
    try {
      logger.info(`Fetching recall data for ${year} ${make} ${model}`);

      const response = await axios.get(
        `${this.nhtsaBaseUrl}/recallsByVehicle`,
        {
          params: {
            make: make,
            model: model,
            modelYear: year
          },
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.results) {
        logger.info(`Found ${response.data.results.length} recalls`);
        return response.data.results;
      }

      return [];
    } catch (error: any) {
      logger.error('Error fetching recalls by vehicle:', error);
      return [];
    }
  }

  /**
   * Get recent recalls (all manufacturers)
   */
  async getRecentRecalls(limit: number = 50): Promise<any[]> {
    try {
      logger.info('Fetching recent recalls');

      const response = await axios.get(
        `${this.nhtsaBaseUrl}/recentRecalls`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.results) {
        return response.data.results.slice(0, limit);
      }

      return [];
    } catch (error: any) {
      logger.error('Error fetching recent recalls:', error);
      return [];
    }
  }

  /**
   * Format recall data for reports
   */
  formatRecallsForReport(recalls: any[]): any[] {
    return recalls.map(recall => ({
      nhtsaCampaignNumber: recall.NHTSACampaignNumber || 'N/A',
      manufacturer: recall.Manufacturer || 'N/A',
      component: recall.Component || 'N/A',
      summary: recall.Summary || 'No description available',
      consequence: recall.Consequence || 'See summary',
      remedy: recall.Remedy || 'Contact manufacturer',
      recallDate: recall.ReportReceivedDate || 'N/A',
      affectedVehicles: recall.PotentialUnitsAffected || 'Unknown'
    }));
  }

  /**
   * Check if vehicle has any open/unresolved recalls
   */
  async hasOpenRecalls(vin: string): Promise<{ hasRecalls: boolean; count: number; recalls: any[] }> {
    const recalls = await this.getRecallsByVIN(vin);
    return {
      hasRecalls: recalls.length > 0,
      count: recalls.length,
      recalls: this.formatRecallsForReport(recalls)
    };
  }
}

export default new RecallService();
