import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicEditor from '../components/ProfilePicEditor';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('superAdminActiveTab') || 'churchesListTab'); // churchesListTab, createChurchTab, settingsTab
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarShowMobile, setSidebarShowMobile] = useState(false);

  // Form States for creating a Church Admin
  const [churchName, setChurchName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [revealPasswords, setRevealPasswords] = useState({});
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Settings Form States
  const [settingsName, setSettingsName] = useState(currentUser.name || '');
  const [settingsUsername, setSettingsUsername] = useState(currentUser.username || '');
  const [settingsEmail, setSettingsEmail] = useState(currentUser.email || '');
  const [settingsPassword, setSettingsPassword] = useState(currentUser.password || '');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    fetchChurches();
  }, []);

  useEffect(() => {
    localStorage.setItem('superAdminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    setSettingsName(currentUser.name || '');
    setSettingsUsername(currentUser.username || '');
    setSettingsEmail(currentUser.email || '');
    setSettingsPassword(currentUser.password || '');
  }, [currentUser.username, currentUser.name, currentUser.email, currentUser.password]);



  const fetchChurches = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-admin-username': currentUser.username }
      });
      const data = await res.json();
      if (res.ok) {
        const uList = Array.isArray(data) ? data : (data.users || []);
        setChurches(uList.filter(u => u.role === 'admin' && (u.isPrimaryAdmin === true || u.username === 'admin')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChurch = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!churchName.trim() || !adminName.trim() || !adminUsername.trim() || !adminPassword) {
      setFormError('الرجاء تعبئة كافة الحقول المطلوبة!');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-username': currentUser.username
        },
        body: JSON.stringify({
          name: adminName.trim(),
          username: adminUsername.trim().toLowerCase(),
          password: adminPassword,
          email: adminEmail.trim(),
          church: churchName.trim(),
          role: 'admin',
          osra: null,
          isPrimaryAdmin: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormSuccess('تم إنشاء حساب الكنيسة بنجاح! ✝');
        setChurchName('');
        setAdminName('');
        setAdminUsername('');
        setAdminPassword('');
        setAdminEmail('');
        fetchChurches();
      } else {
        setFormError(data.message || 'فشل إنشاء حساب الكنيسة.');
      }
    } catch (err) {
      console.error(err);
      setFormError('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleDeleteChurch = async (targetUser) => {
    window.customConfirm(`هل أنت متأكد من حذف حساب الكنيسة لـ: ${targetUser.church}؟`, async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(targetUser.username)}`, {
          method: 'DELETE',
          headers: { 'x-admin-username': currentUser.username }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.customAlert('تم حذف الحساب بنجاح.');
          fetchChurches();
        } else {
          window.customAlert(data.message || 'فشل حذف الحساب.');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر لحذف الحساب.');
      }
    });
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    setUpdatingSettings(true);

    try {
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUsername: currentUser.username,
          name: settingsName.trim(),
          username: settingsUsername.trim().toLowerCase(),
          email: settingsEmail ? settingsEmail.trim() : '',
          church: currentUser.church || 'القيادة العامة',
          password: settingsPassword
        })
      });


      const result = await response.json();
      if (response.ok && result.success) {
        setSettingsSuccess('تم تحديث البيانات بنجاح! ✝');
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        setCurrentUser(result.user);
      } else {
        setSettingsError(result.message || 'فشل تحديث البيانات.');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div className={`wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* Sidebar Backdrop for Mobile */}
        {sidebarShowMobile && (
          <div className="sidebar-backdrop show" onClick={() => setSidebarShowMobile(false)}></div>
        )}

        {/* Sidebar (Right-aligned) */}
        <nav id="sidebar" className={`${sidebarShowMobile ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header border-bottom border-secondary py-4 text-center">
            
            {/* Profile Picture */}
            <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={true} />

            <div className="text-center mt-2">
              <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{currentUser.name}</h5>
              <small className="text-warning" style={{ fontSize: '0.8rem' }}>سوبر أدمن ✝</small>
            </div>
          </div>

          <ul className="list-unstyled components" style={{ padding: '15px 0' }}>
            <li className={`nav-item ${activeTab === 'churchesListTab' ? 'active' : ''}`} onClick={() => { setActiveTab('churchesListTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-church me-2"></i> الكنائس المسجلة</a>
            </li>
            <li className={`nav-item ${activeTab === 'createChurchTab' ? 'active' : ''}`} onClick={() => { setActiveTab('createChurchTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-plus-circle me-2"></i> انشاء حساب كنيسة جديد</a>
            </li>
            <li className={`nav-item ${activeTab === 'settingsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('settingsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-cog me-2"></i> الإعدادات</a>
            </li>
          </ul>

          <div className="sidebar-footer" style={{ padding: '15px', position: 'absolute', bottom: '0', width: '100%', borderTop: '1px solid rgba(201, 168, 76, 0.1)' }}>
            <button className="btn btn-danger btn-sm w-100 py-2" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i> تسجيل الخروج
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div id="content" className="w-100">
          
          {/* Header/Top Bar */}
          <nav className="navbar navbar-expand-lg navbar-theme">
            <div className="container-fluid d-flex justify-content-between align-items-center position-relative">
              
              {/* Right Side (RTL context) - Church Name and Menu Toggle */}
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  id="sidebarToggleBtn"
                  className="btn btn-outline-light btn-sm"
                  onClick={() => {
                    if (window.innerWidth < 992) {
                      setSidebarShowMobile(true);
                    } else {
                      setSidebarCollapsed(!sidebarCollapsed);
                    }
                  }}
                  style={{ border: '1px solid rgba(255,255,255,0.5)', background: 'transparent', borderRadius: '10px', padding: '5px 10px' }}
                >
                  <i className="fas fa-bars text-white fs-4"></i>
                </button>
                <h5 className="mb-0 fw-bold text-white d-none d-md-inline" id="topBarChurchName" style={{fontFamily: 'Cairo, sans-serif'}}>لوحة تحكم السوبر أدمن الرئيسي</h5>
              </div>

              {/* Center - Logo / Title */}
              <div className="position-absolute start-50 translate-middle-x text-center d-none d-xl-block" style={{ marginRight: '-30px' }}>
                <h4 className="mb-0 fw-bold text-white d-flex align-items-center gap-2" style={{ fontFamily: "'DecoType Thuluth', 'Aref Ruqaa', serif" }}>
                  <i className="fas fa-cross"></i> رعية الله <i className="fas fa-cross"></i>
                </h4>
              </div>

              {/* Left Side (RTL context) - Actions */}
              <div className="d-flex align-items-center gap-3">
                

                {/* 2. Theme Toggle (Circle) */}
                <div style={{ background: '#fff', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <ThemeToggle />
                </div>

                {/* 4. Old Logo / Profile Pic (Circle, Leftmost) */}
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo-removebg-preview.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/coptic_cross_final.png' }} />
                </div>
              </div>

            </div>
          </nav>

          <div className="container-fluid p-4">
            {/* TAB: REGISTERED CHURCHES LIST */}
            {activeTab === 'churchesListTab' && (
              <div className="row justify-content-center">
                <div className="col-lg-12">
                  <div className="card shadow mb-4" style={{ minHeight: '400px' }}>
                    <div className="card-header py-3">
                      <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-church me-2"></i> الكنائس المسجلة</h5>
                    </div>
                    <div className="card-body">
                      {loading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-warning" role="status"></div>
                        </div>
                      ) : churches.length === 0 ? (
                        <p className="text-center text-muted py-5">لم يتم تسجيل أي كنيسة بعد.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table align-middle">
                            <thead>
                              <tr style={{ color: '#c9a84c' }}>
                                <th>الكنيسة</th>
                                <th>اسم المستخدم</th>
                                <th>كلمة المرور</th>
                                <th>البريد الإلكتروني</th>
                                <th className="text-center">إجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {churches.map(c => (
                                <tr key={c.username}>
                                  <td className="fw-bold">{c.church}</td>
                                  <td><code>{c.username}</code></td>
                                  <td>
                                    <div className="d-flex align-items-center justify-content-center gap-2" style={{ maxWidth: '160px', margin: '0 auto' }}>
                                      <input
                                        type={revealPasswords[c.username] ? 'text' : 'password'}
                                        value={c.password}
                                        readOnly
                                        className="form-control form-control-sm text-center border-0 text-muted bg-transparent"
                                        style={{ width: '90px', cursor: 'default', padding: '0', fontSize: '0.9rem' }}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-outline-secondary p-1 py-0"
                                        onClick={() => setRevealPasswords({
                                          ...revealPasswords,
                                          [c.username]: !revealPasswords[c.username]
                                        })}
                                        title={revealPasswords[c.username] ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                                      >
                                        <i className={`fas ${revealPasswords[c.username] ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.75rem' }}></i>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="text-muted">{c.email || 'غير مسجل'}</td>
                                  <td className="text-center">
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteChurch(c)}>
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CREATE CHURCH */}
            {activeTab === 'createChurchTab' && (
              <div className="row justify-content-center">
                <div className="col-lg-6">
                  <div className="card shadow mb-4">
                    <div className="card-header py-3">
                      <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-plus-circle me-2"></i> إنشاء حساب كنيسة جديد</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleCreateChurch}>
                        <div className="mb-3">
                          <label className="form-label">اسم الكنيسة</label>
                          <input
                            type="text"
                            className="form-control"
                            value={churchName}
                            onChange={(e) => setChurchName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">اسم حساب الأدمن (اسم المسؤول)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">اسم المستخدم</label>
                          <input
                            type="text"
                            className="form-control"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">البريد الإلكتروني (اختياري)</label>
                          <input
                            type="email"
                            className="form-control"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">كلمة المرور</label>
                          <div className="input-group">
                            <input
                              type={showAdminPassword ? "text" : "password"}
                              className="form-control"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowAdminPassword(!showAdminPassword)}
                            >
                              <i className={`fas ${showAdminPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>

                        <button type="submit" className="btn btn-warning w-100 py-2 mt-2">
                          <i className="fas fa-plus me-1"></i> تسجيل حساب الكنيسة
                        </button>
                        {formError && <div className="alert alert-danger mt-3 text-center py-2">{formError}</div>}
                        {formSuccess && <div className="alert alert-success mt-3 text-center py-2">{formSuccess}</div>}
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settingsTab' && (
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="card shadow mb-4">
                    <div className="card-header py-3">
                      <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-user-cog me-2"></i> إعدادات حساب السوبر أدمن</h5>
                    </div>
                    <div className="card-body">
                      
                      {/* Profile pic on top of settings form */}
                      <div className="text-center mb-4">
                        <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={false} />
                      </div>

                      <form onSubmit={handleUpdateSettings}>
                        {settingsError && <div className="alert alert-danger">{settingsError}</div>}
                        {settingsSuccess && <div className="alert alert-success">{settingsSuccess}</div>}

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">الاسم بالكامل</label>
                            <input
                              type="text"
                              className="form-control"
                              value={settingsName}
                              onChange={(e) => setSettingsName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">اسم المستخدم</label>
                            <input
                              type="text"
                              className="form-control"
                              value={settingsUsername}
                              onChange={(e) => setSettingsUsername(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-12 mb-3">
                            <label className="form-label">البريد الإلكتروني</label>
                            <input
                              type="email"
                              className="form-control"
                              value={settingsEmail}
                              onChange={(e) => setSettingsEmail(e.target.value)}
                            />

                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label">كلمة المرور</label>
                          <div className="input-group">
                            <input
                              type={showSettingsPassword ? "text" : "password"}
                              className="form-control"
                              value={settingsPassword}
                              onChange={(e) => setSettingsPassword(e.target.value)}
                            />



                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                            >
                              <i className={`fas ${showSettingsPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                          </div>
                        </div>

                        <button type="submit" className="btn btn-warning w-100 py-2" disabled={updatingSettings}>
                          {updatingSettings ? 'جاري التحديث...' : 'حفظ التعديلات ✝'}
                        </button>
                      </form>

                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
