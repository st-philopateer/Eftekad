import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { getUserAssignments, getUserGroupedServices } from '../utils/assignmentHelper';
import authService from '../services/authService';
import serviceTreeService from '../services/serviceTreeService';
import jobService from '../services/jobService';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic Assignment Selection States
  const [authMode, setAuthMode] = useState('login'); // 'login', 'assignment_select', 'forgot'
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [detectedSystemPortals, setDetectedSystemPortals] = useState([]);
  const [detectedServices, setDetectedServices] = useState([]);
  const [selectedServiceGroup, setSelectedServiceGroup] = useState(null);

  // Forgot Password States
  const [forgotUser, setForgotUser] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const navigate = useNavigate();

  const [transparentCrossSrc, setTransparentCrossSrc] = useState('/new_cross_transparent.png');

  useEffect(() => {
    // Check if session expired due to permission update
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_expired') === 'true') {
      setLoginError('تم تحديث جلسة حسابك من قبل الإدارة، يرجى تسجيل الدخول مجدداً ✝');
      return;
    }

    // Auto-detect logged-in user for switching services seamlessly
    const savedUserStr = localStorage.getItem('currentUser');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.username) {
          setLoggedInUser(savedUser);
          (async () => {
            try {
              const [srvData, jbData] = await Promise.all([
                serviceTreeService.getServices().catch(() => []),
                jobService.getJobs().catch(() => []),
              ]);
              const servicesList = Array.isArray(srvData) ? srvData : srvData.services || srvData.priestServices || [];
              const jobsList = Array.isArray(jbData) ? jbData : jbData.jobs || [];

              const { systemPortals, services } = getUserGroupedServices(savedUser, servicesList, jobsList);
              setDetectedSystemPortals(systemPortals);
              setDetectedServices(services);
              setSelectedServiceGroup(null);
              setAuthMode('assignment_select');
            } catch (e) {
              console.error('Error auto-loading services for switch:', e);
            }
          })();
        }
      } catch (e) {}
    }
  }, []);

  const selectAssignment = (asgn, user = loggedInUser) => {
    // Keep user's real DB role in sessionUser.role if they are admin/super_admin/priest so guards won't reject or think role changed!
    const sessionUser = {
      ...user,
      role: user.role || asgn.role,
      activeRole: asgn.role,
      serviceRole: asgn.role,
      activeService: asgn.serviceName,
      activeStage: asgn.stageName,
      activeClass: asgn.className || '',
      sessionTitle: asgn.title,
      permissions: asgn.permissions || user.permissions || {},
    };

    localStorage.setItem('currentUser', JSON.stringify(sessionUser));
    if (asgn.serviceName) {
      localStorage.setItem('activeService_' + user.username, asgn.serviceName);
      localStorage.setItem('activeService', asgn.serviceName);
    }
    if (asgn.stageName) {
      localStorage.setItem('activeStage_' + user.username, asgn.stageName);
      localStorage.setItem('activeStage', asgn.stageName);
    }

    navigate(asgn.targetPath);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password) {
      setLoginError('الرجاء كتابة اسم المستخدم وكلمة المرور!');
      return;
    }

    setIsLoggingIn(true);

    try {
      const loginResult = await authService.login({ username: username.trim(), password });
      if (loginResult && loginResult.success) {
        const user = loginResult.user;
        setLoggedInUser(user);

        // Fetch Services and Jobs to scan all assignments
        let servicesList = [];
        let jobsList = [];

        try {
          const [srvData, jbData] = await Promise.all([
            serviceTreeService.getServices().catch(() => []),
            jobService.getJobs().catch(() => []),
          ]);
          servicesList = Array.isArray(srvData) ? srvData : srvData.services || srvData.priestServices || [];
          jobsList = Array.isArray(jbData) ? jbData : jbData.jobs || [];
        } catch (fetchErr) {
          console.warn('Could not load service tree for assignments:', fetchErr);
        }

        const { systemPortals, services, allAssignments } = getUserGroupedServices(user, servicesList, jobsList);

        // 1. Super Admin account -> Go straight to /super-admin
        if (user.role === 'super_admin') {
          selectAssignment({
            role: 'super_admin',
            serviceName: 'الرئاسة العامة',
            stageName: 'كافة القطاعات',
            targetPath: '/super-admin',
            title: 'السوبر أدمن الرئيسي'
          }, user);
          return;
        }

        // 2. Church Secretariat / Admin account added by Super Admin -> Go straight to /admin
        const isPrimaryAdmin = user.isPrimaryAdmin === true || user.username === 'admin';
        if (user.role === 'admin' && isPrimaryAdmin) {
          selectAssignment({
            role: 'admin',
            serviceName: user.church || 'الكنيسة',
            stageName: 'كافة الخدمات والمراحل',
            targetPath: '/admin',
            title: 'الأمانة العامة / الإدارة'
          }, user);
          return;
        }

        // 3. Show Interactive Selection Screen for all users with services
        setDetectedSystemPortals(systemPortals);
        setDetectedServices(services);
        setSelectedServiceGroup(null);
        setAuthMode('assignment_select');
        setIsLoggingIn(false);
      } else {
        setLoginError(loginResult.message || 'اسم المستخدم أو كلمة المرور غير صحيحة!');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotUser.trim() || !forgotEmail.trim()) {
      setForgotError('الرجاء إدخال اسم المستخدم والبريد الإلكتروني!');
      return;
    }

    setIsRecovering(true);

    try {
      const result = await authService.forgotPassword(forgotEmail.trim());
      if (result && result.success) {
        setForgotSuccess('تم إرسال تعليمات استعادة الحساب بنجاح إلى بريدك الإلكتروني! ✝');
      } else {
        setForgotError(result.message || 'اسم المستخدم أو البريد الإلكتروني غير متطابق!');
      }
    } catch (err) {
      console.error('Password recovery error:', err);
      setForgotError(err.message || 'فشل الاتصال بالسيرفر لإرسال البريد الإلكتروني.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div id="authSection" style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

          html, body, #root, #authSection {
            overflow: hidden !important;
            height: 100vh !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .mobile-wrapper {
            overflow: hidden !important;
            height: 100vh !important;
            max-height: 100vh !important;
          }
          .auth-theme-toggle {
            background-color: #8f1d2c !important;
            border: 2px solid #8f1d2c !important;
            color: #ffffff !important;
            box-shadow: 0 4px 15px rgba(143, 29, 44, 0.5) !important;
          }
          .auth-theme-toggle i {
            color: #ffffff !important;
            font-size: 1.2rem !important;
          }

          #authSection {
            background-color: transparent !important;
            overflow: hidden !important;
          }

          .auth-cross-watermark {
            display: none !important;
          }
          
          .mobile-wrapper {
            position: relative;
            width: 100%;
            height: 100vh;
            min-height: 100vh;
            overflow: hidden !important;
            background-image: var(--bg-overlay, linear-gradient(to bottom, rgba(5, 5, 8, 0.6) 0%, rgba(5, 5, 8, 0.9) 100%)), url('/background.png') !important;
            background-size: 100% 100% !important;
            background-repeat: no-repeat !important;
            background-position: center center !important;
            background-attachment: fixed !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }

          .replica-container {
            width: 100%;
            max-width: 460px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 35px 28px;
            background: rgba(15, 10, 5, 0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(229, 205, 141, 0.2);
            border-radius: 28px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(229, 205, 141, 0.05);
            box-sizing: border-box;
          }

          @media (max-width: 480px) {
            .mobile-wrapper {
              padding: 0;
            }
            .replica-container {
              padding: 35px 20px;
              border-radius: 0;
              border: none;
              background: transparent;
              box-shadow: none;
              backdrop-filter: none;
              -webkit-backdrop-filter: none;
              min-height: 100vh;
              justify-content: center;
            }
            .cross-icon-img {
              width: 100px !important;
              height: 100px !important;
            }
            .replica-title {
              font-size: 22px !important;
            }
          }
          
          .cross-icon-wrapper {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 15px;
            width: 100%;
            background: none !important;
            box-shadow: none !important;
            border: none !important;
          }

          .cross-icon-img {
            width: 110px;
            height: 110px;
            object-fit: contain;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)) !important;
          }

          .replica-title {
            font-family: 'Cinzel', serif;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: 1.5px;
            color: #f4e3b5;
            margin-bottom: 5px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.9);
            text-align: center;
          }
          
          .replica-subtitle {
            font-size: 12px;
            letter-spacing: 1px;
            color: #d1b471;
            margin-bottom: 25px;
            text-shadow: 0 1px 5px rgba(0,0,0,0.9);
            text-align: center;
          }
          
          .replica-form {
            width: 100%;
            display: flex;
            flex-direction: column;
            direction: rtl;
          }
          
          .replica-input-group {
            position: relative;
            margin-bottom: 15px;
          }
          
          .replica-icon-left {
            position: absolute;
            right: 18px;
            top: 50%;
            transform: translateY(-50%);
            color: #d1b471;
            font-size: 16px;
          }
          
          .replica-input {
            width: 100%;
            background: rgba(30, 20, 15, 0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(229, 205, 141, 0.4);
            border-radius: 14px;
            padding: 15px 45px 15px 15px;
            color: white;
            font-size: 14px;
            outline: none;
            transition: all 0.3s;
            text-align: right;
            box-sizing: border-box;
          }
          
          .replica-input::placeholder {
            color: rgba(229, 205, 141, 0.5);
          }
          
          .replica-input:focus {
            border-color: #f4e3b5;
            background: rgba(40, 30, 20, 0.7);
            box-shadow: 0 0 15px rgba(229, 205, 141, 0.3);
          }
          
          .replica-toggle-pass {
            position: absolute;
            left: 18px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #d1b471;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
          }
          
          .replica-forgot-container {
            text-align: left;
            margin-bottom: 25px;
          }
          
          .replica-forgot-link {
            background: none;
            border: none;
            color: #f4e3b5;
            font-size: 12px;
            text-decoration: underline;
            cursor: pointer;
            padding: 0;
          }
          
          .replica-login-btn {
            width: 100%;
            background: rgba(10, 5, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1.5px solid #d1b471;
            border-radius: 25px;
            color: #f4e3b5;
            font-weight: 600;
            font-size: 15px;
            padding: 14px;
            cursor: pointer;
            box-shadow: 0 0 20px rgba(229, 205, 141, 0.25), inset 0 0 10px rgba(229, 205, 141, 0.1);
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 20px;
          }
          
          .replica-login-btn:hover {
            background: rgba(229, 205, 141, 0.15);
            box-shadow: 0 0 25px rgba(229, 205, 141, 0.4), inset 0 0 15px rgba(229, 205, 141, 0.2);
            border-color: #f4e3b5;
          }

          .assignment-select-card {
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25) !important;
          }
          .assignment-select-card:hover {
            transform: scale(1.02) !important;
            background: rgba(229, 205, 141, 0.15) !important;
            box-shadow: 0 8px 25px rgba(229, 205, 141, 0.3) !important;
            border-color: #f4e3b5 !important;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(229, 205, 141, 0.3);
            border-radius: 3px;
          }
          
          /* LIGHT THEME OVERRIDES */
          html[data-theme='light'] body,
          html[data-theme='light'] #authSection {
            background-color: #fff8eb;
          }
          
          html[data-theme='light'] .mobile-wrapper {
            background-image: linear-gradient(to bottom, rgba(255, 248, 235, 0.8) 0%, rgba(255, 248, 235, 0.95) 100%), url('/background.png');
          }
          
          html[data-theme='light'] .replica-container {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          }
          
          html[data-theme='light'] .replica-title,
          html[data-theme='light'] .replica-subtitle {
            color: #2c241b;
            text-shadow: none;
          }
          
          html[data-theme='light'] .replica-input {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(0, 0, 0, 0.15);
            color: #2c241b;
          }
          
          html[data-theme='light'] .replica-input::placeholder {
            color: #8c8278;
          }
          
          html[data-theme='light'] .replica-input:focus {
            background: rgba(255, 255, 255, 0.9);
            border-color: #d1b471;
            box-shadow: 0 0 15px rgba(209, 180, 113, 0.3);
          }
          
          html[data-theme='light'] .replica-icon-left,
          html[data-theme='light'] .replica-toggle-pass {
            color: #2c241b;
          }
          
          html[data-theme='light'] .replica-forgot-link,
          html[data-theme='light'] .replica-signup-link {
            color: #2c241b;
            font-weight: 700;
          }
          
          html[data-theme='light'] .replica-login-btn {
            background: linear-gradient(to right, #d1b471, #f4e3b5);
            color: #2c241b;
            border: none;
            box-shadow: 0 4px 15px rgba(209, 180, 113, 0.4);
          }
          
          html[data-theme='light'] .replica-login-btn:hover {
            filter: brightness(1.05);
            box-shadow: 0 6px 20px rgba(209, 180, 113, 0.6);
            color: #2c241b;
          }

          html[data-theme='light'] .assignment-select-card {
            background: rgba(255, 255, 255, 0.85) !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
          }
          html[data-theme='light'] .assignment-select-card:hover {
            background: rgba(209, 180, 113, 0.1) !important;
            border-color: #d1b471 !important;
            box-shadow: 0 8px 25px rgba(209, 180, 113, 0.2) !important;
          }
          html[data-theme='light'] .assignment-select-card span {
            color: #2c241b !important;
          }
          html[data-theme='light'] .assignment-select-card .text-muted {
            color: #6c757d !important;
          }
          html[data-theme='light'] .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(209, 180, 113, 0.4);
          }
        `}
      </style>

      <div className="mobile-wrapper">
        <ThemeToggle isFixed={true} />

        {/* 1. DYNAMIC ASSIGNMENT SELECTION SCREEN (2-STEP HIERARCHICAL) */}
        {authMode === 'assignment_select' ? (
          <div id="adminSelectCard" className="replica-container fade-in">
            
            {/* STEP 2: STAGE SELECTION FOR A CHOSEN SERVICE */}
            {selectedServiceGroup ? (
              <>
                <h3 className="replica-title" style={{ fontSize: '20px', marginBottom: '8px' }}>
                  {selectedServiceGroup.title}
                </h3>
                <p className="replica-subtitle" style={{ marginBottom: '20px', color: '#a09786' }}>
                  الرجاء اختيار المرحلة للمتابعة:
                </p>

                <div className="w-100 mb-4 px-1 custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto', direction: 'rtl' }}>
                  <div className="d-flex flex-column gap-3 w-100">
                    {selectedServiceGroup.stages.map((asgn) => (
                      <div
                        key={asgn.id}
                        className="assignment-select-card p-3 d-flex align-items-center justify-content-between cursor-pointer"
                        style={{
                          background: 'rgba(30, 20, 15, 0.65)',
                          backdropFilter: 'blur(10px)',
                          border: `1.5px solid ${asgn.color || '#c9a84c'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease-in-out',
                        }}
                        onClick={() => selectAssignment(asgn)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(201, 168, 76, 0.12)',
                            border: `1px solid ${asgn.color || '#e5cd8d'}`,
                            color: asgn.color || '#f4e3b5'
                          }}>
                            <i className={asgn.icon || 'fas fa-graduation-cap'} style={{ fontSize: '1.15rem' }}></i>
                          </div>
                          
                          <div className="d-flex flex-column align-items-start text-end">
                            <span className="fw-bold" style={{ color: '#f4e3b5', fontSize: '0.92rem' }}>
                              {asgn.stageName}
                            </span>
                            <span className="small text-muted mt-1" style={{ fontSize: '0.76rem' }}>
                              {asgn.title}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ color: asgn.color || '#f4e3b5', opacity: 0.85 }}>
                          <i className="fas fa-chevron-left"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="replica-forgot-link"
                  style={{ textDecoration: 'none', color: '#f4e3b5', fontSize: '0.85rem' }}
                  onClick={() => setSelectedServiceGroup(null)}
                >
                  <i className="fas fa-arrow-right me-1"></i> العودة لقائمة الخدمات
                </button>
              </>
            ) : (
              /* STEP 1: SERVICE & GENERAL SECRETARIAT SELECTION */
              <>
                <h3 className="replica-title" style={{ fontSize: '20px', marginBottom: '8px' }}>
                  مرحباً {loggedInUser?.name || loggedInUser?.username}
                </h3>
                <p className="replica-subtitle" style={{ marginBottom: '20px', color: '#a09786' }}>
                  الرجاء اختيار الخدمة أو النظام للمتابعة:
                </p>

                <div className="w-100 mb-4 px-1 custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto', direction: 'rtl' }}>
                  <div className="d-flex flex-column gap-3 w-100">
                    {/* 1. System Portals (General Secretariat / Super Admin / Priest Portal) */}
                    {detectedSystemPortals.map((asgn) => (
                      <div
                        key={asgn.id}
                        className="assignment-select-card p-3 d-flex align-items-center justify-content-between cursor-pointer"
                        style={{
                          background: 'rgba(30, 20, 15, 0.65)',
                          backdropFilter: 'blur(10px)',
                          border: `1.5px solid ${asgn.color || '#0d6efd'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease-in-out',
                        }}
                        onClick={() => selectAssignment(asgn)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(13, 110, 253, 0.12)',
                            border: `1px solid ${asgn.color || '#0d6efd'}`,
                            color: asgn.color || '#6ea8fe'
                          }}>
                            <i className={asgn.icon || 'fas fa-cogs'} style={{ fontSize: '1.15rem' }}></i>
                          </div>
                          
                          <div className="d-flex flex-column align-items-start text-end">
                            <span className="fw-bold" style={{ color: '#f4e3b5', fontSize: '0.92rem' }}>
                              {asgn.title}
                            </span>
                            <span className="small text-muted mt-1" style={{ fontSize: '0.76rem' }}>
                              {asgn.subtitle}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ color: asgn.color || '#6ea8fe', opacity: 0.85 }}>
                          <i className="fas fa-chevron-left"></i>
                        </div>
                      </div>
                    ))}

                    {/* 2. Service Groups (e.g. خدمة تربية كنسية, خدمة ثانوي, etc.) */}
                    {detectedServices.map((srv) => (
                      <div
                        key={srv.id}
                        className="assignment-select-card p-3 d-flex align-items-center justify-content-between cursor-pointer"
                        style={{
                          background: 'rgba(30, 20, 15, 0.65)',
                          backdropFilter: 'blur(10px)',
                          border: `1.5px solid ${srv.color || '#c9a84c'}`,
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease-in-out',
                        }}
                        onClick={() => {
                          setSelectedServiceGroup(srv);
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(201, 168, 76, 0.12)',
                            border: `1px solid ${srv.color || '#e5cd8d'}`,
                            color: srv.color || '#f4e3b5'
                          }}>
                            <i className={srv.icon || 'fas fa-church'} style={{ fontSize: '1.15rem' }}></i>
                          </div>
                          
                          <div className="d-flex flex-column align-items-start text-end">
                            <span className="fw-bold" style={{ color: '#f4e3b5', fontSize: '0.92rem' }}>
                              {srv.title}
                            </span>
                            <span className="small text-muted mt-1" style={{ fontSize: '0.76rem' }}>
                              {srv.subtitle}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ color: srv.color || '#f4e3b5', opacity: 0.85 }}>
                          <i className="fas fa-chevron-left"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="replica-forgot-link"
                  style={{ textDecoration: 'none' }}
                  onClick={() => {
                    localStorage.removeItem('currentUser');
                    setAuthMode('login');
                    setLoggedInUser(null);
                    setDetectedSystemPortals([]);
                    setDetectedServices([]);
                    setSelectedServiceGroup(null);
                  }}
                >
                  تسجيل الدخول بحساب آخر <i className="fas fa-arrow-right ms-1"></i>
                </button>
              </>
            )}
          </div>
        ) : authMode === 'forgot' ? (
          /* 2. FORGOT PASSWORD CARD */
          <div id="forgotCard" className="replica-container fade-in">
              <h1 className="replica-title">استعادة كلمة المرور</h1>
              <p className="replica-subtitle">أدخل بياناتك بالأسفل</p>

              <form onSubmit={handleForgotPassword} className="replica-form">
                <div className="replica-input-group">
                  <i className="fas fa-user replica-icon-left"></i>
                  <input
                    type="text"
                    className="replica-input"
                    placeholder="أدخل اسم المستخدم"
                    value={forgotUser}
                    onChange={(e) => setForgotUser(e.target.value)}
                    required
                  />
                </div>

                <div className="replica-input-group">
                  <i className="fas fa-envelope replica-icon-left"></i>
                  <input
                    type="email"
                    className="replica-input"
                    placeholder="أدخل البريد الإلكتروني"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                {forgotError && <div className="alert alert-danger p-2 small text-center mb-3" style={{borderRadius: '12px', color: '#ff8a8a', background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 138, 138, 0.35)'}}>{forgotError}</div>}
                {forgotSuccess && <div className="alert alert-success p-2 small text-center mb-3" style={{borderRadius: '12px', color: '#7dffb5', background: 'rgba(100, 255, 160, 0.08)', border: '1px solid rgba(125, 255, 181, 0.35)'}}>{forgotSuccess}</div>}

                <button type="submit" className="replica-login-btn" disabled={isRecovering} style={{marginTop: '15px'}}>
                  {isRecovering ? 'جاري الإرسال...' : 'إرسال التعليمات'}
                </button>

                <div className="replica-signup-section">
                  <button type="button" className="replica-signup-link" onClick={() => setAuthMode('login')}>
                    العودة لتسجيل الدخول
                  </button>
                </div>
              </form>
          </div>
        ) : (
          /* 3. STANDARD LOGIN CARD */
          <div id="loginCard" className="replica-container fade-in">
              <div className="cross-icon-wrapper">
                <img 
                  src={transparentCrossSrc} 
                  alt="Cross Icon" 
                  className="cross-icon-img" 
                />
              </div>
              <h1 className="replica-title">رعية الله</h1>
              <p className="text-warning fw-bold mb-3" style={{ fontSize: '1.1rem', fontFamily: 'Cairo, sans-serif', direction: 'rtl', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                ❖ ارْعَوْا رَعِيَّةَ اللهِ الَّتِي بَيْنَكُمْ (١ بط ٥ : ٢)
              </p>
              <p className="replica-subtitle">سجل الدخول للمتابعة</p>

              <form onSubmit={handleLogin} className="replica-form">
                <div className="replica-input-group">
                  <i className="fas fa-user replica-icon-left"></i>
                  <input
                    type="text"
                    className="replica-input"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="replica-input-group">
                  <i className="fas fa-lock replica-icon-left"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="replica-input"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="replica-toggle-pass"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                  </button>
                </div>

                <div className="replica-forgot-container">
                  <button
                    type="button"
                    className="replica-forgot-link"
                    onClick={() => setAuthMode('forgot')}
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {loginError && <div className="alert alert-danger p-2 small text-center mb-3" style={{borderRadius: '12px', color: '#ff8a8a', background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 138, 138, 0.35)'}}>{loginError}</div>}

                <button type="submit" className="replica-login-btn" disabled={isLoggingIn} style={{ marginBottom: '15px' }}>
                  {isLoggingIn ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>

              </form>
          </div>
        )}
      </div>
    </div>
  );
}
