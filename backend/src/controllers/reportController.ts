import { Request, Response } from 'express';
import reportService from '../services/reportService';
import logger from '../config/logger';

class ReportController {
  /**
   * Generate comprehensive vehicle report by VIN
   * GET /api/reports/vin/:vin
   */
  async generateReportByVIN(req: Request, res: Response): Promise<void> {
    try {
      const { vin } = req.params;
      
      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        res.status(400).json({ error: 'Invalid VIN format. VIN must be 17 characters.' });
        return;
      }

      logger.info(`Report request for VIN: ${vin}`);
      
      const report = await reportService.generateVehicleReport(vin.toUpperCase());
      
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      logger.error('Error in generateReportByVIN:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate report'
      });
    }
  }

  /**
   * Generate report by license plate
   * GET /api/reports/plate/:state/:plate
   */
  async generateReportByPlate(req: Request, res: Response): Promise<void> {
    try {
      const { state, plate } = req.params;
      
      if (!state || !plate || typeof state !== 'string' || typeof plate !== 'string') {
        res.status(400).json({ error: 'State and plate are required' });
        return;
      }

      logger.info(`Report request for plate: ${plate}, state: ${state}`);
      
      const report = await reportService.generateReportByPlate(plate.toUpperCase(), state.toUpperCase());
      
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      logger.error('Error in generateReportByPlate:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate report by plate'
      });
    }
  }

  /**
   * Generate report as formatted text for printing
   * GET /api/reports/vin/:vin/text
   */
  async generateTextReport(req: Request, res: Response): Promise<void> {
    try {
      const { vin } = req.params;
      
      if (!vin || typeof vin !== 'string' || vin.length !== 17) {
        res.status(400).json({ error: 'Invalid VIN format' });
        return;
      }

      const report = await reportService.generateVehicleReport(vin.toUpperCase());
      const textReport = reportService.formatReportAsText(report);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="vehicle-report-${vin}.txt"`);
      res.send(textReport);
    } catch (error: any) {
      logger.error('Error in generateTextReport:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate text report'
      });
    }
  }
}

export default new ReportController();
