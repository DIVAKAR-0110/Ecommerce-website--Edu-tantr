 
import React, { useState, useEffect } from 'react';
import './Confirm.css';

const Confirm = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const defaultApprovalMessage = `Dear Seller,

Congratulations! Your product has been successfully reviewed and approved by our quality assurance team.

Your product meets all our listing standards and is now live on our platform. Customers can now discover and purchase your product.

Please ensure:
• Keep your inventory updated regularly
• Respond to customer queries within 24 hours
• Maintain product quality standards
• Ship orders within the promised timeframe

Thank you for being a valued seller partner!

Best regards,
SellerHub Admin Team`;

  const defaultRejectionMessage = `Dear Seller,

After reviewing your product submission, we found that it does not meet our current listing standards.

Common reasons for rejection:
• Incomplete or inaccurate product information
• Poor quality product images
• Pricing discrepancies or errors
• Missing required specifications
• Product category mismatch

Please review the product details, make necessary corrections, and resubmit for approval.

If you have any questions, contact support at 7010186524.

Best regards,
SellerHub Admin Team`;

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      const response = await fetch('/api/admin/products/pending');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (product) => {
    setSelectedProduct(product);
    setAdminMessage(defaultApprovalMessage);
    setShowApproveDialog(true);
  };

  const handleReject = (product) => {
    setSelectedProduct(product);
    setAdminMessage(defaultRejectionMessage);
    setShowRejectDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedProduct) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/products/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          adminMessage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Product approved successfully! Email sent to seller.');
        setShowApproveDialog(false);
        fetchPendingProducts(); // Refresh list
      } else {
        alert('Failed to approve product: ' + data.message);
      }
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Error approving product');
    } finally {
      setProcessing(false);
    }
  };

  const confirmRejection = async () => {
    if (!selectedProduct) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/admin/products/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          rejectionReason: adminMessage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Product rejected successfully! Email sent to seller.');
        setShowRejectDialog(false);
        fetchPendingProducts(); // Refresh list
      } else {
        alert('Failed to reject product: ' + data.message);
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Error rejecting product');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="confirm-container"><p className="loading">Loading pending products...</p></div>;
  }

  return (
    <div className="confirm-container">
      <h1>📦 Product Approval Dashboard</h1>
      <p className="subtitle">Review and approve/reject seller product submissions</p>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>✅ No pending products to review</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              {/* Seller Information */}
              <div className="section seller-info">
                <h3>👤 Seller Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Name:</strong> {product.seller.contactName}
                  </div>
                  <div className="info-item">
                    <strong>Request ID:</strong> {product.seller.requestId}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {product.seller.contactEmail}
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {product.seller.contactNumber}
                  </div>
                  <div className="info-item full-width">
                    <strong>Shipping Address:</strong> {product.seller.shippingAddress}
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="section product-info">
                <h3>📦 Product Details</h3>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <strong>Product Name:</strong> {product.itemName}
                  </div>
                  <div className="info-item">
                    <strong>Category:</strong> {product.category}
                  </div>
                  <div className="info-item">
                    <strong>Brand:</strong> {product.brandName}
                  </div>
                  <div className="info-item">
                    <strong>Manufacturer:</strong> {product.manufacturer}
                  </div>
                  <div className="info-item">
                    <strong>Product ID:</strong> {product.productId}
                  </div>
                  <div className="info-item">
                    <strong>Seller SKU:</strong> {product.sellerSKU || 'N/A'}
                  </div>
                  <div className="info-item">
                    <strong>Condition:</strong> {product.itemCondition}
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="section pricing-info">
                <h3>💰 Pricing & Stock</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>MRP:</strong> ₹{product.mrp}
                  </div>
                  <div className="info-item">
                    <strong>Listing Price:</strong> ₹{product.listingPrice}
                  </div>
                  <div className="info-item">
                    <strong>Selling Price:</strong> ₹{product.sellingPrice}
                  </div>
                  <div className="info-item">
                    <strong>Quantity:</strong> {product.quantity} units
                  </div>
                  {product.regionOfOrigin && (
                    <div className="info-item">
                      <strong>Origin:</strong> {product.regionOfOrigin}
                    </div>
                  )}
                  {product.hsnCode && (
                    <div className="info-item">
                      <strong>HSN Code:</strong> {product.hsnCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="section description-info">
                <h3>📝 Description</h3>
                <p className="description-text">{product.fullDescription}</p>
                {product.bulletPoints && product.bulletPoints.length > 0 && (
                  <div className="bullet-points">
                    <strong>Key Features:</strong>
                    <ul>
                      {product.bulletPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              {product.material && product.material.length > 0 && (
                <div className="section specs-info">
                  <h3>🔧 Specifications</h3>
                  <div className="info-item">
                    <strong>Materials:</strong> {product.material.join(', ')}
                  </div>
                  {product.modelName && (
                    <div className="info-item">
                      <strong>Model:</strong> {product.modelName}
                    </div>
                  )}
                </div>
              )}

              {/* Submission Info */}
              <div className="section submission-info">
                <h3>📅 Submission Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Submitted:</strong> {new Date(product.submittedAt).toLocaleString('en-IN')}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong> <span className="status-pending">Pending Review</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-approve" onClick={() => handleApprove(product)}>
                  ✓ Approve Product
                </button>
                <button className="btn-reject" onClick={() => handleReject(product)}>
                  ✗ Reject Product
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      {showApproveDialog && (
        <div className="modal-overlay" onClick={() => !processing && setShowApproveDialog(false)}>
          <div className="modal-content approve-modal" onClick={(e) => e.stopPropagation()}>
            <h2>✅ Approve Product</h2>
            <p>Product: <strong>{selectedProduct?.itemName}</strong></p>
            <p>Seller: <strong>{selectedProduct?.seller.contactName}</strong></p>
            
            <label>Message to Seller:</label>
            <textarea
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              rows="12"
              placeholder="Enter approval message..."
            />
            
            <div className="modal-actions">
              <button onClick={() => setShowApproveDialog(false)} disabled={processing}>Cancel</button>
              <button className="btn-confirm-approve" onClick={confirmApproval} disabled={processing}>
                {processing ? 'Processing...' : 'Confirm Approval & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="modal-overlay" onClick={() => !processing && setShowRejectDialog(false)}>
          <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
            <h2>❌ Reject Product</h2>
            <p>Product: <strong>{selectedProduct?.itemName}</strong></p>
            <p>Seller: <strong>{selectedProduct?.seller.contactName}</strong></p>
            
            <label>Rejection Reason:</label>
            <textarea
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              rows="12"
              placeholder="Enter rejection reason..."
            />
            
            <div className="modal-actions">
              <button onClick={() => setShowRejectDialog(false)} disabled={processing}>Cancel</button>
              <button className="btn-confirm-reject" onClick={confirmRejection} disabled={processing}>
                {processing ? 'Processing...' : 'Confirm Rejection & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Confirm;
