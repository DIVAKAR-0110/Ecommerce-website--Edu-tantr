/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import './Admin_View.css';

const Admin_View = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, statusFilter, categoryFilter, minPrice, maxPrice, sortBy, sortOrder]);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/admin/products/all');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.itemName.toLowerCase().includes(search) ||
        p.brandName?.toLowerCase().includes(search) ||
        p.productId.toLowerCase().includes(search) ||
        p.seller.contactName.toLowerCase().includes(search)
      );
    }
    
    // Price range filter
    if (minPrice) {
      filtered = filtered.filter(p => p.listingPrice >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(p => p.listingPrice <= parseFloat(maxPrice));
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'submittedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredProducts(filtered);
  };

  const viewDetails = async (productId) => {
    try {
      const response = await fetch(`/api/admin/product/${productId}`);
      const data = await response.json();
      
      if (data.success) {
        setModalData(data);
        setSelectedImage(data.product.images.primary);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      alert('Error loading product details');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '⏳ Pending', class: 'status-pending' },
      approved: { text: '✓ Approved', class: 'status-approved' },
      rejected: { text: '✗ Rejected', class: 'status-rejected' }
    };
    return badges[status] || badges.pending;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('submittedAt');
    setSortOrder('desc');
  };

  if (loading) {
    return <div className="admin-view-container"><p className="loading">Loading products...</p></div>;
  }

  return (
    <div className="admin-view-container">
      {/* Header */}
      <div className="admin-header">
        <h1>🛍️ All Products - Admin View</h1>
        <p className="subtitle">View and manage all products from all sellers</p>
      </div>

      {/* Statistics */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-number">{products.length}</span>
          <span className="stat-label">Total Products</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{products.filter(p => p.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{products.filter(p => p.status === 'approved').length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{products.filter(p => p.status === 'rejected').length}</span>
          <span className="stat-label">Rejected</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredProducts.length}</span>
          <span className="stat-label">Filtered Results</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          {/* Search */}
          <div className="filter-group">
            <label>🔍 Search</label>
            <input
              type="text"
              placeholder="Search by product name, brand, seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-row">
          {/* Price Range */}
          <div className="filter-group">
            <label>Min Price (₹)</label>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Max Price (₹)</label>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Sort By */}
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="submittedAt">Submission Date</option>
              <option value="listingPrice">Price</option>
              <option value="itemName">Product Name</option>
              <option value="quantity">Stock Quantity</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="filter-group">
            <label>Order</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="filter-select">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <button onClick={resetFilters} className="btn-reset">
            🔄 Reset Filters
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <p>No products found matching your filters</p>
          <button onClick={resetFilters} className="btn-reset-empty">Reset Filters</button>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Details</th>
                <th>Seller Info</th>
                <th>Pricing</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const statusBadge = getStatusBadge(product.status);
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="product-image-cell">
                        {product.primaryImageUrl ? (
                          <img src={product.primaryImageUrl} alt={product.itemName} />
                        ) : (
                          <div className="no-image-placeholder">No Image</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-info-cell">
                        <strong className="product-name">{product.itemName}</strong>
                        <span className="product-id">ID: {product.productId}</span>
                        <span className="product-category">📁 {product.category}</span>
                        <span className="product-brand">🏷️ {product.brandName || 'Generic'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="seller-info-cell">
                        <strong>{product.seller.contactName}</strong>
                        <span>{product.seller.requestId}</span>
                        <span>{product.seller.contactEmail}</span>
                        <span>📞 {product.seller.contactNumber}</span>
                      </div>
                    </td>
                    <td>
                      <div className="pricing-cell">
                        <span className="price-mrp">MRP: ₹{product.mrp}</span>
                        <span className="price-listing">List: ₹{product.listingPrice}</span>
                        <span className="price-selling">Sell: ₹{product.sellingPrice}</span>
                      </div>
                    </td>
                    <td>
                      <div className="stock-cell">
                        <span className="stock-quantity">{product.quantity}</span>
                        <span className="stock-label">units</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        {new Date(product.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => viewDetails(product._id)} 
                        className="btn-view-details"
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showModal && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            
            <h2>Product Details</h2>
            
            <div className="modal-body">
              {/* Images */}
              <div className="modal-images">
                <div className="modal-main-image">
                  {selectedImage ? (
                    <img src={selectedImage} alt="Product" />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="modal-thumbnails">
                  {modalData.product.images.primary && (
                    <img
                      src={modalData.product.images.primary}
                      alt="Primary"
                      className={selectedImage === modalData.product.images.primary ? 'active' : ''}
                      onClick={() => setSelectedImage(modalData.product.images.primary)}
                    />
                  )}
                  {modalData.product.images.additional.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Additional ${idx + 1}`}
                      className={selectedImage === img ? 'active' : ''}
                      onClick={() => setSelectedImage(img)}
                    />
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="modal-details">
                <div className="detail-section">
                  <h3>Product Information</h3>
                  <p><strong>Name:</strong> {modalData.product.itemName}</p>
                  <p><strong>Category:</strong> {modalData.product.category}</p>
                  <p><strong>Brand:</strong> {modalData.product.brandName}</p>
                  <p><strong>Manufacturer:</strong> {modalData.product.manufacturer}</p>
                  <p><strong>Condition:</strong> {modalData.product.itemCondition}</p>
                </div>

                <div className="detail-section">
                  <h3>Pricing & Stock</h3>
                  <p><strong>MRP:</strong> ₹{modalData.product.mrp}</p>
                  <p><strong>Listing Price:</strong> ₹{modalData.product.listingPrice}</p>
                  <p><strong>Selling Price:</strong> ₹{modalData.product.sellingPrice}</p>
                  <p><strong>Stock:</strong> {modalData.product.quantity} units</p>
                </div>

                <div className="detail-section">
                  <h3>Seller Information</h3>
                  <p><strong>Name:</strong> {modalData.seller.contactName}</p>
                  <p><strong>Email:</strong> {modalData.seller.contactEmail}</p>
                  <p><strong>Phone:</strong> {modalData.seller.contactNumber}</p>
                  <p><strong>Address:</strong> {modalData.seller.shippingAddress}</p>
                </div>

                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{modalData.product.fullDescription}</p>
                  {modalData.product.bulletPoints?.length > 0 && (
                    <>
                      <strong>Key Features:</strong>
                      <ul>
                        {modalData.product.bulletPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_View;
