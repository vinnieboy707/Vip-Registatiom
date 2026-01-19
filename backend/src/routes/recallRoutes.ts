import { Router } from 'express';
import recallController from '../controllers/recallController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/recalls/vin/{vin}:
 *   get:
 *     summary: Get NHTSA recalls for a specific VIN
 *     tags: [Recalls]
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
 *         description: Recalls retrieved successfully
 */
router.get('/vin/:vin', authenticate, recallController.getRecallsByVIN);

/**
 * @swagger
 * /api/recalls/vehicle:
 *   get:
 *     summary: Get recalls by make, model, and year
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: make
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: model
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recalls retrieved successfully
 */
router.get('/vehicle', authenticate, recallController.getRecallsByVehicle);

/**
 * @swagger
 * /api/recalls/recent:
 *   get:
 *     summary: Get recent recalls from NHTSA
 *     tags: [Recalls]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Recent recalls retrieved
 */
router.get('/recent', recallController.getRecentRecalls);

export default router;
