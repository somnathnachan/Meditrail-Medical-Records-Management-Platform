import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import PatientDashboard from './PatientDashboard';

const PatientDashboardWrapper = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        navigate('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f8f9fa'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}></div>
      <p style={{ marginTop: '16px', color: '#666', fontSize: '15px' }}>Loading MediTrail...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!authenticated) return null;

  const handleLogout = () => {
    navigate('/');
  };

  return <PatientDashboard onLogout={handleLogout} />;
};

export default PatientDashboardWrapper;