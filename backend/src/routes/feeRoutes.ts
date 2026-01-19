import express from 'express';
import * as feeController from '../controllers/feeController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @swagger
 * /api/fees:
 *   get:
 *     summary: Get all active fees
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of fees
 */
router.get('/', authenticate, feeController.getAllFees);

/**
 * @swagger
 * /api/fees/{type}:
 *   get:
 *     summary: Get fee by type
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fee details
 */
router.get('/:type', authenticate, feeController.getFeeByType);

/**
 * @swagger
 * /api/fees/{id}:
 *   patch:
 *     summary: Update fee (admin only)
 *     tags: [Fees]
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
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Fee updated
 */
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  auditLog('update', 'fee'),
  feeController.updateFee
);

export default router;
