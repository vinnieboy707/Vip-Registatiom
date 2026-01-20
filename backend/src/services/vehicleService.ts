import db from '../config/database';
import logger from '../config/logger';
import dmvService from './dmvService';
import { Vehicle, RegistrationRecord, OwnershipHistory } from '../types';

class VehicleService {
  /**
   * Get vehicle by VIN from database or fetch from DMV
   */
  async getVehicleByVIN(vin: string, fetchFromDMV: boolean = false): Promise<Vehicle | null> {
    return new Promise(async (resolve, reject) => {
      // First check local database
      db.get('SELECT * FROM vehicles WHERE vin = ?', [vin], async (err, row: Vehicle) => {
        if (err) {
          logger.error('Error fetching vehicle:', err);
          return reject(err);
        }

        if (row && !fetchFromDMV) {
          return resolve(row);
        }

        // Fetch from DMV if not in database or explicitly requested
        try {
          const dmvData = await dmvService.getVehicleByVIN(vin);
          
          if (row) {
            // Update existing record
            const updates: Partial<Vehicle> = {
              make: dmvData.make,
              model: dmvData.model,
              year: dmvData.year,
              color: dmvData.color,
              registration_status: dmvData.registration_status as 'active' | 'inactive' | 'expired' | 'suspended',
              is_stolen: dmvData.is_stolen,
            };
            await this.updateVehicle(row.id, updates);
            const updated = await this.getVehicleById(row.id);
            resolve(updated);
          } else {
            // Create new record
            const newVehicle = await this.createVehicle(dmvData);
            resolve(newVehicle);
          }
        } catch (error) {
          logger.error('Error fetching from DMV:', error);
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: number): Promise<Vehicle | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM vehicles WHERE id = ?', [id], (err, row: Vehicle) => {
        if (err) {
          logger.error('Error fetching vehicle by ID:', err);
          return reject(err);
        }
        resolve(row || null);
      });
    });
  }

  /**
   * Create new vehicle record
   */
  async createVehicle(vehicleData: any): Promise<Vehicle> {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO vehicles 
         (vin, license_plate, make, model, year, color, current_owner_name, 
          current_owner_address, registration_status, registration_expiry, is_stolen) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vehicleData.vin,
          vehicleData.license_plate || null,
          vehicleData.make,
          vehicleData.model,
          vehicleData.year,
          vehicleData.color || null,
          vehicleData.owner_name || null,
          vehicleData.owner_address || null,
          vehicleData.registration_status || 'inactive',
          vehicleData.registration_expiry || null,
          vehicleData.is_stolen ? 1 : 0,
        ],
        function (err) {
          if (err) {
            logger.error('Error creating vehicle:', err);
            return reject(err);
          }

          db.get('SELECT * FROM vehicles WHERE id = ?', [this.lastID], (err, row: Vehicle) => {
            if (err) return reject(err);
            
            // Create ownership history
            if (vehicleData.owner_name) {
              db.run(
                `INSERT INTO ownership_history (vehicle_id, owner_name, owner_address, start_date) 
                 VALUES (?, ?, ?, ?)`,
                [this.lastID, vehicleData.owner_name, vehicleData.owner_address, new Date().toISOString().split('T')[0]]
              );
            }
            
            logger.info(`Vehicle created: ${vehicleData.vin}`);
            resolve(row);
          });
        }
      );
    });
  }

  /**
   * Update vehicle information
   */
  async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at') {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });

      values.push(id);

      db.run(
        `UPDATE vehicles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            logger.error('Error updating vehicle:', err);
            return reject(err);
          }
          resolve();
        }
      );
    });
  }

  /**
   * Get ownership history for a vehicle
   */
  async getOwnershipHistory(vehicleId: number): Promise<OwnershipHistory[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM ownership_history WHERE vehicle_id = ? ORDER BY start_date DESC',
        [vehicleId],
        (err, rows: OwnershipHistory[]) => {
          if (err) {
            logger.error('Error fetching ownership history:', err);
            return reject(err);
          }
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get registration records for a vehicle
   */
  async getRegistrationRecords(vehicleId: number): Promise<RegistrationRecord[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM registration_records WHERE vehicle_id = ? ORDER BY registration_date DESC',
        [vehicleId],
        (err, rows: RegistrationRecord[]) => {
          if (err) {
            logger.error('Error fetching registration records:', err);
            return reject(err);
          }
          resolve(rows || []);
        }
      );
    });
  }

  /**
   * Create new registration record
   */
  async createRegistration(data: {
    vehicleId: number;
    agentId?: number;
    registrationType: string;
    registrationDate: string;
    expiryDate: string;
    baseFee: number;
    transferFee: number;
    totalFee: number;
    locationFiled?: string;
    notes?: string;
  }): Promise<RegistrationRecord> {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO registration_records 
         (vehicle_id, agent_id, registration_type, registration_date, expiry_date, 
          base_fee, transfer_fee, total_fee, location_filed, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.vehicleId,
          data.agentId || null,
          data.registrationType,
          data.registrationDate,
          data.expiryDate,
          data.baseFee,
          data.transferFee,
          data.totalFee,
          data.locationFiled || null,
          data.notes || null,
        ],
        function (err) {
          if (err) {
            logger.error('Error creating registration:', err);
            return reject(err);
          }

          db.get(
            'SELECT * FROM registration_records WHERE id = ?',
            [this.lastID],
            (err, row: RegistrationRecord) => {
              if (err) return reject(err);
              
              // Update vehicle registration status
              const expiryDate = new Date(data.expiryDate);
              const status = expiryDate > new Date() ? 'active' : 'expired';
              
              db.run(
                'UPDATE vehicles SET registration_status = ?, registration_expiry = ? WHERE id = ?',
                [status, data.expiryDate, data.vehicleId]
              );
              
              logger.info(`Registration created for vehicle ID: ${data.vehicleId}`);
              resolve(row);
            }
          );
        }
      );
    });
  }

  /**
   * Search vehicles
   */
  async searchVehicles(query: string): Promise<Vehicle[]> {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${query}%`;
      db.all(
        `SELECT * FROM vehicles 
         WHERE vin LIKE ? OR license_plate LIKE ? OR 
               make LIKE ? OR model LIKE ? OR 
               current_owner_name LIKE ?
         LIMIT 50`,
        [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern],
        (err, rows: Vehicle[]) => {
          if (err) {
            logger.error('Error searching vehicles:', err);
            return reject(err);
          }
          resolve(rows || []);
        }
      );
    });
  }
}

export default new VehicleService();
