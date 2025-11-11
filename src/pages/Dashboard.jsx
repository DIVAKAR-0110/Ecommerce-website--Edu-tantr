/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("sellerSession"));
    if (!session || Date.now() > session.expiresAt) {
      localStorage.removeItem("sellerSession");
      navigate("/SellerLogin");
      return;
    }

    setSeller(session.seller);

    if (session.seller.profilePictureId) {
      setProfileImageUrl(`/api/files/${session.seller.profilePictureId}`);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sellerSession");
    navigate("/SellerLogin");
  };

  const handleUpload = async () => {
    if (!file || !seller) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      formData.append("sellerId", seller.requestId);

      const res = await fetch("/api/seller/upload-profile-picture", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProfileImageUrl(`/api/files/${data.profilePictureId}`);
        const updatedSeller = { ...seller, profilePictureId: data.profilePictureId };
        localStorage.setItem(
          "sellerSession",
          JSON.stringify({ seller: updatedSeller, expiresAt: Date.now() + 3600000 })
        );
        alert("Profile Updated ✅");
        setShowUploadDialog(false);
        setFile(null);
      }
    } catch (err) {
      alert("Upload Failed ❌");
    }

    setUploading(false);
  };

  if (!seller) return null;

  const guidelines = [
    {
      title: "Add Product Guidelines",
      desc: "Provide accurate title, price, description, and category. Avoid misleading information.",
    },
    {
      title: "Volume Listing",
      desc: "Use variation grouping to avoid product duplication.",
    },
    {
      title: "Category Approvals",
      desc: "Submit requested documents for categories needing approval (e.g., cosmetics, electronics).",
    },
    {
      title: "Create Variations",
      desc: "Use size, color, material options to help customers choose easily.",
    },
    {
      title: "GTIN Barcodes",
      desc: "Use Global Trade Item Number barcode for brand authentication.",
    },
    {
      title: "Product Images",
      desc: "Use clear, high-quality images with a plain background.",
    },
  ];

  const generalTips = [
    "Respond politely to customers — respect builds brand.",
    "Ship products on time — late delivery reduces rating.",
    "Check product before packing — avoid returns.",
    "Always keep stock updated — avoid cancellation.",
    "Ask customer for reviews — builds trust fast.",
  ];

  return (
    <div className="dashboard-wrapper">
      {/* TOP NAVBAR */}
      <nav className="top-navbar">
        <ul>
          <li
            className="dropdown-trigger"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            Add Product ▾
            {showAddMenu && (
              <ul className="dropdown">
                <li onClick={() => navigate('/seller-dashboard/add-product')}>
  Add New Product
</li>

                <li>Add Existing Product</li>
              </ul>
            )}
          </li>

          <li
            className="dropdown-trigger"
            onClick={() => setShowViewMenu(!showViewMenu)}
          >
            View Products ▾
            {showViewMenu && (
              <ul className="dropdown">
                <li>List All</li>
                <li>By Category</li>
                <li>By Name</li>
                <li>By Quantity</li>
                <li>Edit Product</li>
              </ul>
            )}
          </li>

          <li>Remove Products</li>
          <li>See Feedback</li>
          <li>Customers Purchased</li>
          <li>Product Reviews</li>

          <div className="right-section">
            <div
              className="profile-icon-wrapper"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} className="nav-profile" alt="Profile" />
              ) : (
                <svg className="nav-profile default-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}
              {showProfileMenu && (
                <ul className="dropdown profile-dropdown">
                  <li onClick={() => setShowProfileView(true)}>View Profile</li>
                  <li onClick={() => setShowUploadDialog(true)}>Update</li>
                </ul>
              )}
            </div>
            <span className="seller-name">{seller.contactName}</span>
            <button className="logout-icon" onClick={handleLogout}>⏻</button>
          </div>
        </ul>
      </nav>

      {/* MAIN CONTENT */}
      <main className="content-area">
        <section className="guidelines-section">
          <h2>Seller Guidelines</h2>
          <div className="guidelines-grid">
            {guidelines.map((item, index) => (
              <div key={index} className="guideline-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          {showMore && (
            <div className="general-tips">
              <h3>General Tips</h3>
              <ul>
                {generalTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="readmore-btn" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Read Less ▲" : "Read More ▼"}
          </button>
        </section>
      </main>

      {/* UPLOAD DIALOG */}
      {showUploadDialog && (
        <div className="modal-overlay" onClick={() => setShowUploadDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Profile Picture</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
            {file && <p className="file-name">{file.name}</p>}
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowUploadDialog(false);
                  setFile(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-upload"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE VIEW */}
      {showProfileView && (
        <div className="profile-view-overlay" onClick={() => setShowProfileView(false)}>
          <div className="profile-view-content">
            <div className="profile-view-image">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}
            </div>
            <p className="profile-view-name">{seller.contactName}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
