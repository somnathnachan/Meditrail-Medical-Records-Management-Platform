import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { updateDoc, deleteDoc } from 'firebase/firestore';
import '../../styles/DoctorDashboard.css';

const BACKEND_URL = 'http://localhost:8080';
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

const DoctorDashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Search & Patient Data
  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);

  // Upload Form
  const [description, setDescription] = useState('');
  const [disease, setDisease] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // History
  const [historyFiles, setHistoryFiles] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settings
  const [expandedSections, setExpandedSections] = useState({
    profile: false, security: false, notifications: false, privacy: false, account: false
  });
  const [notificationToggles, setNotificationToggles] = useState({
    uploadSuccess: true, uploadFail: true
  });

  // Settings modal state
  const [settingModal, setSettingModal] = useState(null); // 'editName' | 'editSpecialization' | 'changePassword' | 'deleteAccount'
  const [settingInput, setSettingInput] = useState('');
  const [settingInput2, setSettingInput2] = useState('');
  const [settingInput3, setSettingInput3] = useState('');
  const [settingLoading, setSettingLoading] = useState(false);
  const [settingError, setSettingError] = useState('');
  const [settingSuccess, setSettingSuccess] = useState('');

  //eye button 
  const [showSettingPassword, setShowSettingPassword] = useState(false);
  const [showSettingPassword2, setShowSettingPassword2] = useState(false);
  const [showSettingPassword3, setShowSettingPassword3] = useState(false);

  // Chatbot
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hi Dr! I am your MediTrail AI Assistant. I can help you with medical queries, drug interactions, or any clinical questions. How can I help?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) { if (onLogout) onLogout(); return; }
    setUser(currentUser);
    fetchDoctorProfile(currentUser.uid);
  }, [onLogout]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab === 'history' && user) {
        fetchHistory();
    }
}, [activeTab, user]);

  const fetchDoctorProfile = async (uid) => {
    setLoadingProfile(true);
    try {
      const doctorDocRef = doc(db, 'doctors', uid);
      const doctorDoc = await getDoc(doctorDocRef);
      if (doctorDoc.exists()) {
        setDoctorProfile(doctorDoc.data());
      } else {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setDoctorProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

 const handleSearchPatient = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a patient UID, email or phone number');
      return;
    }
    setSearching(true);
    setSearchError('');
    setPatientData(null);

    const query = searchQuery.trim();

    // Try uid first, then email, then phone
    const attempts = [
      { uid: query },
      { email: query },
      { phoneNumber: query }
    ];

    try {
      for (const body of attempts) {
        const response = await fetch(`${BACKEND_URL}/api/doctor/search-patient`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.uid) {
            setPatientData(data);
            setSearchError('');
            return; // found! stop trying
          }
        }
      }
      // None worked
      setSearchError('Patient not found. Please check the UID, email or phone number.');
    } catch (error) {
      console.error('Error searching patient:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setSearching(false);
    }
};

const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a valid PDF or image file (PDF, JPG, PNG)', {
          position: "top-center", autoClose: 3000, hideProgressBar: false,
          closeOnClick: true, pauseOnHover: false, draggable: false,
        });
        setSelectedFile(null);
      }
    }
};

  const handleUploadReport = async () => {
    if (!patientData) {
      toast.error('Please search and select a patient first', {
        position: "top-center", autoClose: 3000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a report description', {
        position: "top-center", autoClose: 3000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a file to upload', {
        position: "top-center", autoClose: 3000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientUid', patientData.uid);
      formData.append('doctorUid', user.uid);
      formData.append('doctorName', getDoctorDisplayName());
      formData.append('description', disease.trim() ? `${description.trim()} - ${disease.trim()}` : description.trim());

      const response = await fetch(`${BACKEND_URL}/api/files/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('File successfully uploaded ✅', {
          position: "top-center", autoClose: 3000, hideProgressBar: false,
          closeOnClick: true, pauseOnHover: false, draggable: false,
        });
        setDescription('');
        setDisease('');
        setSelectedFile(null);
        document.getElementById('fileInput').value = '';
      } else {
        toast.error('Upload failed. Please try again.', {
          position: "top-center", autoClose: 3000, hideProgressBar: false,
          closeOnClick: true, pauseOnHover: false, draggable: false,
        });
      }
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Upload failed. Please check your connection.', {
        position: "top-center", autoClose: 3000, hideProgressBar: false,
        closeOnClick: true, pauseOnHover: false, draggable: false,
      });
    } finally {
      setUploading(false);
    }
};

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/files/doctor/${user.uid}/history`);
      const data = await response.json();
      setHistoryFiles(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDoctorDisplayName = () => {
    if (loadingProfile) return 'Loading...';
    return doctorProfile?.name || doctorProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Doctor';
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
      case 'editSpecialization': setSettingModal('editSpecialization'); break;
      case 'changePassword': setSettingModal('changePassword'); break;
      case 'deleteAccount': setSettingModal('deleteAccount'); break;
      case 'logoutAll': handleLogoutAll(); break;
      case 'viewGuidelines':
        setSettingModal('viewGuidelines'); break;
      case 'viewPolicy':
        setSettingModal('viewPolicy'); break;
      default: break;
    }
};

const handleLogoutAll = async () => {
    try {
        await auth.currentUser.getIdToken(true); // force token refresh
        await signOut(auth);
        if (onLogout) onLogout();
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

const handleSaveSetting = async () => {
    setSettingLoading(true);
    setSettingError('');
    setSettingSuccess('');

    try {
        if (settingModal === 'editName') {
            if (!settingInput.trim()) { setSettingError('Name cannot be empty'); setSettingLoading(false); return; }
            // Update Firebase Auth
            await updateProfile(auth.currentUser, { displayName: settingInput.trim() });
            // Update Firestore
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { name: settingInput.trim() });
            // Update PostgreSQL
            await fetch(`${BACKEND_URL}/api/doctor/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: doctorProfile?.uid, name: settingInput.trim() })
            });
            setDoctorProfile(prev => ({ ...prev, name: settingInput.trim() }));
            setSettingSuccess('Name updated successfully! ✅');

        } else if (settingModal === 'editSpecialization') {
            if (!settingInput.trim()) { setSettingError('Specialization cannot be empty'); setSettingLoading(false); return; }
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { specialization: settingInput.trim() });
            await fetch(`${BACKEND_URL}/api/doctor/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: doctorProfile?.uid, specialization: settingInput.trim() })
            });
            setDoctorProfile(prev => ({ ...prev, specialization: settingInput.trim() }));
            setSettingSuccess('Specialization updated successfully! ✅');

        } else if (settingModal === 'changePassword') {
            if (!settingInput.trim()) { setSettingError('Current password is required'); setSettingLoading(false); return; }
            if (!settingInput2.trim()) { setSettingError('New password is required'); setSettingLoading(false); return; }
            if (settingInput2.length < 6) { setSettingError('New password must be at least 6 characters'); setSettingLoading(false); return; }
            if (settingInput2 !== settingInput3) { setSettingError('New passwords do not match'); setSettingLoading(false); return; }
            // Reauthenticate first
            const credential = EmailAuthProvider.credential(auth.currentUser.email, settingInput);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, settingInput2);
            setSettingSuccess('Password changed successfully! ✅');

        } else if (settingModal === 'deleteAccount') {
            if (!settingInput.trim()) { setSettingError('Please enter your password to confirm'); setSettingLoading(false); return; }
            const credential = EmailAuthProvider.credential(auth.currentUser.email, settingInput);
            await reauthenticateWithCredential(auth.currentUser, credential);
            // Delete from Firestore
            await deleteDoc(doc(db, 'users', auth.currentUser.uid));
            // Delete from Firebase Auth
            await deleteUser(auth.currentUser);
            if (onLogout) onLogout();
        }

        setTimeout(() => {
        setSettingSuccess('');
        setSettingModal(null); // ✅ close for all including changePassword
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
        content: `You are MediTrail AI Assistant, a helpful and knowledgeable medical assistant 
                  for doctors integrated into the MediTrail medical records platform. 
                  Help doctors with medical queries, drug interactions, clinical questions, 
                  treatment guidelines and patient care advice. 
                  Be concise, professional and accurate. Keep responses under 150 words.`
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-content">
            <h2 className="section-title">Profile</h2>
            {loadingProfile ? (
              <div className="loading-container"><div className="spinner"></div><p>Loading profile...</p></div>
            ) : (
              <div className="profile-info">
                <p><strong>Name:</strong> {doctorProfile?.name || user?.displayName || 'Not set'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Unique ID:</strong> {doctorProfile?.uid || user?.uid}</p>
                <p><strong>Role:</strong> Doctor</p>
                {doctorProfile?.specialization && <p><strong>Specialization:</strong> {doctorProfile.specialization}</p>}
                {doctorProfile?.licenseNumber && <p><strong>License Number:</strong> {doctorProfile.licenseNumber}</p>}
                {doctorProfile?.phoneNumber && <p><strong>Phone:</strong> {doctorProfile.phoneNumber}</p>}
              </div>
            )}
          </div>
        );

      case 'upload':
        return (
          <div className="tab-content">
            <div className="welcome-section">
              <h1 className="welcome-title">Welcome, Dr. {getDoctorDisplayName()}</h1>
              <p className="welcome-subtitle">Find patient and upload medical files.</p>
            </div>

            {/* Search Bar */}
            <div className="search-section">
              <div className="search-bar">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Enter UID, Phone Number or Email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                  className="search-input"
                />
                <button className="search-btn" onClick={handleSearchPatient} disabled={searching}>
                  {searching ? <div className="spinner-small"></div> : 'Search'}
                </button>
              </div>
              {searchError && <div className="error-message">{searchError}</div>}
            </div>

            {/* Patient Result Box */}
            {patientData && (
              <div className="patient-info-box">
                <div className="patient-header">
                  <div className="patient-icon">👤</div>
                  <h3>Patient Found</h3>
                </div>
                <div className="patient-details">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{patientData.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{patientData.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{patientData.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{patientData.gender || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{patientData.age || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">UID:</span>
                    <span className="detail-value">{patientData.uid}</span>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="upload-section">
                  <h3 className="upload-title">Upload Medical Report</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Report Description</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Blood Report Jan 2024"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Disease / Condition</label>
                      <input
                        type="text"
                        value={disease}
                        onChange={(e) => setDisease(e.target.value)}
                        placeholder="e.g. Diabetes, Fever"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="text"
                        value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        disabled
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Upload File (PDF/Image)</label>
                      <div className="file-input-wrapper">
                        <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="file-input" />
                        <label htmlFor="fileInput" className="file-input-label">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          {selectedFile ? selectedFile.name : 'Choose file'}
                        </label>
                      </div>
                    </div>
                  </div>

                  

                  <button className="upload-btn" onClick={handleUploadReport} disabled={uploading}>
                    {uploading ? (
                      <><div className="spinner-small"></div> Uploading...</>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Upload Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">Upload History</h2>
              <button className="search-btn" onClick={fetchHistory} disabled={loadingHistory}>
                {loadingHistory ? <div className="spinner-small"></div> : 'Refresh'}
              </button>
            </div>

            {loadingHistory ? (
              <div className="loading-container"><div className="spinner"></div><p>Loading history...</p></div>
            ) : historyFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No upload history found</h3>
                <p>Files you upload will appear here. Click Refresh to load.</p>
              </div>
            ) : (
              <div className="files-container">
                {historyFiles.map((file) => (
                  <div key={file.id} className="file-row">
                    <div className="file-icon">
                      {file.fileType === 'application/pdf' ? '📄' : '🖼️'}
                    </div>
                    <div className="file-details">
                      <h4 className="file-name">{file.description || file.fileName}</h4>
                      <div className="file-meta">
                        <span>👤 {file.patientName}</span>
                        <span>📅 {formatDate(file.uploadedAt)}</span>
                        <span>📁 {file.fileType?.split('/')[1]?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
    return (
      <div className="tab-content">
        <h2 className="section-title">Settings</h2>

        {/* Settings Modal */}
        {settingModal && !['viewGuidelines', 'viewPolicy'].includes(settingModal) && (
          <div className="setting-modal-overlay" onClick={() => setSettingModal(null)}>
            <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {settingModal === 'editName' && '✏️ Edit Name'}
                  {settingModal === 'editSpecialization' && '🏥 Edit Specialization'}
                  {settingModal === 'changePassword' && '🔑 Change Password'}
                  {settingModal === 'deleteAccount' && '🗑️ Delete Account'}
                </h3>
                <button className="modal-close" onClick={() => setSettingModal(null)}>✕</button>
              </div>

              <div className="modal-body">
                {settingModal === 'editName' && (
                  <>
                    <p className="modal-current">Current: <strong>{doctorProfile?.name}</strong></p>
                    <input className="modal-input" type="text" placeholder="Enter new name"
                      value={settingInput} onChange={(e) => setSettingInput(e.target.value)} />
                  </>
                )}
                {settingModal === 'editSpecialization' && (
                  <>
                    <p className="modal-current">Current: <strong>{doctorProfile?.specialization}</strong></p>
                    <input className="modal-input" type="text" placeholder="Enter new specialization"
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
                  <button
                    className={`modal-save-btn ${settingModal === 'deleteAccount' ? 'danger' : ''}`}
                    onClick={handleSaveSetting} disabled={settingLoading}>
                    {settingLoading ? 'Saving...' : settingModal === 'deleteAccount' ? 'Delete Account' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guidelines Modal */}
        {settingModal === 'viewGuidelines' && (
          <div className="setting-modal-overlay" onClick={() => setSettingModal(null)}>
            <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📋 Upload Guidelines</h3>
                <button className="modal-close" onClick={() => setSettingModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <ul className="guidelines-list">
                  <li>✅ Only upload verified medical reports</li>
                  <li>✅ Ensure patient UID is correct before uploading</li>
                  <li>✅ Accepted formats: PDF, JPG, JPEG, PNG</li>
                  <li>✅ Maximum file size: 10MB</li>
                  <li>✅ Always add description and disease name</li>
                  <li>✅ Maintain patient confidentiality at all times</li>
                  <li>✅ Follow HIPAA guidelines for data handling</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Policy Modal */}
        {settingModal === 'viewPolicy' && (
          <div className="setting-modal-overlay" onClick={() => setSettingModal(null)}>
            <div className="setting-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🛡️ Data Protection Policy</h3>
                <button className="modal-close" onClick={() => setSettingModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <ul className="guidelines-list">
                  <li>🔒 All files are encrypted and stored on AWS S3</li>
                  <li>🔒 Patient data is never shared with third parties</li>
                  <li>🔒 Access to files is controlled via pre-signed URLs</li>
                  <li>🔒 Pre-signed URLs expire after 30 minutes</li>
                  <li>🔒 All data is HIPAA compliant</li>
                  <li>🔒 Doctors can only access their own uploaded files</li>
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
                <button className="setting-item" onClick={() => handleSettingAction('editSpecialization')}>
                  <span className="item-icon">🏥</span><span className="item-text">Edit Specialization</span>
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
            <div className="section-header-settings" onClick={() => toggleSection('privacy')}>
              <div className="section-title-icon">🔒 Privacy & Compliance</div>
              <span className={`dropdown-arrow ${expandedSections.privacy ? 'open' : ''}`}>▾</span>
            </div>
            {expandedSections.privacy && (
              <div className="section-content">
                <button className="setting-item" onClick={() => handleSettingAction('viewGuidelines')}>
                  <span className="item-icon">📋</span><span className="item-text">View Upload Guidelines</span>
                </button>
                <button className="setting-item" onClick={() => handleSettingAction('viewPolicy')}>
                  <span className="item-icon">🛡️</span><span className="item-text">Data Protection Policy</span>
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
              <div className="card-icon">📤</div>
              <div>
                <h3 className="card-title">How to Upload a Report</h3>
                <ol className="card-steps">
                  <li>Go to <strong>Upload Files</strong> from left menu</li>
                  <li>Search patient by UID, Email or Phone</li>
                  <li>Fill report description and disease name</li>
                  <li>Select file (PDF/Image) and click Upload</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">🔍</div>
              <div>
                <h3 className="card-title">How to Search a Patient</h3>
                <ol className="card-steps">
                  <li>Go to <strong>Upload Files</strong> from left menu</li>
                  <li>Enter patient UID (MT-P-000001), Email or Phone</li>
                  <li>Press Enter or click Search button</li>
                  <li>Patient details will appear below</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">🤖</div>
              <div>
                <h3 className="card-title">AI Assistant</h3>
                <ol className="card-steps">
                  <li>Go to <strong>Chatbot</strong> from left menu</li>
                  <li>Ask any medical or clinical question</li>
                  <li>Get instant AI powered answers</li>
                </ol>
              </div>
            </div>

            <div className="help-card-small">
              <div className="card-icon">📞</div>
              <div>
                <h3 className="card-title">Contact Support</h3>
                <ul className="card-steps">
                  <li>📧 Email: support@meditrail.com</li>
                  <li>📞 Phone: +91 93561 99931</li>
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
                    <div className="chat-text typing"><span></span><span></span><span></span></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Ask me anything..."
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
            { tab: 'upload', icon: '📤', label: 'Upload Files' },
            { tab: 'history', icon: '📄', label: 'History' },
            { tab: 'settings', icon: '⚙', label: 'Settings' },
            { tab: 'help', icon: '❓', label: 'Help' },
            { tab: 'chatbot', icon: '🤖', label: 'Chatbot' },
          ].map(({ tab, icon, label }) => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} title={label}>
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

export default DoctorDashboard;