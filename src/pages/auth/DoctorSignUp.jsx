import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { toast } from 'react-toastify';
import '../../styles/DoctorSignUp.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DoctorSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    specialization: '', licenseNumber: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword, specialization, licenseNumber } = formData;
    if (!fullName || !email || !password || !confirmPassword || !specialization || !licenseNumber) {
      setError('All fields are required'); return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  // Generate MT-D-000001 style UID
  const generateDoctorUID = async () => {
    const counterRef = doc(db, 'counters', 'doctorCounter');
    const newUID = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      const newCount = (counterDoc.data()?.count || 0) + 1;
      transaction.update(counterRef, { count: newCount });
      return `MT-D-${String(newCount).padStart(6, '0')}`;
    });
    return newUID;
  };

  // Register doctor in PostgreSQL via Spring Boot
  const registerInPostgres = async (customUID, email, name, licenseNumber, specialization) => {
    try {
      await fetch(`${BACKEND_URL}/api/doctor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: customUID,
          email: email,
          name: name,
          licenseNumber: licenseNumber,
          specialization: specialization,
          role: 'doctor'
        })
      });
    } catch (error) {
      console.error('Error registering doctor in PostgreSQL:', error);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      // 1. Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth, formData.email, formData.password
      );

      // 2. Generate custom UID
      const customUID = await generateDoctorUID();

      // 3. Save to Firestore with custom UID
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: customUID,
        firebaseUid: userCredential.user.uid,
        name: formData.fullName,
        email: formData.email,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        role: 'doctor',
        createdAt: new Date().toISOString(),
      });

      // 4. Register in PostgreSQL
      await registerInPostgres(
        customUID,
        formData.email,
        formData.fullName,
        formData.licenseNumber,
        formData.specialization
      );

      setLoading(false);
      toast.success('Account created successfully! Redirecting...', {
        position: "top-center", autoClose: 2000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      setTimeout(() => navigate('/doctor/dashboard', { replace: true }), 500);

    } catch (err) {
      const errorMessage = err.message.replace('Firebase: ', '');
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center", autoClose: 2000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (!userDoc.exists()) {
        // Generate custom UID
        const customUID = await generateDoctorUID();

        // Save to Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: customUID,
          firebaseUid: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          specialization: formData.specialization || 'Not specified',
          licenseNumber: formData.licenseNumber || 'Pending',
          role: 'doctor',
          createdAt: new Date().toISOString(),
        });

        // Register in PostgreSQL
        await registerInPostgres(
          customUID,
          result.user.email,
          result.user.displayName,
          formData.licenseNumber || 'Pending',
          formData.specialization || 'Not specified'
        );
      }

      setLoading(false);
      toast.success('Signed up successfully with Google! Redirecting...', {
        position: "top-center", autoClose: 2000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      setTimeout(() => navigate('/doctor/dashboard', { replace: true }), 500);

    } catch (err) {
      const errorMessage = err.message.replace('Firebase: ', '');
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center", autoClose: 2000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Doctor Portal</h1>
          <p>Create your professional account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailSignup}>
          <div className="form-group">
            <input type="text" name="fullName" placeholder="Full Name"
              value={formData.fullName} onChange={handleChange} disabled={loading} />
          </div>
          <div className="form-group">
            <input type="email" name="email" placeholder="Email Address"
              value={formData.email} onChange={handleChange} disabled={loading} />
          </div>
          <div className="form-row">
            <div className="form-group password-group">
              <input type={showPassword ? "text" : "password"} name="password"
                placeholder="Password" value={formData.password}
                onChange={handleChange} disabled={loading} />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="form-group password-group">
              <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                placeholder="Confirm Password" value={formData.confirmPassword}
                onChange={handleChange} disabled={loading} />
              <button type="button" className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <input type="text" name="specialization" placeholder="Specialization"
                value={formData.specialization} onChange={handleChange} disabled={loading} />
            </div>
            <div className="form-group">
              <input type="text" name="licenseNumber" placeholder="License Number"
                value={formData.licenseNumber} onChange={handleChange} disabled={loading} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button className="btn-google" onClick={handleGoogleSignup} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <p className="login-link">
          Already have an account? <a href="/doctor/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default DoctorSignup;


/*What changed in both files:**
```
✅ generatePatientUID() → MT-P-000001
✅ generateDoctorUID()  → MT-D-000001
✅ Firestore stores both customUID and firebaseUid
✅ Auto registers in PostgreSQL on signup
✅ Works for both email and Google signup */