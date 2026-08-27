import React, { useState, useMemo } from 'react';

// Helper to check if a date falls within selected period
const isDateInPeriod = (dateStr, periodType, periodValue, year) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  // Verify year matches
  const dateYear = date.getFullYear().toString();
  if (year && dateYear !== year) return false;

  const month = date.getMonth() + 1; // 1-indexed

  if (periodType === 'quarter') {
    if (periodValue === 'q1') return month >= 1 && month <= 3;
    if (periodValue === 'q2') return month >= 4 && month <= 6;
    if (periodValue === 'q3') return month >= 7 && month <= 9;
    if (periodValue === 'q4') return month >= 10 && month <= 12;
  } else if (periodType === 'month') {
    return month === parseInt(periodValue, 10);
  }

  return true; // Whole Year
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
};

export default function ServiceDetailsView({
  currentUser,
  priestServicesList = [], // for priest
  services = [], // for coordinator
  servants = [],
  evaluationTemplates = [],
  servantEvaluations = [],
  preparations = [],
  preparationSubmissions = [],
  selectedYearForFilter
}) {
  const [periodType, setPeriodType] = useState('year'); // 'year', 'quarter', 'month'
  const [periodValue, setPeriodValue] = useState('q1'); // 'q1'..'q4' or '1'..'12'
  const [activeTabSub, setActiveTabSub] = useState('stages'); // 'stages', 'classes', 'servants'
  
  // Navigation states
  const [selectedStageName, setSelectedStageName] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedServantUsername, setSelectedServantUsername] = useState('');

  // 1. Resolve available services and stages for user
  const isPriest = currentUser.activeRole === 'priest' || currentUser.role === 'priest';
  const allServices = isPriest ? priestServicesList : services;

  // Extract all stages and classes for calculation
  const calculatedStages = useMemo(() => {
    const list = [];
    allServices.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(osra => {
          (osra.stages || []).forEach(stage => {
            list.push({
              osraName: osra.name,
              stageName: stage.name,
              classes: stage.classes || [],
              generalCoordinators: stage.generalCoordinatorUsers || [],
              familyCoordinators: stage.familyCoordinatorUsers || [],
              assistantFamilyCoordinators: stage.assistantFamilyCoordinatorUsers || []
            });
          });
        });
      }
    });
    return list;
  }, [allServices, selectedYearForFilter]);

  // If coordinator, filter stages they are assigned to
  const myStages = useMemo(() => {
    if (isPriest) return calculatedStages;
    const usernameLower = (currentUser.username || '').toLowerCase();
    
    // Check if they are osra-level coordinator
    const assignedOsraNames = [];
    allServices.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(osra => {
          const isOsraCoord = (osra.generalCoordinatorUser || '').toLowerCase() === usernameLower ||
                              (osra.familyCoordinatorUser || '').toLowerCase() === usernameLower ||
                              (osra.assistantFamilyCoordinatorUser || '').toLowerCase() === usernameLower;
          if (isOsraCoord) assignedOsraNames.push(osra.name);
        });
      }
    });

    return calculatedStages.filter(st => {
      if (assignedOsraNames.includes(st.osraName)) return true;
      const isCoord = st.generalCoordinators.map(x => x.toLowerCase()).includes(usernameLower) ||
                      st.familyCoordinators.map(x => x.toLowerCase()).includes(usernameLower) ||
                      st.assistantFamilyCoordinators.map(x => x.toLowerCase()).includes(usernameLower);
      const isServant = st.classes.some(cls => (cls.servants || []).some(s => s.toLowerCase() === usernameLower));
      return isCoord || isServant;
    });
  }, [calculatedStages, isPriest, allServices, selectedYearForFilter, currentUser.username]);

  // Compute stats for all servants in the selected period
  const servantStats = useMemo(() => {
    const stats = {}; // username -> { totalScore, count, avg, evaluations: [] }

    // Initialize servants
    servants.forEach(s => {
      stats[s.username] = {
        name: s.name,
        code: s.systemCode,
        totalScore: 0,
        count: 0,
        avg: null,
        details: []
      };
    });

    // 1. Process servantEvaluations (Checklist grades)
    servantEvaluations.forEach(ev => {
      const userStat = stats[ev.servantUsername];
      if (!userStat) return;

      const dateStr = ev.weekDate || ev.scannedAt;
      if (!isDateInPeriod(dateStr, periodType, periodValue, selectedYearForFilter)) return;

      const template = evaluationTemplates.find(t => t.id === ev.templateId);
      const templateName = template ? template.name : 'تقييم';
      const templateType = template ? template.type : 'checkbox';

      let score = 0;
      if (templateType === 'percentage') {
        score = ev.value !== undefined && ev.value !== null ? Number(ev.value) : 0;
      } else {
        score = ev.value === true || ev.value === 'true' ? 100 : 0;
      }

      userStat.totalScore += score;
      userStat.count += 1;
      userStat.details.push({
        name: templateName,
        date: dateStr,
        score: score,
        type: 'checklist'
      });
    });

    // 2. Process preparationSubmissions
    preparationSubmissions.forEach(sub => {
      const userStat = stats[sub.servantUsername || sub.username];
      if (!userStat) return;

      const dateStr = sub.uploadedAt || sub.evaluatedAt;
      if (!isDateInPeriod(dateStr, periodType, periodValue, selectedYearForFilter)) return;

      if (sub.score === undefined || sub.score === null || sub.score === '') return;

      const score = Number(sub.score);
      const prepName = sub.lessonName || 'تحضير درس';

      userStat.totalScore += score;
      userStat.count += 1;
      userStat.details.push({
        name: `تحضير: ${prepName}`,
        date: dateStr,
        score: score,
        type: 'preparation'
      });
    });

    // Calculate averages & Sort detailed grades ascending
    Object.keys(stats).forEach(uname => {
      const s = stats[uname];
      s.avg = s.count > 0 ? Math.round(s.totalScore / s.count) : null;
      
      // Sort: January first, December last
      s.details.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Format all dates to YYYY-MM-DD
      s.details.forEach(dt => {
        dt.date = formatDateOnly(dt.date);
      });
    });

    return stats;
  }, [servants, servantEvaluations, preparationSubmissions, evaluationTemplates, periodType, periodValue, selectedYearForFilter]);

  // Compute Class Averages
  const classStats = useMemo(() => {
    const classMap = {}; // "stageName-className" -> { name, avg, servants: [] }

    myStages.forEach(st => {
      st.classes.forEach(cls => {
        const key = `${st.stageName}-${cls.name}`;
        const servantList = cls.servants || [];
        
        let sum = 0;
        let count = 0;
        const servantData = [];

        servantList.forEach(sUsername => {
          const sStat = servantStats[sUsername.toLowerCase()];
          if (sStat && sStat.avg !== null) {
            sum += sStat.avg;
            count += 1;
            servantData.push({ username: sUsername.toLowerCase(), name: sStat.name, avg: sStat.avg });
          } else if (sStat) {
            servantData.push({ username: sUsername.toLowerCase(), name: sStat.name, avg: null });
          }
        });

        classMap[key] = {
          className: cls.name,
          stageName: st.stageName,
          servants: servantData,
          avg: count > 0 ? Math.round(sum / count) : null
        };
      });
    });

    return classMap;
  }, [myStages, servantStats]);

  // Compute Stage Averages
  const stageStats = useMemo(() => {
    const stageMap = {}; // stageName -> { avg, classes: [] }

    myStages.forEach(st => {
      const matchingClasses = Object.keys(classStats)
        .filter(k => k.startsWith(`${st.stageName}-`))
        .map(k => classStats[k]);

      let sum = 0;
      let count = 0;

      matchingClasses.forEach(c => {
        if (c.avg !== null) {
          sum += c.avg;
          count += 1;
        }
      });

      stageMap[st.stageName] = {
        stageName: st.stageName,
        osraName: st.osraName,
        classesCount: matchingClasses.length,
        avg: count > 0 ? Math.round(sum / count) : null
      };
    });

    return stageMap;
  }, [myStages, classStats]);

  // Handlers for period selection
  const months = [
    { value: '1', label: 'يناير' },
    { value: '2', label: 'فبراير' },
    { value: '3', label: 'مارس' },
    { value: '4', label: 'أبريل' },
    { value: '5', label: 'مايو' },
    { value: '6', label: 'يونيو' },
    { value: '7', label: 'يوليو' },
    { value: '8', label: 'أغسطس' },
    { value: '9', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' }
  ];

  const quarters = [
    { value: 'q1', label: 'الربع الأول (يناير، فبراير، مارس)' },
    { value: 'q2', label: 'الربع الثاني (أبريل، مايو، يونيو)' },
    { value: 'q3', label: 'الربع الثالث (يوليو، أغسطس، سبتمبر)' },
    { value: 'q4', label: 'الربع الرابع (أكتوبر، نوفمبر، ديسمبر)' }
  ];

  return (
    <div className="fade-in" style={{ direction: 'rtl' }}>
      
      {/* 1. Header Filter Section */}
      <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        <div className="card-body p-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <label className="form-label text-warning fw-bold"><i className="fas fa-filter me-2"></i> تحديد فترة التقييم</label>
              <select 
                className="form-select" 
                value={periodType} 
                onChange={(e) => {
                  setPeriodType(e.target.value);
                  if (e.target.value === 'quarter') setPeriodValue('q1');
                  else if (e.target.value === 'month') setPeriodValue('1');
                }}
                style={{ borderRadius: '10px' }}
              >
                <option value="year">السنة كاملة ({selectedYearForFilter})</option>
                <option value="quarter">تقييم ربع سنوي</option>
                <option value="month">تقييم شهري</option>
              </select>
            </div>

            {periodType !== 'year' && (
              <div className="col-md-4">
                <label className="form-label text-warning fw-bold">الفترة المحددة</label>
                <select 
                  className="form-select" 
                  value={periodValue} 
                  onChange={(e) => setPeriodValue(e.target.value)}
                  style={{ borderRadius: '10px' }}
                >
                  {periodType === 'quarter' ? (
                    quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)
                  ) : (
                    months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)
                  )}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Navigation Breadcrumbs */}
      <div className="d-flex align-items-center gap-2 mb-3 bg-dark bg-opacity-25 p-3 rounded-3" style={{ border: '1px solid var(--border-color)' }}>
        <button 
          className="btn btn-sm btn-outline-warning" 
          onClick={() => {
            setActiveTabSub('stages');
            setSelectedStageName('');
            setSelectedClassName('');
            setSelectedServantUsername('');
          }}
          style={{ borderRadius: '8px' }}
        >
          الرئيسية
        </button>
        {selectedStageName && (
          <>
            <span className="text-muted">/</span>
            <button 
              className="btn btn-sm btn-outline-warning"
              onClick={() => {
                setActiveTabSub('classes');
                setSelectedClassName('');
                setSelectedServantUsername('');
              }}
              style={{ borderRadius: '8px' }}
            >
              مرحلة {selectedStageName}
            </button>
          </>
        )}
        {selectedClassName && (
          <>
            <span className="text-muted">/</span>
            <button 
              className="btn btn-sm btn-outline-warning"
              onClick={() => {
                setActiveTabSub('servants');
                setSelectedServantUsername('');
              }}
              style={{ borderRadius: '8px' }}
            >
              فصل {selectedClassName}
            </button>
          </>
        )}
        {selectedServantUsername && (
          <>
            <span className="text-muted">/</span>
            <span className="text-warning fw-bold">{servantStats[selectedServantUsername]?.name || selectedServantUsername}</span>
          </>
        )}
      </div>

      {/* 3. Render content depending on activeTabSub */}
      
      {/* SUB-TAB 1: STAGES OVERVIEW */}
      {activeTabSub === 'stages' && (
        <div className="row g-4">
          {Object.values(stageStats).map(st => (
            <div className="col-md-6 col-lg-4" key={st.stageName}>
              <div 
                className="card h-100 service-select-card cursor-pointer shadow-sm"
                onClick={() => {
                  setSelectedStageName(st.stageName);
                  setActiveTabSub('classes');
                }}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  transition: 'all 0.25s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = 'var(--gold-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div className="card-body p-4 text-center d-flex flex-column">
                  <div className="service-icon-circle mb-3 mx-auto" style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-layer-group text-warning fa-2x"></i>
                  </div>
                  <h4 className="fw-bold mb-2 text-warning">{st.stageName}</h4>
                  <p className="text-muted small mb-3">الخدمة: {st.osraName} | الفصول: {st.classesCount}</p>
                  
                  <div className="mt-auto">
                    <span className="small text-white-50 d-block mb-1">التقييم الإجمالي للمرحلة</span>
                    {st.avg !== null ? (
                      <div className="mb-3">
                        <h2 className="fw-bold text-success mb-2">{st.avg}%</h2>
                        <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${st.avg}%`, borderRadius: '4px' }}
                            aria-valuenow={st.avg} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <h5 className="text-muted mb-3">لا توجد تقييمات</h5>
                    )}
                    <button className="btn btn-warning btn-sm w-100 fw-bold py-2 mt-2" style={{ borderRadius: '12px' }}>
                      <i className="fas fa-folder-open me-1"></i> عرض فصول المرحلة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(stageStats).length === 0 && (
            <p className="text-center text-muted py-5 col-12">لا توجد مراحل مسندة أو تقييمات مسجلة في شجرة الخدمة حالياً.</p>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CLASSES OVERVIEW */}
      {activeTabSub === 'classes' && (
        <div className="row g-4">
          {Object.values(classStats)
            .filter(c => c.stageName === selectedStageName)
            .map(c => (
              <div className="col-md-6 col-lg-4" key={c.className}>
                <div 
                  className="card h-100 service-select-card cursor-pointer shadow-sm"
                  onClick={() => {
                    setSelectedClassName(c.className);
                    setActiveTabSub('servants');
                  }}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    transition: 'all 0.25s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = 'var(--gold-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div className="card-body p-4 text-center d-flex flex-column">
                    <div className="service-icon-circle mb-3 mx-auto" style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-school text-warning fa-2x"></i>
                    </div>
                    <h4 className="fw-bold mb-2 text-warning">فصل: {c.className}</h4>
                    <p className="text-muted small mb-3">عدد الخدام: {c.servants.length}</p>

                    <div className="mt-auto">
                      <span className="small text-white-50 d-block mb-1">التقييم الإجمالي للفصل</span>
                      {c.avg !== null ? (
                        <div className="mb-3">
                          <h2 className="fw-bold text-success mb-2">{c.avg}%</h2>
                          <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${c.avg}%`, borderRadius: '4px' }}
                              aria-valuenow={c.avg} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <h5 className="text-muted mb-3">لا توجد تقييمات</h5>
                      )}
                      <button className="btn btn-warning btn-sm w-100 fw-bold py-2 mt-2" style={{ borderRadius: '12px' }}>
                        <i className="fas fa-users me-1"></i> عرض تقييمات خدام الفصل
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* SUB-TAB 3: SERVANTS OVERVIEW */}
      {activeTabSub === 'servants' && (
        <div className="row g-4">
          {(() => {
            const classObj = Object.values(classStats).find(c => c.stageName === selectedStageName && c.className === selectedClassName);
            if (!classObj) return <p className="text-center text-muted col-12">لم يتم العثور على بيانات هذا الفصل.</p>;

            return classObj.servants.map(s => {
              const details = servantStats[s.username];
              return (
                <div className="col-md-6 col-lg-4" key={s.username}>
                  <div 
                    className="card h-100 service-select-card cursor-pointer shadow-sm"
                    onClick={() => {
                      setSelectedServantUsername(s.username);
                      setActiveTabSub('details');
                    }}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      transition: 'all 0.25s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                      e.currentTarget.style.borderColor = 'var(--gold-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div className="card-body p-4 text-center d-flex flex-column">
                      <div className="service-icon-circle mb-3 mx-auto" style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user text-warning fa-2x"></i>
                      </div>
                      <h5 className="fw-bold mb-3 text-warning">{s.name}</h5>

                      <div className="mt-auto">
                        <span className="small text-white-50 d-block mb-1">التقييم الإجمالي للخادم</span>
                        {s.avg !== null ? (
                          <div className="mb-3">
                            <h3 className="fw-bold text-success mb-2">{s.avg}%</h3>
                            <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${s.avg}%`, borderRadius: '4px' }}
                                aria-valuenow={s.avg} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <h5 className="text-muted mb-3">لا توجد تقييمات</h5>
                        )}
                        <button className="btn btn-warning btn-sm w-100 fw-bold py-2 mt-2" style={{ borderRadius: '12px' }}>
                          <i className="fas fa-clipboard-list me-1"></i> عرض سجل التقييمات
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* SUB-TAB 4: DETAILED GRADES LIST FOR SERVANT */}
      {activeTabSub === 'details' && (
        <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div className="card-header p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold text-warning mb-1"><i className="fas fa-user-check me-2"></i> سجل تقييمات الخادم التفصيلية</h5>
              <p className="text-muted small mb-0">الخادم: {servantStats[selectedServantUsername]?.name || selectedServantUsername}</p>
            </div>
            {servantStats[selectedServantUsername]?.avg !== null && (
              <span className="badge bg-success fs-5 px-3 py-2 fw-bold" style={{ borderRadius: '10px' }}>
                المتوسط العام: {servantStats[selectedServantUsername]?.avg}%
              </span>
            )}
          </div>
          <div className="card-body p-0">
            {servantStats[selectedServantUsername]?.details.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle mb-0 text-white">
                  <thead style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                    <tr>
                      <th className="p-3">بند التقييم</th>
                      <th className="p-3">تاريخ التقييم</th>
                      <th className="p-3">نوع التقييم</th>
                      <th className="p-3 text-center">الدرجة الممنوحة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servantStats[selectedServantUsername].details.map((dt, idx) => (
                      <tr key={idx} className="border-bottom border-secondary">
                        <td className="p-3 fw-bold">{dt.name}</td>
                        <td className="p-3 font-monospace">{dt.date}</td>
                        <td className="p-3">
                          {dt.type === 'preparation' ? (
                            <span className="badge bg-info text-white">تحضير درس</span>
                          ) : (
                            <span className="badge bg-warning text-dark">بند تقييم</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`fw-bold ${dt.score >= 50 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.1rem' }}>
                            {dt.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted py-5 mb-0">لا توجد تقييمات مسجلة لهذا الخادم في الفترة المحددة.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
