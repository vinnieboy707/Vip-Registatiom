import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';
import vehicleService from '../services/vehicleService';
import dmvService from '../services/dmvService';
import logger from '../config/logger';
import { TitleTransfer } from '../types';

/**
 * Get title transfer fees
 */
export const getTitleTransferFees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, fromState, toState } = req.query;

    if (!type || !['standard', 'out_of_state', 'family'].includes(type as string)) {
      res.status(400).json({ 
        error: 'Valid transfer type is required (standard, out_of_state, family)' 
      });
      return;
    }

    const fees = await dmvService.getTitleTransferFees(
      type as any,
      fromState as string,
      toState as string
    );

    res.json({
      transferType: type,
      fromState,
      toState,
      ...fees,
    });
  } catch (error: any) {
    logger.error('Get title transfer fees error:', error);
    res.status(500).json({ error: 'Failed to calculate title transfer fees' });
  }
};

/**
 * Create title transfer
 */
export const createTitleTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      vin,
      transferType,
      fromOwner,
      toOwner,
      fromState,
      toState,
      isFamilyTransfer,
    } = req.body;

    if (!vin || !transferType || !fromOwner || !toOwner) {
      res.status(400).json({ 
        error: 'VIN, transfer type, from owner, and to owner are required' 
      });
      return;
    }

    // Validate transfer type
    if (!['standard', 'out_of_state', 'family'].includes(transferType)) {
      res.status(400).json({ error: 'Invalid transfer type' });
      return;
    }

    // Get or create vehicle
    let vehicle = await vehicleService.getVehicleByVIN(vin, true);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Calculate fees
    const fees = await dmvService.getTitleTransferFees(transferType, fromState, toState);

    // Create title transfer record
    const transferDate = new Date().toISOString().split('T')[0];

    db.run(
      `INSERT INTO title_transfers 
       (vehicle_id, transfer_type, from_owner, to_owner, from_state, to_state, 
        transfer_date, transfer_fee, is_family_transfer, agent_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vehicle.id,
        transferType,
        fromOwner,
        toOwner,
        fromState || null,
        toState || null,
        transferDate,
        fees.totalFee,
        isFamilyTransfer ? 1 : 0,
        req.user?.id || null,
        'pending',
      ],
      function (err) {
        if (err) {
          logger.error('Error creating title transfer:', err);
          res.status(500).json({ error: 'Failed to create title transfer' });
          return;
        }

        // Update vehicle owner
        db.run(
          'UPDATE vehicles SET current_owner_name = ? WHERE id = ?',
          [toOwner, vehicle!.id]
        );

        // Close old ownership record
        db.run(
          `UPDATE ownership_history 
           SET end_date = ? 
           WHERE vehicle_id = ? AND end_date IS NULL`,
          [transferDate, vehicle!.id]
        );

        // Create new ownership record
        db.run(
          `INSERT INTO ownership_history (vehicle_id, owner_name, start_date) 
           VALUES (?, ?, ?)`,
          [vehicle!.id, toOwner, transferDate]
        );

        // Fetch the created transfer
        db.get(
          'SELECT * FROM title_transfers WHERE id = ?',
          [this.lastID],
          (err, row: TitleTransfer) => {
            if (err) {
              logger.error('Error fetching created transfer:', err);
              res.status(500).json({ error: 'Failed to fetch created transfer' });
              return;
            }

            logger.info(`Title transfer created for vehicle ID: ${vehicle!.id}`);
            res.status(201).json({
              message: 'Title transfer created successfully',
              transfer: row,
              fees,
            });
          }
        );
      }
    );
  } catch (error: any) {
    logger.error('Create title transfer error:', error);
    res.status(500).json({ error: error.message || 'Failed to create title transfer' });
  }
};

/**
 * Get title transfers for a vehicle
 */
export const getTitleTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vin = req.params.vin as string;

    if (!vin) {
      res.status(400).json({ error: 'VIN is required' });
      return;
    }

    const vehicle = await vehicleService.getVehicleByVIN(vin);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    db.all(
      'SELECT * FROM title_transfers WHERE vehicle_id = ? ORDER BY transfer_date DESC',
      [vehicle.id],
      (err, rows: TitleTransfer[]) => {
        if (err) {
          logger.error('Error fetching title transfers:', err);
          res.status(500).json({ error: 'Failed to fetch title transfers' });
          return;
        }

        res.json({
          vin: vehicle.vin,
          transfers: rows || [],
        });
      }
    );
  } catch (error: any) {
    logger.error('Get title transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch title transfers' });
  }
};

/**
 * Update title transfer status
 */
export const updateTitleTransferStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'completed', 'rejected'].includes(status as string)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    // Check if user has permission (admin only)
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can update transfer status' });
      return;
    }

    db.run(
      'UPDATE title_transfers SET status = ? WHERE id = ?',
      [status, id],
      function (err) {
        if (err) {
          logger.error('Error updating transfer status:', err);
          res.status(500).json({ error: 'Failed to update transfer status' });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: 'Transfer not found' });
          return;
        }

        logger.info(`Title transfer ${id} status updated to: ${status}`);
        res.json({
          message: 'Transfer status updated successfully',
          id,
          status,
        });
      }
    );
  } catch (error: any) {
    logger.error('Update transfer status error:', error);
    res.status(500).json({ error: 'Failed to update transfer status' });
  }
};
