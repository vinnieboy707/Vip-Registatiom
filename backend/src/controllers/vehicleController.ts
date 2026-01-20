import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import vehicleService from '../services/vehicleService';
import dmvService from '../services/dmvService';
import logger from '../config/logger';

/**
 * Get vehicle by VIN
 */
export const getVehicleByVIN = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vin = req.params.vin as string;
    const refresh = req.query.refresh as string | undefined;

    if (!vin) {
      res.status(400).json({ error: 'VIN is required' });
      return;
    }

    if (!dmvService.validateVIN(vin)) {
      res.status(400).json({ error: 'Invalid VIN format' });
      return;
    }

    const vehicle = await vehicleService.getVehicleByVIN(vin, refresh === 'true');

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Get ownership history
    const ownershipHistory = await vehicleService.getOwnershipHistory(vehicle.id);

    // Check stolen status
    const isStolenFromDMV = await dmvService.checkStolenStatus(vin);

    res.json({
      vehicle: {
        ...vehicle,
        is_stolen: vehicle.is_stolen || isStolenFromDMV,
      },
      ownershipHistory,
    });
  } catch (error: any) {
    logger.error('Get vehicle error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch vehicle' });
  }
};

/**
 * Search vehicles
 */
export const searchVehicles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const vehicles = await vehicleService.searchVehicles(q);

    res.json({ vehicles, count: vehicles.length });
  } catch (error: any) {
    logger.error('Search vehicles error:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
};

/**
 * Get vehicle registration status
 */
export const getRegistrationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vin = req.params.vin as string;

    if (!vin) {
      res.status(400).json({ error: 'VIN is required' });
      return;
    }

    const vehicle = await vehicleService.getVehicleByVIN(vin, true);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const registrationRecords = await vehicleService.getRegistrationRecords(vehicle.id);

    res.json({
      vin: vehicle.vin,
      status: vehicle.registration_status,
      expiry: vehicle.registration_expiry,
      licensePlate: vehicle.license_plate,
      records: registrationRecords,
    });
  } catch (error: any) {
    logger.error('Get registration status error:', error);
    res.status(500).json({ error: 'Failed to fetch registration status' });
  }
};

/**
 * Get registration fees
 */
export const getRegistrationFees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vin = req.params.vin as string;
    const type = req.query.type as string | undefined;

    if (!vin) {
      res.status(400).json({ error: 'VIN is required' });
      return;
    }

    if (!type || !['new', 'renewal', 'transfer'].includes(type as string)) {
      res.status(400).json({ error: 'Valid registration type is required (new, renewal, transfer)' });
      return;
    }

    const fees = await dmvService.getRegistrationFees(vin, type as any);

    res.json({
      vin,
      registrationType: type,
      ...fees,
    });
  } catch (error: any) {
    logger.error('Get registration fees error:', error);
    res.status(500).json({ error: 'Failed to calculate registration fees' });
  }
};

/**
 * Create registration
 */
export const createRegistration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vin, registrationType, locationFiled, notes } = req.body;

    if (!vin || !registrationType) {
      res.status(400).json({ error: 'VIN and registration type are required' });
      return;
    }

    // Get or create vehicle
    let vehicle = await vehicleService.getVehicleByVIN(vin, true);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Calculate fees
    const fees = await dmvService.getRegistrationFees(vin, registrationType);

    // Calculate expiry date (1 year from now)
    const registrationDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Create registration record
    const registration = await vehicleService.createRegistration({
      vehicleId: vehicle.id,
      agentId: req.user?.id,
      registrationType,
      registrationDate,
      expiryDate: expiryDate.toISOString().split('T')[0],
      baseFee: fees.baseFee,
      transferFee: 0,
      totalFee: fees.totalFee,
      locationFiled,
      notes,
    });

    res.status(201).json({
      message: 'Registration created successfully',
      registration,
    });
  } catch (error: any) {
    logger.error('Create registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to create registration' });
  }
};

/**
 * Get ownership history
 */
export const getOwnershipHistory = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const history = await vehicleService.getOwnershipHistory(vehicle.id);

    res.json({
      vin: vehicle.vin,
      currentOwner: vehicle.current_owner_name,
      history,
    });
  } catch (error: any) {
    logger.error('Get ownership history error:', error);
    res.status(500).json({ error: 'Failed to fetch ownership history' });
  }
};
