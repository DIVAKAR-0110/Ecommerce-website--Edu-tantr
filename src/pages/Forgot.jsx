/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import './Forgot.css';

const Forgot = () => {
  // Step state management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: CAPTCHA
  const [captchaId, setCaptchaId] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaBackground, setCaptchaBackground] = useState('');

  // Step 2: Email & OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  // Step 3: Password Reset
  const [contactName, setContactName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:3000/api';

  // Generate random gradient background for CAPTCHA
  const generateGradient = () => {
    const colors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867'],
      ['#a8edea', '#fed6e3'],
      ['#ff9a9e', '#fecfef'],
    ];
    const randomColors = colors[Math.floor(Math.random() * colors.length)];
    return `linear-gradient(135deg, ${randomColors[0]}, ${randomColors[1]})`;
  };

  // Fetch new CAPTCHA
  const fetchCaptcha = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-captcha`);
      const data = await response.json();

      if (data.success) {
        setCaptchaId(data.captchaId);
        setCaptchaText(data.captchaText);
        setCaptchaBackground(generateGradient());
        setCaptchaInput('');
      } else {
        setMessage('Failed to load CAPTCHA');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching CAPTCHA:', error);
      setMessage('Error loading CAPTCHA. Please refresh.');
      setMessageType('error');
    }
  };

  // Initialize CAPTCHA on component mount
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Password strength checker
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength('');
      return;
    }

    let strength = 0;
    const checks = {
      length: newPassword.length >= 8,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    strength = Object.values(checks).filter(Boolean).length;

    if (strength <= 2) setPasswordStrength('Weak');
    else if (strength === 3) setPasswordStrength('Moderate');
    else if (strength === 4) setPasswordStrength('Strong');
    else setPasswordStrength('Very Strong');
  }, [newPassword]);

  // Step 1: Verify CAPTCHA
  const handleCaptchaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/verify-captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaId, captchaInput }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('CAPTCHA verified! Enter your email.');
        setMessageType('success');
        setCurrentStep(2);
      } else {
        setMessage(data.message || 'Invalid CAPTCHA');
        setMessageType('error');
        fetchCaptcha(); // Refresh CAPTCHA
      }
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error);
      setMessage('Verification failed. Please try again.');
      setMessageType('error');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send OTP - FIXED DUPLICATE IF STATEMENT
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('OTP sent to your email!');
        setMessageType('success');
        setShowOtpInput(true);
      } else {
        setMessage(data.message || 'Failed to send OTP');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessage('Error sending OTP. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('OTP verified! Enter your contact name.');
        setMessageType('success');
        setCurrentStep(3);
      } else {
        setMessage(data.message || 'Invalid OTP');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setMessage('Verification failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify Contact Name and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match!');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (passwordStrength === 'Weak' || passwordStrength === '') {
      setMessage('Password is too weak. Use a stronger password.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      // First verify contact name
      const verifyResponse = await fetch(`${API_BASE_URL}/forgot-password/verify-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contactName }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setMessage(verifyData.message || 'Contact name does not match');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Then reset password
      const resetResponse = await fetch(`${API_BASE_URL}/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      const resetData = await resetResponse.json();

      if (resetData.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setMessageType('success');
        setTimeout(() => {
          window.location.href = '/SellerLogin';
        }, 2000);
      } else {
        setMessage(resetData.message || 'Failed to reset password');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage('Error resetting password. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">🔐 Forgot Password</h2>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. CAPTCHA</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Verify Email</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Reset Password</div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* STEP 1: CAPTCHA VERIFICATION */}
        {currentStep === 1 && (
          <form onSubmit={handleCaptchaSubmit} className="forgot-form">
            <div className="captcha-container">
              <div
                className="captcha-display"
                style={{ background: captchaBackground }}
              >
                <span className="captcha-text">{captchaText}</span>
              </div>
              <button
                type="button"
                onClick={fetchCaptcha}
                className="refresh-captcha-btn"
                title="Refresh CAPTCHA"
              >
                🔄
              </button>
            </div>

            <input
              type="text"
              placeholder="Enter CAPTCHA"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              className="input-field"
              maxLength={7}
            />

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify CAPTCHA'}
            </button>
          </form>
        )}

        {/* STEP 2: EMAIL & OTP VERIFICATION */}
        {currentStep === 2 && (
          <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp} className="forgot-form">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              disabled={showOtpInput}
            />

            {!showOtpInput && (
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            )}

            {showOtpInput && (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="input-field"
                  maxLength={6}
                />
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </>
            )}
          </form>
        )}

        {/* STEP 3: PASSWORD RESET */}
        {currentStep === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="warning-box">
              <p>⚠️ <strong>Important:</strong></p>
              <ul>
                <li>Your password must be at least 8 characters long</li>
                <li>Include uppercase, lowercase, numbers, and special characters</li>
                <li>Do not share your password with anyone</li>
              </ul>
            </div>

            <input
              type="text"
              placeholder="Enter your registered contact name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
              className="input-field"
            />

            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="input-field"
                minLength={8}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {newPassword && (
              <div className={`password-strength strength-${passwordStrength.toLowerCase().replace(' ', '-')}`}>
                Password Strength: <strong>{passwordStrength}</strong>
              </div>
            )}

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field"
              minLength={8}
            />

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <a href="/SellerLogin">← Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default Forgot;
