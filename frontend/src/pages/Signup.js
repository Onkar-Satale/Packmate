import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

import api from '../api/axiosConfig';
import './Login.css';
import { AuthContext } from '../context/AuthContext';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Signup() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle input change
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Validate inputs
    const validateForm = () => {
        const { firstName, email, password, confirmPassword } = formData;

        if (!firstName || !email || !password || !confirmPassword) {
            toast.error("⚠️ Please fill all required fields");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("❌ Invalid email format");
            return false;
        }

        if (password.length < 6) {
            toast.error("❌ Password must be at least 6 characters");
            return false;
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}/;
        if (!strongPasswordRegex.test(password)) {
            toast.error("❌ Password must contain upper, lower, and number");
            return false;
        }

        if (password !== confirmPassword) {
            toast.error("❌ Passwords do not match");
            return false;
        }

        return true;
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const { confirmPassword, ...submitData } = formData;
            const res = await api.post(`/register`, submitData);

            const { token, email, firstName, lastName } = res.data.data;

            localStorage.setItem("token", res.data.data.token);
            localStorage.setItem("email", res.data.data.email);
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('lastName', lastName);

            // 🔹 Update AuthContext
            login({ token, email, firstName, lastName });

            toast.success("🎉 Signup successful! Redirecting...");

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
            console.error("Signup Error:", err);
            
            if (err.response) {
                toast.error(err.response.data?.message || "Signup failed");
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
                <h2>Create Your Account</h2>

                <form onSubmit={handleSignup} className="login-form">

                    <label>First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />

                    <label>Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Enter your last name (optional)"
                        value={formData.lastName}
                        onChange={handleChange}
                    />

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

                    <label>Confirm Password</label>
                    <div className="password-wrapper" style={{ position: 'relative' }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <span 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        className="login-btn" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing you up...' : 'Sign Up'}
                    </button>
                </form>

                <footer className="footer-login">
                    <p>
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
