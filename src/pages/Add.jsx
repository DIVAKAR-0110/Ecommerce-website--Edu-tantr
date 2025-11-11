 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Add.css';

const Add = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manufacturer editing states
  const [editManufacturer, setEditManufacturer] = useState(false);
  const [addNewManufacturer, setAddNewManufacturer] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    hasVariation: null,
    productId: '',
    autoGenerateSKU: false,
    itemName: '',
    manufacturer: '',
    brandName: '',
    
    sellerSKU: '',
    sellingPrice: '',
    listingPrice: '',
    quantity: '',
    itemCondition: 'New',
    regionOfOrigin: '',
    hsnCode: '',
    mrp: '',
    
    primaryImage: null,
    additionalImages: [],
    
    fullDescription: '',
    bulletPoints: ['', '', '', '', ''],
    
    styleModelNumber: '',
    dimensions: {
      length: { value: '', unit: 'cm' },
      width: { value: '', unit: 'cm' },
      height: { value: '', unit: 'cm' },
      diameter: { value: '', unit: 'cm' },
      capacity: { value: '', unit: 'ml' },
      weight: { value: '', unit: 'g' },
      thickness: { value: '', unit: 'mm' },
      sizeLabel: ''
    },
    dimensionDescription: '',
    unitCount: '',
    unitType: 'Piece',
    modelName: '',
    material: [],
    numberOfBoxes: '',
    
    variations: {
      color: [],
      itemShape: '',
      size: [],
      storage: [],
      pattern: [],
      style: []
    }
  });

  const businessCategories = [
    'Grocery & Daily Essentials',
    'Fresh Fruits & Vegetables',
    'Clothing & Fashion',
    'Electronics & Mobile Accessories',
    'Home Appliances & Furniture',
    'Beauty & Personal Care',
    'Medicines & Health Products',
    'Books & Stationery',
    'Sports & Fitness Equipment',
    'Toys & Baby Products',
    'Jewelry & Accessories',
    'Footwear & Bags',
    'Automotive Parts & Accessories',
    'Hardware & Tools',
    'Restaurant & Food Services',
    'All Others (Specify)'
  ];

  const materials = ['Steel', 'Plastic', 'Glass', 'Fabric', 'Leather', 'Wood', 'Aluminum', 'Rubber', 'Silicone', 'Ceramic', 'Carbon Fiber'];
  const unitTypes = ['Piece', 'Pack', 'Pair', 'Set', 'ml', 'L', 'g', 'kg'];
  const lengthUnits = ['cm', 'mm', 'inch', 'meter', 'feet'];
  const weightUnits = ['g', 'kg', 'mg', 'pound (lb)', 'ounce (oz)'];
  const capacityUnits = ['ml', 'L', 'cubic cm (cc)', 'cubic inch'];
  const itemShapes = ['Round', 'Cylindrical', 'Square', 'Rectangular', 'Oval', 'Triangular', 'Hexagonal', 'Irregular'];

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sellerSession'));
    if (!session || Date.now() > session.expiresAt) {
      localStorage.removeItem('sellerSession');
      navigate('/SellerLogin');
      return;
    }
    setSeller(session.seller);
    
    // FIXED: Auto-fill from seller.manufacturerName and seller.brandName
    setFormData(prev => ({
      ...prev,
      manufacturer: session.seller.manufacturerName || '',
      brandName: session.seller.brandName || ''
    }));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariationChoice = (choice) => {
    setFormData(prev => ({ ...prev, hasVariation: choice }));
  };

  const handleDimensionChange = (field, key, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: {
          ...prev.dimensions[field],
          [key]: value
        }
      }
    }));
  };

  const handleBulletPointChange = (index, value) => {
    const newBulletPoints = [...formData.bulletPoints];
    newBulletPoints[index] = value;
    setFormData(prev => ({ ...prev, bulletPoints: newBulletPoints }));
  };

  const addBulletPoint = () => {
    setFormData(prev => ({
      ...prev,
      bulletPoints: [...prev.bulletPoints, '']
    }));
  };

  const handleMaterialChange = (material) => {
    setFormData(prev => {
      const materials = prev.material.includes(material)
        ? prev.material.filter(m => m !== material)
        : [...prev.material, material];
      return { ...prev, material: materials };
    });
  };

  const validateForm = () => {
    if (!formData.category) {
      alert('Please select a category');
      return false;
    }
    
    if (formData.category === 'All Others (Specify)' && !formData.customCategory) {
      alert('Please specify your custom category');
      return false;
    }
    
    if (formData.hasVariation === null) {
      alert('Please select if product has variations');
      return false;
    }
    
    if (!formData.itemName) {
      alert('Please enter item name');
      return false;
    }
    
    if (!formData.mrp || !formData.listingPrice || !formData.sellingPrice) {
      alert('Please enter all pricing details');
      return false;
    }
    
    if (parseFloat(formData.sellingPrice) > parseFloat(formData.listingPrice)) {
      alert('Selling Price cannot be greater than Listing Price');
      return false;
    }
    
    if (parseFloat(formData.sellingPrice) > parseFloat(formData.mrp)) {
      alert('Selling Price cannot be greater than MRP');
      return false;
    }
    
    if (formData.itemCondition === 'Used' && parseFloat(formData.listingPrice) > parseFloat(formData.mrp) * 0.5) {
      alert('For used items, Listing Price must be <= 50% of MRP');
      return false;
    }
    
    if (!formData.quantity || formData.quantity < 0) {
      alert('Please enter valid quantity');
      return false;
    }
    
    if (!formData.primaryImage) {
      alert('Please upload primary product image');
      return false;
    }
    
    if (!formData.fullDescription) {
      alert('Please enter product description');
      return false;
    }
    
    const validBulletPoints = formData.bulletPoints.filter(bp => bp.trim());
    if (validBulletPoints.length < 5) {
      alert('Please enter at least 5 bullet points');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!seller) {
      alert('Session expired. Please login again.');
      navigate('/SellerLogin');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const submitData = new FormData();
      
      submitData.append('sellerRequestId', seller.requestId);
      submitData.append('category', formData.category);
      if (formData.category === 'All Others (Specify)') {
        submitData.append('customCategory', formData.customCategory);
      }
      submitData.append('hasVariation', formData.hasVariation);
      
      if (!formData.autoGenerateSKU && formData.productId) {
        submitData.append('productId', formData.productId);
      }
      
      submitData.append('itemName', formData.itemName);
      submitData.append('manufacturer', formData.manufacturer);
      submitData.append('brandName', formData.brandName);
      submitData.append('sellerSKU', formData.sellerSKU);
      submitData.append('sellingPrice', formData.sellingPrice);
      submitData.append('listingPrice', formData.listingPrice);
      submitData.append('quantity', formData.quantity);
      submitData.append('itemCondition', formData.itemCondition);
      submitData.append('regionOfOrigin', formData.regionOfOrigin);
      submitData.append('hsnCode', formData.hsnCode);
      submitData.append('mrp', formData.mrp);
      submitData.append('fullDescription', formData.fullDescription);
      submitData.append('bulletPoints', JSON.stringify(formData.bulletPoints.filter(bp => bp.trim())));
      submitData.append('styleModelNumber', formData.styleModelNumber);
      submitData.append('dimensions', JSON.stringify(formData.dimensions));
      submitData.append('dimensionDescription', formData.dimensionDescription);
      submitData.append('unitCount', formData.unitCount);
      submitData.append('unitType', formData.unitType);
      submitData.append('modelName', formData.modelName);
      submitData.append('material', JSON.stringify(formData.material));
      submitData.append('numberOfBoxes', formData.numberOfBoxes);
      submitData.append('variations', JSON.stringify(formData.variations));

      if (formData.primaryImage) {
        submitData.append('primaryImage', formData.primaryImage);
      }
      formData.additionalImages.forEach(img => {
        submitData.append('additionalImages', img);
      });

      const response = await fetch('/api/products/add', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmissionResult(result);
        setShowSuccessDialog(true);
      } else {
        alert('Failed to submit product: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Error submitting product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!seller) return null;

  return (
    <div className="add-product-container">
      <div className="add-header">
        <h1>Add New Product</h1>
        <p>Seller: <strong>{seller.contactName}</strong> | Request ID: {seller.requestId}</p>
      </div>

      <form onSubmit={handleSubmit} className="add-product-form">
        {/* SECTION 1: Basic Details */}
        <section className="form-section">
          <h2>📋 Section 1 — Basic Details</h2>
          
          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleInputChange} required>
              <option value="">-- Select Product Category --</option>
              {businessCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {formData.category === 'All Others (Specify)' && (
            <div className="form-group">
              <label>Specify Your Category *</label>
              <input
                type="text"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleInputChange}
                placeholder="e.g., Pet Supplies, Gardening Tools"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Does the product have variation? *</label>
            <div className="variation-toggle">
              <button
                type="button"
                className={`toggle-btn ${formData.hasVariation === true ? 'active yes-active' : ''}`}
                onClick={() => handleVariationChoice(formData.hasVariation === true ? null : true)}
              >
                ✓ Yes
              </button>
              <button
                type="button"
                className={`toggle-btn ${formData.hasVariation === false ? 'active no-active' : ''}`}
                onClick={() => handleVariationChoice(formData.hasVariation === false ? null : false)}
              >
                ✗ No
              </button>
            </div>
            <small className="help-text">Select Yes if product has color, size, or style variations</small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="autoGenerateSKU"
                checked={formData.autoGenerateSKU}
                onChange={handleInputChange}
              />
              I don't have a product ID (System will generate unique SKU)
            </label>
          </div>

          {!formData.autoGenerateSKU && (
            <div className="form-group">
              <label>Product ID</label>
              <input
                type="text"
                name="productId"
                value={formData.productId}
                onChange={handleInputChange}
                placeholder="e.g., PROD-12345, ABC-XYZ-001"
              />
              <small className="help-text">Your internal product identification code</small>
            </div>
          )}

          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              maxLength={100}
              required
              placeholder="e.g., Stainless Steel Water Bottle 1L with Carrying Handle"
            />
            <small className="help-text">Max 100 characters. Be descriptive and clear.</small>
          </div>

          {/* ENHANCED MANUFACTURER SECTION */}
          <div className="form-group">
            <label>Manufacturer</label>
            
            <div className="manufacturer-display">
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., ABC Manufacturing Ltd."
                disabled={!editManufacturer && !addNewManufacturer}
                className={editManufacturer || addNewManufacturer ? 'editable' : 'readonly'}
              />
            </div>
            
            <div className="manufacturer-actions">
              {formData.manufacturer && !addNewManufacturer && (
                <>
                  <button
                    type="button"
                    className={`action-btn keep-btn ${!editManufacturer && !addNewManufacturer ? 'active' : ''}`}
                    onClick={() => {
                      setEditManufacturer(false);
                      setAddNewManufacturer(false);
                      // Restore original manufacturer
                      setFormData(prev => ({ ...prev, manufacturer: seller.manufacturerName || '' }));
                    }}
                  >
                    ✓ Keep Current
                  </button>
                  <button
                    type="button"
                    className={`action-btn edit-btn ${editManufacturer ? 'active' : ''}`}
                    onClick={() => {
                      setEditManufacturer(!editManufacturer);
                      setAddNewManufacturer(false);
                    }}
                  >
                    ✏️ Edit Manufacturer
                  </button>
                </>
              )}
              
              <button
                type="button"
                className={`action-btn add-btn ${addNewManufacturer ? 'active' : ''}`}
                onClick={() => {
                  setAddNewManufacturer(!addNewManufacturer);
                  setEditManufacturer(false);
                  if (!addNewManufacturer) {
                    setFormData(prev => ({ ...prev, manufacturer: '' }));
                  } else {
                    setFormData(prev => ({ ...prev, manufacturer: seller.manufacturerName || '' }));
                  }
                }}
              >
                + Add New Manufacturer
              </button>
            </div>
            
            <small className="help-text">
              {editManufacturer && '✏️ Edit the manufacturer name from your registration'}
              {addNewManufacturer && '➕ Enter a new manufacturer name for this product'}
              {!editManufacturer && !addNewManufacturer && `📋 Auto-filled from registration: ${seller.manufacturerName || 'Not specified'}`}
            </small>
          </div>

          <div className="form-group">
            <label>Brand Name</label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleInputChange}
              placeholder="e.g., Nike, Samsung, Generic"
            />
            <small className="help-text">Auto-filled from registration: {seller.brandName || 'Generic'}. Edit if needed.</small>
          </div>
        </section>

        {/* SECTION 2: Offer & Pricing */}
        <section className="form-section">
          <h2>💰 Section 2 — Offer & Pricing</h2>
          
          <div className="form-group">
            <label>Seller SKU</label>
            <input
              type="text"
              name="sellerSKU"
              value={formData.sellerSKU}
              onChange={handleInputChange}
              placeholder="e.g., WB-SS-1L-BLK (Your internal stock keeping unit code)"
            />
            <small className="help-text">Your internal code to track this product in inventory</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>MRP (Maximum Retail Price) *</label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                placeholder="e.g., 599.00"
              />
              <small className="help-text">Official maximum retail price printed on product</small>
            </div>

            <div className="form-group">
              <label>Listing Price * (Display Price)</label>
              <input
                type="number"
                name="listingPrice"
                value={formData.listingPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                placeholder="e.g., 499.00"
              />
              <small className="help-text">Price shown to customers</small>
            </div>

            <div className="form-group">
              <label>Your Selling Price *</label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                placeholder="e.g., 450.00"
              />
              <small className="help-text">Must be ≤ Listing Price and ≤ MRP</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity (Units in stock) *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                required
                placeholder="e.g., 100"
              />
              <small className="help-text">How many units you have available to sell</small>
            </div>

            <div className="form-group">
              <label>Item Condition *</label>
              <select name="itemCondition" value={formData.itemCondition} onChange={handleInputChange} required>
                <option value="New">New</option>
                <option value="Used">Used (Listing Price auto-limited to 50% MRP)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Region of Origin</label>
            <input
              type="text"
              name="regionOfOrigin"
              value={formData.regionOfOrigin}
              onChange={handleInputChange}
              placeholder="e.g., Maharashtra, India / Made in China"
            />
            <small className="help-text">Where this product was manufactured or sourced</small>
          </div>

          <div className="form-group">
            <label>HSN Code <a href="https://www.google.com/search?q=HSN+code+finder" target="_blank" rel="noreferrer" className="help-link">Search on Google</a></label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleInputChange}
              placeholder="e.g., 7323 (for steel utensils)"
            />
            <small className="help-text">Harmonized System of Nomenclature code for tax purposes</small>
          </div>
        </section>

        {/* SECTION 3: Product Images */}
        <section className="form-section">
          <h2>📷 Section 3 — Product Images</h2>
          
          <div className="form-group">
            <label>Primary Image * (White Background, JPG/PNG)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setFormData(prev => ({ ...prev, primaryImage: e.target.files[0] }))}
              required
            />
            <small className="help-text">Main product photo with plain white background. High quality, well-lit.</small>
          </div>

          <div className="form-group">
            <label>Additional Images (Max 6, any background)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFormData(prev => ({ ...prev, additionalImages: Array.from(e.target.files).slice(0, 6) }))}
            />
            <small className="help-text">Show product from different angles, in-use photos, packaging, etc.</small>
          </div>
        </section>

        {/* SECTION 4: Product Description */}
        <section className="form-section">
          <h2>📝 Section 4 — Product Description</h2>
          
          <div className="form-group">
            <label>Full Description *</label>
            <textarea
              name="fullDescription"
              value={formData.fullDescription}
              onChange={handleInputChange}
              rows="6"
              required
              placeholder="Describe your product in detail. What is it? What problem does it solve? Who is it for? Include key features, benefits, usage instructions, care instructions, etc."
            />
            <small className="help-text">Write a comprehensive description explaining the product</small>
          </div>

          <div className="form-group">
            <label>Bullet Points (At least 5) *</label>
            {formData.bulletPoints.map((point, index) => (
              <input
                key={index}
                type="text"
                value={point}
                onChange={(e) => handleBulletPointChange(index, e.target.value)}
                placeholder={`Key feature ${index + 1}: e.g., "BPA-free food-grade stainless steel"`}
                required={index < 5}
                className="bullet-input"
              />
            ))}
            <button type="button" onClick={addBulletPoint} className="add-bullet-btn">
              + Add More Bullet Points
            </button>
            <small className="help-text">Highlight key features in short, scannable points</small>
          </div>
        </section>

        {/* SECTION 5: Technical Specifications */}
        <section className="form-section">
          <h2>🔧 Section 5 — Technical Specifications</h2>
          
          <div className="form-group">
            <label>Style / Model Number (SKU Style)</label>
            <input
              type="text"
              name="styleModelNumber"
              value={formData.styleModelNumber}
              onChange={handleInputChange}
              placeholder="e.g., MOD-2024-BLK-XL"
            />
            <small className="help-text">Helps identify product variants</small>
          </div>

          <h3>Dimensions</h3>
          <div className="dimensions-grid">
            {['length', 'width', 'height', 'diameter'].map(dim => (
              <div key={dim} className="dimension-group">
                <label>{dim.charAt(0).toUpperCase() + dim.slice(1)}</label>
                <div className="dimension-input-group">
                  <input
                    type="number"
                    value={formData.dimensions[dim].value}
                    onChange={(e) => handleDimensionChange(dim, 'value', e.target.value)}
                    placeholder="0"
                    step="0.01"
                  />
                  <select
                    value={formData.dimensions[dim].unit}
                    onChange={(e) => handleDimensionChange(dim, 'unit', e.target.value)}
                  >
                    {lengthUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="dimension-group">
              <label>Weight</label>
              <div className="dimension-input-group">
                <input
                  type="number"
                  value={formData.dimensions.weight.value}
                  onChange={(e) => handleDimensionChange('weight', 'value', e.target.value)}
                  placeholder="0"
                  step="0.01"
                />
                <select
                  value={formData.dimensions.weight.unit}
                  onChange={(e) => handleDimensionChange('weight', 'unit', e.target.value)}
                >
                  {weightUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
            </div>

            <div className="dimension-group">
              <label>Capacity / Volume</label>
              <div className="dimension-input-group">
                <input
                  type="number"
                  value={formData.dimensions.capacity.value}
                  onChange={(e) => handleDimensionChange('capacity', 'value', e.target.value)}
                  placeholder="0"
                  step="0.01"
                />
                <select
                  value={formData.dimensions.capacity.unit}
                  onChange={(e) => handleDimensionChange('capacity', 'unit', e.target.value)}
                >
                  {capacityUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
            </div>

            <div className="dimension-group">
              <label>Thickness</label>
              <div className="dimension-input-group">
                <input
                  type="number"
                  value={formData.dimensions.thickness.value}
                  onChange={(e) => handleDimensionChange('thickness', 'value', e.target.value)}
                  placeholder="0"
                  step="0.01"
                />
                <select
                  value={formData.dimensions.thickness.unit}
                  onChange={(e) => handleDimensionChange('thickness', 'unit', e.target.value)}
                >
                  <option value="mm">mm</option>
                  <option value="micron">micron</option>
                  <option value="gauge">gauge</option>
                </select>
              </div>
            </div>

            <div className="dimension-group">
              <label>Size Label (for clothing/shoes)</label>
              <input
                type="text"
                value={formData.dimensions.sizeLabel}
                onChange={(e) => handleDimensionChange('sizeLabel', 'value', e.target.value)}
                placeholder="e.g., XL, 42 EU, 10 US"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Dimension Description (For complex shapes)</label>
            <textarea
              name="dimensionDescription"
              value={formData.dimensionDescription}
              onChange={handleInputChange}
              rows="3"
              placeholder="e.g., Curved ergonomic handle, bottle neck tapering from 5cm to 3cm diameter"
            />
            <small className="help-text">Describe unique shape features that numbers can't capture</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Unit Count</label>
              <input
                type="number"
                name="unitCount"
                value={formData.unitCount}
                onChange={handleInputChange}
                placeholder="e.g., 1, 6, 12"
              />
              <small className="help-text">How many items in this pack?</small>
            </div>

            <div className="form-group">
              <label>Unit Type</label>
              <select name="unitType" value={formData.unitType} onChange={handleInputChange}>
                {unitTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Model Name</label>
              <input
                type="text"
                name="modelName"
                value={formData.modelName}
                onChange={handleInputChange}
                placeholder="e.g., Pro Series 2024, Elite Edition"
              />
            </div>

            <div className="form-group">
              <label>Number of Boxes Included</label>
              <input
                type="number"
                name="numberOfBoxes"
                value={formData.numberOfBoxes}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2"
              />
              <small className="help-text">For shipping/packaging info</small>
            </div>
          </div>

          <div className="form-group">
            <label>Material (Select Multiple)</label>
            <div className="material-checkboxes">
              {materials.map(mat => (
                <label key={mat} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.material.includes(mat)}
                    onChange={() => handleMaterialChange(mat)}
                  />
                  {mat}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: Variation (shown only if Yes selected) */}
        {formData.hasVariation === true && (
          <section className="form-section">
            <h2>🎨 Section 6 — Product Variations</h2>
            <p className="variation-note">Add variation options available for this product</p>
            
            <div className="form-group">
              <label>Colors (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Red, Blue, Green, Black, White"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  variations: { ...prev.variations, color: e.target.value.split(',').map(c => c.trim()).filter(c => c) }
                }))}
              />
            </div>

            <div className="form-group">
              <label>Sizes (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., S, M, L, XL, XXL"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  variations: { ...prev.variations, size: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                }))}
              />
            </div>

            <div className="form-group">
              <label>Item Shape</label>
              <select
                value={formData.variations.itemShape}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  variations: { ...prev.variations, itemShape: e.target.value }
                }))}
              >
                <option value="">Select Shape</option>
                {itemShapes.map(shape => <option key={shape} value={shape}>{shape}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Storage Options (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., 64GB, 128GB, 256GB, 512GB"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  variations: { ...prev.variations, storage: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                }))}
              />
            </div>

            <div className="form-group">
              <label>Patterns (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Striped, Dotted, Floral, Solid"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  variations: { ...prev.variations, pattern: e.target.value.split(',').map(p => p.trim()).filter(p => p) }
                }))}
              />
            </div>

            <div className="form-group">
              <label>Styles (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Casual, Formal, Sporty, Vintage"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  variations: { ...prev.variations, style: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                }))}
              />
            </div>
          </section>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '⏳ Submitting Product...' : '✅ Submit Product for Review'}
        </button>
      </form>

      {/* Success Dialog */}
      {showSuccessDialog && submissionResult && (
        <div className="modal-overlay" onClick={() => setShowSuccessDialog(false)}>
          <div className="success-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 Product Submission Successful!</h2>
            <p>Thank you for submitting your product listing.</p>
            <p>Our team will review your details and notify you shortly.</p>
            <p className="support-text">If approval takes more than 1 hour, please contact support: <strong>7010186524</strong></p>
            
            <hr />
            
            <div className="submission-details">
              <h3>Product Details:</h3>
              <table>
                <tbody>
                  <tr><td><strong>Product Name:</strong></td><td>{submissionResult.product.itemName}</td></tr>
                  <tr><td><strong>Brand:</strong></td><td>{submissionResult.product.brandName}</td></tr>
                  <tr><td><strong>Category:</strong></td><td>{submissionResult.product.category}</td></tr>
                  <tr><td><strong>Condition:</strong></td><td>{submissionResult.product.itemCondition}</td></tr>
                  <tr><td><strong>Seller SKU:</strong></td><td>{submissionResult.product.sellerSKU || 'N/A'}</td></tr>
                  <tr><td><strong>Quantity Added:</strong></td><td>{submissionResult.product.quantity}</td></tr>
                  <tr><td><strong>Region of Origin:</strong></td><td>{submissionResult.product.regionOfOrigin || 'N/A'}</td></tr>
                  <tr><td><strong>Request ID:</strong></td><td>{submissionResult.seller.requestId}</td></tr>
                </tbody>
              </table>
            </div>
            
            <hr />
            
            <div className="submission-metadata">
              <p><strong>Submission Time:</strong> {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Review Status:</strong> <span className="status-pending">Pending Approval</span></p>
              <p><strong>Shipping Address:</strong> {submissionResult.seller.shippingAddress}</p>
              <p><strong>Your Phone Number:</strong> {submissionResult.seller.contactNumber}</p>
            </div>
            
            <hr />
            
            <p className="track-info">You can track status in: <strong>My Listings → Pending</strong></p>
            
            <div className="dialog-actions">
              <button onClick={() => navigate('/seller-dashboard')} className="btn-dashboard">
                ← Back to Dashboard
              </button>
              <button onClick={() => {
                setShowSuccessDialog(false);
                window.location.reload();
              }} className="btn-add-another">
                + Add Another Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Add;
