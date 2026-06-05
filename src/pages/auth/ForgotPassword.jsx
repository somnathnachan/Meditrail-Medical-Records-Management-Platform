import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { toast } from 'react-toastify';
import '../../styles/PatientLogin.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address', {
        position: "top-center", autoClose: 3000,
        hideProgressBar: false, closeOnClick: true,
        pauseOnHover: false, draggable: false,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address', {
        position: "top-center", autoClose: 3000,
        hideProgressBar: false, closeOnClick: true,
        pauseOnHover: false, draggable: false,
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox ✅', {
        position: "top-center", autoClose: 4000,
        hideProgressBar: false, closeOnClick: true,
        pauseOnHover: false, draggable: false,
      });
      setTimeout(() => {
        navigate(role === 'doctor' ? '/doctor/login' : '/patient/login');
      }, 2000);
    } catch (error) {
      toast.error('Email not found. Please check and try again.', {
        position: "top-center", autoClose: 3000,
        hideProgressBar: false, closeOnClick: true,
        pauseOnHover: false, draggable: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-login-container">
      <div className="patient-login-card">
        <div className="patient-login-header">
          <h1>Forgot Password</h1>
          <p>Enter your {role} email to reset password</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="patient-form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="patient-btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <p className="patient-signup-link">
          Remember your password?{' '}
          <a href={role === 'doctor' ? '/doctor/login' : '/patient/login'}>
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;