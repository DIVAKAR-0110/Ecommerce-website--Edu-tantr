/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, TrendingUp, Package, DollarSign, BarChart3, Star, Zap, Award, Eye, EyeOff, Sparkles, Store, Users, Mail, Lock, CheckCircle } from 'lucide-react';
import styles from './SellerLogin.module.css';
import { useNavigate } from 'react-router-dom';

const SellerLogin = () => {
  const navigate = useNavigate();

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Login successful! Redirecting to dashboard...');

        const sessionData = {
          seller: {
            ...data.seller,
            profilePictureId: data.seller.profilePictureId || null,
            manufacturerName: data.seller.manufacturerName || null,
          },
          expiresAt: Date.now() + 60 * 60 * 1000,
        };
        localStorage.setItem('sellerSession', JSON.stringify(sessionData));

        navigate('/seller-dashboard');
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
    <div className={`${styles['seller-login-container']} ${isLoaded ? styles.loaded : ''}`}>
      <div className={styles['left-panel']} ref={leftPanelRef} onMouseMove={handleMouseMove}>
        <div className={styles['gradient-bg']}>
          <div className={`${styles['gradient-orb']} ${styles['orb-1']}`}></div>
          <div className={`${styles['gradient-orb']} ${styles['orb-2']}`}></div>
          <div className={`${styles['gradient-orb']} ${styles['orb-3']}`}></div>
          <div className={`${styles['gradient-orb']} ${styles['orb-4']}`}></div>
        </div>

        <div className={styles['waves-container']}>
          <div className={`${styles.wave} ${styles['wave-1']}`}></div>
          <div className={`${styles.wave} ${styles['wave-2']}`}></div>
          <div className={`${styles.wave} ${styles['wave-3']}`}></div>
          <div className={`${styles.wave} ${styles['wave-4']}`}></div>
        </div>

        <div className={styles.particles}>
          {[...Array(25)].map((_, i) => (
            <div key={i} className={styles.particle} style={{ animationDelay: `${i * 0.3}s` }}></div>
          ))}
        </div>

        <div className={styles['glass-panel']}>
          <div className={styles['brand-icon']}>
            <Store size={40} />
          </div>
          <h1 className={styles['brand-title']}>SellerHub</h1>
          <p className={styles['brand-subtitle']}>Elevate Your E-Commerce Journey</p>
          <div className={styles['stats-grid']}>
            <div className={styles['stat-item']}>
              <TrendingUp size={24} />
              <span>+250% Growth</span>
            </div>
            <div className={styles['stat-item']}>
              <Star size={24} />
              <span>4.9★ Rating</span>
            </div>
            <div className={styles['stat-item']}>
              <Package size={24} />
              <span>50K+ Orders</span>
            </div>
          </div>
        </div>

        {floatingIcons.map(({ Icon, delay, position }, index) => (
          <div
            key={index}
            className={styles['floating-icon']}
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

        <div className={styles['seller-illustration']}>
          <div className={styles['illustration-glow']}></div>
          <div className={styles['illustration-ring']}></div>
        </div>
      </div>

      <div className={styles['right-panel']}>
        <div className={styles['login-form-wrapper']}>
          
          {authStep === 'email' && (
            <>
              <div className={styles['form-header']}>
                <div className={styles['icon-wrapper']}>
                  <Mail size={48} className={styles['header-icon']} />
                </div>
                <h2 className={styles['welcome-title']}>Verify Your Email 📧</h2>
                <p className={styles['welcome-subtitle']}>Enter your email to receive a verification code</p>
              </div>

              <div className={styles['login-form']}>
                {errorMessage && (
                  <div className={`${styles['message-box']} ${styles['error-message']}`}>
                    {errorMessage}
                  </div>
                )}
                
                {successMessage && (
                  <div className={`${styles['message-box']} ${styles['success-message']}`}>
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSendOTP}>
                  <div className={`${styles['input-group']} ${emailFocused ? styles.focused : ''}`}>
                    <label htmlFor="email">Email Address</label>
                    <div className={styles['input-wrapper']}>
                      <Mail className={styles['input-icon']} size={20} />
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
                      <div className={styles['input-glass-effect']}></div>
                    </div>
                  </div>

                  <button type="submit" className={styles['login-button']} disabled={loading}>
                    <span className={styles['button-text']}>
                      {loading ? 'Sending OTP...' : 'Send Verification Code'}
                    </span>
                    <span className={styles['button-shine']}></span>
                    <Sparkles className={styles['button-icon']} size={18} />
                  </button>
                </form>

                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <div className={styles['secondary-actions-grid']}>
                  <a href="/SalesRegister" className={`${styles['action-card']} ${styles['create-account']}`}>
                    <div className={styles['action-icon-wrapper']}>
                      <Users size={24} />
                    </div>
                    <div className={styles['action-content']}>
                      <h4>Create New Account</h4>
                      <p>Join as a new seller</p>
                    </div>
                    <div className={styles['action-arrow']}>→</div>
                  </a>

                  <a href="/Forgot" className={`${styles['action-card']} ${styles['forgot-password']}`}>
                    <div className={styles['action-icon-wrapper']}>
                      <Lock size={24} />
                    </div>
                    <div className={styles['action-content']}>
                      <h4>Forgot Password?</h4>
                      <p>Reset your credentials</p>
                    </div>
                    <div className={styles['action-arrow']}>→</div>
                  </a>
                </div>
              </div>
            </>
          )}

          {authStep === 'otp' && (
            <>
              <div className={styles['form-header']}>
                <div className={styles['icon-wrapper']}>
                  <Lock size={48} className={styles['header-icon']} />
                </div>
                <h2 className={styles['welcome-title']}>Enter Verification Code 🔐</h2>
                <p className={styles['welcome-subtitle']}>
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <button className={styles['change-email-btn']} onClick={handleChangeEmail}>
                  Change Email
                </button>
              </div>

              <div className={styles['login-form']}>
                {errorMessage && (
                  <div className={`${styles['message-box']} ${styles['error-message']}`}>
                    {errorMessage}
                  </div>
                )}
                
                {successMessage && (
                  <div className={`${styles['message-box']} ${styles['success-message']}`}>
                    <CheckCircle size={18} />
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleVerifyOTP}>
                  <div className={`${styles['input-group']} ${otpFocused ? styles.focused : ''}`}>
                    <label htmlFor="otp">Verification Code</label>
                    <div className={styles['input-wrapper']}>
                      <Lock className={styles['input-icon']} size={20} />
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
                      <div className={styles['input-glass-effect']}></div>
                    </div>
                  </div>

                  <div className={styles['otp-timer-section']}>
                    {!canResend ? (
                      <p className={styles['timer-text']}>
                        Resend code in <span className={styles['timer-count']}>{timer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        className={styles['resend-btn']}
                        onClick={handleResendOTP}
                        disabled={loading}
                      >
                        {loading ? 'Resending...' : 'Resend Code'}
                      </button>
                    )}
                  </div>

                  <button type="submit" className={styles['login-button']} disabled={loading}>
                    <span className={styles['button-text']}>
                      {loading ? 'Verifying...' : 'Verify & Continue'}
                    </span>
                    <span className={styles['button-shine']}></span>
                    <CheckCircle className={styles['button-icon']} size={18} />
                  </button>
                </form>
              </div>
            </>
          )}

          {authStep === 'login' && (
            <>
              <div className={styles['form-header']}>
                <h2 className={styles['welcome-title']}>Welcome Seller! 🚀</h2>
                <p className={styles['welcome-subtitle']}>Manage your store, sales & insights</p>
              </div>

              <div className={styles['login-form']}>
                {errorMessage && (
                  <div className={`${styles['message-box']} ${styles['error-message']}`}>
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className={`${styles['message-box']} ${styles['success-message']}`}>
                    <CheckCircle size={18} />
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className={styles['input-group']}>
                    <label htmlFor="login-email">Email Address</label>
                    <div className={`${styles['input-wrapper']} ${styles['verified-input']}`}>
                      <Mail className={styles['input-icon']} size={20} />
                      <input
                        type="email"
                        id="login-email"
                        value={email}
                        disabled
                        className={styles['verified-email']}
                      />
                      <CheckCircle className={styles['verified-icon']} size={20} />
                      <div className={styles['input-glass-effect']}></div>
                    </div>
                  </div>

                  <div className={`${styles['input-group']} ${passwordFocused ? styles.focused : ''}`}>
                    <label htmlFor="password">Password</label>
                    <div className={`${styles['input-wrapper']} ${styles['password-wrapper']}`}>
                      <Lock className={styles['input-icon']} size={20} />
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
                        className={styles['password-toggle']}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <div className={styles['input-glass-effect']}></div>
                    </div>
                  </div>

                  <div className={styles['form-options']}>
                    <label className={styles['remember-me']}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className={styles['checkbox-custom']}></span>
                      <span>Remember Me</span>
                    </label>
                    <a href="/Forgot" className={styles['forgot-link']}>Forgot Password?</a>
                  </div>

                  <button type="submit" className={styles['login-button']} disabled={loading}>
                    <span className={styles['button-text']}>
                      {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </span>
                    <span className={styles['button-shine']}></span>
                    <Sparkles className={styles['button-icon']} size={18} />
                  </button>
                </form>

                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <div className={styles['secondary-actions']}>
                  <p>Don't have an account? <a href="/SalesRegister" className={styles['signup-link']}>Create Account</a></p>
                </div>
              </div>

              <div className={styles['premium-badge']}>
                <Zap size={16} />
                <span>Premium Seller Portal</span>
                <div className={styles['badge-glow']}></div>
              </div>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
