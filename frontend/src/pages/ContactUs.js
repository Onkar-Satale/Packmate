import React, { useState, useContext, useCallback, useEffect } from 'react';
import './ContactUs.css';
import mapdis from '../assets/mapdis.png';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ContactUs() {
  const { user } = useContext(AuthContext);

  // ✅ safe extraction (works for string OR object user)
  const userEmail = typeof user === 'string' ? user : user?.email;
  const userFirstName = typeof user === 'object' ? user?.firstName : '';
  const userLastName = typeof user === 'object' ? user?.lastName : '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore form data on refresh, clear on unmount (when leaving the page)
  useEffect(() => {
    const savedContactForm = sessionStorage.getItem("contactFormData");
    if (savedContactForm) {
      setFormData(prev => ({ ...prev, ...JSON.parse(savedContactForm) }));
    }
    
    return () => {
      sessionStorage.removeItem("contactFormData");
    };
  }, []);

  // Save form data to sessionStorage exactly whenever it changes
  useEffect(() => {
    sessionStorage.setItem("contactFormData", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFocus = useCallback((field) => {
    if (field === 'firstName' && userFirstName && !formData.firstName) {
      setFormData(prev => ({ ...prev, firstName: userFirstName }));
    } else if (field === 'lastName' && userLastName && !formData.lastName) {
      setFormData(prev => ({ ...prev, lastName: userLastName }));
    } else if (field === 'email' && userEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [userFirstName, userLastName, userEmail, formData.firstName, formData.lastName, formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }

    if (!/^\+?\d{10,15}$/.test(formData.phone)) {
      toast.error('Enter a valid phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          access_key: process.env.REACT_APP_WEB3FORMS_KEY,
          subject: 'New Submission from PackMate Contact Form',
          email: formData.email,
          ...formData
        })
      });

      const result = await response.json();

      if (response.status === 200) {
        toast.success('Message sent successfully!');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        toast.error(result.message || 'Something went wrong with the API!');
      }
    } catch (err) {
      console.error('Contact Form Error:', err);
      toast.error('Network error or API failure. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">


      <main>
        <section>
          <h4>Get in Touch</h4>
          <h2>We’re Here to Help</h2>
          <p>Reach out to us for any inquiries or support regarding your PackMate experience.</p>
        </section>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="icon">📧</div>
            <h3>Email Us</h3>
            <p>support@packmate.com</p>
            <p>We aim to respond within 24 hours.</p>
          </div>
          <div className="contact-card">
            <div className="icon">📞</div>
            <h3>Call Us</h3>
            <p>+1-555-0125</p>
            <p>Need immediate assistance? Our team is ready to help you.</p>
          </div>
          <div className="contact-card">
            <div className="icon">📍</div>
            <h3>Visit Us</h3>
            <p>12 MG Road, 3rd Floor</p>
            <p>Bengaluru, Karnataka, India</p>
          </div>
        </div>

        <div className="form-image-grid">
          <form onSubmit={handleSubmit} className="contact-form" noValidate aria-label="Contact form">

            <div className="flex">
              <div className="input-group">
                <label className="label" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onFocus={() => handleFocus('firstName')}
                  className="input"
                  aria-label="First Name"
                  aria-required="true"
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onFocus={() => handleFocus('lastName')}
                  className="input"
                  aria-label="Last Name"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="flex">
              <div className="input-group">
                <label className="label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="abc@xyz.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  className="input"
                  aria-label="Email Address"
                  aria-required="true"
                />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  aria-label="Phone Number"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label" htmlFor="message">Your Message</label>
              <textarea
                id="message"
                rows="5"
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                className="input"
                aria-label="Your Message"
                aria-required="true"
              />
            </div>

            <div className="submit-group">
              <button type="submit" className="submit-btn" disabled={isSubmitting} aria-label={isSubmitting ? 'Sending Message' : 'Send Message'}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>

          </form>

          <div className="image-container">
            <img src={mapdis} alt="Map displaying our location" className="contact-image" />
          </div>
        </div>
      </main>
    </div>
  );
}
