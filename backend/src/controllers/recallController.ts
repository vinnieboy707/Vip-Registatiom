import { Request, Response } from 'express';
import recallService from '../services/recallService';
import logger from '../config/logger';

class RecallController {
  /**
   * Get recalls by VIN
   * GET /api/recalls/vin/:vin
   */
  async getRecallsByVIN(req: Request, res: Response): Promise<void> {
    try {
      const { vin } = req.params;
      
      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        res.status(400).json({ error: 'Invalid VIN format' });
        return;
      }

      logger.info(`Fetching recalls for VIN: ${vin}`);
      
      const recallData = await recallService.hasOpenRecalls(vin.toUpperCase());
      
      res.json({
        success: true,
        data: recallData
      });
    } catch (error: any) {
      logger.error('Error in getRecallsByVIN:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch recalls'
      });
    }
  }

  /**
   * Get recalls by make, model, year
   * GET /api/recalls/vehicle?make=Toyota&model=Camry&year=2020
   */
  async getRecallsByVehicle(req: Request, res: Response): Promise<void> {
    try {
      const { make, model, year } = req.query;
      
      if (!make || !model || !year) {
        res.status(400).json({ error: 'Make, model, and year are required' });
        return;
      }

      logger.info(`Fetching recalls for ${year} ${make} ${model}`);
      
      const recalls = await recallService.getRecallsByVehicle(
        make as string,
        model as string,
        parseInt(year as string)
      );
      
      const formattedRecalls = recallService.formatRecallsForReport(recalls);
      
      res.json({
        success: true,
        data: {
          hasRecalls: recalls.length > 0,
          count: recalls.length,
          recalls: formattedRecalls
        }
      });
    } catch (error: any) {
      logger.error('Error in getRecallsByVehicle:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch recalls'
      });
    }
  }

  /**
   * Get recent recalls
   * GET /api/recalls/recent?limit=50
   */
  async getRecentRecalls(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      logger.info('Fetching recent recalls');
      
      const recalls = await recallService.getRecentRecalls(limit);
      const formattedRecalls = recallService.formatRecallsForReport(recalls);
      
      res.json({
        success: true,
        data: {
          count: formattedRecalls.length,
          recalls: formattedRecalls
        }
      });
    } catch (error: any) {
      logger.error('Error in getRecentRecalls:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch recent recalls'
      });
    }
  }
}

export default new RecallController();
