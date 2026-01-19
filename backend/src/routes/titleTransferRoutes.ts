import express from 'express';
import * as titleTransferController from '../controllers/titleTransferController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @swagger
 * /api/title-transfers/fees:
 *   get:
 *     summary: Get title transfer fees
 *     tags: [Title Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [standard, out_of_state, family]
 *       - in: query
 *         name: fromState
 *         schema:
 *           type: string
 *       - in: query
 *         name: toState
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer fees
 */
router.get('/fees', authenticate, titleTransferController.getTitleTransferFees);

/**
 * @swagger
 * /api/title-transfers:
 *   post:
 *     summary: Create title transfer
 *     tags: [Title Transfers]
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
 *               - transferType
 *               - fromOwner
 *               - toOwner
 *             properties:
 *               vin:
 *                 type: string
 *               transferType:
 *                 type: string
 *                 enum: [standard, out_of_state, family]
 *               fromOwner:
 *                 type: string
 *               toOwner:
 *                 type: string
 *               fromState:
 *                 type: string
 *               toState:
 *                 type: string
 *               isFamilyTransfer:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Transfer created
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'agent'),
  auditLog('create', 'title_transfer'),
  titleTransferController.createTitleTransfer
);

/**
 * @swagger
 * /api/title-transfers/vehicle/{vin}:
 *   get:
 *     summary: Get title transfers for a vehicle
 *     tags: [Title Transfers]
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
 *         description: Transfer history
 */
router.get('/vehicle/:vin', authenticate, titleTransferController.getTitleTransfers);

/**
 * @swagger
 * /api/title-transfers/{id}/status:
 *   patch:
 *     summary: Update title transfer status
 *     tags: [Title Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, completed, rejected]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  auditLog('update', 'title_transfer'),
  titleTransferController.updateTitleTransferStatus
);

export default router;
