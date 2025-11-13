 
 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Manage.css';

const Manage = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [editableData, setEditableData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrimaryImageWarning, setShowPrimaryImageWarning] = useState(false);

  // File uploads
  const [newPrimaryImage, setNewPrimaryImage] = useState(null);
  const [newAdditionalImages, setNewAdditionalImages] = useState([]);


  

  const sections = {
    'Basic Details': ['itemName', 'category', 'brandName', 'manufacturer', 'productId', 'itemCondition'],
    'Pricing': ['mrp', 'listingPrice', 'sellingPrice', 'quantity', 'sellerSKU', 'hsnCode', 'regionOfOrigin'],
    'Description': ['fullDescription', 'bulletPoints'],
    'Images': ['primaryImage', 'additionalImages'],
    'Technical Specs': ['styleModelNumber', 'modelName', 'material', 'dimensions', 'unitCount', 'unitType', 'numberOfBoxes'],
    'Variations': ['hasVariation', 'variations']
  };

  const fieldLabels = {
    itemName: 'Product Name',
    category: 'Category',
    brandName: 'Brand Name',
    manufacturer: 'Manufacturer',
    productId: 'Product ID',
    itemCondition: 'Condition',
    mrp: 'MRP',
    listingPrice: 'Listing Price',
    sellingPrice: 'Selling Price',
    quantity: 'Quantity',
    sellerSKU: 'Seller SKU',
    hsnCode: 'HSN Code',
    regionOfOrigin: 'Region of Origin',
    fullDescription: 'Description',
    bulletPoints: 'Bullet Points',
    primaryImage: 'Primary Image',
    additionalImages: 'Additional Images',
    styleModelNumber: 'Style/Model Number',
    modelName: 'Model Name',
    material: 'Materials',
    dimensions: 'Dimensions',
    unitCount: 'Unit Count',
    unitType: 'Unit Type',
    numberOfBoxes: 'Number of Boxes',
    hasVariation: 'Has Variation',
    variations: 'Variation Details'
  };


  // Add to existing states at the top
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [showDeleteWarning, setShowDeleteWarning] = useState(false);
const [deletionReason, setDeletionReason] = useState('');
const [deleting, setDeleting] = useState(false);

// Add delete handler
const handleDelete = () => {
  setShowDeleteWarning(true);
};

const confirmDelete = () => {
  setShowDeleteWarning(false);
  setShowDeleteDialog(true);
};

const executeDelete = async () => {
  if (!deletionReason.trim()) {
    alert('Please provide a reason for deletion');
    return;
  }

  setDeleting(true);

  try {
    const response = await fetch('/api/seller/product/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct._id,
        sellerRequestId: seller.requestId,
        deletionReason
      })
    });

    const result = await response.json();

    if (result.success) {
      alert(`✅ Product deleted successfully!\n\nSKU "${result.deletedSKU.sku}" is now blocked for 24 hours.\n\nExpires at: ${new Date(result.deletedSKU.expiresAt).toLocaleString('en-IN')}`);
      setShowDeleteDialog(false);
      setShowEditDialog(false);
      window.location.reload(); // Reload page
    } else {
      alert('Failed to delete product: ' + result.message);
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Error deleting product');
  } finally {
    setDeleting(false);
  }
};


  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sellerSession'));
    if (!session || Date.now() > session.expiresAt) {
      localStorage.removeItem('sellerSession');
      navigate('/SellerLogin');
      return;
    }
    setSeller(session.seller);
    fetchProducts(session.seller.requestId);
  }, [navigate]);

  const fetchProducts = async (requestId) => {
    try {
      const response = await fetch(`/api/seller/products/${requestId}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditableData({ ...product });
    setShowEditDialog(true);
    setSelectedSection('');
    setSelectedFields([]);
    setEditMode(false);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setSelectedFields([]);
    setEditMode(false);
  };

  const handleFieldSelection = (field) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  const enableEditing = () => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to edit');
      return;
    }
    
    // Check if primary image is selected
    if (selectedFields.includes('primaryImage')) {
      setShowPrimaryImageWarning(true);
      return;
    }
    
    setEditMode(true);
  };

  const confirmPrimaryImageEdit = () => {
    setShowPrimaryImageWarning(false);
    setEditMode(true);
  };

  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

 


const handleSave = async () => {
  if (!selectedProduct || selectedFields.length === 0) return;
  
  setSaving(true);

  try {
    const formData = new FormData();
    formData.append('productId', selectedProduct._id);
    formData.append('sellerRequestId', seller.requestId); // ✅ FIXED: Use requestId instead of _id
    formData.append('section', selectedSection);
    formData.append('fieldsToEdit', JSON.stringify(selectedFields));

    // Prepare updates object
    const updates = {};
    selectedFields.forEach(field => {
      if (field !== 'primaryImage' && field !== 'additionalImages') {
        updates[field] = editableData[field];
      }
    });

    formData.append('updates', JSON.stringify(updates));

    // Handle image uploads
    if (selectedFields.includes('primaryImage') && newPrimaryImage) {
      formData.append('primaryImage', newPrimaryImage);
    }

    if (selectedFields.includes('additionalImages') && newAdditionalImages.length > 0) {
      newAdditionalImages.forEach(img => {
        formData.append('additionalImages', img);
      });
    }

    const response = await fetch('/api/seller/product/update', {
      method: 'PUT',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      alert('✅ Product updated successfully!\nEdit history has been recorded.');
      setShowEditDialog(false);
      fetchProducts(seller.requestId); // Refresh list
    } else {
      alert('Failed to update product: ' + result.message);
    }

  } catch (error) {
    console.error('Error updating product:', error);
    alert('Error updating product');
  } finally {
    setSaving(false);
  }
};







  const renderFieldValue = (field, value) => {
    if (field === 'bulletPoints' && Array.isArray(value)) {
      return (
        <ul className="bullet-list">
          {value.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      );
    }

    if (field === 'material' && Array.isArray(value)) {
      return value.join(', ');
    }

    if (field === 'variations' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    if (field === 'dimensions' && typeof value === 'object') {
      return (
        <div className="dimensions-display">
          {Object.entries(value).map(([key, val]) => (
            val.value && <div key={key}>{key}: {val.value} {val.unit}</div>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return value || 'N/A';
  };

  const renderEditableField = (field, value) => {
    const isEditable = selectedFields.includes(field) && editMode;

    if (field === 'primaryImage') {
      return (
        <div>
          <p>Current: {value ? 'Image uploaded' : 'No image'}</p>
          {isEditable && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPrimaryImage(e.target.files[0])}
            />
          )}
        </div>
      );
    }

    if (field === 'additionalImages') {
      return (
        <div>
          <p>Current: {value?.length || 0} images</p>
          {isEditable && (
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewAdditionalImages(Array.from(e.target.files))}
            />
          )}
        </div>
      );
    }

    if (field === 'fullDescription') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={!isEditable}
          rows="4"
          className={isEditable ? 'editable' : 'readonly'}
        />
      );
    }

    if (field === 'bulletPoints' && Array.isArray(value)) {
      return (
        <div>
          {value.map((point, idx) => (
            <input
              key={idx}
              type="text"
              value={point}
              onChange={(e) => {
                if (isEditable) {
                  const newBullets = [...value];
                  newBullets[idx] = e.target.value;
                  handleFieldChange(field, newBullets);
                }
              }}
              disabled={!isEditable}
              className={isEditable ? 'editable' : 'readonly'}
            />
          ))}
        </div>
      );
    }

    if (field === 'itemCondition') {
      return (
        <select
          value={value || 'New'}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={!isEditable}
          className={isEditable ? 'editable' : 'readonly'}
        >
          <option value="New">New</option>
          <option value="Used">Used</option>
        </select>
      );
    }

    if (['mrp', 'listingPrice', 'sellingPrice', 'quantity', 'unitCount', 'numberOfBoxes'].includes(field)) {
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => handleFieldChange(field, parseFloat(e.target.value))}
          disabled={!isEditable}
          className={isEditable ? 'editable' : 'readonly'}
        />
      );
    }

    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        disabled={!isEditable}
        className={isEditable ? 'editable' : 'readonly'}
      />
    );
  };

  if (loading) {
    return <div className="manage-container"><p className="loading">Loading products...</p></div>;
  }

  if (!seller) return null;

  return (
    <div className="manage-container">
      {/* Seller Header */}
      <div className="seller-header">
        <h1>🔧 Manage Inventory</h1>
        <div className="seller-info-card">
          <div className="info-row">
            <div className="info-item">
              <strong>Seller:</strong> {seller.contactName}
            </div>
            <div className="info-item">
              <strong>Request ID:</strong> {seller.requestId}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {seller.contactEmail}
            </div>
            <div className="info-item">
              <strong>Phone:</strong> {seller.contactNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products to manage</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>{product.itemName}</td>
                  <td>{product.category}</td>
                  <td>{product.brandName}</td>
                  <td>₹{product.listingPrice}</td>
                  <td>{product.quantity}</td>
                  <td>
                    <span className={`status-badge status-${product.status}`}>
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(product)} className="btn-edit">
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditDialog(false)}>
          <div className="edit-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditDialog(false)}>✕</button>
            
            <h2>Edit Product</h2>
            <p className="product-name">{selectedProduct.itemName}</p>

            <div className="dialog-body">
              {/* Center Area - Field Details */}
              <div className="center-area">
                <h3>Product Details</h3>
                {!selectedSection && (
                  <p className="placeholder-text">Select a section from the right to view details</p>
                )}
                
                {selectedSection && sections[selectedSection] && (
                  <div className="section-details">
                    {sections[selectedSection].map(field => (
                      <div key={field} className="field-row">
                        <label>{fieldLabels[field]}:</label>
                        {!editMode ? (
                          <div className="field-value">
                            {renderFieldValue(field, editableData[field])}
                          </div>
                        ) : (
                          <div className="field-edit">
                            {renderEditableField(field, editableData[field])}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Right Side - Section & Field Selection */}
              <div className="right-sidebar">
                <h3>Select Section</h3>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="section-dropdown"
                >
                  <option value="">-- Choose Section --</option>
                  {Object.keys(sections).map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>

                {selectedSection && (
                  <>
                    <h3>Select Fields to Edit</h3>
                    <div className="field-checkboxes">
                      {sections[selectedSection].map(field => (
                        <label key={field} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field)}
                            onChange={() => handleFieldSelection(field)}
                            disabled={editMode}
                          />
                          {fieldLabels[field]}
                        </label>
                      ))}
                    </div>

                    {!editMode && selectedFields.length > 0 && (
                      <button onClick={enableEditing} className="btn-enable-edit">
                        Enable Editing
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
          {/* Actions */}
<div className="dialog-actions">
  <button onClick={handleDelete} className="btn-delete">
    🗑️ Remove Product
  </button>
  <div className="right-actions">
    <button onClick={() => setShowEditDialog(false)} className="btn-cancel">
      Cancel
    </button>
    {editMode && (
      <button onClick={handleSave} disabled={saving} className="btn-save">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    )}
  </div>
</div>



          
          </div>
        </div>
      )}

      {/* Primary Image Warning */}
      {showPrimaryImageWarning && (
        <div className="modal-overlay">
          <div className="warning-dialog">
            <h2>⚠️ Warning</h2>
            <p>You are about to edit the <strong>Primary Image</strong>.</p>
            <p>If the new image is incorrect or does not meet quality standards, your product may be <strong>rejected</strong>.</p>
            <p>Are you sure you want to proceed?</p>
            <div className="warning-actions">
              <button onClick={() => setShowPrimaryImageWarning(false)} className="btn-no">
                No, Cancel
              </button>
              <button onClick={confirmPrimaryImageEdit} className="btn-yes">
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Warning Dialog */}
{showDeleteWarning && (
  <div className="modal-overlay">
    <div className="warning-dialog">
      <h2>⚠️ Delete Product Warning</h2>
      <p>You are about to <strong>permanently delete</strong> this product:</p>
      <div className="product-warn-box">
        <p><strong>Product:</strong> {selectedProduct.itemName}</p>
        <p><strong>SKU:</strong> {selectedProduct.productId}</p>
        <p><strong>Category:</strong> {selectedProduct.category}</p>
      </div>
      <div className="warning-points">
        <p><strong>Important:</strong></p>
        <ul>
          <li>This action cannot be undone</li>
          <li>The SKU <strong>"{selectedProduct.productId}"</strong> will be blocked for <strong>24 hours</strong></li>
          <li>You cannot create a new product with this SKU for 24 hours</li>
          <li>All product data will be permanently removed</li>
        </ul>
      </div>
      <p className="confirm-text">Are you sure you want to continue?</p>
      <div className="warning-actions">
        <button onClick={() => setShowDeleteWarning(false)} className="btn-no">
          No, Keep Product
        </button>
        <button onClick={confirmDelete} className="btn-yes-delete">
          Yes, Delete Product
        </button>
      </div>
    </div>
  </div>
)}

{/* Delete Reason Dialog */}
{showDeleteDialog && (
  <div className="modal-overlay">
    <div className="delete-dialog">
      <h2>📝 Provide Deletion Reason</h2>
      <p>Please explain why you are deleting this product:</p>
      <textarea
        value={deletionReason}
        onChange={(e) => setDeletionReason(e.target.value)}
        placeholder="e.g., Product discontinued, Out of stock permanently, Wrong listing, etc."
        rows="6"
        className="reason-textarea"
      />
      <div className="delete-dialog-actions">
        <button 
          onClick={() => {
            setShowDeleteDialog(false);
            setDeletionReason('');
          }} 
          className="btn-cancel"
        >
          Cancel
        </button>
        <button 
          onClick={executeDelete} 
          disabled={deleting || !deletionReason.trim()} 
          className="btn-confirm-delete"
        >
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Manage;
