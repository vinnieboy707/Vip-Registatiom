import { Router } from 'express';
import reportController from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/reports/vin/{vin}:
 *   get:
 *     summary: Generate comprehensive vehicle report by VIN
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: 17-character VIN
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       400:
 *         description: Invalid VIN format
 *       500:
 *         description: Server error
 */
router.get('/vin/:vin', authenticate, reportController.generateReportByVIN);

/**
 * @swagger
 * /api/reports/vin/{vin}/text:
 *   get:
 *     summary: Generate text format report for printing
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Text report generated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/vin/:vin/text', authenticate, reportController.generateTextReport);

/**
 * @swagger
 * /api/reports/plate/{state}/{plate}:
 *   get:
 *     summary: Generate report by license plate
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: plate
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
router.get('/plate/:state/:plate', authenticate, reportController.generateReportByPlate);

export default router;
