/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10
    }));
    setParticles(newParticles);
  }, []);

  const handleMouseMove = (e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', { email, password });
  };

  return (
    <div className="login-container" onMouseMove={handleMouseMove}>
      {/* Animated Background */}
      <div className="background-gradient"></div>
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Illustration Section */}
        <div className="illustration-section">
          <div className="illustration-card glass-effect">
            <svg viewBox="0 0 500 500" className="illustration">
              {/* Person with laptop illustration */}
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#f093fb', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#f5576c', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Floating elements */}
              <circle cx="100" cy="100" r="30" fill="url(#grad1)" opacity="0.3" className="float-element" />
              <circle cx="400" cy="150" r="40" fill="url(#grad2)" opacity="0.2" className="float-element-2" />
              
              {/* Laptop base */}
              <rect x="150" y="280" width="200" height="120" rx="10" fill="url(#grad1)" />
              <rect x="160" y="290" width="180" height="90" rx="5" fill="#fff" />
              
              {/* Person */}
              <circle cx="250" cy="200" r="40" fill="#764ba2" />
              <ellipse cx="250" cy="270" rx="50" ry="70" fill="url(#grad1)" />
              
              {/* Arms */}
              <path d="M 200 250 Q 180 280 190 310" stroke="#764ba2" strokeWidth="15" fill="none" strokeLinecap="round" />
              <path d="M 300 250 Q 320 280 310 310" stroke="#764ba2" strokeWidth="15" fill="none" strokeLinecap="round" />
              
              {/* Tech icons floating */}
              <g className="float-icon">
                <circle cx="350" cy="200" r="25" fill="rgba(102, 126, 234, 0.2)" />
                <text x="350" y="210" textAnchor="middle" fontSize="24">⚡</text>
              </g>
              <g className="float-icon-2">
                <circle cx="150" cy="180" r="20" fill="rgba(245, 87, 108, 0.2)" />
                <text x="150" y="188" textAnchor="middle" fontSize="20">🚀</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="login-section">
          <div className="login-card glass-effect">
            <div className="card-glow"></div>
            
            <h1 className="login-title fade-in">Please Login</h1>
            <p className="login-subtitle fade-in-delay">Welcome back! Enter your credentials</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>

              <a href="#" className="forgot-password">Forgot password?</a>

              <button type="submit" className="login-button">
                <span>Login</span>
                <div className="button-glow"></div>
              </button>
            </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="social-login">
              <button className="social-button google">
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>

              <button className="social-button facebook">
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>

              <button className="social-button apple">
                <svg viewBox="0 0 24 24" className="social-icon">
                  <path fill="#000" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <p className="register-link">
              Don't have an account? <a href="#" className="register-link-action">Register now</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <a href="#" className="footer-link">Terms of Service</a>
        <span className="footer-divider">•</span>
        <a href="#" className="footer-link">Privacy Policy</a>
        <span className="footer-divider">•</span>
        <a href="#" className="footer-link">Contact Us</a>
      </footer>
    </div>
  );
};

export default LoginPage;