import React, { useState } from 'react';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, OwnershipHistory } from '../types';
import Loading from '../components/Loading';

const VehicleLookup: React.FC = () => {
  const [vin, setVin] = useState('');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [ownershipHistory, setOwnershipHistory] = useState<OwnershipHistory[]>([]);
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vin.trim()) {
      setError('Please enter a VIN');
      return;
    }

    setLoading(true);
    setError('');
    setVehicle(null);
    setOwnershipHistory([]);
    setRegistrationStatus(null);

    try {
      // Fetch vehicle data
      const vehicleData = await vehicleService.getVehicleByVIN(vin.trim(), true);
      setVehicle(vehicleData.vehicle);
      setOwnershipHistory(vehicleData.ownershipHistory);

      // Fetch registration status
      const regStatus = await vehicleService.getRegistrationStatus(vin.trim());
      setRegistrationStatus(regStatus);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch vehicle information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeClass =
      status === 'active'
        ? 'badge-success'
        : status === 'expired'
        ? 'badge-danger'
        : status === 'suspended'
        ? 'badge-warning'
        : 'badge-info';
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1>Vehicle Lookup</h1>
        <p className="text-secondary">
          Search for comprehensive vehicle information using VIN
        </p>

        <form onSubmit={handleSearch} style={{ marginTop: '1.5rem' }}>
          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="Enter VIN (17 characters)"
                maxLength={17}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>

      {loading && <Loading message="Fetching vehicle data from DMV..." />}

      {vehicle && !loading && (
        <>
          {/* Vehicle Information */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2>Vehicle Information</h2>
              {vehicle.is_stolen && (
                <span className="badge badge-danger" style={{ fontSize: '1rem' }}>
                  ⚠️ REPORTED STOLEN
                </span>
              )}
            </div>

            <div className="grid grid-cols-2">
              <div>
                <p>
                  <strong>VIN:</strong> {vehicle.vin}
                </p>
                <p>
                  <strong>Make:</strong> {vehicle.make}
                </p>
                <p>
                  <strong>Model:</strong> {vehicle.model}
                </p>
                <p>
                  <strong>Year:</strong> {vehicle.year}
                </p>
                {vehicle.color && (
                  <p>
                    <strong>Color:</strong> {vehicle.color}
                  </p>
                )}
              </div>

              <div>
                {vehicle.license_plate && (
                  <p>
                    <strong>License Plate:</strong> {vehicle.license_plate}
                  </p>
                )}
                {vehicle.current_owner_name && (
                  <p>
                    <strong>Current Owner:</strong> {vehicle.current_owner_name}
                  </p>
                )}
                {vehicle.current_owner_address && (
                  <p>
                    <strong>Address:</strong> {vehicle.current_owner_address}
                  </p>
                )}
                <p>
                  <strong>Registration Status:</strong>{' '}
                  {getStatusBadge(vehicle.registration_status)}
                </p>
                {vehicle.registration_expiry && (
                  <p>
                    <strong>Expiry Date:</strong>{' '}
                    {new Date(vehicle.registration_expiry).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Registration Status */}
          {registrationStatus && (
            <div className="card">
              <h3>Registration Records</h3>
              {registrationStatus.records && registrationStatus.records.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Registration Date</th>
                        <th>Expiry Date</th>
                        <th>Total Fee</th>
                        <th>Payment Status</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrationStatus.records.map((record: any) => (
                        <tr key={record.id}>
                          <td>{record.registration_type}</td>
                          <td>{new Date(record.registration_date).toLocaleDateString()}</td>
                          <td>{new Date(record.expiry_date).toLocaleDateString()}</td>
                          <td>${record.total_fee.toFixed(2)}</td>
                          <td>
                            <span
                              className={`badge ${
                                record.payment_status === 'paid'
                                  ? 'badge-success'
                                  : record.payment_status === 'failed'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                              }`}
                            >
                              {record.payment_status}
                            </span>
                          </td>
                          <td>{record.location_filed || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-secondary" style={{ padding: '2rem' }}>
                  No registration records found
                </p>
              )}
            </div>
          )}

          {/* Ownership History */}
          {ownershipHistory && ownershipHistory.length > 0 && (
            <div className="card">
              <h3>Ownership History</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Owner Name</th>
                      <th>Address</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownershipHistory.map((record) => (
                      <tr key={record.id}>
                        <td>{record.owner_name}</td>
                        <td>{record.owner_address || 'N/A'}</td>
                        <td>{new Date(record.start_date).toLocaleDateString()}</td>
                        <td>
                          {record.end_date
                            ? new Date(record.end_date).toLocaleDateString()
                            : 'Current'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!vehicle && !loading && !error && (
        <div className="card">
          <p className="text-center text-secondary" style={{ padding: '3rem' }}>
            Enter a VIN to search for vehicle information
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleLookup;
