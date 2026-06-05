import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

import '../../styles/PatientDashboard.css';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const BACKEND_URL = 'http://localhost:8080';

const PatientDashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medicalHistory');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    profile: false,
    security: false,
    notifications: false,
    privacy: false,
    account: false
  });
  const [notificationToggles, setNotificationToggles] = useState({
    emailAlert: true,
    smsAlert: false
  });


  // Settings modal state
const [settingModal, setSettingModal] = useState(null);
const [settingInput, setSettingInput] = useState('');
const [settingInput2, setSettingInput2] = useState('');
const [settingInput3, setSettingInput3] = useState('');
const [settingLoading, setSettingLoading] = useState(false);
const [settingError, setSettingError] = useState('');
const [settingSuccess, setSettingSuccess] = useState('');
const [showSettingPassword, setShowSettingPassword] = useState(false);
const [showSettingPassword2, setShowSettingPassword2] = useState(false);
const [showSettingPassword3, setShowSettingPassword3] = useState(false);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I am your MediTrail AI Assistant. I can help you understand your medical records, explain medical terms, or answer any health related questions. How can I help you today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

 useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      if (onLogout) onLogout();
      return;
    }
    setUser(currentUser);
    fetchPatientProfile(currentUser.uid);

    const blockBackNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBackNavigation);
    return () => window.removeEventListener('popstate', blockBackNavigation);
}, [onLogout, fetchPatientProfile]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report =>
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchQuery, reports]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchPatientProfile = useCallback(async (uid) => {
    setLoadingProfile(true);
    try {
      const patientDocRef = doc(db, 'patients', uid);
      const patientDoc = await getDoc(patientDocRef);
      if (patientDoc.exists()) {
        const profileData = patientDoc.data();
        setPatientProfile(profileData);
        fetchReports(profileData.uid);
      } else {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setPatientProfile(profileData);
          fetchReports(profileData.uid);
        }
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    } finally {
      setLoadingProfile(false);
    }
}, []);

  const fetchReports = async (uid) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/files/patient/${uid}`);
      const data = await response.json();
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.history.pushState(null, '', window.location.href);
      window.onpopstate = () => window.history.pushState(null, '', window.location.href);
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

const handleView = async (fileId) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/files/download/${fileId}`);
        const url = await response.text();
        window.open(url, '_blank', 'noopener,noreferrer'); // ✅ already correct
    } catch (error) {
        console.error('Error viewing file:', error);
    }
};

const handleDownload = async (fileId, fileName) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/files/download/${fileId}`);
        const url = await response.text();
        
        const fileResponse = await fetch(url);
        const blob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'medical-report';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
    }
};

 const handleShare = async (fileId, doctorName, description) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/files/download/${fileId}`);
    const longUrl = await response.text();

    const bitlyRes = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_BITLY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ long_url: longUrl })
    });
    const bitlyData = await bitlyRes.json(); 

    const shortUrl = bitlyData.link;
    if (navigator.share) {
      await navigator.share({
        title: 'MediTrail Medical Report',
        text: `${description}\n - Dr. ${doctorName}\n${shortUrl}`,
      });
    } else {
      navigator.clipboard.writeText(shortUrl);
      toast.success('Short link copied! ✅');
    }
  } catch (error) {
    console.error('Error sharing file:', error);
  }
};

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleNotification = (type) => {
    setNotificationToggles(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSettingAction = (action) => {
    setSettingError('');
    setSettingSuccess('');
    setSettingInput('');
    setSettingInput2('');
    setSettingInput3('');
    switch (action) {
      case 'editName': setSettingModal('editName'); break;
      case 'updatePhone': setSettingModal('updatePhone'); break;
      case 'changePassword': setSettingModal('changePassword'); break;
      case 'deleteAccount': setSettingModal('deleteAccount'); break;
      case 'logoutAll': handleLogoutAll(); break;
      case 'dataProtection': setSettingModal('dataProtection'); break;
      case 'dataStorage': setSettingModal('dataStorage'); break;
      case 'downloadRecords': handleDownloadRecords(); break;
      default: break;
    }
};

const handleLogoutAll = async () => {
    try {
        await auth.currentUser.getIdToken(true);
        await signOut(auth);
        if (onLogout) onLogout();
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

const handleDownloadRecords = () => {
    if (reports.length === 0) {
        toast.error('No records found to download!', {
            position: "top-center", autoClose: 3000, hideProgressBar: false,
            closeOnClick: true, pauseOnHover: false, draggable: false,
        });
        return;
    }
    const csvContent = [
        ['File Name', 'Description', 'Doctor', 'Date', 'File Type'],
        ...reports.map(r => [
            r.fileName, r.description, r.doctorName,
            formatDate(r.uploadedAt), r.fileType
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meditrail_records.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Records downloaded successfully! ✅', {
        position: "top-center", autoClose: 3000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
    });
};

const handleSaveSetting = async () => {
    setSettingLoading(true);
    setSettingError('');
    setSettingSuccess('');

    try {
        if (settingModal === 'editName') {
            if (!settingInput.trim()) { setSettingError('Name cannot be empty'); setSettingLoading(false); return; }
            await updateProfile(auth.currentUser, { displayName: settingInput.trim() });
            await updateDoc(doc(db, 'patients', auth.currentUser.uid), { name: settingInput.trim() });
            await fetch(`http://localhost:8080/api/patient/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: patientProfile?.uid, name: settingInput.trim() })
            });
            setPatientProfile(prev => ({ ...prev, name: settingInput.trim() }));
            setSettingSuccess('Name updated successfully! ✅');

        } else if (settingModal === 'updatePhone') {
            if (!settingInput.trim()) { setSettingError('Phone number cannot be empty'); setSettingLoading(false); return; }
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(settingInput.replace(/\D/g, ''))) {
                setSettingError('Please enter a valid 10-digit phone number');
                setSettingLoading(false); return;
            }
            await updateDoc(doc(db, 'patients', auth.currentUser.uid), { phoneNumber: settingInput.trim() });
            await fetch(`http://localhost:8080/api/patient/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: patientProfile?.uid, phoneNumber: settingInput.trim() })
            });
            setPatientProfile(prev => ({ ...prev, phoneNumber: settingInput.trim() }));
            setSettingSuccess('Phone number updated successfully! ✅');

        } else if (settingModal === 'changePassword') {
            if (!settingInput.trim()) { setSettingError('Current password is required'); setSettingLoading(false); return; }
            if (!settingInput2.trim()) { setSettingError('New password is required'); setSettingLoading(false); return; }
            if (settingInput2.length < 6) { setSettingError('New password must be at least 6 characters'); setSettingLoading(false); return; }
            if (settingInput2 !== settingInput3) { setSettingError('New passwords do not match'); setSettingLoading(false); return; }
            const credential = EmailAuthProvider.credential(auth.currentUser.email, settingInput);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, settingInput2);
            setSettingSuccess('Password changed successfully! ✅');

        } else if (settingModal === 'deleteAccount') {
            if (!settingInput.trim()) { setSettingError('Please enter your password to confirm'); setSettingLoading(false); return; }
            const credential = EmailAuthProvider.credential(auth.currentUser.email, settingInput);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await deleteDoc(doc(db, 'patients', auth.currentUser.uid));
            await deleteUser(auth.currentUser);
            if (onLogout) onLogout();
        }

        setTimeout(() => {
            setSettingSuccess('');
            setSettingModal(null);
        }, 2000);

    } catch (error) {
        console.error('Setting error:', error);
        if (error.code === 'auth/wrong-password') setSettingError('Current password is incorrect');
        else if (error.code === 'auth/weak-password') setSettingError('Password must be at least 6 characters');
        else setSettingError(error.message || 'Something went wrong. Please try again.');
    } finally {
        setSettingLoading(false);
    }
};

const handleChatSend = async () => {
  if (!chatInput.trim() || chatLoading) return;

  const userMessage = chatInput.trim();
  setChatInput('');

  const updatedMessages = [...chatMessages, { role: 'user', text: userMessage }];
  setChatMessages(updatedMessages);
  setChatLoading(true);

  try {
    const messages = [
      {
        role: 'system',
        content: `You are MediTrail AI Assistant, a helpful and empathetic medical assistant 
                  integrated into the MediTrail medical records platform for patients. 
                  Help patients understand their medical records, explain medical terms, 
                  provide general health tips, and guide them on using MediTrail features. 
                  Always remind users to consult a licensed doctor for medical decisions. 
                  Be concise, friendly and professional. Keep responses under 150 words.`
      },
      ...updatedMessages.slice(1).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || 'Groq API error');
    }

    const data = await response.json();
    const aiText =
      data.choices?.[0]?.message?.content ||
      'Sorry, I could not process your request. Please try again.';

    setChatMessages(prev => [...prev, { role: 'assistant', text: aiText }]);

  } catch (error) {
    console.error('Chat error:', error);
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      text: '⚠️ Something went wrong. Please check your connection and try again.'
    }]);
  } finally {
    setChatLoading(false);
  }
};

  const getPatientDisplayName = () => {
    if (loadingProfile) return 'Loading...';
    return patientProfile?.name || patientProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Patient';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <h2 className="section-title">Profile</h2>
            {loadingProfile ? (
              <div className="loading-message">Loading profile...</div>
            ) : (
              <div className="profile-info">
                <p><strong>Name:</strong> {patientProfile?.name || user?.displayName || 'Not set'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Unique ID:</strong> {patientProfile?.uid || user?.uid}</p>
                {patientProfile?.phoneNumber && <p><strong>Phone:</strong> {patientProfile.phoneNumber}</p>}
                {patientProfile?.gender && <p><strong>Gender:</strong> {patientProfile.gender}</p>}
                {patientProfile?.age && <p><strong>Age:</strong> {patientProfile.age}</p>}
              </div>
            )}
          </div>
        );

      case 'medicalHistory':
        return (
          <>
            <div className="welcome-section">
              <h1 className="welcome-title">Welcome, {getPatientDisplayName()}</h1>
              <p className="welcome-subtitle">Manage your medical records securely</p>
            </div>

            <div>
              <div className="section-header">
                <h2 className="section-title">Medical History</h2>
                <div className="search-bar">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by description or doctor name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading your medical records...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No medical records found</h3>
                  <p>{searchQuery ? 'Try adjusting your search query' : 'Your uploaded medical reports will appear here'}</p>
                </div>
              ) : (
                <div className="files-container">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="file-row">
                      <div className="file-icon">
                        {report.fileType === 'application/pdf' ? '📄' : '🖼️'}
                      </div>
                      <div className="file-details">
                        <h4 className="file-name">{report.description || report.fileName}</h4>
                        <div className="file-meta">
                          <span>👨‍⚕️ {report.doctorName}</span>
                          <span>📅 {formatDate(report.uploadedAt)}</span>
                          <span>📁 {report.fileType?.split('/')[1]?.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="file-actions">
                        <button className="btn btn-view" onClick={() => handleView(report.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </button>
                        <button className="btn btn-download" onClick={() => handleDownload(report.id, report.fileName)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download
                        </button>
                        <button className="btn btn-share" onClick={() => handleShare(report.id, report.doctorName, report.description)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                          </svg>
                          Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case 'settings':
        return (
          <div className="tab-content">
            <h2 className="section-title">Settings</h2>

            {/* Settings Modal */}
            {settingModal && !['dataProtection', 'dataStorage'].includes(settingModal) && (
              <div className="setting-modal-overlay" onClick={() => setSettingModal(null)}>
                <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>
                      {settingModal === 'editName' && '✏️ Edit Name'}
                      {settingModal === 'updatePhone' && '📱 Update Phone Number'}
                      {settingModal === 'changePassword' && '🔑 Change Password'}
                      {settingModal === 'deleteAccount' && '🗑️ Delete Account'}
                    </h3>
                    <button className="modal-close" onClick={() => setSettingModal(null)}>✕</button>
                  </div>
                  <div className="modal-body">
                    {settingModal === 'editName' && (
                      <>
                        <p className="modal-current">Current: <strong>{patientProfile?.name}</strong></p>
                        <input className="modal-input" type="text" placeholder="Enter new name"
                          value={settingInput} onChange={(e) => setSettingInput(e.target.value)} />
                      </>
                    )}
                    {settingModal === 'updatePhone' && (
                      <>
                        <p className="modal-current">Current: <strong>{patientProfile?.phoneNumber || 'Not set'}</strong></p>
                        <input className="modal-input" type="tel" placeholder="Enter new phone number"
                          value={settingInput} onChange={(e) => setSettingInput(e.target.value)} />
                      </>
                    )}
                    {settingModal === 'changePassword' && (
                      <>
                        <div className="modal-password-group">
                          <input className="modal-input" type={showSettingPassword ? "text" : "password"}
                            placeholder="Current password"
                            value={settingInput} onChange={(e) => setSettingInput(e.target.value)} />
                          <button type="button" className="modal-password-toggle"
                            onClick={() => setShowSettingPassword(!showSettingPassword)}>
                            {showSettingPassword ? (
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
                        <div className="modal-password-group">
                          <input className="modal-input" type={showSettingPassword2 ? "text" : "password"}
                            placeholder="New password"
                            value={settingInput2} onChange={(e) => setSettingInput2(e.target.value)} />
                          <button type="button" className="modal-password-toggle"
                            onClick={() => setShowSettingPassword2(!showSettingPassword2)}>
                            {showSettingPassword2 ? (
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
                        <div className="modal-password-group">
                          <input className="modal-input" type={showSettingPassword3 ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={settingInput3} onChange={(e) => setSettingInput3(e.target.value)} />
                          <button type="button" className="modal-password-toggle"
                            onClick={() => setShowSettingPassword3(!showSettingPassword3)}>
                            {showSettingPassword3 ? (
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
                      </>
                    )}
                    {settingModal === 'deleteAccount' && (
                      <>
                        <p className="modal-warning">⚠️ This action is permanent and cannot be undone!</p>
                        <input className="modal-input" type="password" placeholder="Enter your password to confirm"
                          value={settingInput} onChange={(e) => setSettingInput(e.target.value)} />
                      </>
                    )}
                    {settingError && <div className="modal-error">{settingError}</div>}
                    {settingSuccess && <div className="modal-success">{settingSuccess}</div>}
                    <div className="modal-actions">
                      <button className="modal-cancel-btn" onClick={() => setSettingModal(null)}>Cancel</button>
                      <button className={`modal-save-btn ${settingModal === 'deleteAccount' ? 'danger' : ''}`}
                        onClick={handleSaveSetting} disabled={settingLoading}>
                        {settingLoading ? 'Saving...' : settingModal === 'deleteAccount' ? 'Delete Account' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Protection Modal */}
            {settingModal === 'dataProtection' && (
              <div className="setting-modal-overlay" onClick={() => setSettingModal(null)}>
                <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>🛡️ Data Protection Policy</h3>
                    <button className="modal-close" onClick={() => setSettingModal(null)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <ul className="guidelines-list">
                      <li>🔒 Your data is never shared with third parties</li>
                      <li>🔒 Only your assigned doctors can upload files</li>
                      <li>🔒 You have read-only access to your records</li>
                      <li>🔒 All data is HIPAA compliant</li>
                      <li>🔒 Pre-signed URLs expire after 30 minutes</li>
                      <li>🔒 You can delete your account anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Data Storage Modal */}
            {settingModal === 'dataStorage' && (
              <div className="setting-modal-overlay" onClick={() => setSettingModal(null)}>
                <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>☁️ How Your Data is Stored</h3>
                    <button className="modal-close" onClick={() => setSettingModal(null)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <ul className="guidelines-list">
                      <li>☁️ Files stored on AWS S3 with encryption</li>
                      <li>🔐 Access controlled via secure pre-signed URLs</li>
                      <li>🗄️ Your profile stored in Firebase Firestore</li>
                      <li>📋 File metadata stored in PostgreSQL database</li>
                      <li>🌏 Data stored in Mumbai (ap-south-1) region</li>
                      <li>✅ Regular backups and 99.9% uptime guarantee</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="settings-container">
              <div className="settings-section">
                <div className="section-header-settings" onClick={() => toggleSection('profile')}>
                  <div className="section-title-icon">👤 Profile</div>
                  <span className={`dropdown-arrow ${expandedSections.profile ? 'open' : ''}`}>▾</span>
                </div>
                {expandedSections.profile && (
                  <div className="section-content">
                    <button className="setting-item" onClick={() => handleSettingAction('editName')}>
                      <span className="item-icon">✏️</span><span className="item-text">Edit Name</span>
                    </button>
                    <button className="setting-item" onClick={() => handleSettingAction('updatePhone')}>
                      <span className="item-icon">📱</span><span className="item-text">Update Phone Number</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <div className="section-header-settings" onClick={() => toggleSection('security')}>
                  <div className="section-title-icon">🔐 Security</div>
                  <span className={`dropdown-arrow ${expandedSections.security ? 'open' : ''}`}>▾</span>
                </div>
                {expandedSections.security && (
                  <div className="section-content">
                    <button className="setting-item" onClick={() => handleSettingAction('changePassword')}>
                      <span className="item-icon">🔑</span><span className="item-text">Change Password</span>
                    </button>
                    <button className="setting-item" onClick={() => handleSettingAction('logoutAll')}>
                      <span className="item-icon">🚪</span><span className="item-text">Logout from All Devices</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <div className="section-header-settings" onClick={() => toggleSection('notifications')}>
                  <div className="section-title-icon">🔔 Notifications</div>
                  <span className={`dropdown-arrow ${expandedSections.notifications ? 'open' : ''}`}>▾</span>
                </div>
                {expandedSections.notifications && (
                  <div className="section-content">
                    <div className="setting-item toggle-item">
                      <div className="toggle-label"><span className="item-icon">📩</span><span className="item-text">Email alert for new report</span></div>
                      <label className="toggle-switch"><input type="checkbox" checked={notificationToggles.emailAlert} onChange={() => toggleNotification('emailAlert')} /><span className="slider"></span></label>
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <div className="section-header-settings" onClick={() => toggleSection('privacy')}>
                  <div className="section-title-icon">🔒 Privacy</div>
                  <span className={`dropdown-arrow ${expandedSections.privacy ? 'open' : ''}`}>▾</span>
                </div>
                {expandedSections.privacy && (
                  <div className="section-content">
                    <button className="setting-item" onClick={() => handleSettingAction('dataProtection')}>
                      <span className="item-icon">🛡️</span><span className="item-text">Data Protection Policy</span>
                    </button>
                    <button className="setting-item" onClick={() => handleSettingAction('dataStorage')}>
                      <span className="item-icon">☁️</span><span className="item-text">How Your Data is Stored</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-section">
                <div className="section-header-settings" onClick={() => toggleSection('account')}>
                  <div className="section-title-icon">🗂️ Account</div>
                  <span className={`dropdown-arrow ${expandedSections.account ? 'open' : ''}`}>▾</span>
                </div>
                {expandedSections.account && (
                  <div className="section-content">
                    <button className="setting-item" onClick={() => handleSettingAction('downloadRecords')}>
                      <span className="item-icon">📥</span><span className="item-text">Download All Records</span>
                    </button>
                    <button className="setting-item delete-item" onClick={() => handleSettingAction('deleteAccount')}>
                      <span className="item-icon">🗑️</span><span className="item-text">Delete Account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'help':
      return (
        <div className="tab-content">
          <h2 className="section-title">Help & Support</h2>
          <div className="help-grid">

            <div className="help-card-small">
              <div className="card-icon">📂</div>
              <div>
                <h3 className="card-title">View Medical Records</h3>
                <ol className="card-steps">
                  <li>Go to <strong>Medical History</strong> from left menu</li>
                  <li>All your reports are listed by date</li>
                  <li>Click <strong>View</strong> to preview any file</li>
                  <li>Files open securely in a new tab</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">📥</div>
              <div>
                <h3 className="card-title">Download a Report</h3>
                <ol className="card-steps">
                  <li>Go to <strong>Medical History</strong> from left menu</li>
                  <li>Find the report you want</li>
                  <li>Click <strong>Download</strong> button</li>
                  <li>File saves directly to your device</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">📤</div>
              <div>
                <h3 className="card-title">Share a Report</h3>
                <ol className="card-steps">
                  <li>Go to <strong>Medical History</strong> from left menu</li>
                  <li>Find the report you want to share</li>
                  <li>Click <strong>Share</strong> button</li>
                  <li>Link copied to clipboard or share directly</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">🤖</div>
              <div>
                <h3 className="card-title">AI Assistant</h3>
                <ol className="card-steps">
                  <li>Go to <strong>AI Chatbot</strong> from left menu</li>
                  <li>Ask any health or medical question</li>
                  <li>Get instant AI powered answers</li>
                  <li>Powered by Groq AI</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">📞</div>
              <div>
                <h3 className="card-title">Contact Support</h3>
                <ul className="card-steps">
                  <li>📧 Email: support@meditrail.com</li>
                  <li>📞 Phone: +91 93561 99932</li>
                  <li>⏰ Mon - Fri, 9AM to 6PM IST</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      );
      case 'chatbot':
        return (
          <div className="tab-content">
            <h2 className="section-title">AI Chatbot Assistant</h2>
            <div className="chatbot-container">
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-bubble ${msg.role}`}>
                    {msg.role === 'assistant' && <div className="chat-avatar">🤖</div>}
                    <div className="chat-text">{msg.text}</div>
                    {msg.role === 'user' && <div className="chat-avatar">👤</div>}
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-bubble assistant">
                    <div className="chat-avatar">🤖</div>
                    <div className="chat-text typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask me anything about your health..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                />
                <button className="chat-send-btn" onClick={handleChatSend} disabled={chatLoading}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="vertical-navbar">
        <div className="navbar-header">
          <div className="logo">MT</div>
        </div>
        <div className="navbar-menu">
          {[
            { tab: 'profile', icon: '👤', label: 'Profile' },
            { tab: 'medicalHistory', icon: '📄', label: 'Medical History' },
            { tab: 'settings', icon: '⚙', label: 'Settings' },
            { tab: 'help', icon: '❓', label: 'Help' },
            { tab: 'chatbot', icon: '🤖', label: 'AI Chatbot' },
          ].map(({ tab, icon, label }) => (
            <div
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              title={label}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="main-content">
        <nav className="top-navbar">
          <div className="navbar-brand">MediTrail</div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
        <div className="dashboard-body">
          <div className="content-card">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;