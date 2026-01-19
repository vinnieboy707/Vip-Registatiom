import express from 'express';
import * as vehicleController from '../controllers/vehicleController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @swagger
 * /api/vehicles/search:
 *   get:
 *     summary: Search vehicles
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', authenticate, vehicleController.searchVehicles);

/**
 * @swagger
 * /api/vehicles/vin/{vin}:
 *   get:
 *     summary: Get vehicle by VIN
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle VIN
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Fetch fresh data from DMV
 *     responses:
 *       200:
 *         description: Vehicle details
 */
router.get('/vin/:vin', authenticate, auditLog('view', 'vehicle'), vehicleController.getVehicleByVIN);

/**
 * @swagger
 * /api/vehicles/vin/{vin}/registration-status:
 *   get:
 *     summary: Get vehicle registration status
 *     tags: [Vehicles]
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
 *         description: Registration status
 */
router.get(
  '/vin/:vin/registration-status',
  authenticate,
  vehicleController.getRegistrationStatus
);

/**
 * @swagger
 * /api/vehicles/vin/{vin}/registration-fees:
 *   get:
 *     summary: Get registration fees for a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [new, renewal, transfer]
 *     responses:
 *       200:
 *         description: Registration fees
 */
router.get(
  '/vin/:vin/registration-fees',
  authenticate,
  vehicleController.getRegistrationFees
);

/**
 * @swagger
 * /api/vehicles/vin/{vin}/ownership-history:
 *   get:
 *     summary: Get vehicle ownership history
 *     tags: [Vehicles]
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
 *         description: Ownership history
 */
router.get(
  '/vin/:vin/ownership-history',
  authenticate,
  vehicleController.getOwnershipHistory
);

/**
 * @swagger
 * /api/vehicles/registration:
 *   post:
 *     summary: Create new registration
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vin
 *               - registrationType
 *             properties:
 *               vin:
 *                 type: string
 *               registrationType:
 *                 type: string
 *                 enum: [new, renewal, transfer]
 *               locationFiled:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration created
 */
router.post(
  '/registration',
  authenticate,
  authorize('admin', 'agent'),
  auditLog('create', 'registration'),
  vehicleController.createRegistration
);

export default router;
