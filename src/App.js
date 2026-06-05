import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import DoctorLogin from "./pages/auth/DoctorLogin";
import DoctorSignUp from "./pages/auth/DoctorSignUp";
import PatientLogin from "./pages/auth/PatientLogin";
import PatientSignUp from "./pages/auth/PatientSignUp";
import ForgotPassword from './pages/auth/ForgotPassword';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DoctorDashboardWrapper from "./pages/doctor/DoctorDashboardWrapper";
import PatientDashboardWrapper from "./pages/patient/PatientDashboardWrapper";

function App() {
  return (
    <Router>
      {/* toast notifications */}
      <ToastContainer position="top-right" autoClose={2000} />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Doctor Routes */}
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/signup" element={<DoctorSignUp />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboardWrapper />} />

        {/* Patient Routes */}
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/signup" element={<PatientSignUp />} />
        <Route path="/patient/dashboard" element={<PatientDashboardWrapper />} />
        {/*forgot pass */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;