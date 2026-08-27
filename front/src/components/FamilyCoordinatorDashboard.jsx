import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function FamilyCoordinatorDashboard({ isAssistant = false }) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: '#060e22', minHeight: '100vh', color: '#f7f2e8', fontFamily: 'Cairo' }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-dark" style={{ backgroundColor: '#101c3d', borderBottom: '1px solid #c9a84c', padding: '15px 30px' }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img src="/logo-removebg-preview.png" alt="Logo" style={{ height: '50px', marginLeft: '15px', border: '1px solid #c9a84c', borderRadius: '50%', padding: '3px' }} />
            <div>
              <h4 className="mb-0 fw-bold" style={{ color: '#f0d080' }}>
                لوحة تحكم {isAssistant ? 'مساعد أمين الأسرة' : 'أمين الأسرة'}
              </h4>
              <small style={{ color: 'rgba(201,168,76,0.8)' }}>{currentUser.church}</small>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <span className="me-3 d-none d-sm-inline" style={{ color: '#f7f2e8' }}>
              أهلاً، <strong style={{ color: '#f0d080' }}>{currentUser.name}</strong>
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout} style={{ border: '1px solid rgba(220,53,69,0.5)' }}>
              <i className="fas fa-sign-out-alt me-1"></i> تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="card shadow py-5 px-4" style={{ backgroundColor: 'rgba(22, 38, 84, 0.4)', border: '2px solid #c9a84c', borderRadius: '24px', backdropFilter: 'blur(10px)' }}>
              <div className="mb-4">
                <span style={{ fontSize: '4rem', color: '#f0d080' }}>✝</span>
              </div>
              <h2 className="fw-bold mb-3" style={{ color: '#f0d080' }}>
                مرحباً بك يا {isAssistant ? 'مساعد أمين الأسرة' : 'أمين الأسرة'}
              </h2>
              <h4 className="text-muted mb-4">{currentUser.name}</h4>
              
              <div className="py-3 px-4 mx-auto my-4 style-quote" style={{ maxWidth: '600px', backgroundColor: 'rgba(201, 168, 76, 0.08)', borderRadius: '12px', borderLeft: '4px solid #c9a84c', borderRight: '4px solid #c9a84c' }}>
                <p className="mb-0 fs-5 font-italic" style={{ color: '#f7f2e8', fontFamily: 'Amiri', lineHeight: '1.8' }}>
                  «وأما أنا وبيتي فنعبد الرب»
                  <br />
                  <small className="text-muted">(يشوع 15:24)</small>
                </p>
              </div>

              <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(201, 168, 76, 0.3)' }}>
                <h5 className="fw-bold mb-2" style={{ color: '#f0d080' }}>خطوة البداية والربط</h5>
                <p className="mb-0 text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>
                  لقد تم التحقق من حساب قدسك وتصنيفه كـ <strong>{isAssistant ? 'مساعد أمين أسرة' : 'أمين أسرة'}</strong>.
                  <br />
                  في الخطوات التالية، سنقوم بإعداد وتفعيل القوائم المخصصة للتقارير، الغيابات، والصلاحيات الإدارية المطلوبة لهذه الصفحة بناءً على طلبك.
                </p>
              </div>

              {currentUser.osra && (
                <div className="mt-3 text-warning">
                  <i className="fas fa-users me-2"></i> الأسرة المسؤل عنها: <strong>{currentUser.osra}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
