/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, TrendingUp, Package, DollarSign, BarChart3, Star, Zap, Award, Eye, EyeOff, Sparkles, Store, Users, Mail, Lock, CheckCircle } from 'lucide-react';
import './SellerLogin.css';

const SellerLogin = () => {
  // Authentication Steps: 'email' -> 'otp' -> 'login'
  const [authStep, setAuthStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [otpFocused, setOtpFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // OTP Timer States
  const [otpSent, setOtpSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const leftPanelRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Timer Effect for OTP Resend
  useEffect(() => {
    if (otpSent && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [otpSent, timer]);

  const handleMouseMove = (e) => {
    if (leftPanelRef.current) {
      const rect = leftPanelRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    }
  };

  // Send OTP to Email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('OTP sent successfully! Check your email.');
        setOtpSent(true);
        setCanResend(false);
        setTimer(60);
        setAuthStep('otp');
      } else {
        setErrorMessage(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('OTP resent successfully!');
        setCanResend(false);
        setTimer(60);
        setOtp('');
      } else {
        setErrorMessage(data.message || 'Failed to resend OTP.');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Email verified successfully!');
        setTimeout(() => {
          setAuthStep('login');
          setErrorMessage('');
          setSuccessMessage('');
        }, 1000);
      } else {
        setErrorMessage(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login Submit with Database Verification
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/seller-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Login successful! Redirecting to dashboard...');
        
        // Store user data if remember me is checked
        if (rememberMe) {
          localStorage.setItem('sellerData', JSON.stringify(data.seller));
        } else {
          sessionStorage.setItem('sellerData', JSON.stringify(data.seller));
        }

        console.log('Login successful:', data.seller);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          // Replace with your dashboard route
          window.location.href = '/seller-dashboard';
          // Or if using React Router: navigate('/seller-dashboard');
        }, 2000);

      } else {
        setErrorMessage(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Change Email (Go back to email step)
  const handleChangeEmail = () => {
    setAuthStep('email');
    setOtp('');
    setPassword('');
    setOtpSent(false);
    setCanResend(false);
    setTimer(60);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const floatingIcons = [
    { Icon: ShoppingCart, delay: 0, position: { top: '15%', left: '20%' } },
    { Icon: TrendingUp, delay: 0.5, position: { top: '25%', left: '70%' } },
    { Icon: Package, delay: 1, position: { top: '50%', left: '15%' } },
    { Icon: DollarSign, delay: 1.5, position: { top: '60%', left: '75%' } },
    { Icon: BarChart3, delay: 2, position: { top: '75%', left: '25%' } },
    { Icon: Star, delay: 2.5, position: { top: '35%', left: '85%' } },
    { Icon: Zap, delay: 3, position: { top: '80%', left: '65%' } },
    { Icon: Award, delay: 3.5, position: { top: '40%', left: '40%' } },
    { Icon: Store, delay: 4, position: { top: '20%', left: '50%' } },
    { Icon: Users, delay: 4.5, position: { top: '65%', left: '50%' } },
    { Icon: Sparkles, delay: 5, position: { top: '45%', left: '80%' } },
  ];

  return (
    <div className={`seller-login-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Left Visual Panel */}
      <div 
        className="left-panel"
        ref={leftPanelRef}
        onMouseMove={handleMouseMove}
      >
        {/* Animated Background Gradients */}
        <div className="gradient-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="gradient-orb orb-4"></div>
        </div>

        {/* Animated Waves */}
        <div className="waves-container">
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
          <div className="wave wave-4"></div>
        </div>

        {/* Particle Effects */}
        <div className="particles">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="particle" style={{ animationDelay: `${i * 0.3}s` }}></div>
          ))}
        </div>

        {/* Glassmorphism Panel */}
        <div className="glass-panel">
          <div className="brand-icon">
            <Store size={40} />
          </div>
          <h1 className="brand-title">SellerHub</h1>
          <p className="brand-subtitle">Elevate Your E-Commerce Journey</p>
          <div className="stats-grid">
            <div className="stat-item">
              <TrendingUp size={24} />
              <span>+250% Growth</span>
            </div>
            <div className="stat-item">
              <Star size={24} />
              <span>4.9★ Rating</span>
            </div>
            <div className="stat-item">
              <Package size={24} />
              <span>50K+ Orders</span>
            </div>
          </div>
        </div>

        {/* Floating Holographic Icons */}
        {floatingIcons.map(({ Icon, delay, position }, index) => (
          <div
            key={index}
            className="floating-icon"
            style={{
              top: position.top,
              left: position.left,
              animationDelay: `${delay}s`,
              transform: `translate(${mousePosition.x * 20 - 10}px, ${mousePosition.y * 20 - 10}px)`,
              transition: 'transform 0.3s ease-out'
            }}
          >
            <Icon size={32} />
          </div>
        ))}

        {/* Seller Illustration */}
        <div className="seller-illustration">
          <div className="illustration-glow"></div>
          <div className="illustration-ring"></div>
        </div>
      </div>

      {/* Right Panel - Dynamic Content Based on Auth Step */}
      <div className="right-panel">
        <div className="login-form-wrapper">
          
          {/* STEP 1: Email Verification Dialog */}
         {/* STEP 1: Email Verification Dialog */}
{authStep === 'email' && (
  <>
    <div className="form-header">
      <div className="icon-wrapper">
        <Mail size={48} className="header-icon" />
      </div>
      <h2 className="welcome-title">Verify Your Email 📧</h2>
      <p className="welcome-subtitle">Enter your email to receive a verification code</p>
    </div>

    <div className="login-form">
      {errorMessage && (
        <div className="message-box error-message">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="message-box success-message">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSendOTP}>
        <div className={`input-group ${emailFocused ? 'focused' : ''}`}>
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              placeholder="seller@example.com"
              disabled={loading}
            />
            <div className="input-glass-effect"></div>
          </div>
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          <span className="button-text">
            {loading ? 'Sending OTP...' : 'Send Verification Code'}
          </span>
          <span className="button-shine"></span>
          <Sparkles className="button-icon" size={18} />
        </button>
      </form>

      <div className="divider">
        <span>or</span>
      </div>

      {/* NEW: Enhanced Secondary Actions with Icons */}
      <div className="secondary-actions-grid">
        <a href="/SalesRegister" className="action-card create-account">
          <div className="action-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="action-content">
            <h4>Create New Account</h4>
            <p>Join as a new seller</p>
          </div>
          <div className="action-arrow">→</div>
        </a>

        <a href="/Forgot" className="action-card forgot-password">
          <div className="action-icon-wrapper">
            <Lock size={24} />
          </div>
          <div className="action-content">
            <h4>Forgot Password?</h4>
            <p>Reset your credentials</p>
          </div>
          <div className="action-arrow">→</div>
        </a>
      </div>
    </div>
  </>
)}


          {/* STEP 2: OTP Verification Dialog */}
          {authStep === 'otp' && (
            <>
              <div className="form-header">
                <div className="icon-wrapper">
                  <Lock size={48} className="header-icon" />
                </div>
                <h2 className="welcome-title">Enter Verification Code 🔐</h2>
                <p className="welcome-subtitle">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <button 
                  className="change-email-btn"
                  onClick={handleChangeEmail}
                >
                  Change Email
                </button>
              </div>

              <div className="login-form">
                {errorMessage && (
                  <div className="message-box error-message">
                    {errorMessage}
                  </div>
                )}
                
                {successMessage && (
                  <div className="message-box success-message">
                    <CheckCircle size={18} />
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleVerifyOTP}>
                  <div className={`input-group ${otpFocused ? 'focused' : ''}`}>
                    <label htmlFor="otp">Verification Code</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={20} />
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(value);
                        }}
                        onFocus={() => setOtpFocused(true)}
                        onBlur={() => setOtpFocused(false)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        disabled={loading}
                      />
                      <div className="input-glass-effect"></div>
                    </div>
                  </div>

                  <div className="otp-timer-section">
                    {!canResend ? (
                      <p className="timer-text">
                        Resend code in <span className="timer-count">{timer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="resend-btn"
                        onClick={handleResendOTP}
                        disabled={loading}
                      >
                        {loading ? 'Resending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>

                  <button type="submit" className="login-button" disabled={loading}>
                    <span className="button-text">
                      {loading ? 'Verifying...' : 'Verify & Continue'}
                    </span>
                    <span className="button-shine"></span>
                    <CheckCircle className="button-icon" size={18} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* STEP 3: Login Form (After Email Verified) */}
          {authStep === 'login' && (
            <>
              <div className="form-header">
                <h2 className="welcome-title">Welcome Seller! 🚀</h2>
                <p className="welcome-subtitle">Manage your store, sales & insights</p>
              </div>

              <div className="login-form">
                {errorMessage && (
                  <div className="message-box error-message">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="message-box success-message">
                    <CheckCircle size={18} />
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  {/* Email Input - Pre-filled and Disabled */}
                  <div className="input-group">
                    <label htmlFor="login-email">Email Address</label>
                    <div className="input-wrapper verified-input">
                      <Mail className="input-icon" size={20} />
                      <input
                        type="email"
                        id="login-email"
                        value={email}
                        disabled
                        className="verified-email"
                      />
                      <CheckCircle className="verified-icon" size={20} />
                      <div className="input-glass-effect"></div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className={`input-group ${passwordFocused ? 'focused' : ''}`}>
                    <label htmlFor="password">Password</label>
                    <div className="input-wrapper password-wrapper">
                      <Lock className="input-icon" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <div className="input-glass-effect"></div>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="checkbox-custom"></span>
                      <span>Remember Me</span>
                    </label>
                    <a href="/Forgot" className="forgot-link">Forgot Password?</a>
                  </div>

                  <button type="submit" className="login-button" disabled={loading}>
                    <span className="button-text">
                      {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </span>
                    <span className="button-shine"></span>
                    <Sparkles className="button-icon" size={18} />
                  </button>
                </form>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="secondary-actions">
                  <p>Don't have an account? <a href="/SalesRegister" className="signup-link">Create Account</a></p>
                </div>
              </div>

              {/* Premium Features Badge */}
              <div className="premium-badge">
                <Zap size={16} />
                <span>Premium Seller Portal</span>
                <div className="badge-glow"></div>
              </div>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;