import React, { useState } from 'react';
import { vehicleService } from '../services/vehicleService';

const Registration: React.FC = () => {
  const [formData, setFormData] = useState({
    vin: '',
    registrationType: 'new' as 'new' | 'renewal' | 'transfer',
    locationFiled: '',
    notes: '',
  });
  const [fees, setFees] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset fees when VIN or type changes
    if (e.target.name === 'vin' || e.target.name === 'registrationType') {
      setFees(null);
    }
  };

  const calculateFees = async () => {
    if (!formData.vin.trim()) {
      setError('Please enter a VIN');
      return;
    }

    setCalculating(true);
    setError('');

    try {
      const feeData = await vehicleService.getRegistrationFees(
        formData.vin.trim(),
        formData.registrationType
      );
      setFees(feeData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate fees');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await vehicleService.createRegistration({
        vin: formData.vin.trim(),
        registrationType: formData.registrationType,
        locationFiled: formData.locationFiled,
        notes: formData.notes,
      });

      setSuccess('Registration created successfully!');
      setFormData({
        vin: '',
        registrationType: 'new',
        locationFiled: '',
        notes: '',
      });
      setFees(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1>Vehicle Registration</h1>
        <p className="text-secondary">
          File new vehicle registration or renewal. Calculate fees and complete registration
          on-site.
        </p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3>Vehicle Information</h3>

          <div className="form-group">
            <label htmlFor="vin" className="form-label">
              Vehicle VIN *
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              className="form-input"
              value={formData.vin}
              onChange={handleChange}
              required
              maxLength={17}
              placeholder="Enter 17-character VIN"
            />
          </div>

          <div className="form-group">
            <label htmlFor="registrationType" className="form-label">
              Registration Type *
            </label>
            <select
              id="registrationType"
              name="registrationType"
              className="form-select"
              value={formData.registrationType}
              onChange={handleChange}
              required
            >
              <option value="new">New Registration</option>
              <option value="renewal">Renewal</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <button
            type="button"
            onClick={calculateFees}
            className="btn btn-secondary"
            disabled={calculating || !formData.vin.trim()}
          >
            {calculating ? 'Calculating...' : 'Calculate Fees'}
          </button>
        </div>

        {fees && (
          <div className="card">
            <h3>Fee Breakdown</h3>
            <div className="grid grid-cols-2">
              <div>
                <p>
                  <strong>Base Fee:</strong>
                </p>
                <p style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                  ${fees.baseFee.toFixed(2)}
                </p>
              </div>
              <div>
                <p>
                  <strong>Taxes & Fees:</strong>
                </p>
                <p style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                  ${fees.taxes.toFixed(2)}
                </p>
              </div>
            </div>
            <div
              style={{
                borderTop: '2px solid var(--border-color)',
                paddingTop: '1rem',
                marginTop: '1rem',
              }}
            >
              <p>
                <strong>Total Fee:</strong>
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary-color)' }}>
                ${fees.totalFee.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <div className="card">
          <h3>Filing Information</h3>

          <div className="form-group">
            <label htmlFor="locationFiled" className="form-label">
              Filing Location (Optional)
            </label>
            <input
              type="text"
              id="locationFiled"
              name="locationFiled"
              className="form-input"
              value={formData.locationFiled}
              onChange={handleChange}
              placeholder="e.g., Customer's home, Office, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes or comments"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !fees}
            >
              {loading ? 'Processing...' : 'Submit Registration'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFormData({
                  vin: '',
                  registrationType: 'new',
                  locationFiled: '',
                  notes: '',
                });
                setFees(null);
                setError('');
                setSuccess('');
              }}
            >
              Clear Form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Registration;
