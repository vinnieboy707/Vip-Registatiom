import React, { useState } from 'react';
import { vehicleService } from '../services/vehicleService';

const VehicleReport: React.FC = () => {
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [state, setState] = useState('CA');
  const [searchType, setSearchType] = useState<'vin' | 'plate'>('vin');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setReport(null);

    try {
      let reportData;
      
      if (searchType === 'vin') {
        if (vin.length !== 17) {
          setError('VIN must be 17 characters');
          setLoading(false);
          return;
        }
        reportData = await vehicleService.generateReport(vin.toUpperCase());
      } else {
        if (!licensePlate || !state) {
          setError('License plate and state are required');
          setLoading(false);
          return;
        }
        reportData = await vehicleService.generateReportByPlate(licensePlate.toUpperCase(), state);
      }

      setReport(reportData);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await vehicleService.downloadTextReport(vin.toUpperCase());
      const blob = new Blob([response], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vehicle-report-${vin}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download report');
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '#dc2626';
      case 'MEDIUM':
        return '#ea580c';
      case 'LOW':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Vehicle History Report</h1>
      <p>Generate comprehensive vehicle reports with real NHTSA data, recalls, and ownership history</p>

      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', marginRight: '20px' }}>
            <input
              type="radio"
              value="vin"
              checked={searchType === 'vin'}
              onChange={() => setSearchType('vin')}
            />
            {' '}Search by VIN
          </label>
          <label style={{ fontWeight: 'bold' }}>
            <input
              type="radio"
              value="plate"
              checked={searchType === 'plate'}
              onChange={() => setSearchType('plate')}
            />
            {' '}Search by License Plate
          </label>
        </div>

        {searchType === 'vin' ? (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Vehicle Identification Number (VIN)
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
              }}
            />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                }}
              >
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
                {/* Add more states */}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                License Plate
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="Enter license plate number"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {report && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Vehicle Report</h2>
            {searchType === 'vin' && (
              <button
                onClick={handleDownloadReport}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download Report
              </button>
            )}
          </div>

          {/* Vehicle Info */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Vehicle Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>VIN:</strong> {report.vehicleInfo.vin}
              </div>
              <div>
                <strong>Year:</strong> {report.vehicleInfo.year}
              </div>
              <div>
                <strong>Make:</strong> {report.vehicleInfo.make}
              </div>
              <div>
                <strong>Model:</strong> {report.vehicleInfo.model}
              </div>
              <div>
                <strong>Color:</strong> {report.vehicleInfo.color}
              </div>
              <div>
                <strong>Registration Status:</strong>{' '}
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      report.vehicleInfo.registrationStatus === 'active' ? '#dcfce7' : '#fee2e2',
                    color:
                      report.vehicleInfo.registrationStatus === 'active' ? '#166534' : '#991b1b',
                  }}
                >
                  {report.vehicleInfo.registrationStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Current Owner */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Current Owner</h3>
            <p><strong>Name:</strong> {report.currentOwner.name}</p>
            <p><strong>Address:</strong> {report.currentOwner.address}</p>
            <p><strong>Ownership Since:</strong> {report.currentOwner.ownershipDate}</p>
          </div>

          {/* Ownership History */}
          {report.ownershipHistory && report.ownershipHistory.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Ownership History</h3>
              <p><strong>Total Previous Owners:</strong> {report.previousOwnersSummary.totalPreviousOwners}</p>
              <div style={{ marginTop: '15px' }}>
                {report.ownershipHistory.map((owner: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      marginBottom: '10px',
                    }}
                  >
                    <div><strong>Owner {index + 1}:</strong> {owner.ownerName}</div>
                    <div><strong>Period:</strong> {owner.startDate} to {owner.endDate}</div>
                    {owner.transferType && <div><strong>Transfer Type:</strong> {owner.transferType}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety & Recalls */}
          <div
            style={{
              backgroundColor: report.safetyInfo.isStolen ? '#fef2f2' : 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '20px',
              border: report.safetyInfo.isStolen ? '2px solid #dc2626' : 'none',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Safety & Recall Information</h3>
            <p>
              <strong>Stolen Status:</strong>{' '}
              <span style={{ color: report.safetyInfo.isStolen ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                {report.safetyInfo.stolenStatus}
              </span>
            </p>
            <p>
              <strong>Active Recalls:</strong> {report.safetyInfo.hasRecalls ? 'YES' : 'NO'} ({report.safetyInfo.recallCount} total)
            </p>

            {report.safetyInfo.recalls && report.safetyInfo.recalls.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <h4>Recall Details:</h4>
                {report.safetyInfo.recalls.map((recall: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '15px',
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: '4px',
                      marginBottom: '10px',
                    }}
                  >
                    <div><strong>Campaign #:</strong> {recall.nhtsaCampaignNumber}</div>
                    <div><strong>Component:</strong> {recall.component}</div>
                    <div><strong>Summary:</strong> {recall.summary}</div>
                    <div><strong>Remedy:</strong> {recall.remedy}</div>
                    <div><strong>Date:</strong> {recall.recallDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>Report Summary</h3>
            <div style={{ marginBottom: '15px' }}>
              <strong>Risk Level:</strong>{' '}
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  backgroundColor: getRiskLevelColor(report.summary.riskLevel) + '20',
                  color: getRiskLevelColor(report.summary.riskLevel),
                  fontWeight: 'bold',
                }}
              >
                {report.summary.riskLevel}
              </span>
            </div>
            <p><strong>Condition:</strong> {report.summary.vehicleCondition}</p>

            <h4>Recommendations:</h4>
            <ul>
              {report.summary.recommendationsForBuyer.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleReport;
