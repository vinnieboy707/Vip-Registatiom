import React, { useState } from 'react';
import { titleTransferService } from '../services/titleTransferService';

const TitleTransfer: React.FC = () => {
  const [formData, setFormData] = useState({
    vin: '',
    transferType: 'standard' as 'standard' | 'out_of_state' | 'family',
    fromOwner: '',
    toOwner: '',
    fromState: '',
    toState: '',
    isFamilyTransfer: false,
  });
  const [fees, setFees] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });

    // Reset fees when transfer type or states change
    if (['transferType', 'fromState', 'toState'].includes(e.target.name)) {
      setFees(null);
    }
  };

  const calculateFees = async () => {
    setCalculating(true);
    setError('');

    try {
      const feeData = await titleTransferService.getTitleTransferFees(
        formData.transferType,
        formData.fromState || undefined,
        formData.toState || undefined
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
      await titleTransferService.createTitleTransfer({
        vin: formData.vin.trim(),
        transferType: formData.transferType,
        fromOwner: formData.fromOwner,
        toOwner: formData.toOwner,
        fromState: formData.fromState || undefined,
        toState: formData.toState || undefined,
        isFamilyTransfer: formData.isFamilyTransfer,
      });

      setSuccess('Title transfer created successfully!');
      setFormData({
        vin: '',
        transferType: 'standard',
        fromOwner: '',
        toOwner: '',
        fromState: '',
        toState: '',
        isFamilyTransfer: false,
      });
      setFees(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create title transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1>Title Transfer</h1>
        <p className="text-secondary">
          Process vehicle title transfers including standard, out-of-state, and family transfers.
        </p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3>Vehicle & Transfer Information</h3>

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
            <label htmlFor="transferType" className="form-label">
              Transfer Type *
            </label>
            <select
              id="transferType"
              name="transferType"
              className="form-select"
              value={formData.transferType}
              onChange={handleChange}
              required
            >
              <option value="standard">Standard Transfer</option>
              <option value="out_of_state">Out-of-State Transfer</option>
              <option value="family">Family Transfer</option>
            </select>
          </div>

          {formData.transferType === 'family' && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="isFamilyTransfer"
                  checked={formData.isFamilyTransfer}
                  onChange={handleChange}
                />
                <span className="form-label" style={{ marginBottom: 0 }}>
                  Confirm this is a family member transfer (reduced fees)
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Owner Information</h3>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label htmlFor="fromOwner" className="form-label">
                From Owner (Seller) *
              </label>
              <input
                type="text"
                id="fromOwner"
                name="fromOwner"
                className="form-input"
                value={formData.fromOwner}
                onChange={handleChange}
                required
                placeholder="Current owner name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="toOwner" className="form-label">
                To Owner (Buyer) *
              </label>
              <input
                type="text"
                id="toOwner"
                name="toOwner"
                className="form-input"
                value={formData.toOwner}
                onChange={handleChange}
                required
                placeholder="New owner name"
              />
            </div>
          </div>

          {formData.transferType === 'out_of_state' && (
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label htmlFor="fromState" className="form-label">
                  From State
                </label>
                <input
                  type="text"
                  id="fromState"
                  name="fromState"
                  className="form-input"
                  value={formData.fromState}
                  onChange={handleChange}
                  maxLength={2}
                  placeholder="e.g., CA"
                />
              </div>

              <div className="form-group">
                <label htmlFor="toState" className="form-label">
                  To State
                </label>
                <input
                  type="text"
                  id="toState"
                  name="toState"
                  className="form-input"
                  value={formData.toState}
                  onChange={handleChange}
                  maxLength={2}
                  placeholder="e.g., NY"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={calculateFees}
            className="btn btn-secondary"
            disabled={calculating}
          >
            {calculating ? 'Calculating...' : 'Calculate Transfer Fees'}
          </button>
        </div>

        {fees && (
          <div className="card">
            <h3>Fee Breakdown</h3>
            <div className="grid grid-cols-2">
              <div>
                <p>
                  <strong>Transfer Fee:</strong>
                </p>
                <p style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                  ${fees.transferFee.toFixed(2)}
                </p>
              </div>
              <div>
                <p>
                  <strong>Taxes & Processing:</strong>
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
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !fees}
            >
              {loading ? 'Processing...' : 'Submit Title Transfer'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFormData({
                  vin: '',
                  transferType: 'standard',
                  fromOwner: '',
                  toOwner: '',
                  fromState: '',
                  toState: '',
                  isFamilyTransfer: false,
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

export default TitleTransfer;
