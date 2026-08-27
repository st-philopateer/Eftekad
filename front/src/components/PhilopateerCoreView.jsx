import React, { useState, useEffect } from 'react';

export default function PhilopateerCoreView({ currentUser, isManager = false }) {
  const [activeSubTab, setActiveSubTab] = useState(isManager ? 'requests' : 'on-air'); // 'on-air', 'sound', 'codex', 'requests', 'rules'
  
  // Rules State
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);

  // Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Create Request Form State
  const [requestType, setRequestType] = useState('poster'); // poster, video, montage, office, photography, sound
  const [details, setDetails] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Photography-specific state
  const [photoWhat, setPhotoWhat] = useState('');
  const [photoTimings, setPhotoTimings] = useState('');
  const [photoHasEquipment, setPhotoHasEquipment] = useState(false);

  // Sound-specific state
  const [soundDetails, setSoundDetails] = useState('');

  // Rules Editor State (for managers)
  const [editingRules, setEditingRules] = useState({});
  const [managerRequestTypeFilter, setManagerRequestTypeFilter] = useState('on-air'); // 'on-air', 'sound'

  useEffect(() => {
    fetchRules();
    fetchRequests();
    if (isManager) {
      markAllSeen();
    }
  }, [isManager]);

  const fetchRules = async () => {
    setLoadingRules(true);
    try {
      const res = await fetch('/api/philopateer/rules');
      const data = await res.json();
      if (res.ok && data.success) {
        setRules(data.rules || []);
        const rulesMap = {};
        (data.rules || []).forEach(r => {
          if (r.serviceType === 'terms') {
            rulesMap[r.serviceType] = r.description || '';
          } else {
            rulesMap[r.serviceType] = r.minDaysRequired;
          }
        });
        setEditingRules(rulesMap);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const url = isManager 
        ? '/api/philopateer/requests' 
        : `/api/philopateer/requests?requesterUsername=${currentUser.username}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const markAllSeen = async () => {
    try {
      await fetch('/api/philopateer/requests/seen', { method: 'POST' });
    } catch (err) {
      console.error('Error marking requests seen:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);
    
    const filePromises = selectedFiles.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, data: reader.result });
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then(base64Files => {
        setFiles(prev => [...prev, ...base64Files]);
        setUploading(false);
      })
      .catch(err => {
        console.error('Error reading files:', err);
        setUploading(false);
        window.customAlert('فشل تحميل الملفات، يرجى المحاولة مرة أخرى.');
      });
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRule = async (serviceType, days, description) => {
    try {
      const payload = { serviceType, minDaysRequired: days };
      if (description !== undefined) {
        payload.description = description;
      }
      const res = await fetch('/api/philopateer/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.customAlert('تم تحديث القاعدة بنجاح! ✝');
        fetchRules();
      } else {
        window.customAlert(data.error || 'فشل تحديث القاعدة');
      }
    } catch (err) {
      console.error('Error saving rule:', err);
      window.customAlert('خطأ أثناء حفظ القاعدة.');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!requiredDate) {
      window.customAlert('الرجاء اختيار تاريخ الطلب المطلوب!');
      return;
    }

    // Terms validation
    const termsRule = rules.find(r => r.serviceType === 'terms');
    if (termsRule && termsRule.description && !acceptedTerms) {
      window.customAlert('الرجاء قراءة الشروط والأحكام والموافقة عليها أولاً لتقديم الطلب!');
      return;
    }

    // 1. Date validation rule check
    const selectedRule = rules.find(r => r.serviceType === requestType);
    const minDays = selectedRule ? selectedRule.minDaysRequired : 0;
    
    if (minDays > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const reqDate = new Date(requiredDate);
      reqDate.setHours(0, 0, 0, 0);

      const diffTime = reqDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < minDays) {
        window.customAlert(
          `⚠️ عذراً! طبقاً لقواعد الخدمة، يجب طلب خدمة (${selectedRule.description}) قبل موعدها بـ ${minDays} أيام على الأقل.\nالفرق الحالي هو ${diffDays} يوم.`
        );
        return;
      }
    }

    // 2. Prepare payload
    const payload = {
      requestType,
      requesterUsername: currentUser.username,
      requesterName: currentUser.name,
      requesterOsra: (currentUser.activeService || '') + (currentUser.activeStage ? ' - ' + currentUser.activeStage : ''),
      requiredDate,
      files: files.map(f => f.data), // Base64 data URLs
      details: requestType === 'photography' ? photoWhat : details,
      photographyDetails: requestType === 'photography' ? {
        whatToPhotograph: photoWhat,
        timings: photoTimings,
        hasFullEquipment: photoHasEquipment
      } : undefined
    };

    try {
      const res = await fetch('/api/philopateer/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.customAlert('✝ تم إرسال طلبك بنجاح وجاري مراجعته من قبل أمانة سان فيلوباتير.');
        // Reset form
        setDetails('');
        setRequiredDate('');
        setFiles([]);
        setPhotoWhat('');
        setPhotoTimings('');
        setPhotoHasEquipment(false);
        setAcceptedTerms(false);
        fetchRequests();
      } else {
        window.customAlert(data.error || 'فشل إرسال الطلب.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء إرسال الطلب.');
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await fetch(`/api/philopateer/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.customAlert('تم تحديث حالة الطلب بنجاح! ✝');
        fetchRequests();
      } else {
        window.customAlert(data.error || 'فشل تحديث الحالة.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('خطأ في الشبكة.');
    }
  };

  const translateType = (type) => {
    switch (type) {
      case 'poster': return 'بوستر / تصميم';
      case 'video': return 'فيديو كامل';
      case 'montage': return 'مونتاج فيديو';
      case 'office': return 'أعمال مكتبية (Office)';
      case 'photography': return 'تصوير فوتوغرافي/فيديو';
      case 'sound': return 'خدمات الصوت والساوند';
      default: return type;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge bg-warning text-dark"><i className="fas fa-clock me-1"></i> قيد الانتظار</span>;
      case 'approved': return <span className="badge bg-success"><i className="fas fa-check me-1"></i> مقبول ومؤكد</span>;
      case 'rejected': return <span className="badge bg-danger"><i className="fas fa-times me-1"></i> مرفوض</span>;
      case 'in_progress': return <span className="badge bg-info text-white"><i className="fas fa-spinner fa-spin me-1"></i> جاري التنفيذ</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="fade-in" style={{ direction: 'rtl' }}>
      
      {/* Tab Navigation header */}
      <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        <div className="card-body p-2 d-flex flex-wrap gap-2 justify-content-center">
          {!isManager ? (
            <>
              <button 
                className={`btn px-4 py-2 fw-bold ${activeSubTab === 'on-air' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setActiveSubTab('on-air')}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-broadcast-tower me-2"></i> On Air (الميديا والإنتاج)
              </button>
              <button 
                className={`btn px-4 py-2 fw-bold ${activeSubTab === 'sound' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setActiveSubTab('sound')}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-volume-up me-2"></i> Tekton Sound (الصوتيات)
              </button>
              <button 
                className={`btn px-4 py-2 fw-bold ${activeSubTab === 'codex' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setActiveSubTab('codex')}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-file-contract me-2"></i> نبذة عن خدمتنا
              </button>
            </>
          ) : (
            <>
              <button 
                className={`btn px-4 py-2 fw-bold ${activeSubTab === 'requests' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setActiveSubTab('requests')}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-list-ul me-2"></i> طلبات الخدمات والإنتاج ({requests.length})
              </button>
              <button 
                className={`btn px-4 py-2 fw-bold ${activeSubTab === 'rules' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setActiveSubTab('rules')}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-cog me-2"></i> قواعد وفترات الموعد المسبق
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS FOR CLIENTS (Family Coordinators) */}
      {!isManager && activeSubTab === 'on-air' && (
        <div className="row">
          
          {/* Top description box */}
          <div className="col-12 mb-4">
            <div className="card shadow-sm" style={{ backgroundColor: 'rgba(201, 168, 76, 0.05)', border: '1.5px dashed var(--gold-accent)', borderRadius: '16px' }}>
              <div className="card-body p-4">
                <h5 className="text-warning fw-bold mb-3"><i className="fas fa-info-circle me-2"></i> نبذة عن خدمات ميديا سان فيلوباتير (On Air)</h5>
                <p className="text-white mb-0" style={{ lineHeight: '1.8' }}>
                  أهلاً بك في قسم الإنتاج الفني والمحتوى الرقمي لأسرة سان فيلوباتير. يمكنك من خلال هذه اللوحة طلب الخدمات الفنية المتكاملة:
                  <br />
                  🎨 <strong>إنشاء البوسترات والتصاميم</strong> | 🎥 <strong>إنتاج الفيديوهات</strong> | ✂️ <strong>أعمال المونتاج</strong> | 📷 <strong>التصوير الفوتوغرافي والفيديو</strong> | 📄 <strong>الأعمال المكتبية والـ Office</strong>.
                  <br />
                  <span className="text-warning fw-bold">⚠️ تنبيه هام:</span> يرجى الالتزام بالمدد الزمنية والقواعد المحددة لكل خدمة قبل إرسال طلبك لضمان جودة وسرعة تسليم العمل.
                </p>
              </div>
            </div>
          </div>

          {/* Form and My orders */}
          <div className="col-lg-5 mb-4">
            <div className="card shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div className="card-header py-3">
                <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-plus-circle me-2"></i> طلب خدمة ميديا جديدة</h5>
              </div>
              <div className="p-3 pb-0">
                <div className="alert alert-info py-2 px-3 small border-0 mb-0 d-flex align-items-center gap-2" style={{ backgroundColor: 'rgba(201,168,76,0.06)', color: 'var(--gold-accent, #f4e3b5)', borderRadius: '10px' }}>
                  <i className="fas fa-info-circle text-warning fs-5"></i>
                  <span>يرجى ملء تفاصيل الطلب بدقة وإرفاق كافة الملفات أو السكربتات المساعدة. سيقوم فريق الميديا بمراجعة طلبك وتحديث حالته مباشرة.</span>
                </div>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmitRequest}>
                  
                  <div className="mb-3">
                    <label className="form-label text-warning fw-bold">نوع الخدمة المطلوبة</label>
                    <select 
                      className="form-select" 
                      value={requestType} 
                      onChange={(e) => setRequestType(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="poster">إنشاء بوستر / تصميم</option>
                      <option value="video">إنشاء فيديو كامل</option>
                      <option value="montage">أعمال مونتاج</option>
                      <option value="office">أعمال مكتبية (Office/Word/Powerpoint)</option>
                      <option value="photography">تصوير فوتوغرافي أو فيديو</option>
                    </select>
                  </div>

                  {requestType !== 'photography' ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label text-warning fw-bold">تفاصيل الطلب (اكتب بالتفصيل ما تريده)</label>
                        <textarea 
                          className="form-control" 
                          rows="4" 
                          value={details} 
                          onChange={(e) => setDetails(e.target.value)}
                          placeholder="اكتب مواصفات التصميم أو محتوى الفيديو أو المستند المطلوب..."
                          required
                          style={{ borderRadius: '10px' }}
                        ></textarea>
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-warning fw-bold">تاريخ الاستلام المطلوب</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={requiredDate} 
                          onChange={(e) => setRequiredDate(e.target.value)}
                          required
                          style={{ borderRadius: '10px' }}
                        />
                        {rules.find(r => r.serviceType === requestType) && (
                          <small className="text-muted d-block mt-1 font-monospace">
                            * يتطلب موعداً مسبقاً قبل {rules.find(r => r.serviceType === requestType).minDaysRequired} أيام على الأقل.
                          </small>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-warning fw-bold">إدراج ملفات أو سكربتات مساعدة</label>
                        <div className="p-3 text-center border border-secondary rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <input 
                            type="file" 
                            multiple 
                            onChange={handleFileChange} 
                            className="form-control mb-2" 
                            style={{ borderRadius: '8px' }}
                          />
                          <small className="text-muted">يمكنك إرفاق نصوص أو صور توضيحية للطلب</small>
                          
                          {uploading && <div className="text-warning mt-2 small"><i className="fas fa-spinner fa-spin me-1"></i> جاري قراءة الملفات...</div>}

                          {files.length > 0 && (
                            <div className="mt-3 text-start">
                              <span className="small text-warning fw-bold">الملفات المرفقة:</span>
                              <ul className="list-unstyled mb-0 mt-1">
                                {files.map((file, index) => (
                                  <li key={index} className="d-flex justify-content-between align-items-center p-2 mb-1 rounded bg-dark bg-opacity-50">
                                    <span className="text-truncate small" style={{ maxWidth: '200px' }}>{file.name}</span>
                                    <button 
                                      type="button" 
                                      className="btn btn-sm btn-link text-danger p-0"
                                      onClick={() => handleRemoveFile(index)}
                                    >
                                      حذف
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* PHOTOGRAPHY WORKFLOW */
                    <div className="p-3 rounded border border-warning border-opacity-25 bg-dark bg-opacity-25 mb-3">
                      <h6 className="text-warning fw-bold mb-3 border-bottom pb-2"><i className="fas fa-camera me-1"></i> تفاصيل حجز التصوير</h6>
                      
                      <div className="mb-3">
                        <label className="form-label text-warning fw-bold">ما الذي سيتم تصويره؟ (الحدث أو النشاط)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="مثال: قداس اليوم، مؤتمر الخدمة، لقاء الأسر..."
                          value={photoWhat}
                          onChange={(e) => setPhotoWhat(e.target.value)}
                          required
                          style={{ borderRadius: '10px' }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-warning fw-bold">المواعيد والتواريخ المحددة للتصوير</label>
                        <textarea 
                          className="form-control" 
                          rows="2" 
                          placeholder="اكتب التوقيت بالتفصيل (مثال: الجمعة القادمة من الساعة 9 ص حتى 1 ظ)"
                          value={photoTimings}
                          onChange={(e) => setPhotoTimings(e.target.value)}
                          required
                          style={{ borderRadius: '10px' }}
                        ></textarea>
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-warning fw-bold">تاريخ اليوم المطلوب</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={requiredDate} 
                          onChange={(e) => setRequiredDate(e.target.value)}
                          required
                          style={{ borderRadius: '10px' }}
                        />
                      </div>

                      <div className="form-check p-2 d-flex align-items-center gap-2 mb-3">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          id="photoHasEquipment"
                          checked={photoHasEquipment}
                          onChange={(e) => setPhotoHasEquipment(e.target.checked)}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        <label className="form-check-label ms-2 cursor-pointer text-white-50" htmlFor="photoHasEquipment">
                          هل تتوفر أدوات تصوير كاملة في موقع الحدث؟
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Terms & Conditions Acceptance Box */}
                  {(() => {
                    const termsRule = rules.find(r => r.serviceType === 'terms');
                    if (!termsRule || !termsRule.description) return null;
                    return (
                      <div className="p-3 mb-3 rounded border border-warning" style={{ backgroundColor: 'rgba(201,168,76,0.02)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <h6 className="fw-bold text-warning small mb-2"><i className="fas fa-file-signature me-1"></i> الشروط والأحكام الخاصة بالطلب:</h6>
                        <div className="mb-2 p-2 rounded bg-dark bg-opacity-50 text-white-50 small scrollable-terms" style={{ maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', textAlign: 'right', direction: 'rtl', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {termsRule.description}
                        </div>
                        <div className="form-check d-flex align-items-center gap-2 mb-0">
                          <input 
                            type="checkbox" 
                            className="form-check-input text-warning" 
                            id="acceptTerms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                            style={{ transform: 'scale(1.1)' }}
                          />
                          <label className="form-check-label text-warning small cursor-pointer" htmlFor="acceptTerms" style={{ fontSize: '0.85rem' }}>
                            أقر وأوافق على الشروط والأحكام المذكورة أعلاه.
                          </label>
                        </div>
                      </div>
                    );
                  })()}

                  <button 
                    type="submit" 
                    className="btn btn-warning w-100 fw-bold py-2 shadow-sm"
                    style={{ borderRadius: '25px' }}
                  >
                    إرسال الطلب للمراجعة ✝
                  </button>

                </form>
              </div>
            </div>
          </div>

          {/* List of my requests */}
          <div className="col-lg-7 mb-4">
            <div className="card shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div className="card-header py-3">
                <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-history me-2"></i> طلباتي السابقة</h5>
              </div>
              <div className="card-body p-0">
                {requests.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle mb-0 text-white">
                      <thead>
                        <tr>
                          <th className="p-3">نوع الخدمة</th>
                          <th className="p-3">التفاصيل</th>
                          <th className="p-3">تاريخ الاستلام</th>
                          <th className="p-3 text-center">حالة الطلب</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map(req => (
                          <tr key={req._id}>
                            <td className="p-3 fw-bold">{translateType(req.requestType)}</td>
                            <td className="p-3 small text-truncate" style={{ maxWidth: '200px' }}>
                              {req.details || (req.photographyDetails && req.photographyDetails.whatToPhotograph)}
                            </td>
                            <td className="p-3 font-monospace">{req.requiredDate}</td>
                            <td className="p-3 text-center">{getStatusBadge(req.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted py-5 mb-0">لم تقم بإرسال أي طلبات إنتاج فني بعد.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {!isManager && activeSubTab === 'sound' && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 mb-4 text-center py-5">
            <div className="service-icon-circle mb-4 mx-auto" style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-volume-up text-warning fa-3x"></i>
            </div>
            <h3 className="fw-bold text-warning mb-3">Tekton Sound (خدمات الصوتيات)</h3>
            <p className="text-white-50 leading-relaxed mb-4">
              نظام إدارة وحجوزات أجهزة الصوت والساوند سيستم المخصص للمؤتمرات والقداسات وحفلات الخدمة.
              <br />
              هذه الخدمة قيد التطوير والتجهيز حالياً وسيتم إطلاقها قريباً جداً ✝
            </p>
            <span className="badge bg-secondary p-2 px-3 fs-6">قريباً جداً (Under Construction)</span>
          </div>
        </div>
      )}

      {!isManager && activeSubTab === 'codex' && (
        <div className="row justify-content-center">
          <div className="col-md-8 mb-4">
            <div className="card shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div className="card-header py-3 text-center">
                <h4 className="mb-0 fw-bold text-warning"><i className="fas fa-info-circle me-2"></i> نبذة عن خدمتنا</h4>
              </div>
              <div className="card-body p-4 text-white" style={{ lineHeight: '2.0', textAlign: 'justify' }}>
                <h5 className="text-warning border-bottom pb-2 mb-3">✝ الرؤية والهدف الأساسي</h5>
                <p>
                  خدمة سان فيلوباتير هي خدمة إنتاج فني ومحتوى وإعلام هادف تسعى إلى تمجيد اسم الله وتقديم الإنجيل ورسالة الكنيسة الأرثوذكسية بطريقة بصرية معاصرة وروحية عالية.
                </p>
                <h5 className="text-warning border-bottom pb-2 mb-3 mt-4">✝ قواعد الحجز والطلب</h5>
                <ul>
                  <li>يلتزم طالبو الخدمات بتقديم طلباتهم من خلال النظام الإلكتروني حصراً.</li>
                  <li>يتم تسليم المواد الفنية فقط بعد اعتمادها وتأكيد مطابقتها لضوابط الكنيسة والخدمة.</li>
                  <li>أي طلب يقل موعد استلامه عن المدة المحددة في لوحة القواعد يتم رفضه تلقائياً لضمان الجودة.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS FOR MANAGERS (Philopateer Service Admins) */}
      {isManager && activeSubTab === 'requests' && (
        <div className="card shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div className="card-header p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-warning mb-0"><i className="fas fa-list-ul me-2"></i> طلبات الميديا والتصوير الواردة</h5>
            <button className="btn btn-sm btn-outline-warning" onClick={fetchRequests}><i className="fas fa-sync me-1"></i> تحديث</button>
          </div>
          <div className="p-3 border-bottom border-secondary d-flex gap-2 justify-content-start" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <button 
              className={`btn btn-sm ${managerRequestTypeFilter === 'on-air' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setManagerRequestTypeFilter('on-air')}
              style={{ borderRadius: '8px' }}
            >
              <i className="fas fa-broadcast-tower me-1"></i> طلبات On Air (الميديا)
            </button>
            <button 
              className={`btn btn-sm ${managerRequestTypeFilter === 'sound' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setManagerRequestTypeFilter('sound')}
              style={{ borderRadius: '8px' }}
            >
              <i className="fas fa-volume-up me-1"></i> طلبات Sound (الساوند)
            </button>
          </div>
          <div className="card-body p-0">
            {(() => {
              const filteredRequests = requests.filter(req => {
                if (managerRequestTypeFilter === 'on-air') {
                  return req.requestType !== 'sound';
                } else {
                  return req.requestType === 'sound';
                }
              });

              if (filteredRequests.length === 0) {
                return <p className="text-center text-muted py-5 mb-0">لا توجد طلبات واردة لهذه الخدمة حالياً.</p>;
              }

              return (
                <div className="table-responsive">
                  <table className="table table-striped table-hover align-middle mb-0 text-white">
                    <thead>
                      <tr>
                        <th className="p-3">صاحب الطلب</th>
                      <th className="p-3">الأسرة / الخدمة</th>
                      <th className="p-3">نوع الخدمة</th>
                      <th className="p-3">التفاصيل / الحدث</th>
                      <th className="p-3">تاريخ الاستلام</th>
                      <th className="p-3 text-center">المرفقات</th>
                      <th className="p-3 text-center" style={{ width: '200px' }}>حالة الطلب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id}>
                        <td className="p-3">
                          <span className="fw-bold text-warning">{req.requesterName}</span>
                        </td>
                        <td className="p-3">{req.requesterOsra}</td>
                        <td className="p-3 fw-bold">{translateType(req.requestType)}</td>
                        <td className="p-3">
                          {req.requestType === 'photography' ? (
                            <div className="small">
                              <strong>الحدث:</strong> {req.details}
                              <br />
                              <strong>المواعيد:</strong> {req.photographyDetails?.timings}
                              <br />
                              <strong>معدات كاملة:</strong> {req.photographyDetails?.hasFullEquipment ? 'نعم' : 'لا'}
                            </div>
                          ) : (
                            <span className="small">{req.details}</span>
                          )}
                        </td>
                        <td className="p-3 font-monospace">{req.requiredDate}</td>
                        <td className="p-3 text-center">
                          {req.files && req.files.length > 0 ? (
                            <div className="d-flex flex-column gap-1 align-items-center">
                              {req.files.map((fileData, fileIdx) => (
                                <a 
                                  key={fileIdx}
                                  href={fileData}
                                  download={`attachment_${fileIdx + 1}`}
                                  className="btn btn-sm btn-link text-warning p-0 fw-bold font-monospace"
                                >
                                  <i className="fas fa-download me-1"></i> تحميل مرفق {fileIdx + 1}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted small">لا توجد</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <select 
                            className="form-select form-select-sm"
                            value={req.status}
                            onChange={(e) => handleUpdateStatus(req._id, e.target.value)}
                            style={{ borderRadius: '8px', backgroundColor: 'var(--card-bg)', color: '#fff', border: '1px solid var(--border-color)' }}
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="approved">مقبول ومؤكد</option>
                            <option value="rejected">مرفوض</option>
                            <option value="in_progress">جاري التنفيذ</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isManager && activeSubTab === 'rules' && (
        <div className="card shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div className="card-header p-4 border-bottom border-secondary">
            <h5 className="fw-bold text-warning mb-0"><i className="fas fa-cog me-2"></i> تحديد فترات الموعد المسبق لخدمات الميديا</h5>
          </div>
          <div className="card-body p-4">
            <p className="text-white-50 small mb-4">
              يمكنك هنا تحديد الحد الأدنى من الأيام المطلوبة قبل موعد تسليم الخدمة. لن يتمكن المنسق / أمين الأسرة من تقديم أي طلب قبل الموعد المحدد له بهذه الأيام.
            </p>
            
            {loadingRules ? (
              <div className="text-center py-4"><div className="spinner-border text-warning" role="status"></div></div>
            ) : (
              <>
                <div className="row g-4">
                  {rules.filter(r => r.serviceType !== 'terms').map(rule => (
                    <div className="col-md-6" key={rule._id}>
                      <div className="p-3 rounded border border-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <h6 className="fw-bold text-warning mb-3">{rule.description}</h6>
                        <div className="d-flex align-items-center gap-3">
                          <label className="text-white-50 small" style={{ minWidth: '150px' }}>عدد الأيام المسبقة المطلوبة</label>
                          <input 
                            type="number" 
                            className="form-control" 
                            min="0"
                            value={editingRules[rule.serviceType] || 0}
                            onChange={(e) => setEditingRules({ ...editingRules, [rule.serviceType]: parseInt(e.target.value, 10) })}
                            style={{ width: '80px', borderRadius: '8px' }}
                          />
                          <button 
                            className="btn btn-warning btn-sm fw-bold px-3"
                            onClick={() => handleSaveRule(rule.serviceType, editingRules[rule.serviceType] || 0, rule.description)}
                            style={{ borderRadius: '8px' }}
                          >
                            تحديث
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(() => {
                  const termsRule = rules.find(r => r.serviceType === 'terms');
                  if (!termsRule) return null;
                  return (
                    <div className="card border-warning mt-4 shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '12px' }}>
                      <div className="card-header py-3" style={{ backgroundColor: 'rgba(201,168,76,0.05)' }}>
                        <h6 className="mb-0 fw-bold text-warning">
                          <i className="fas fa-file-contract me-2"></i> الشروط والأحكام للخدمة (تظهر للمنسق عند تقديم طلب جديد)
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <textarea
                            className="form-control text-white bg-dark border-secondary"
                            rows="6"
                            value={editingRules['terms'] || ''}
                            onChange={(e) => setEditingRules({ ...editingRules, terms: e.target.value })}
                            placeholder="اكتب هنا الشروط والأحكام بالتفصيل..."
                            style={{ borderRadius: '12px', resize: 'vertical', direction: 'rtl', textAlign: 'right' }}
                          />
                        </div>
                        <button
                          className="btn btn-warning fw-bold px-4 py-2"
                          onClick={() => handleSaveRule('terms', 0, editingRules['terms'] || '')}
                          style={{ borderRadius: '12px' }}
                        >
                          حفظ الشروط والأحكام ✝
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
