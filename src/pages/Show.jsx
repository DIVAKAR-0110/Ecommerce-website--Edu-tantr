

 
// Show.jsx - Admin Panel with Approve/Reject
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import './Show.css';

const Show = () => {
  // All state declarations
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:3000';

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/sales-registrations`);
      const result = await response.json();

      if (result.success) {
        setRegistrations(result.data);
      } else {
        setError('Failed to fetch registrations');
      }
    } catch (err) {
      setError('Error connecting to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/approve-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          adminMessage: adminMessage || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Seller approved successfully! Email notification sent.');
        setShowApproveDialog(null);
        setAdminMessage('');
        fetchRegistrations();
      } else {
        alert('❌ Failed to approve seller: ' + result.message);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reject-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Seller rejected successfully! Email notification sent.');
        setShowRejectDialog(null);
        setRejectionReason('');
        fetchRegistrations();
      } else {
        alert('❌ Failed to reject seller: ' + result.message);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getFileUrl = (fileId) => {
    if (!fileId) return null;
    return `${API_BASE_URL}/api/files/${fileId}`;
  };

  const openFile = (fileId) => {
    if (!fileId) return;
    const url = getFileUrl(fileId);
    window.open(url, '_blank');
  };

  const FileDisplay = ({ fileId, label, type }) => {
    if (!fileId) return null;

    const fileUrl = getFileUrl(fileId);
    const isImage = type === 'image' || label.toLowerCase().includes('logo') || label.toLowerCase().includes('signature');

    if (isImage) {
      return (
        <div className="file-display">
          <label>{label}:</label>
          <img 
            src={fileUrl} 
            alt={label} 
            onClick={() => openFile(fileId)}
            className="file-image"
          />
        </div>
      );
    }

    return (
      <div className="file-display">
        <label>{label}:</label>
        <button 
          onClick={() => openFile(fileId)}
          className="btn btn--secondary btn--sm"
        >
          View Document
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="container loading">Loading registrations...</div>;
  }

  if (error) {
    return <div className="container error">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>Seller Registrations - Admin Panel</h1>
      <p className="subtitle">Total Registrations: {registrations.length}</p>

      <div className="status-summary">
        <div className="status-card pending">
          <span className="count">{registrations.filter(r => r.status === 'pending').length}</span>
          <span className="label">Pending</span>
        </div>
        <div className="status-card approved">
          <span className="count">{registrations.filter(r => r.status === 'approved').length}</span>
          <span className="label">Approved</span>
        </div>
        <div className="status-card rejected">
          <span className="count">{registrations.filter(r => r.status === 'rejected').length}</span>
          <span className="label">Rejected</span>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="no-data">No registrations found</div>
      ) : (
        <div className="registrations-grid">
          {registrations.map((reg) => (
            <div key={reg._id} className="card">
              <div className="card__header">
                <h3>{reg.brandName}</h3>
                <span className={`status status--${reg.status}`}>
                  {reg.status === 'approved' && '✓ '}
                  {reg.status === 'rejected' && '✗ '}
                  {reg.status}
                </span>
              </div>

              <div className="card__body">
                <div className="info-group">
                  <p><strong>Request ID:</strong> {reg.requestId}</p>
                  <p><strong>Contact Name:</strong> {reg.contactName}</p>
                  <p><strong>Email:</strong> {reg.contactEmail}</p>
                  <p><strong>Phone:</strong> {reg.contactNumber}</p>
                  <p><strong>PAN:</strong> {reg.panNumber}</p>
                  <p><strong>GST Type:</strong> {reg.gstType}</p>
                </div>

                <div className="files-section">
                  <h4>Documents</h4>
                  <FileDisplay fileId={reg.brandLogoId} label="Brand Logo" type="image" />
                  <FileDisplay fileId={reg.gstCertificateId} label="GST Certificate" type="pdf" />
                  <FileDisplay fileId={reg.digitalSignatureId} label="Digital Signature" type="image" />
                </div>

                <div className="meta-info">
                  <p><small>Created: {new Date(reg.createdAt).toLocaleString()}</small></p>
                </div>

                {/* Admin Action Buttons */}
                <div className="admin-actions">
                  {reg.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => setShowApproveDialog(reg)}
                        className="btn btn--success btn--full-width"
                        style={{ marginBottom: '8px' }}
                      >
                        <CheckCircle size={18} style={{ marginRight: '8px' }} />
                        Approve
                      </button>
                      <button 
                        onClick={() => setShowRejectDialog(reg)}
                        className="btn btn--danger btn--full-width"
                      >
                        <XCircle size={18} style={{ marginRight: '8px' }} />
                        Reject
                      </button>
                    </>
                  )}

                  {reg.status === 'approved' && (
                    <div className="status-message approved-message">
                      <CheckCircle size={20} />
                      <span>Approved - User can login</span>
                    </div>
                  )}

                  {reg.status === 'rejected' && (
                    <div className="status-message rejected-message">
                      <XCircle size={20} />
                      <span>Rejected - User notified</span>
                    </div>
                  )}

                  <button 
                    onClick={() => setSelectedRegistration(reg)}
                    className="btn btn--outline btn--full-width"
                    style={{ marginTop: '8px' }}
                  >
                    <Eye size={18} style={{ marginRight: '8px' }} />
                    View Full Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      {showApproveDialog && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowApproveDialog(null)}>
          <div className="modal-content dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><CheckCircle size={24} style={{ color: '#28a745' }} /> Approve Seller</h2>
              <button 
                className="close-btn"
                onClick={() => setShowApproveDialog(null)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Brand:</strong> {showApproveDialog.brandName}</p>
              <p><strong>Contact:</strong> {showApproveDialog.contactName}</p>
              <p><strong>Email:</strong> {showApproveDialog.contactEmail}</p>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Optional Message to Seller:</label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Welcome message or additional instructions (optional)"
                  rows="4"
                  className="form-control"
                  disabled={actionLoading}
                />
              </div>

              <div className="dialog-actions">
                <button 
                  onClick={() => setShowApproveDialog(null)}
                  className="btn btn--secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleApprove(showApproveDialog.requestId)}
                  className="btn btn--success"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Approval'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRejectDialog(null)}>
          <div className="modal-content dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><XCircle size={24} style={{ color: '#dc3545' }} /> Reject Seller</h2>
              <button 
                className="close-btn"
                onClick={() => setShowRejectDialog(null)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Brand:</strong> {showRejectDialog.brandName}</p>
              <p><strong>Contact:</strong> {showRejectDialog.contactName}</p>
              <p><strong>Email:</strong> {showRejectDialog.contactEmail}</p>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Reason for Rejection: <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  rows="4"
                  className="form-control"
                  required
                  disabled={actionLoading}
                />
              </div>

              <div className="dialog-actions">
                <button 
                  onClick={() => {
                    setShowRejectDialog(null);
                    setRejectionReason('');
                  }}
                  className="btn btn--secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleReject(showRejectDialog.requestId)}
                  className="btn btn--danger"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedRegistration && (
        <div className="modal-overlay" onClick={() => setSelectedRegistration(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Full Registration Details</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedRegistration(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre>{JSON.stringify(selectedRegistration, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Show;