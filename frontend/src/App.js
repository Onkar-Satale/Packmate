// src/App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'; // Import Navbar component
import Footer from './components/Footer'; // Import Footer component
import Home from './pages/Home'; // Import the Home component
import AboutUs from './pages/AboutUs'; // Import AboutUs component
import Features from './pages/Features'; // Import Features component
import HowItWorks from './pages/HowItWorks'; // Import HowItWorks component
import Home2 from './pages/Home2'; // Import the new Home2 component
import Home3 from './pages/Home3'; // Import the new Home3 component
import Home4 from './pages/Home4'; // Import the new Home4 component
import Login from './pages/Login';
import ContactUs from './pages/ContactUs'; // Adjust the path based on your file structure
import Signup from './pages/Signup'; // Import Signup page
import PackingAssistant from "./pages/PackingAssistant";

import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';
import AccountPage from './pages/AccountPage';
import BotpressChat from "./pages/Botpresschat";
import TripDetailsPage from "./pages/TripDetailsPage";



const App = () => {
  const { logout } = useContext(AuthContext); // get logout from context

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={1500} closeButton={false} closeOnClick={false} pauseOnHover={false} />
      {/* Navbar component with logout prop */}
      <Navbar logout={logout} />
      <BotpressChat />
      {/* Define the routes */}
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <Home />
              <Home2 />
              <Home3 />
              <Home4 />
            </div>
          }
        />
        <Route path="/how-it-works" element={<HowItWorks />} />  {/* public now */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/packing-assistant" element={<ProtectedRoute><PackingAssistant /></ProtectedRoute>} />
        <Route path="/trip/:id" element={<ProtectedRoute><TripDetailsPage /></ProtectedRoute>} />

      </Routes>

      {/* Footer component */}
      <Footer />
    </Router>
  );
};

export default App;
