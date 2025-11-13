 
 
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import './List.css';

const List = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedFeatures, setExpandedFeatures] = useState({});
  const [selectedImages, setSelectedImages] = useState({});
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedShareProduct, setSelectedShareProduct] = useState(null);
  const shareDialogRef = useRef(null);

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
        setSeller(data.seller);
        setProducts(data.products);
        // Initialize selected images
        const initialImages = {};
        data.products.forEach(product => {
          initialImages[product._id] = product.primaryImageId ? `/api/files/${product.primaryImageId}` : null;
        });
        setSelectedImages(initialImages);
      } else {
        alert('Failed to load products: ' + data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    if (filter === 'all') return products;
    return products.filter(p => p.status === filter);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '⏳ Pending', class: 'status-pending' },
      approved: { text: '✓ Approved', class: 'status-approved' },
      rejected: { text: '✗ Rejected', class: 'status-rejected' }
    };
    return badges[status] || badges.pending;
  };

  const toggleFeatures = (productId) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const selectImage = (productId, imageUrl) => {
    setSelectedImages(prev => ({
      ...prev,
      [productId]: imageUrl
    }));
  };

  const calculateDiscount = (mrp, sellingPrice) => {
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
  };

  const openShareDialog = (product) => {
    if (product.status !== 'approved') {
      alert('⚠️ Only approved products can be shared with customers.');
      return;
    }
    setSelectedShareProduct(product);
    setShowShareDialog(true);
  };

const shareFromDialog = async () => {
  try {
    const shareDialog = shareDialogRef.current;
    if (!shareDialog) return;

    const discount = calculateDiscount(selectedShareProduct.mrp, selectedShareProduct.sellingPrice);

    // ✅ WAIT FOR ALL IMAGES TO LOAD
    const images = shareDialog.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) resolve();
        else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      });
    });
    await Promise.all(imagePromises);

    // ✅ TOP BANNER (Blue/Purple Gradient)
    const topBanner = document.createElement('div');
    topBanner.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 25px;
      font-family: 'Segoe UI', 'SF Pro Display', -apple-system, system-ui, sans-serif;
      border-radius: 20px 20px 0 0;
      text-align: center;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    `;
    
    topBanner.innerHTML = `
      <h2 style="
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: 800;
        text-shadow: 0 2px 6px rgba(0,0,0,0.2);
      ">🛍️ Visit Our E-commerce Website</h2>
      <p style="
        margin: 0 0 5px 0;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
      ">I, <strong>${seller.contactName}</strong>, have added a product in our e-commerce store</p>
      <p style="
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        opacity: 0.95;
      "><strong>${seller.contactName}</strong> recommends you to visit our website! ✨</p>
    `;

    // ✅ BOTTOM BANNER (Green Gradient)
    const bottomBanner = document.createElement('div');
    bottomBanner.style.cssText = `
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      padding: 20px 25px;
      font-family: 'Segoe UI', 'SF Pro Display', -apple-system, system-ui, sans-serif;
      border-radius: 0 0 20px 20px;
      text-align: center;
      box-shadow: 0 -4px 15px rgba(17, 153, 142, 0.3);
    `;
    
    bottomBanner.innerHTML = `
      <p style="
        margin: 0 0 10px 0;
        font-size: 24px;
        font-weight: 800;
        text-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">💰 Just ₹${selectedShareProduct.sellingPrice}
      ${discount > 0 ? `<span style="
        background: rgba(255,255,255,0.25);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 16px;
        margin-left: 8px;
        border: 2px solid rgba(255,255,255,0.4);
      ">${discount}% OFF!</span>` : ''}</p>
      <p style="
        margin: 0 0 5px 0;
        font-size: 14px;
        font-weight: 600;
      ">✅ New • It's really good quality! 🌟</p>
      <p style="
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        opacity: 0.95;
      ">🛒 Shop Now: [http://127.0.0.1/e-commerce/shop]</p>
    `;

    // Insert elements
    shareDialog.insertBefore(topBanner, shareDialog.firstChild);
    shareDialog.appendChild(bottomBanner);

    // Wait for layout
    await new Promise(resolve => setTimeout(resolve, 500));

    // ✅ CAPTURE WITH HIGH QUALITY
    const canvas = await html2canvas(shareDialog, {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      scale: 2,
      logging: false,
      width: shareDialog.scrollWidth,
      height: shareDialog.scrollHeight,
    });

    // Remove elements after capture
    shareDialog.removeChild(topBanner);
    shareDialog.removeChild(bottomBanner);

    // Convert to PNG
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${selectedShareProduct.itemName.replace(/\s+/g, '_')}.png`, { 
      type: 'image/png' 
    });

    // Share or Download
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: selectedShareProduct.itemName
      });
      setShowShareDialog(false);
      console.log('✅ Product shared successfully');
    } else {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${selectedShareProduct.itemName.replace(/\s+/g, '_')}.png`;
      link.click();
      alert('✅ Image downloaded!');
      setShowShareDialog(false);
    }
  } catch (error) {
    console.error('Error sharing:', error);
    alert('Failed to share: ' + error.message);
  }
};





  const filteredProducts = getFilteredProducts();

  if (loading) {
    return <div className="list-container"><p className="loading">Loading your products...</p></div>;
  }

  if (!seller) return null;

  return (
    <div className="list-container">
      {/* Seller Info Header */}
      <div className="seller-header">
        <h1>📦 My Product Listings</h1>
        <div className="seller-info-card">
          <div className="info-row">
            <div className="info-item">
              <strong>Seller Name:</strong> {seller.contactName}
            </div>
            <div className="info-item">
              <strong>Request ID:</strong> {seller.requestId}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <strong>Email:</strong> {seller.contactEmail}
            </div>
            <div className="info-item">
              <strong>Phone:</strong> {seller.contactNumber}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item full-width">
              <strong>Brand:</strong> {seller.brandName || 'Not Specified'}
            </div>
            <div className="info-item full-width">
              <strong>Manufacturer:</strong> {seller.manufacturerName || 'Not Specified'}
            </div>
          </div>
          <div className="info-row">
            <div className="info-item full-width">
              <strong>Shipping Address:</strong> {seller.shippingAddress}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <div className="stat-card total">
          <div className="stat-number">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{products.filter(p => p.status === 'pending').length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-number">{products.filter(p => p.status === 'approved').length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-number">{products.filter(p => p.status === 'rejected').length}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-section">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({products.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({products.filter(p => p.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({products.filter(p => p.status === 'approved').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({products.filter(p => p.status === 'rejected').length})
        </button>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          {products.length === 0 ? (
            <>
              <p>📭 You haven't added any products yet</p>
              <p className="empty-subtitle">Add your first product and come back to see it here!</p>
              <button onClick={() => navigate('/seller-dashboard/add-product')} className="btn-add-product">
                + Add Your First Product
              </button>
            </>
          ) : (
            <>
              <p>📭 No {filter} products found</p>
              <p className="empty-subtitle">Try changing the filter or add new products</p>
              <button onClick={() => setFilter('all')} className="btn-reset-filter">
                Show All Products
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="products-list">
          {filteredProducts.map((product) => {
            const statusBadge = getStatusBadge(product.status);
            const primaryImageUrl = product.primaryImageId ? `/api/files/${product.primaryImageId}` : null;
            const additionalImagesUrls = product.additionalImageIds?.map(id => `/api/files/${id}`) || [];
            const allImages = [primaryImageUrl, ...additionalImagesUrls].filter(Boolean);
            const discount = calculateDiscount(product.mrp, product.sellingPrice);

            return (
              <div key={product._id} className="product-item">
                {/* Product Header */}
                <div className="product-header-row">
                  <div className="product-title-section">
                    <h3>{product.itemName}</h3>
                    <span className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                  <div className="product-actions">
                    <div className="product-id">
                      <strong>Product ID:</strong> {product.productId}
                    </div>
                    <button 
                      onClick={() => openShareDialog(product)} 
                      className="btn-share-icon"
                      disabled={product.status !== 'approved'}
                      title={product.status === 'approved' ? 'Share this product' : 'Only approved products can be shared'}
                    >
                      📤 Share
                    </button>
                  </div>
                </div>

                <div className="product-content">
                  {/* Left: Image Gallery */}
                  <div className="image-gallery-section">
                    <div className="main-image-container">
                      {selectedImages[product._id] ? (
                        <img src={selectedImages[product._id]} alt={product.itemName} className="main-image" />
                      ) : (
                        <div className="no-image">No Image Available</div>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <div className="thumbnail-gallery">
                        {allImages.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt={`${product.itemName} ${idx + 1}`}
                            className={`thumbnail ${selectedImages[product._id] === imgUrl ? 'active' : ''}`}
                            onClick={() => selectImage(product._id, imgUrl)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Product Details */}
                  <div className="product-details-section">
                    {/* Basic Details */}
                    <div className="detail-grid">
                      <div className="detail-item">
                        <strong>Category:</strong> {product.category}
                      </div>
                      <div className="detail-item">
                        <strong>Brand:</strong> {product.brandName}
                      </div>
                      <div className="detail-item">
                        <strong>Manufacturer:</strong> {product.manufacturer}
                      </div>
                      <div className="detail-item">
                        <strong>Condition:</strong> {product.itemCondition}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="pricing-section">
                      <div className="price-row">
                        <div className="price-item">
                          <label>MRP:</label>
                          <span className="price-mrp">₹{product.mrp}</span>
                        </div>
                        <div className="price-item">
                          <label>Listing Price:</label>
                          <span className="price-listing">₹{product.listingPrice}</span>
                        </div>
                        <div className="price-item">
                          <label>Selling Price:</label>
                          <span className="price-selling">₹{product.sellingPrice}</span>
                        </div>
                        <div className="price-item">
                          <label>Stock:</label>
                          <span className="stock-qty">{product.quantity} units</span>
                        </div>
                      </div>
                      {discount > 0 && (
                        <div className="discount-badge">
                          {discount}% OFF
                        </div>
                      )}
                    </div>

                    {product.sellerSKU && (
                      <div className="detail-item full-width">
                        <strong>Seller SKU:</strong> {product.sellerSKU}
                      </div>
                    )}

                    {/* Description */}
                    <div className="product-description">
                      <strong>Description:</strong>
                      <p>{product.fullDescription}</p>
                    </div>

                    {/* Key Features */}
                    {product.bulletPoints && product.bulletPoints.length > 0 && (
                      <div className="bullet-points">
                        <strong>Key Features:</strong>
                        <ul>
                          {(expandedFeatures[product._id] ? product.bulletPoints : product.bulletPoints.slice(0, 3)).map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                        {product.bulletPoints.length > 3 && (
                          <button 
                            onClick={() => toggleFeatures(product._id)} 
                            className="read-more-btn"
                          >
                            {expandedFeatures[product._id] ? '− Show Less' : `+ ${product.bulletPoints.length - 3} more features`}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Variations */}
                    {product.hasVariation && product.variations && (
                      <div className="variations-section">
                        <strong>Available Variations:</strong>
                        <div className="variations-grid">
                          {product.variations.color?.length > 0 && (
                            <div className="variation-item">
                              <label>Colors:</label>
                              <span>{product.variations.color.join(', ')}</span>
                            </div>
                          )}
                          {product.variations.size?.length > 0 && (
                            <div className="variation-item">
                              <label>Sizes:</label>
                              <span>{product.variations.size.join(', ')}</span>
                            </div>
                          )}
                          {product.variations.itemShape && (
                            <div className="variation-item">
                              <label>Shape:</label>
                              <span>{product.variations.itemShape}</span>
                            </div>
                          )}
                          {product.variations.storage?.length > 0 && (
                            <div className="variation-item">
                              <label>Storage:</label>
                              <span>{product.variations.storage.join(', ')}</span>
                            </div>
                          )}
                          {product.variations.pattern?.length > 0 && (
                            <div className="variation-item">
                              <label>Patterns:</label>
                              <span>{product.variations.pattern.join(', ')}</span>
                            </div>
                          )}
                          {product.variations.style?.length > 0 && (
                            <div className="variation-item">
                              <label>Styles:</label>
                              <span>{product.variations.style.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="product-footer">
                      <div className="submission-date">
                        <strong>Submitted:</strong> {new Date(product.submittedAt).toLocaleString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      {product.reviewedAt && (
                        <div className="review-date">
                          <strong>Reviewed:</strong> {new Date(product.reviewedAt).toLocaleString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      )}
                    </div>

                    {product.status === 'rejected' && product.rejectionReason && (
                      <div className="rejection-reason">
                        <strong>⚠️ Rejection Reason:</strong>
                        <p>{product.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && selectedShareProduct && (
        <div className="modal-overlay" onClick={() => setShowShareDialog(false)}>
          <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShareDialog(false)}>✕</button>
            
            <div ref={shareDialogRef} className="share-dialog-content">
              {/* Image Gallery */}
              <div className="share-images">
                {/* Primary Image */}
                {selectedShareProduct.primaryImageId && (
                  <img 
                    src={`/api/files/${selectedShareProduct.primaryImageId}`} 
                    alt={selectedShareProduct.itemName}
                    className="share-primary-image"
                  />
                )}
                
                {/* Additional Images */}
                {selectedShareProduct.additionalImageIds?.length > 0 && (
                  <div className="share-additional-images">
                    {selectedShareProduct.additionalImageIds.slice(0, 4).map((imgId, idx) => (
                      <img 
                        key={idx}
                        src={`/api/files/${imgId}`}
                        alt={`${selectedShareProduct.itemName} ${idx + 1}`}
                        className="share-thumb-image"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="share-details">
                <h2>{selectedShareProduct.itemName}</h2>
                
                <div className="share-info-row">
                  <span className="share-info-badge">📁 {selectedShareProduct.category}</span>
                  <span className="share-info-badge">🏷️ {selectedShareProduct.brandName}</span>
                  <span className="share-info-badge">✓ {selectedShareProduct.itemCondition}</span>
                </div>

                {/* Pricing */}
                <div className="share-pricing">
                  <div className="share-price-main">
                    <span className="share-selling-price">₹{selectedShareProduct.sellingPrice}</span>
                    <span className="share-mrp">MRP: ₹{selectedShareProduct.mrp}</span>
                  </div>
                  {calculateDiscount(selectedShareProduct.mrp, selectedShareProduct.sellingPrice) > 0 && (
                    <div className="share-discount">
                      {calculateDiscount(selectedShareProduct.mrp, selectedShareProduct.sellingPrice)}% OFF
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="share-description">
                  <p>{selectedShareProduct.fullDescription}</p>
                </div>

                {/* Key Features */}
                {selectedShareProduct.bulletPoints?.length > 0 && (
                  <div className="share-features">
                    <strong>Key Features:</strong>
                    <ul>
                      {selectedShareProduct.bulletPoints.slice(0, 5).map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Variations */}
                {selectedShareProduct.hasVariation && selectedShareProduct.variations && (
                  <div className="share-variations">
                    <strong>Available in:</strong>
                    <div className="variation-tags">
                      {selectedShareProduct.variations.color?.length > 0 && (
                        <div className="var-tag">
                          <span>Colors:</span> {selectedShareProduct.variations.color.slice(0, 5).join(', ')}
                        </div>
                      )}
                      {selectedShareProduct.variations.size?.length > 0 && (
                        <div className="var-tag">
                          <span>Sizes:</span> {selectedShareProduct.variations.size.slice(0, 5).join(', ')}
                        </div>
                      )}
                      {selectedShareProduct.variations.storage?.length > 0 && (
                        <div className="var-tag">
                          <span>Storage:</span> {selectedShareProduct.variations.storage.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Store Branding */}
                <div className="share-branding">
                  <p>🛍️ Available Now on Our E-commerce Store</p>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button onClick={shareFromDialog} className="btn-share-confirm">
              📤 Share Product
            </button>
          </div>
        </div>
      )}

      {/* Back to Dashboard Button */}
      <div className="back-section">
        <button onClick={() => navigate('/seller-dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default List;
