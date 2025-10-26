/* eslint-disable no-unused-vars */
// File: SalesRegister.jsx
// Place this file in your Vite + React project (e.g. src/pages/SalesRegister.jsx)

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import './SalesRegister.css';

// Utility: generate Request ID like ABC123
function generateRequestId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const getLetters = () =>
    Array.from({ length: 3 })
      .map(() => letters[Math.floor(Math.random() * letters.length)])
      .join('');
  const nums = () => Math.floor(100 + Math.random() * 900).toString();
  return `${getLetters()}${nums()}`;
}

export default function SalesRegister() {


    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);


const [signatureDone, setSignatureDone] = useState(false);
const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);


const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);  // ← ADD THIS



  const totalSteps = 7;
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [form, setForm] = useState({
    // 1) Business details
    categories: [],           // Changed to array for multi-select
customCategory: '',       // NEW: for "All Others" textbox

    retailDetails: '',
    retailDetailsLink: '',
    platformTimePeriod: '', 
    referenceLink: '',
    totalTime: '',
    socialPlatforms: [], // array of selected platforms
    instagramLink: '',
    whatsappContact: '',
    facebookLink: '',
    twitterLink: '',
    telegramLink: '',
    contactName: '',
    contactEmail: '',
    contactNumber: '',
    contactDesignation: '',
    // 2) GST
    gstNumber: '',
    gstName: '',
    gstAddress: '',
      panNumber: '', // NEW FIELD
        gstCertificate: null, // NEW FIELD
          gstType: '', // NEW FIELD
    // 3) Brand
    brandName: '',
    manufacturerName: '',
    trademarkNumber: '',
    trademarkFile: null,
    brandLogo: null,
    authorizationLetter: null,
    // 4) Bank
    accountNumber: '',
    reAccountNumber: '',
    ifsc: '',
    bankType: '',
    // 5) Shipping
    shippingAddress: '',
    shippingLat: '',
    shippingLng: '',
    locationFetchStatus: '',
    // 6) Digital Signature
    digitalSignature: '',
    // 7) Password
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestId, setRequestId] = useState('');
  const sigPadRef = useRef(null);

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


  const socialPlatforms = [
    'Instagram',
    'WhatsApp',
    'Facebook',
    'Twitter',
    'Telegram'
  ];

  // NEW useEffect - Restore signature when returning to step 6
// Restore signature when returning to step 6
// Restore signature when returning to step 6

// Restore signature when returning to step 6
// Restore signature when returning to step 6
useEffect(() => {
  // Only restore if we're on step 6 AND the canvas exists
  if (step === 6 && sigPadRef.current && form.digitalSignature) {
    // Use a slight delay to ensure canvas is mounted
    const timer = setTimeout(() => {
      if (sigPadRef.current) {
        sigPadRef.current.fromDataURL(form.digitalSignature);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [step]); // ONLY depend on step, NOT form.digitalSignature

  useEffect(() => {
    if (dialogOpen && !requestId) setRequestId(generateRequestId());
  }, [dialogOpen, requestId]);

   // NEW useEffect - Add this for OTP timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);


   // Function to send OTP
  async function handleSendOtp() {
    // Validate email first
    if (!form.contactEmail) {
      setErrors({ ...errors, contactEmail: 'Email is required' });
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      setErrors({ ...errors, contactEmail: 'Invalid email format' });
      return;
    }

    setSendingOtp(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const response = await fetch('http://localhost:3000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: form.contactEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpDialogOpen(true);
        setOtpSuccess('OTP sent successfully! Check your email.');
        setResendTimer(60); // 60 seconds cooldown
      } else {
        setOtpError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError('Network error. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  // Function to verify OTP
  async function handleVerifyOtp() {
    if (!otpInput || otpInput.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    try {
      const response = await fetch('http://localhost:3000/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.contactEmail,
          otp: otpInput,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailVerified(true);
        setOtpSuccess('✓ Email verified successfully!');
        
        // Close dialog after 1.5 seconds
        setTimeout(() => {
          setOtpDialogOpen(false);
          setOtpInput('');
        }, 1500);
      } else {
        setOtpError(data.message || 'Invalid OTP');
        setOtpInput('');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('Network error. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

function handleNext() {
    const e = validateStep(step);
    
    // Add email verification check for step 1
    if (step === 1 && !emailVerified) {
      setErrors({ ...e, contactEmail: 'Please verify your email first' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (Object.keys(e).length) {
      setErrors(e);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setErrors({});
    
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    
    setStep((s) => Math.min(totalSteps, s + 1));
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  function goToStep(targetStep) {
    // Allow navigation to completed steps or the next immediate step
    if (targetStep <= completedSteps.length + 1 && targetStep >= 1) {
      setStep(targetStep);
      setErrors({});
    }
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFile(field, file) {
    setForm((f) => ({ ...f, [field]: file }));
  }

function toggleCategory(category) {
  const current = form.categories;
  if (current.includes(category)) {
    setForm((f) => ({ ...f, categories: current.filter(c => c !== category) }));
  } else {
    setForm((f) => ({ ...f, categories: [...current, category] }));
  }
}



  function toggleSocialPlatform(platform) {
    const current = form.socialPlatforms;
    if (current.includes(platform)) {
      setForm((f) => ({ ...f, socialPlatforms: current.filter(p => p !== platform) }));
    } else {
      setForm((f) => ({ ...f, socialPlatforms: [...current, platform] }));
    }
  }

  function validateStep(s) {
    const e = {};
   if (s === 1) {
    /*if (!form.category) e.category = 'Category required';*/
    if (!form.retailPlatform) e.retailPlatform = 'Please select a retail platform';
    
    // Validate platform store link only for platforms other than Own Retail and None
    if (form.retailPlatform && 
        form.retailPlatform !== 'Own Retail' && 
        form.retailPlatform !== 'None' && 
        !form.platformStoreLink) {
      e.platformStoreLink = 'Store link required for selected platform';
    }
      if (form.categories.length === 0) {
    e.categories = 'Please select at least one category';
  }
  
  // Validate custom category if "All Others (Specify)" is selected
  if (form.categories.includes('All Others (Specify)') && !form.customCategory.trim()) {
    e.customCategory = 'Please specify your category';
  }
    
    if (!form.contactName) e.contactName = 'Contact name required';
    if (form.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail)) 
      e.contactEmail = 'Invalid email';
    if (!form.contactNumber) e.contactNumber = 'Contact number required';
  }
     if (s === 2) {
    // Validate GST Type
    if (!form.gstType) e.gstType = 'GST type required';
    
    // Validate GST fields only if not Unregistered
    if (form.gstType && form.gstType !== 'Unregistered') {
      if (!form.gstNumber) e.gstNumber = 'GST number required';
      
      // Validate GST number format (basic check: 15 characters)
      if (form.gstNumber && form.gstNumber.length !== 15) {
        e.gstNumber = 'GST number must be 15 characters';
      }
      
      if (!form.gstCertificate) e.gstCertificate = 'GST certificate required';
    }
    
    // Validate PAN number (always required)
    if (!form.panNumber) e.panNumber = 'PAN number required';
    
    // Validate PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (form.panNumber && !panRegex.test(form.panNumber)) {
      e.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }
  }
  
    if (s === 3) {
      if (!form.brandName) e.brandName = 'Brand name required';
    }
    if (s === 4) {
      if (!form.accountNumber) e.accountNumber = 'Account number required';
      if (form.accountNumber !== form.reAccountNumber) 
        e.reAccountNumber = 'Account numbers must match';
    }
    if (s === 5) {
      if (!form.shippingAddress) e.shippingAddress = 'Shipping address required';
    }
    if (s === 6) {
      if (!form.digitalSignature || form.digitalSignature.trim().length < 10) 
        e.digitalSignature = 'Please draw your signature';
    }
    if (s === 7) {
      if (!form.password) e.password = 'Password required';
      if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) 
        e.confirmPassword = 'Passwords must match';
    }
    return e;
  }


  async function handleSubmit(e) {
  e && e.preventDefault();
  const allErrors = {
    ...validateStep(1),
    ...validateStep(2),
    ...validateStep(3),
    ...validateStep(4),
    ...validateStep(5),
    ...validateStep(6),
    ...validateStep(7),
  };
  if (Object.keys(allErrors).length) {
    setErrors(allErrors);
    return;
  }

  setSubmitting(true);

  try {
    const formData = new FormData();
    const generatedRequestId = generateRequestId();

    console.log("Generated Request ID:", generatedRequestId); // Debug log

    formData.append("requestId", generatedRequestId);
    formData.append("categories", JSON.stringify(form.categories));
    formData.append("customCategory", form.customCategory || "");
    formData.append("retailPlatform", form.retailPlatform || "");
    formData.append("platformStoreLink", form.platformStoreLink || "");
    formData.append("platformTimePeriod", form.platformTimePeriod || "");
    formData.append("retailDetails", form.retailDetails || "");
    formData.append("retailDetailsLink", form.retailDetailsLink || "");
    formData.append("totalTime", form.totalTime || "");
    formData.append("referenceLink", form.referenceLink || "");
    formData.append("socialPlatforms", JSON.stringify(form.socialPlatforms));
    formData.append("instagramLink", form.instagramLink || "");
    formData.append("whatsappContact", form.whatsappContact || "");
    formData.append("facebookLink", form.facebookLink || "");
    formData.append("twitterLink", form.twitterLink || "");
    formData.append("telegramLink", form.telegramLink || "");
    formData.append("contactName", form.contactName);
    formData.append("contactEmail", form.contactEmail);
    formData.append("contactNumber", form.contactNumber);
    formData.append("contactDesignation", form.contactDesignation || "");
    formData.append("emailVerified", emailVerified);
    formData.append("gstType", form.gstType);
    formData.append("gstNumber", form.gstNumber || "");
    formData.append("gstName", form.gstName || "");
    formData.append("gstAddress", form.gstAddress || "");
    formData.append("panNumber", form.panNumber);

    if (form.gstCertificate) {
      formData.append("gstCertificate", form.gstCertificate);
    }

    formData.append("brandName", form.brandName);
    formData.append("manufacturerName", form.manufacturerName || "");
    formData.append("trademarkNumber", form.trademarkNumber || "");

    if (form.trademarkFile) {
      formData.append("trademarkFile", form.trademarkFile);
    }
    if (form.brandLogo) {
      formData.append("brandLogo", form.brandLogo);
    }
    if (form.authorizationLetter) {
      formData.append("authorizationLetter", form.authorizationLetter);
    }

    formData.append("accountNumber", form.accountNumber || "");
    formData.append("ifsc", form.ifsc || "");
    formData.append("bankType", form.bankType || "");
    formData.append("shippingAddress", form.shippingAddress);

    // Convert digital signature to image
    if (form.digitalSignature) {
      const blob = await fetch(form.digitalSignature).then((r) => r.blob());
      formData.append(
        "digitalSignature",
        blob,
        `signature-${generatedRequestId}.png`
      );
    }

    formData.append("password", form.password);

    console.log("Sending request to backend..."); // Debug log

    const response = await fetch(
      "http://localhost:3000/api/sales-registration/register",
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("Response status:", response.status); // Debug log

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response data:", data); // Debug log

    if (data.success) {
      setRequestId(generatedRequestId);
      setDialogOpen(true);
      alert(`Success! Request ID: ${generatedRequestId}`);
    } else {
      alert("Registration failed: " + data.message);
    }
  } catch (error) {
    console.error("Error details:", error); // Debug log
    alert("Network error: " + error.message + ". Check console for details.");
  } finally {
    setSubmitting(false);
  }
}



  function copyRequestId() {
    navigator.clipboard.writeText(requestId).then(() => {
      alert('Request ID copied to clipboard!');
    });
  }

  function downloadRequestIdAsImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '40px Arial';
    ctx.fillStyle = '#111827';
    ctx.fillText('Request ID:', 20, 80);
    ctx.font = '56px Arial';
    ctx.fillText(requestId, 20, 150);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${requestId}.png`;
    a.click();
  }

  // Progress bar component with step numbers
  const Progress = ({ step, totalSteps, completedSteps }) => {
    const progress = ((step - 1) / (totalSteps - 1)) * 100;
    return (
      <div className="sr-progress-wrapper">
        <div className="sr-progress-bar-container">
          <div 
            className="sr-progress-bar-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="sr-steps">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`sr-step-indicator ${completedSteps.includes(i + 1) ? 'completed' : ''} ${i + 1 === step ? 'current' : ''}`}
              onClick={() => goToStep(i + 1)}
            >
              <div className="sr-step-number">{i + 1}</div>
              <div className="sr-step-label">Step {i + 1}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Reverse geocoding function
  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    
    handleChange('locationFetchStatus', 'Fetching location...');
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        handleChange('shippingLat', lat);
        handleChange('shippingLng', lng);
        
        // Reverse geocoding using Nominatim (OpenStreetMap)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            handleChange('shippingAddress', data.display_name);
            handleChange('locationFetchStatus', '✓ Location detected');
          } else {
            handleChange('shippingAddress', `Latitude: ${lat}, Longitude: ${lng}`);
            handleChange('locationFetchStatus', 'Address not found');
          }
        } catch (error) {
          handleChange('shippingAddress', `Latitude: ${lat}, Longitude: ${lng}`);
          handleChange('locationFetchStatus', 'Could not fetch address');
        }
      },
      (error) => {
        alert('Unable to retrieve your location');
        handleChange('locationFetchStatus', '');
      }
    );
  }

  function clearSignature() {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      handleChange('digitalSignature', '');
    }
  }

  return (
    <div className="sr-page-wrapper">
      <div className="sr-container">
        <h1 className="sr-main-title">Sales Registration</h1>
        <Progress step={step} totalSteps={totalSteps} completedSteps={completedSteps} />

        <form onSubmit={handleSubmit} className="sr-form">
        
        {step === 1 && (
  <section className="sr-section">
    <h2 className="sr-section-title">1) mBusiness Details</h2>
    
   <div className="sr-form-group">
  <label className="sr-label">Choose Your Business Categories * (Select Multiple)</label>
  
  {/* Dropdown trigger */}
  <div 
    className="sr-dropdown-trigger" 
    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
  >
    <span className="sr-dropdown-placeholder">
      {form.categories.length === 0 
        ? 'Select categories...' 
        : `${form.categories.length} categor${form.categories.length === 1 ? 'y' : 'ies'} selected`
      }
    </span>
    <span className={`sr-dropdown-arrow ${categoryDropdownOpen ? 'open' : ''}`}>▼</span>
  </div>

  {/* Dropdown options (shown when open) */}
  {categoryDropdownOpen && (
    <div className="sr-category-grid">
      {businessCategories.map((cat, idx) => (
        <div 
          key={idx} 
          className={`sr-category-option ${form.categories.includes(cat) ? 'selected' : ''}`}
          onClick={() => toggleCategory(cat)}
        >
          <input 
            type="checkbox" 
            checked={form.categories.includes(cat)}
            readOnly
          />
          <span>{cat}</span>
        </div>
      ))}
    </div>
  )}
  
  {errors.categories && <div className="sr-err">{errors.categories}</div>}
</div>

{/* Show custom textbox if "All Others (Specify)" is selected */}
{form.categories.includes('All Others (Specify)') && (
  <div className="sr-form-group sr-custom-category-input">
    <label className="sr-label">Specify Your Category *</label>
    <input 
      className="sr-input"
      value={form.customCategory} 
      onChange={(e) => handleChange('customCategory', e.target.value)} 
      placeholder="Enter your business category..."
    />
    {errors.customCategory && <div className="sr-err">{errors.customCategory}</div>}
  </div>
)}



    <h3 className="sr-subsection-title">Retail Platform</h3>
    
    <div className="sr-form-group">
      <label className="sr-label">Select Retail Platform *</label>
      <select 
        className="sr-input sr-select"
        value={form.retailPlatform} 
        onChange={(e) => handleChange('retailPlatform', e.target.value)}
      >
        <option value="">Select platform...</option>
        <option value="Own Retail">Own Retail</option>
        <option value="Amazon">Amazon</option>
        <option value="Flipkart">Flipkart</option>
        <option value="Meesho">Meesho</option>
        <option value="Myntra">Myntra</option>
        <option value="Ajio">Ajio</option>
        <option value="None">None</option>
      </select>
      {errors.retailPlatform && <div className="sr-err">{errors.retailPlatform}</div>}
    </div>

    {/* Show retail details section only if "Own Retail" is selected */}
    {form.retailPlatform === 'Own Retail' && (
      <>
        <h3 className="sr-subsection-title">Retail Details</h3>
        
        <div className="sr-row-3">
          <div className="sr-form-group">
            <label className="sr-label">Retail Details Link</label>
            <input 
              className="sr-input"
              value={form.retailDetailsLink} 
              onChange={(e) => handleChange('retailDetailsLink', e.target.value)} 
              placeholder="https://..."
            />
          </div>
          <div className="sr-form-group">
            <label className="sr-label">Total Time in Business</label>
            <input 
              className="sr-input"
              value={form.totalTime} 
              onChange={(e) => handleChange('totalTime', e.target.value)} 
              placeholder="e.g. 2 years"
            />
          </div>
          <div className="sr-form-group">
            <label className="sr-label">Reference Link</label>
            <input 
              className="sr-input"
              value={form.referenceLink} 
              onChange={(e) => handleChange('referenceLink', e.target.value)} 
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="sr-form-group">
          <label className="sr-label">Retail Details Description</label>
          <textarea 
            className="sr-textarea"
            value={form.retailDetails} 
            onChange={(e) => handleChange('retailDetails', e.target.value)}
            placeholder="Describe your retail business..."
          />
        </div>
      </>
    )}

    {/* Show platform link field and time period for other platforms (not Own Retail and not None) */}
    {form.retailPlatform && form.retailPlatform !== 'Own Retail' && form.retailPlatform !== 'None' && (
      <>
        <div className="sr-row-2">
          <div className="sr-form-group">
            <label className="sr-label">{form.retailPlatform} Store Link *</label>
            <input 
              className="sr-input"
              value={form.platformStoreLink} 
              onChange={(e) => handleChange('platformStoreLink', e.target.value)} 
              placeholder={`https://${form.retailPlatform.toLowerCase()}.com/your-store`}
            />
            {errors.platformStoreLink && <div className="sr-err">{errors.platformStoreLink}</div>}
          </div>
          <div className="sr-form-group">
            <label className="sr-label">Time on {form.retailPlatform} *</label>
            <input 
              className="sr-input"
              value={form.platformTimePeriod} 
              onChange={(e) => handleChange('platformTimePeriod', e.target.value)} 
              placeholder="e.g. 1 year 6 months"
            />
            {errors.platformTimePeriod && <div className="sr-err">{errors.platformTimePeriod}</div>}
          </div>
        </div>
      </>
    )}

    <h3 className="sr-subsection-title">Social Media Presence</h3>
    
    <div className="sr-form-group">
      <label className="sr-label">Select Social Platforms (Multiple)</label>
      <div className="sr-multi-select">
        {socialPlatforms.map((platform, idx) => (
          <div 
            key={idx} 
            className={`sr-platform-option ${form.socialPlatforms.includes(platform) ? 'selected' : ''}`}
            onClick={() => toggleSocialPlatform(platform)}
          >
            <input 
              type="checkbox" 
              checked={form.socialPlatforms.includes(platform)}
              readOnly
            />
            <span>{platform}</span>
          </div>
        ))}
      </div>
    </div>

    {form.socialPlatforms.includes('Instagram') && (
      <div className="sr-form-group sr-conditional-field">
        <label className="sr-label">Instagram Profile Link</label>
        <input 
          className="sr-input"
          value={form.instagramLink} 
          onChange={(e) => handleChange('instagramLink', e.target.value)} 
          placeholder="https://instagram.com/..."
        />
      </div>
    )}

    {form.socialPlatforms.includes('WhatsApp') && (
      <div className="sr-form-group sr-conditional-field">
        <label className="sr-label">WhatsApp Contact Number</label>
        <input 
          className="sr-input"
          value={form.whatsappContact} 
          onChange={(e) => handleChange('whatsappContact', e.target.value)} 
          placeholder="+91 XXXXXXXXXX"
        />
      </div>
    )}

    {form.socialPlatforms.includes('Facebook') && (
      <div className="sr-form-group sr-conditional-field">
        <label className="sr-label">Facebook Page Link</label>
        <input 
          className="sr-input"
          value={form.facebookLink} 
          onChange={(e) => handleChange('facebookLink', e.target.value)} 
          placeholder="https://facebook.com/..."
        />
      </div>
    )}

    {form.socialPlatforms.includes('Twitter') && (
      <div className="sr-form-group sr-conditional-field">
        <label className="sr-label">Twitter Profile Link</label>
        <input 
          className="sr-input"
          value={form.twitterLink} 
          onChange={(e) => handleChange('twitterLink', e.target.value)} 
          placeholder="https://twitter.com/..."
        />
      </div>
    )}

    {form.socialPlatforms.includes('Telegram') && (
      <div className="sr-form-group sr-conditional-field">
        <label className="sr-label">Telegram Channel Link</label>
        <input 
          className="sr-input"
          value={form.telegramLink} 
          onChange={(e) => handleChange('telegramLink', e.target.value)} 
          placeholder="https://t.me/..."
        />
      </div>
    )}

    <h3 className="sr-subsection-title">Contact Information</h3>
    
    <div className="sr-row-4">
      <div className="sr-form-group">
        <label className="sr-label">Contact Name *</label>
        <input 
          className="sr-input"
          value={form.contactName} 
          onChange={(e) => handleChange('contactName', e.target.value)} 
        />
        {errors.contactName && <div className="sr-err">{errors.contactName}</div>}
      </div>
      <div className="sr-form-group">
        <label className="sr-label">Contact Number *</label>
        <input 
          className="sr-input"
          value={form.contactNumber} 
          onChange={(e) => handleChange('contactNumber', e.target.value)} 
        />
        {errors.contactNumber && <div className="sr-err">{errors.contactNumber}</div>}
      </div>
      <div className="sr-form-group">
        <label className="sr-label">Official Email *</label>
        <input 
          className="sr-input"
          value={form.contactEmail} 
          onChange={(e) => {
            handleChange('contactEmail', e.target.value);
            setEmailVerified(false);
          }} 
          disabled={emailVerified}
        />
        {errors.contactEmail && <div className="sr-err">{errors.contactEmail}</div>}
      </div>
      <div className="sr-form-group">
        <label className="sr-label">Designation</label>
        <input 
          className="sr-input"
          value={form.contactDesignation} 
          onChange={(e) => handleChange('contactDesignation', e.target.value)} 
        />
      </div>
    </div>

    {/* Email Verification Button */}
    <div className="sr-email-verify-section">
      {!emailVerified ? (
        <button
          type="button"
          className="sr-btn-verify-email"
          onClick={handleSendOtp}
          disabled={sendingOtp || !form.contactEmail}
        >
          {sendingOtp ? '⏳ Sending OTP...' : '📧 Verify Email'}
        </button>
      ) : (
        <div className="sr-verified-badge">
          ✓ Email Verified
        </div>
      )}
    </div>

  </section>
)}


{/* STEP 2: GST INFORMATION */}
{step === 2 && (
  <section className="sr-section">
    <h2 className="sr-section-title">2) GST Information</h2>
    
    <div className="sr-form-group">
      <label className="sr-label">GST Type *</label>
      <select 
        className="sr-input sr-select"
        value={form.gstType} 
        onChange={(e) => handleChange('gstType', e.target.value)}
      >
        <option value="">Select GST Type...</option>
        <option value="Regular">Regular GST</option>
        <option value="Composition">Composition Scheme</option>
        <option value="Casual">Casual Taxable Person</option>
        <option value="SEZ">SEZ (Special Economic Zone)</option>
        <option value="Unregistered">Unregistered (No GST)</option>
      </select>
      {errors.gstType && <div className="sr-err">{errors.gstType}</div>}
    </div>

    {/* Show GST fields only if not Unregistered */}
    {form.gstType && form.gstType !== 'Unregistered' && (
      <>
        <div className="sr-form-group">
          <label className="sr-label">GST Number *</label>
          <input 
            className="sr-input"
            value={form.gstNumber} 
            onChange={(e) => handleChange('gstNumber', e.target.value)} 
            placeholder="Enter GSTIN (e.g., 22AAAAA0000A1Z5)"
          />
          {errors.gstNumber && <div className="sr-err">{errors.gstNumber}</div>}
        </div>

        <div className="sr-form-group">
          <label className="sr-label">Legal Business Name</label>
          <input 
            className="sr-input"
            value={form.gstName} 
            onChange={(e) => handleChange('gstName', e.target.value)} 
            placeholder="Will be auto-filled if GST API is integrated"
          />
        </div>

        <div className="sr-form-group">
          <label className="sr-label">Registered Address</label>
          <textarea 
            className="sr-textarea"
            value={form.gstAddress} 
            onChange={(e) => handleChange('gstAddress', e.target.value)}
            placeholder="Enter your GST registered address"
          />
        </div>

        <div className="sr-form-group">
          <label className="sr-label">GST Certificate *</label>
          <input 
            type="file"
            className="sr-file-input"
            onChange={(e) => handleFile('gstCertificate', e.target.files[0])} 
            accept=".pdf,.jpg,.png"
          />
          {form.gstCertificate && (
            <span className="sr-file-name">{form.gstCertificate.name}</span>
          )}
          {errors.gstCertificate && <div className="sr-err">{errors.gstCertificate}</div>}
        </div>

        <small className="sr-muted">
          💡 Tip: Integrate GST verification API to auto-fill business name and address
        </small>
      </>
    )}

    <div className="sr-form-group">
      <label className="sr-label">PAN Number *</label>
      <input 
        className="sr-input"
        value={form.panNumber} 
        onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())} 
        placeholder="Enter PAN (e.g., ABCDE1234F)"
        maxLength="10"
      />
      {errors.panNumber && <div className="sr-err">{errors.panNumber}</div>}
    </div>

    <small className="sr-muted">
      ℹ️ PAN is mandatory for all business registrations
    </small>
  </section>
)}

          {/* STEP 3: BRAND INFORMATION */}
          {step === 3 && (
            <section className="sr-section">
              <h2 className="sr-section-title">3) Brand Information</h2>
              
              <div className="sr-form-group">
                <label className="sr-label">Brand Name *</label>
                <input 
                  className="sr-input"
                  value={form.brandName} 
                  onChange={(e) => handleChange('brandName', e.target.value)} 
                />
                {errors.brandName && <div className="sr-err">{errors.brandName}</div>}
              </div>

              <div className="sr-form-group">
                <label className="sr-label">Manufacturer Name</label>
                <input 
                  className="sr-input"
                  value={form.manufacturerName} 
                  onChange={(e) => handleChange('manufacturerName', e.target.value)} 
                />
              </div>

              <div className="sr-form-group">
                <label className="sr-label">Trademark Number</label>
                <input 
                  className="sr-input"
                  value={form.trademarkNumber} 
                  onChange={(e) => handleChange('trademarkNumber', e.target.value)} 
                  placeholder="e.g., TM123456"
                />
              </div>

              <div className="sr-file-upload-group">
                <div className="sr-form-group">
                  <label className="sr-label">Trademark Certificate</label>
                  <input 
                    type="file" 
                    className="sr-file-input"
                    onChange={(e) => handleFile('trademarkFile', e.target.files[0])} 
                    accept=".pdf,.jpg,.png"
                  />
                  {form.trademarkFile && <span className="sr-file-name">📄 {form.trademarkFile.name}</span>}
                </div>

                <div className="sr-form-group">
                  <label className="sr-label">Brand Logo</label>
                  <input 
                    type="file" 
                    className="sr-file-input"
                    onChange={(e) => handleFile('brandLogo', e.target.files[0])} 
                    accept=".jpg,.png,.svg"
                  />
                  {form.brandLogo && <span className="sr-file-name">🖼️ {form.brandLogo.name}</span>}
                </div>

                <div className="sr-form-group">
                  <label className="sr-label">Authorization Letter</label>
                  <input 
                    type="file" 
                    className="sr-file-input"
                    onChange={(e) => handleFile('authorizationLetter', e.target.files[0])} 
                    accept=".pdf,.jpg,.png"
                  />
                  {form.authorizationLetter && <span className="sr-file-name">📋 {form.authorizationLetter.name}</span>}
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: BANK ACCOUNT DETAILS */}
          {step === 4 && (
            <section className="sr-section">
              <h2 className="sr-section-title">4) Bank Account Details</h2>
              
              <div className="sr-form-group">
                <label className="sr-label">Account Number *</label>
                <input 
                  className="sr-input"
                  type="text"
                  value={form.accountNumber} 
                  onChange={(e) => handleChange('accountNumber', e.target.value)} 
                />
                {errors.accountNumber && <div className="sr-err">{errors.accountNumber}</div>}
              </div>

              <div className="sr-form-group">
                <label className="sr-label">Re-enter Account Number *</label>
                <input 
                  className="sr-input"
                  type="text"
                  value={form.reAccountNumber} 
                  onChange={(e) => handleChange('reAccountNumber', e.target.value)} 
                />
                {errors.reAccountNumber && <div className="sr-err">{errors.reAccountNumber}</div>}
              </div>

              <div className="sr-row-2">
                <div className="sr-form-group">
                  <label className="sr-label">IFSC Code</label>
                  <input 
                    className="sr-input"
                    value={form.ifsc} 
                    onChange={(e) => handleChange('ifsc', e.target.value)} 
                    placeholder="e.g., SBIN0001234"
                  />
                </div>

                <div className="sr-form-group">
                  <label className="sr-label">Account Type</label>
                  <select 
                    className="sr-input sr-select"
                    value={form.bankType} 
                    onChange={(e) => handleChange('bankType', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* STEP 5: SHIPPING LOCATION */}
          {step === 5 && (
            <section className="sr-section">
              <h2 className="sr-section-title">5) Shipping Location</h2>
              
              <div className="sr-form-group">
                <label className="sr-label">Shipping Address *</label>
                <textarea 
                  className="sr-textarea"
                  value={form.shippingAddress} 
                  onChange={(e) => handleChange('shippingAddress', e.target.value)}
                  placeholder="Enter complete shipping address or use current location"
                  rows="3"
                />
                {errors.shippingAddress && <div className="sr-err">{errors.shippingAddress}</div>}
              </div>

              <div className="sr-location-controls">
                <button 
                  type="button" 
                  className="sr-btn-location"
                  onClick={useCurrentLocation}
                >
                  📍 Use Current Location
                </button>
                {form.locationFetchStatus && (
                  <span className="sr-location-status">{form.locationFetchStatus}</span>
                )}
              </div>

              <div className="sr-row-2">
                <div className="sr-form-group">
                  <label className="sr-label">Latitude</label>
                  <input 
                    className="sr-input"
                    value={form.shippingLat} 
                    onChange={(e) => handleChange('shippingLat', e.target.value)} 
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
                <div className="sr-form-group">
                  <label className="sr-label">Longitude</label>
                  <input 
                    className="sr-input"
                    value={form.shippingLng} 
                    onChange={(e) => handleChange('shippingLng', e.target.value)} 
                    placeholder="Auto-filled"
                    readOnly
                  />
                </div>
              </div>

              <small className="sr-muted">💡 Click "Use Current Location" to auto-detect your address using GPS</small>
            </section>
          )}

   {/* STEP 6: DIGITAL SIGNATURE */}
{step === 6 && (
  <section className="sr-section">
    <h2 className="sr-section-title">6) Digital Signature</h2>
    <p className="sr-muted">Sign below using your mouse or touchpad:</p>

    <div className="sr-signature-container">
      <SignatureCanvas
  ref={sigPadRef}
  penColor="black"
  backgroundColor="#ffffff"
  minWidth={0.5}           // ← ADD THIS - Minimum pen thickness
  maxWidth={2.5}           // ← ADD THIS - Maximum pen thickness
  velocityFilterWeight={0.7}  // ← ADD THIS - Smoother strokes
  canvasProps={{
    className: 'sr-signature-canvas',
    width: 600,
    height: 200,
  }}
  onEnd={() => {
    if (sigPadRef.current) {
      const dataURL = sigPadRef.current.toDataURL();
      handleChange('digitalSignature', dataURL);
    }
  }}
/>

    </div>

    <div className="sr-signature-actions">
      <button
        type="button"
        className="sr-btn-clear"
        onClick={() => {
          if (sigPadRef.current) {
            sigPadRef.current.clear();
            handleChange('digitalSignature', '');
            setSignatureDone(false);
          }
        }}
      >
        🗑️ Clear
      </button>
      
      <button
        type="button"
        className="sr-btn-done"
        onClick={() => setSignatureDone(true)}
        disabled={!form.digitalSignature}
      >
        ✓ Done
      </button>
      
      {signatureDone && form.digitalSignature && (
        <span className="sr-signature-confirmed">✓ Signature captured successfully!</span>
      )}
    </div>
    
    {errors.digitalSignature && <div className="sr-err">{errors.digitalSignature}</div>}
  </section>
)}


          {/* STEP 7: PASSWORD VALIDATION */}
          {step === 7 && (
            <section className="sr-section">
              <h2 className="sr-section-title">7) Account Security</h2>
              <p className="sr-muted">Please create a secure password for your account.</p>

              
              <div className="sr-form-group">
  <label className="sr-label">Password *</label>
  <div style={{ position: 'relative' }}>
    <input
      type={showPassword ? "text" : "password"}
      className="sr-input"
      value={form.password}
      onChange={(e) => handleChange('password', e.target.value)}
      placeholder="Enter password"
      style={{ paddingRight: '45px' }}
    />
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#667eea'
      }}
    >
      {showPassword ? '👁️' : '🙈'}  {/* OR use 👁️‍🗨️ for hidden */}
    </button>
  </div>
  {errors.password && <div className="sr-err">{errors.password}</div>}
</div>


              <div className="sr-form-group">
  <label className="sr-label">Confirm Password *</label>
  <div style={{ position: 'relative' }}>
    <input
      type={showConfirmPassword ? "text" : "password"}  // ← Use showConfirmPassword
      className="sr-input"
      value={form.confirmPassword}
      onChange={(e) => handleChange('confirmPassword', e.target.value)}
      placeholder="Confirm password"
      style={{ paddingRight: '45px' }}
    />
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}  // ← Toggle confirmPassword
      style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#667eea'
      }}
    >
      {showConfirmPassword ? '👁️' : '🙈'} {/* OR use 👁️‍🗨️ for hidden */} {/* Same icons, different state */}
    </button>
  </div>
  {errors.confirmPassword && <div className="sr-err">{errors.confirmPassword}</div>}
</div>


              <small className="sr-muted">
                💡 Passwords must match and be at least 6 characters long.
              </small>
            </section>
          )}

          {/* FORM ACTION BUTTONS */}
          <div className="sr-actions">
            <button
              type="button"
              className="sr-btn sr-btn-back"
              onClick={handleBack}
              disabled={step === 1}
            >
              ← Back
            </button>

            {step < 7 && (
              <button
                type="button"
                className="sr-btn sr-btn-next"
                onClick={handleNext}
              >
                Next →
              </button>
            )}

            {step === 7 && (
              <button
                className="sr-btn sr-btn-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? '⏳ Verifying...' : '✓ Submit & Verify'}
              </button>
            )}
          </div>
        </form>

          {/* OTP VERIFICATION DIALOG */}
        {otpDialogOpen && (
          <div className="sr-dialog-overlay">
            <div className="sr-dialog sr-otp-dialog">
              <div className="sr-dialog-header">
                <h2>📧 Verify Email</h2>
              </div>
              <div className="sr-dialog-body">
                <p>We've sent a 6-digit OTP to:</p>
                <div className="sr-otp-email">{form.contactEmail}</div>
                
                {otpSuccess && (
                  <div className="sr-otp-success">{otpSuccess}</div>
                )}
                
                {otpError && (
                  <div className="sr-otp-error">{otpError}</div>
                )}

                {!emailVerified && (
                  <>
                    <div className="sr-otp-input-wrapper">
                      <input
                        type="text"
                        className="sr-otp-input"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        value={otpInput}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setOtpInput(value);
                          setOtpError('');
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleVerifyOtp();
                          }
                        }}
                      />
                    </div>

                    <div className="sr-otp-actions">
                      <button
                        className="sr-btn sr-btn-primary"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpInput.length !== 6}
                      >
                        {verifyingOtp ? '⏳ Verifying...' : 'Verify OTP'}
                      </button>
                      
                      <button
                        className="sr-btn sr-btn-secondary"
                        onClick={() => {
                          setOtpDialogOpen(false);
                          setOtpInput('');
                          setOtpError('');
                          setOtpSuccess('');
                        }}
                        disabled={verifyingOtp}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="sr-resend-section">
                      {resendTimer > 0 ? (
                        <span className="sr-resend-timer">
                          Resend OTP in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="sr-btn-resend"
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS DIALOG */}
        {dialogOpen && (
          <div className="sr-dialog-overlay">
            <div className="sr-dialog">
              <div className="sr-dialog-header">
                <h2>✓ Registration Successful!</h2>
              </div>
              <div className="sr-dialog-body">
                <p>We have received your registration request and verified all provided information.</p>

                <div className="sr-request-box">
                  <div className="sr-request-label">Your Request ID</div>
                  <div className="sr-request-id">{requestId}</div>
                  <div className="sr-request-actions">
                    <button className="sr-btn-small" onClick={copyRequestId}>📋 Copy</button>
                    <button className="sr-btn-small" onClick={downloadRequestIdAsImage}>⬇️ Download</button>
                  </div>
                </div>

                <div className="sr-summary">
  <h4>Registration Summary</h4>
  <div className="sr-summary-item">
    <strong>Name:</strong> <span>{form.contactName || '-'}</span>
  </div>
  <div className="sr-summary-item">
    <strong>Email:</strong> <span>{form.contactEmail || '-'}</span>
  </div>
  <div className="sr-summary-item">
    <strong>PAN:</strong> <span>{form.panNumber || '-'}</span>
  </div>
  <div className="sr-summary-item">
    <strong>GST Type:</strong> <span>{form.gstType || '-'}</span>
  </div>
  {form.gstType !== 'Unregistered' && (
    <div className="sr-summary-item">
      <strong>GST:</strong> <span>{form.gstNumber || '-'}</span>
    </div>
  )}
  <div className="sr-summary-item">
    <strong>Brand:</strong> <span>{form.brandName || '-'}</span>
  </div>
</div>



              </div>

              <div className="sr-dialog-footer">
                <button
                  className="sr-btn sr-btn-primary"
                  onClick={() => { 
                    setDialogOpen(false); 
                    setStep(1); 
                    setCompletedSteps([]); 
                    setForm({
                      category: '',
                      retailDetails: '',
                      retailDetailsLink: '',
                      referenceLink: '',
                      totalTime: '',
                      socialPlatforms: [],
                      instagramLink: '',
                      whatsappContact: '',
                      facebookLink: '',
                      twitterLink: '',
                      
                      telegramLink: '',
                      contactName: '',
                      contactEmail: '',
                      contactNumber: '',
                      contactDesignation: '',
                        gstType: '', // ADD THIS
                      gstNumber: '',
                      gstName: '',
                      gstAddress: '',
                        gstCertificate: null, // ADD THIS
                          panNumber: '', // ADD THIS
                      brandName: '',
                      manufacturerName: '',
                      trademarkNumber: '',
                      trademarkFile: null,
                      brandLogo: null,
                      authorizationLetter: null,
                      accountNumber: '',
                      reAccountNumber: '',
                      ifsc: '',
                      bankType: '',
                      shippingAddress: '',
                      shippingLat: '',
                      shippingLng: '',
                      locationFetchStatus: '',
                      digitalSignature: '',
                      password: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
