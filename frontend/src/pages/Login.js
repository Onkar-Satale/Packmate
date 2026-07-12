import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import api from '../api/axiosConfig';
import './Login.css';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Validate inputs
  const validateForm = () => {
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await api.post(`/login`, formData);

      const { token, email, firstName, lastName } = res.data.data;

      // Save user data (Non-sensitive info only for UI hydration)
      localStorage.setItem("email", res.data.data.email);
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('lastName', lastName);

      // Update global auth state (This securely establishes the in-memory singleton session)
      login({ token, email, firstName, lastName });

      toast.success("Login successful! Redirecting...");

      // Handle redirect
      const redirectUrl = localStorage.getItem('redirectAfterLogin');

      setTimeout(() => {
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        } else {
          navigate('/');
        }
      }, 1200);

    } catch (err) {
      console.error("Login Error:", err);

      if (err.response) {
        toast.error(err.response.data?.message || "Invalid credentials");
      } else if (err.request) {
        toast.error("Server not responding. Try again later.");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrap">


      <div className="login-container">
        <h2>Login to Your Account</h2>

        <form onSubmit={handleLogin} className="login-form">
          
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <div className="password-wrapper" style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging you in...' : 'Login'}
          </button>
        </form>

        <footer className="footer-login">
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}