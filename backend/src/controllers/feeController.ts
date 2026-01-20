import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';
import logger from '../config/logger';
import { Fee } from '../types';

/**
 * Get all fees
 */
export const getAllFees = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    db.all(
      'SELECT * FROM fees WHERE is_active = 1 ORDER BY fee_type',
      [],
      (err, rows: Fee[]) => {
        if (err) {
          logger.error('Error fetching fees:', err);
          res.status(500).json({ error: 'Failed to fetch fees' });
          return;
        }

        res.json({ fees: rows || [] });
      }
    );
  } catch (error: any) {
    logger.error('Get all fees error:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
};

/**
 * Get fee by type
 */
export const getFeeByType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    db.get(
      'SELECT * FROM fees WHERE fee_type = ? AND is_active = 1',
      [type],
      (err, row: Fee) => {
        if (err) {
          logger.error('Error fetching fee:', err);
          res.status(500).json({ error: 'Failed to fetch fee' });
          return;
        }

        if (!row) {
          res.status(404).json({ error: 'Fee not found' });
          return;
        }

        res.json({ fee: row });
      }
    );
  } catch (error: any) {
    logger.error('Get fee by type error:', error);
    res.status(500).json({ error: 'Failed to fetch fee' });
  }
};

/**
 * Update fee (admin only)
 */
export const updateFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, description, is_active } = req.body;

    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can update fees' });
      return;
    }

    const updates = [];
    const values = [];

    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }

    values.push(id);

    db.run(
      `UPDATE fees SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function (err) {
        if (err) {
          logger.error('Error updating fee:', err);
          res.status(500).json({ error: 'Failed to update fee' });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: 'Fee not found' });
          return;
        }

        logger.info(`Fee ${id} updated`);
        res.json({ message: 'Fee updated successfully' });
      }
    );
  } catch (error: any) {
    logger.error('Update fee error:', error);
    res.status(500).json({ error: 'Failed to update fee' });
  }
};
