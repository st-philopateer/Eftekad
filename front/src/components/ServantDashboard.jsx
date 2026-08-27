import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicEditor from '../components/ProfilePicEditor';
import PhilopateerCoreView from './PhilopateerCoreView';
import ThemeToggle from '../components/ThemeToggle';

const resolveFrontendDynamicRole = (user, priestServices, jobs) => {
  if (['super_admin', 'admin', 'priest'].includes(user.role)) {
    return user.role;
  }

  let highestRole = 'servant';
  const usernameLower = (user.username || '').toLowerCase();

  (priestServices || []).forEach(srv => {
    (srv.osras || []).forEach(osra => {
      const isOsraCoord = (osra.coordinatorUser || '').toLowerCase() === usernameLower;
      const isOsraAsst = (osra.assistantCoordinatorUser || '').toLowerCase() === usernameLower;
      const isFamilyCoord = (osra.familyCoordinatorUser || '').toLowerCase() === usernameLower;
      const isFamilyAsst = (osra.assistantFamilyCoordinatorUser || '').toLowerCase() === usernameLower;

      if (isOsraCoord || isOsraAsst || isFamilyCoord || isFamilyAsst) {
        let osraRole = 'servant';
        if (isOsraCoord) osraRole = 'general_coordinator';
        else if (isOsraAsst) osraRole = 'assistant_service_coordinator';
        else if (isFamilyCoord) osraRole = 'family_coordinator';
        else if (isFamilyAsst) osraRole = 'assistant_family_coordinator';

        const roleOrder = ['servant', 'assistant_family_coordinator', 'family_coordinator', 'assistant_service_coordinator', 'general_coordinator', 'admin'];
        if (roleOrder.indexOf(osraRole) > roleOrder.indexOf(highestRole)) {
          highestRole = osraRole;
        }
      }

      (osra.stages || []).forEach(stage => {
        const isStgGeneral = (stage.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
        const isStgFamily = (stage.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
        const isStgAsstFamily = (stage.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);

        if (isStgGeneral || isStgFamily || isStgAsstFamily) {
          let stageRole = 'servant';
          if (isStgGeneral) stageRole = 'general_coordinator';
          else if (isStgFamily) stageRole = 'family_coordinator';
          else if (isStgAsstFamily) stageRole = 'assistant_family_coordinator';

          const roleOrder = ['servant', 'assistant_family_coordinator', 'family_coordinator', 'assistant_service_coordinator', 'general_coordinator', 'admin'];
          if (roleOrder.indexOf(stageRole) > roleOrder.indexOf(highestRole)) {
            highestRole = stageRole;
          }
        }

        const assignments = stage.assignments || [];
      });
    });
  });

  return highestRole;
};

import Footer from '../components/Footer';
import NotificationsBell from '../components/NotificationsBell';

export default function ServantDashboard({ onSwitchToAdmin }) {
  const navigate = useNavigate();
  const determinedRole = 'servant';

  // User details local state
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [activeService, setActiveService] = useState(() => {
    return localStorage.getItem('activeService_' + (JSON.parse(localStorage.getItem('currentUser') || '{}').username || '')) || '';
  });
  const [activeStage, setActiveStage] = useState(() => {
    return localStorage.getItem('activeStage_' + (JSON.parse(localStorage.getItem('currentUser') || '{}').username || '')) || '';
  });

  // Tab Management
  const userPerms = currentUser.permissions || {};
  const hasPermission = (permKey, defaultValue = false) => {
    if (determinedRole === 'admin' || determinedRole === 'super_admin') {
      return true;
    }
    if (userPerms[permKey] !== undefined) {
      return !!userPerms[permKey];
    }
    return defaultValue;
  };

  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('servantActiveTab') || 'addWaznaTab';
    const tabPermMap = {
      addWaznaTab: 'addDirectVisitation',
      classMakhdomeenTab: 'viewMembers',
      attendanceTab: 'viewServiceTree',
      messagesTab: 'viewMessages',
      evaluationsTab: 'viewEvaluations',
      preparationsTab: 'viewPreparations',
      stPhilopateerCoreTab: 'requestPhilopateerServices',
      managePhilopateerServicesTab: 'managePhilopateerServices'
    };
    const reqPerm = tabPermMap[stored];
    if (reqPerm && !hasPermission(reqPerm)) {
      const allowed = Object.keys(tabPermMap).find(t => hasPermission(tabPermMap[t]));
      return allowed || 'settingsTab';
    }
    return stored;
  });

  useEffect(() => {
    const tabPermMap = {
      addWaznaTab: 'addDirectVisitation',
      classMakhdomeenTab: 'viewMembers',
      attendanceTab: 'viewServiceTree',
      messagesTab: 'viewMessages',
      evaluationsTab: 'viewEvaluations',
      preparationsTab: 'viewPreparations',
      stPhilopateerCoreTab: 'requestPhilopateerServices',
      managePhilopateerServicesTab: 'managePhilopateerServices'
    };
    const reqPerm = tabPermMap[activeTab];
    if (reqPerm && !hasPermission(reqPerm)) {
      const allowed = Object.keys(tabPermMap).find(t => hasPermission(tabPermMap[t]));
      setActiveTab(allowed || 'settingsTab');
    }
  }, [currentUser, activeTab]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarShowMobile, setSidebarShowMobile] = useState(false);


  // Database States
  const [selectedClassTab, setSelectedClassTab] = useState(null);
  const isRealMemberCode = (code) => {
    if (!code) return false;
    const isSystemPattern = /^(fr|hs|ahs|gc|sv|ad|usr)\d+$/i.test(code);
    return !isSystemPattern;
  };
  const [priestRecord, setPriestRecord] = useState({ priestUser: '', osras: [] });
  const [servants, setServants] = useState([]);
  const [makhdomeen, setMakhdomeen] = useState([]);
  const [waznat, setWaznat] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState('عام');
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [attendance, setAttendance] = useState([]);

  // Custom evaluations and preparations states
  const [evaluationTemplates, setEvaluationTemplates] = useState([]);
  const [servantEvaluations, setServantEvaluations] = useState([]);
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [preparations, setPreparations] = useState([]);
  const [philopateerRequestsList, setPhilopateerRequestsList] = useState([]);
  const [preparationSubmissions, setPreparationSubmissions] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [servantVisitations, setServantVisitations] = useState([]);
  const [activeCallMakhdoom, setActiveCallMakhdoom] = useState(null);
  const [selectedYearForFilter, setSelectedYearForFilter] = useState(() => {
    const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return localStorage.getItem('activeServiceYear_' + userObj.username) || new Date().getFullYear().toString();
  });
  const [serviceYearsList, setServiceYearsList] = useState([]);
  const [makhdomeenSearchQuery, setMakhdomeenSearchQuery] = useState('');
  const [stagesList, setStagesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState({});
  const [waznaSelectedWeek, setWaznaSelectedWeek] = useState('');

  
  // Attendance Tracker states
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState(null); // stores { serviceName, stageName, className }
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // Attendance Filter states
  const [filterMakhdoomName, setFilterMakhdoomName] = useState('');
  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Add Wazna Form States
  const [newWaznaServant, setNewWaznaServant] = useState(currentUser.username);
  const [newWaznaName, setNewWaznaName] = useState('');
  const [newWaznaPhone, setNewWaznaPhone] = useState('');
  const [newWaznaAddress, setNewWaznaAddress] = useState('');
  const [newWaznaOsra, setNewWaznaOsra] = useState(currentUser.osra || '');
  const [newWaznaFasl, setNewWaznaFasl] = useState('');
  const [newWaznaType, setNewWaznaType] = useState('افتقاد');
  const [newWaznaNotes, setNewWaznaNotes] = useState('');
  const [newWaznaDate, setNewWaznaDate] = useState(new Date().toISOString().split('T')[0]);

  // Chat States
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef(null);

  // Settings Form States
  const [settingsName, setSettingsName] = useState(currentUser.name || '');
  const [settingsUsername, setSettingsUsername] = useState(currentUser.username || '');
  const [settingsEmail, setSettingsEmail] = useState(currentUser.email || '');
  const [settingsChurch, setSettingsChurch] = useState(currentUser.church || '');
  const [settingsPassword, setSettingsPassword] = useState(currentUser.password || '');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Socket
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('servantActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    setSettingsName(currentUser.name || '');
    setSettingsUsername(currentUser.username || '');
    setSettingsEmail(currentUser.email || '');
    setSettingsChurch(currentUser.church || '');
    setSettingsPassword(currentUser.password || '');
  }, [currentUser.username, currentUser.name, currentUser.email, currentUser.church, currentUser.password]);



  useEffect(() => {
    fetchInitialData();

    if (window.io) {
      const socket = window.io();
      socketRef.current = socket;

      let debounceTimer;
      const debouncedFetch = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchInitialData();
        }, 1500);
      };

      socket.on('data-changed', debouncedFetch);

      return () => {
        socket.disconnect();
        clearTimeout(debounceTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'messagesTab') {
      scrollToBottom();
    }
  }, [chatMessages, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMergedUserPermissions = (user, services, jobs, currentActiveService) => {
    const basePermissions = { ...(user.permissions || {}) };
    const usernameLower = (user.username || '').toLowerCase();
    const activeServiceLower = (currentActiveService || '').toLowerCase();
    
    (services || []).forEach(srv => {
      (srv.osras || []).forEach(osra => {
        if (activeServiceLower && osra.name.toLowerCase() !== activeServiceLower) {
          return;
        }
        (osra.stages || []).forEach(stage => {
          (stage.assignments || []).forEach(assign => {
            if ((assign.username || '').toLowerCase() === usernameLower) {
              const job = (jobs || []).find(j => j.id === assign.jobId);
              if (job && job.permissions) {
                Object.keys(job.permissions).forEach(k => {
                  if (job.permissions[k] === true) {
                    basePermissions[k] = true;
                  }
                });
              }
            }
          });
        });
      });
    });
    
    return basePermissions;
  };

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      if (response.ok) {
        const currentPerms = currentUser.permissions || {};
        if (currentPerms.managePhilopateerServices || currentPerms.requestPhilopateerServices) {
          try {
            const url = currentPerms.managePhilopateerServices 
              ? '/api/philopateer/requests' 
              : `/api/philopateer/requests?requesterUsername=${currentUser.username}`;
            const philRes = await fetch(url);
            const philData = await philRes.json();
            if (philRes.ok && philData.success) {
              setPhilopateerRequestsList(philData.requests || []);
            }
          } catch (e) {
            console.error('Error loading Philopateer requests:', e);
          }
        }

        // Sync currentUser permissions if user updated in backend
        if (data.users) {
          const freshUser = data.users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (freshUser) {
            const correctRole = resolveFrontendDynamicRole(freshUser, data.priestServices, data.jobs);
            const currentActiveSrv = freshUser.activeService || currentUser.activeService || activeService;
            const mergedPerms = getMergedUserPermissions(freshUser, data.priestServices, data.jobs, currentActiveSrv);
            const mergedUser = {
              ...freshUser,
              role: currentUser.role || freshUser.role || correctRole,
              activeRole: determinedRole,
              activeService: currentUser.activeService || activeService,
              activeStage: currentUser.activeStage || activeStage,
              activeClass: currentUser.activeClass,
              permissions: mergedPerms
            };
            localStorage.setItem('currentUser', JSON.stringify(mergedUser));
            setCurrentUser(mergedUser);
          }
        }

        // Find priestRecord mapped to this servant
        const priestRecordObj = (data.priestServices || []).find(r => 
          (r.osras || []).some(o => 
            o.years && Object.values(o.years).some(y => y.servants && Object.keys(y.servants).some(k => k.toLowerCase() === currentUser.username.toLowerCase()))
          )
        ) || { priestUser: '', osras: [] };
        setPriestRecord(priestRecordObj);

        // Load makhdomeen
        setMakhdomeen(data.makhdomeen || []);

        // Load waznat
        setWaznat(data.waznat || []);

        setServices(data.priestServices || []);
        fetchAttendance();

        // Filter servants belonging to this church
        const filteredServants = (data.servants || []).filter(s => s.church === currentUser.church);
        setServants(filteredServants);

        // Load deadlines set by this priest
        if (priestRecordObj.priestUser && data.deadlines) {
          setDeadlines(data.deadlines[priestRecordObj.priestUser] || []);
        }

        // Load chat messages
        setChatMessages(data.chat_messages || []);

        // Load custom evaluations and preparations
        setEvaluationTemplates(data.evaluationTemplates || []);
        setServantEvaluations(data.servantEvaluations || []);
        setPreparations(data.preparations || []);
        setPreparationSubmissions(data.preparationSubmissions || []);
        setServantVisitations(data.servantVisitations || []);

        try {
          const yearsRes = await fetch('/api/service-years');
          const yearsData = await yearsRes.json();
          if (yearsRes.ok && yearsData.success) {
            setServiceYearsList(yearsData.serviceYears || []);
          }
          const stagesRes = await fetch('/api/stages-list');
          const stagesData = await stagesRes.json();
          if (stagesRes.ok && stagesData.success) {
            setStagesList(stagesData.stagesList || []);
          }
          const servicesRes = await fetch('/api/services');
          const servicesData = await servicesRes.json();
          if (servicesRes.ok && servicesData.success) {
            setServicesList(servicesData.services || []);
          }
        } catch (yrErr) {
          console.error(yrErr);
        }
      }
    } catch (e) {
      console.error('Error fetching servant dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPendingMember = async (memberId, targetStageName) => {
    if (!targetStageName) {
      window.customAlert('يرجى اختيار المرحلة أولاً!');
      return;
    }
    const member = makhdomeen.find(m => m.id === memberId || m._id === memberId);
    if (!member) return;

    try {
      const response = await fetch(`/api/makhdomeen/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...member,
          osra: currentUser.osra,
          stage: targetStageName,
          fasl: '',
          pendingPromotionFrom: ''
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        window.customAlert('تم تسكين المخدوم بنجاح! ✝');
        fetchData();
      } else {
        window.customAlert(data.message || 'فشل تسكين المخدوم.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      if (res.ok && data.success) {
        setAttendance(data.attendance || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getServantClasses = () => {
    try {
      const list = [];
      services.forEach(s => {
        (s.osras || []).forEach(o => {
          if (o.name !== activeService) return;
          if (o.stages) {
            o.stages.forEach(stg => {
              if (activeStage && stg.name !== activeStage) return;
              const hasStageAssignment = (stg.assignments || []).some(a => (a.username || '').toLowerCase() === (currentUser?.username || '').toLowerCase());
              if (stg.classes) {
                stg.classes.forEach(c => {
                  const isClassServant = c.servants && c.servants.map(x => x ? x.toLowerCase() : '').includes((currentUser?.username || '').toLowerCase());
                  const isAssignedToThisClass = (stg.assignments || []).some(a => 
                    (a.username || '').toLowerCase() === (currentUser?.username || '').toLowerCase() && 
                    (a.className || '').toLowerCase() === (c.name || '').toLowerCase()
                  );
                  
                  if (isClassServant || isAssignedToThisClass || hasStageAssignment) {
                    list.push({ serviceName: o.name, stageName: stg.name, className: c.name });
                  }
                });
              }
            });
          }
        });
      });
      return list;
    } catch (e) {
      console.error("Error in getServantClasses:", e);
      return [];
    }
  };

  const getWeeksForServiceDay = (yearStr, serviceDayName) => {
    const year = parseInt(yearStr) || new Date().getFullYear();
    const daysMap = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6
    };
    const targetDay = daysMap[serviceDayName] !== undefined ? daysMap[serviceDayName] : 5; // default Friday
    const weeks = [];
    const start = new Date(year, 0, 1);
    while (start.getFullYear() === year) {
      if (start.getDay() === targetDay) {
        const yyyy = start.getFullYear();
        const mm = String(start.getMonth() + 1).padStart(2, '0');
        const dd = String(start.getDate()).padStart(2, '0');
        weeks.push(`${yyyy}-${mm}-${dd}`);
      }
      start.setDate(start.getDate() + 1);
    }
    return weeks.reverse(); // Latest weeks first
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const getServantServiceDay = () => {
    const servantClasses = getServantClasses();
    const servantServices = [...new Set(servantClasses.map(c => c.serviceName))];
    if (servantServices.length === 0) return 'Friday';
    
    let serviceDay = 'Friday';
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === new Date().getFullYear().toString()) {
        (record.osras || []).forEach(o => {
          if (servantServices.includes(o.name) && o.serviceDay) {
            serviceDay = o.serviceDay;
          }
        });
      }
    });
    return serviceDay;
  };

  const handleSelectPrepFile = (e, preparationId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      window.customAlert("الرجاء اختيار ملف بصيغة PDF فقط!");
      return;
    }
    setSelectedFiles(prev => ({
      ...prev,
      [preparationId]: file
    }));
  };

  const handleConfirmUpload = async (preparationId) => {
    const file = selectedFiles[preparationId];
    if (!file) {
      window.customAlert("الرجاء اختيار ملف أولاً!");
      return;
    }

    const getBase64 = (fileObj) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });

    try {
      const base64Data = await getBase64(file);
      const response = await fetch('/api/preparations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preparationId,
          servantUsername: currentUser.username,
          servantName: currentUser.name,
          fileName: file.name,
          fileData: base64Data
        })
      });
      if (response.ok) {
        window.customAlert("تم رفع التحضير بنجاح! ✝");
        setSelectedFiles(prev => {
          const copy = { ...prev };
          delete copy[preparationId];
          return copy;
        });
        fetchInitialData();
      } else {
        window.customAlert("فشل رفع التحضير.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewPdf = (base64Data, fileName) => {
    if (base64Data && (base64Data.startsWith('http') || base64Data.startsWith('/') || base64Data.startsWith('./'))) {
      window.open(base64Data, '_blank');
      return;
    }
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(
        `<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      newTab.document.title = fileName;
    } else {
      window.customAlert("الرجاء السماح للنوافذ المنبثقة (Popups) لعرض ملف الـ PDF.");
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedAttendanceClass || !attendanceDate) {
      window.customAlert('الرجاء اختيار الفصل وتحديد التاريخ!');
      return;
    }
    setAttendanceSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: selectedAttendanceClass.serviceName,
          className: selectedAttendanceClass.className,
          date: attendanceDate,
          records: attendanceRecords
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.customAlert('تم حفظ كشف الحضور والغياب بنجاح! ✝');
        fetchAttendance();
      } else {
        window.customAlert(data.message || 'فشل حفظ الكشف.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء حفظ كشف الحضور.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const activeDeadlines = deadlines.filter(d => {
    const dlDateTime = new Date(`${d.date}T${d.time}`);
    return dlDateTime > new Date();
  });

  const getRoleArabicName = (r) => {
    if (r === 'admin') return 'أدمن';
    if (r === 'priest') return 'كاهن';
    if (r === 'coordinator') return 'أمين خدمة';
    if (r === 'assistant_coordinator') return 'مساعد أمين خدمة';
    if (r === 'family_coordinator') return 'أمين أسرة';
    if (r === 'assistant_family_coordinator') return 'مساعد أمين أسرة';
    if (r === 'general_coordinator') return 'أمين عام الخدمة';
    return 'خادم';

  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleAddWazna = async (e) => {
    e.preventDefault();
    if (!newWaznaName.trim()) {
      window.customAlert('الرجاء كتابة اسم المخدوم!');
      return;
    }

    const newWaznaObj = {
      id: Date.now() + Math.random().toString(),
      servantUser: currentUser.username,
      osra: newWaznaOsra,
      fasl: newWaznaFasl,
      name: newWaznaName.trim(),
      phone: newWaznaPhone.trim(),
      address: newWaznaAddress.trim(),
      type: newWaznaType,
      notes: newWaznaNotes.trim(),
      date: newWaznaDate,
      checked: false,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'waznat', data: [...waznat, newWaznaObj] }),
      });
      if (response.ok) {
        setWaznat([...waznat, newWaznaObj]);
        setNewWaznaName('');
        setNewWaznaPhone('');
        setNewWaznaAddress('');
        setNewWaznaNotes('');
        window.customAlert('تم تسجيل الافتقاد بنجاح! ✝');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartCall = (makhdoom) => {
    setActiveCallMakhdoom(makhdoom);
    const phone = makhdoom.phone || makhdoom.phoneNumber || '';
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      window.customAlert("لا يوجد رقم هاتف مسجل لهذا المخدوم!");
    }
  };

  const handleSaveVisitation = async (result) => {
    if (!activeCallMakhdoom) return;
    const waznaWeeksList = getWeeksForServiceDay(new Date().getFullYear().toString(), getServantServiceDay());
    const selectedWeek = waznaSelectedWeek || waznaWeeksList[0] || '';
    
    try {
      const res = await fetch('/api/servant-visitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servantUsername: currentUser.username,
          makhdoomId: activeCallMakhdoom.id || activeCallMakhdoom._id,
          makhdoomName: activeCallMakhdoom.name,
          result,
          weekDate: selectedWeek,
          date: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.customAlert("تم تسجيل نتيجة الاتصال بنجاح! ✝");
        setActiveCallMakhdoom(null);
        fetchInitialData();
      } else {
        window.customAlert("حدث خطأ أثناء حفظ النتيجة.");
      }
    } catch (e) {
      console.error(e);
      window.customAlert("حدث خطأ في الاتصال بالخادم.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      senderName: currentUser.name,
      senderUser: currentUser.username,
      senderRole: currentUser.role,
      message: newMessageText.trim(),
      channel: activeChannel,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'chat_messages', data: [...chatMessages, newMsg] }),
      });
      if (response.ok) {
        setChatMessages([...chatMessages, newMsg]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (!settingsName.trim() || !settingsUsername.trim() || !settingsChurch.trim()) {
      setSettingsError('الرجاء إدخال كافة البيانات المطلوبة!');
      return;
    }




    setUpdatingSettings(true);

    try {
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-username': currentUser.username
        },
        body: JSON.stringify({
          oldUsername: currentUser.username,
          name: settingsName.trim(),
          username: settingsUsername.trim().toLowerCase(),
          email: settingsEmail ? settingsEmail.trim() : '',
          church: settingsChurch.trim(),
          password: settingsPassword
        }),
      });


      const result = await response.json();
      if (response.ok && result.success) {
        setSettingsSuccess('تم تحديث البيانات بنجاح! ✝');
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        setCurrentUser(result.user);
        fetchInitialData();
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

  const myWaznat = waznat.filter(w => (w.servantUser || '').toLowerCase() === (currentUser.username || '').toLowerCase());

  const getMyServicesListObjects = () => {
    const list = [];
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(o => {
          const isAssigned = 
            (o.coordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
            (o.assistantCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
            (o.familyCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
            (o.assistantFamilyCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
            (o.stages || []).some(st => 
              (st.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
              (st.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
              (st.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
              (st.assignments || []).some(a => (a.username || '').toLowerCase() === (currentUser.username || '').toLowerCase()) ||
              (st.classes || []).some(c => c.servants && c.servants.map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()))
            );
          if (isAssigned && !list.some(item => item.name === o.name)) {
            list.push(o);
          }
        });
      }
    });
    return list;
  };

  const getUserStagesInOsra = (o) => {
    const stageNames = [];
    const isPriest = currentUser.role === 'priest';
    (o.stages || []).forEach(st => {
      const isAssigned = isPriest || 
        (st.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
        (st.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
        (st.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
        (st.assignments || []).some(a => (a.username || '').toLowerCase() === (currentUser.username || '').toLowerCase()) ||
        (st.classes || []).some(c => c.servants && c.servants.map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()));
      
      if (isAssigned) {
        stageNames.push(st.name);
      }
    });
    return stageNames;
  };

  if (!activeService) {
    const myServices = getMyServicesListObjects();
    return (
      <div id="authSection" data-auth-theme="dark" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="auth-cross-watermark" style={{ top: '10%', left: '5%', fontSize: '100px' }}>✝</div>
        <div className="auth-cross-watermark" style={{ top: '65%', left: '82%', fontSize: '120px' }}>✝</div>
        <div className="auth-cross-watermark" style={{ top: '35%', left: '88%', fontSize: '70px' }}>✝</div>
        <div className="auth-cross-watermark" style={{ top: '80%', left: '10%', fontSize: '90px' }}>✝</div>

        <div className="auth-glass-card p-5 text-center" style={{ maxWidth: '900px', width: '100%', borderRadius: '24px' }}>
          <div className="church-icon mb-4">
            <img src="/logo-removebg-preview.png" alt="شعار الكنيسة" className="church-logo-img" style={{ width: '80px', height: '80px' }} />
          </div>
          <h2 className="text-warning fw-bold mb-2">مرحباً بك يا {currentUser.name} ✝</h2>
          <p className="text-muted mb-4">الرجاء اختيار الخدمة للبدء في استخدام النظام:</p>
          
          {myServices.length > 0 ? (
            <div className="row g-4 justify-content-center">
              {myServices.map(o => (
                <div className="col-md-6 col-lg-4" key={o.name}>
                  <div 
                    className="card h-100 text-center service-select-card cursor-pointer"
                    style={{ transition: 'all 0.3s ease', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '16px' }}
                    onClick={() => {
                      localStorage.setItem('activeService_' + currentUser.username, o.name);
                      setActiveService(o.name);
                      
                      // Auto-set stage if they are only assigned to 1 stage
                      const stages = getUserStagesInOsra(o);
                      if (stages.length === 1) {
                        localStorage.setItem('activeStage_' + currentUser.username, stages[0]);
                        setActiveStage(stages[0]);
                      }
                    }}
                  >
                    <div className="card-body py-4">
                      <div className="service-icon-circle mb-3 mx-auto" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-church text-warning fa-lg"></i>
                      </div>
                      <h5 className="fw-bold mb-2 text-primary">{o.name}</h5>
                      <span className="badge bg-warning text-dark mb-1">يوم {o.serviceDay === 'Friday' ? 'الجمعة' : o.serviceDay}</span>
                      <p className="text-muted small mb-0 mt-2">
                        المراحل التابع لها: {getUserStagesInOsra(o).join('، ') || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {['admin', 'super_admin'].includes(currentUser.role) && (
                <div className="col-md-6 col-lg-4">
                  <div 
                    className="card h-100 text-center service-select-card cursor-pointer"
                    style={{ transition: 'all 0.3s ease', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '16px' }}
                    onClick={() => {
                      if (typeof onSwitchToAdmin === 'function') {
                        onSwitchToAdmin();
                      } else {
                        window.location.href = currentUser.role === 'super_admin' ? '/super-admin' : '/admin';
                      }
                    }}
                  >
                    <div className="card-body py-4 d-flex flex-column align-items-center justify-content-center">
                      <div className="service-icon-circle mb-3 mx-auto" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-desktop text-warning fa-lg"></i>
                      </div>
                      <h5 className="fw-bold mb-2 text-warning">النظام</h5>
                      <p className="text-muted small mb-0 mt-2">
                        الدخول للنظام بكافة الصلاحيات وإدارة الكنيسة.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-danger py-4 fw-bold">لم يتم توزيعك في أي خدمة بعد في شجرة الخدمة لسنة {selectedYearForFilter} ✝</p>
              <button className="btn btn-danger btn-sm w-100 py-2" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i> تسجيل الخروج
            </button>
          </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="wrapper">
        {sidebarShowMobile && (
          <div className="sidebar-backdrop show" onClick={() => setSidebarShowMobile(false)}></div>
        )}

        {/* Sidebar */}
        <nav id="sidebar" className={`${sidebarShowMobile ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={true} />
            <div className="text-center mt-2">
              <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{currentUser.name}</h5>
              <small className="church-name-sidebar" style={{ fontSize: '0.8rem' }}>{currentUser.church}</small>
            </div>
          </div>
          
          <ul className="list-unstyled components mb-5">
            {hasPermission('addDirectVisitation') && (
              <li className={activeTab === 'addWaznaTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('addWaznaTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-hand-holding-heart"></i> الافتقاد والوزنات
                </a>
              </li>
            )}
            {hasPermission('viewMembers') && (
              <li className={activeTab === 'classMakhdomeenTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('classMakhdomeenTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-users"></i> مخدومين الفصل
                </a>
              </li>
            )}
            {hasPermission('viewServiceTree') && (
              <li className={activeTab === 'attendanceTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('attendanceTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-clipboard-list"></i> الغياب والحضور
                </a>
              </li>
            )}
            {hasPermission('viewPreparations') && (
              <li className={activeTab === 'preparationsTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('preparationsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-book-open"></i> تحضير الدروس
                </a>
              </li>
            )}
            {hasPermission('viewEvaluations') && (
              <li className={activeTab === 'evaluationsTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('evaluationsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-star"></i> التقييمات
                </a>
              </li>
            )}
            {hasPermission('viewMessages') && (
              <li className={activeTab === 'messagesTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('messagesTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-envelope"></i> الرسائل
                </a>
              </li>
            )}
            {hasPermission('requestPhilopateerServices') && !hasPermission('managePhilopateerServices') && (
              <li className={activeTab === 'stPhilopateerCoreTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('stPhilopateerCoreTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-broadcast-tower"></i>
                  <span className="menu-text">st-philopateer-core</span>
                </a>
              </li>
            )}
            {hasPermission('managePhilopateerServices') && (
              <li className={activeTab === 'managePhilopateerServicesTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('managePhilopateerServicesTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }} className="d-flex align-items-center justify-content-between">
                  <i className="fas fa-tasks"></i>
                  <span className="menu-text">إدارة طلبات سان فيلوباتير</span>
                  {philopateerRequestsList.filter(r => !r.seen).length > 0 && (
                    <span className="badge bg-danger rounded-circle font-monospace ms-2" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      {philopateerRequestsList.filter(r => !r.seen).length}
                    </span>
                  )}
                </a>
              </li>
            )}
            <li className={activeTab === 'settingsTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('settingsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-cog"></i> الإعدادات
              </a>
            </li>
            <li style={{ borderTop: '1px solid rgba(201, 168, 76, 0.2)', marginTop: '10px', paddingTop: '5px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/login'; }} style={{ color: 'var(--gold-accent, #f4e3b5)' }}>
                <i className="fas fa-exchange-alt"></i> تبديل الخدمة
              </a>
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
              <h5 className="mb-0 fw-bold text-white d-none d-md-inline" id="topBarChurchName" style={{fontFamily: 'Cairo, sans-serif'}}>{currentUser.church}</h5>
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

              {/* 3. Notifications Bell (Circle) */}
              <div style={{ background: '#fff', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <NotificationsBell user={currentUser} onNavigateTab={(tab) => { if (tab === 'waznatTab' || tab === 'waznaTab') setActiveTab('addWaznaTab'); else setActiveTab(tab); }} />
              </div>

              {/* 4. Old Logo / Profile Pic (Circle, Leftmost) */}
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo-removebg-preview.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/coptic_cross_final.png' }} />
              </div>
            </div>

          </div>
        </nav>

        {/* Main Dashboard Content */}
        <div className="container-fluid p-4">
          {activeDeadlines.length > 0 && (
<div className="alert alert-warning border border-warning shadow-sm mb-4 d-flex align-items-center gap-3" style={{ backgroundColor: 'rgba(255,193,7,0.1)' }}>
              <span style={{ fontSize: '1.5rem' }}>⏰</span>
              <div>
                <h6 className="fw-bold mb-1 text-warning">تنبيه لتسليم الوزنات!</h6>
                <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                  الميعاد الأقصى لتسليم افتقاد الخدمة هو: <strong>{activeDeadlines[0].date}</strong> في تمام الساعة <strong>{activeDeadlines[0].time}</strong>.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="mt-3 text-warning">جاري المزامنة وجلب البيانات الخدمية...</p>
            </div>
          ) : (
            <div className="fade-in">
              {activeTab === 'addWaznaTab' && (() => {
                const myClasses = getServantClasses();
                const assignedMakhdomeen = makhdomeen.filter(m => {
                  if (m.serviceYear !== selectedYearForFilter) return false;
                  if (m.osra !== activeService || m.stage !== activeStage) return false;
                  if (m.assignedServant) {
                    return m.assignedServant.toLowerCase() === currentUser.username.toLowerCase();
                  }
                  // Fallback: If no direct servant assigned, show all class servants
                  return myClasses.some(c => c.serviceName === m.osra && c.stageName === m.stage && c.className === m.fasl);
                });
                
                const getWaznaTargetDay = () => {
                  const visTemplate = (evaluationTemplates || []).find(t => t.type === 'visitation');
                  if (visTemplate && visTemplate.targetDay) {
                    return visTemplate.targetDay;
                  }
                  return getServantServiceDay();
                };

                const selectedWeek = getWeeksForServiceDay(new Date().getFullYear().toString(), getWaznaTargetDay())[0] || '';

                return (
                  <div className="row g-4">
                    {/* Makhdomeen (الوزنات) table */}
                    <div className="col-12">
                      {/* Makhdomeen (الوزنات) Table Card */}
                      <div className="card shadow mb-4">
                        <div className="card-header py-3" style={{ backgroundColor: 'rgba(201,168,76,0.06)' }}>
                          <h6 className="mb-0 fw-bold text-warning">
                            <i className="fas fa-hand-holding-heart me-2"></i> المخدومين المسؤول عنهم (الوزنات) ✝
                          </h6>
                        </div>
                        <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                          {assignedMakhdomeen.length === 0 ? (
                            <p className="text-muted text-center py-5 mb-0 small">لم يتم تعيين وزنات مخصصة لك بعد.</p>
                          ) : (
                            <div className="table-responsive">
                              <table className="table align-middle text-center small mb-0 table-striped table-bordered text-start">
                                <thead className="table-dark">
                                  <tr>
                                    <th>#</th>
                                    <th>الاسم</th>
                                    <th>حالة الافتقاد</th>
                                    <th>رقم الهاتف</th>
                                    <th>الإجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {assignedMakhdomeen.map((m, idx) => {
                                    const visit = (servantVisitations || []).find(v => v.servantUsername === currentUser.username && v.makhdoomId === (m.id || m._id) && v.weekDate === selectedWeek);
                                    return (
                                      <tr key={m.id || m._id}>
                                        <td>{idx + 1}</td>
                                        <td className="fw-bold text-start">
                                          {m.name}
                                        </td>
                                        <td>
                                          {visit ? (
                                            visit.result === 'answered' ? (
                                              <span className="badge bg-success fs-6 px-3 py-2 fw-bold shadow-sm">
                                                <i className="fas fa-check-circle me-1"></i> تم الرد
                                              </span>
                                            ) : visit.result === 'no_answer' ? (
                                              <span className="badge bg-warning text-dark fs-6 px-3 py-2 fw-bold shadow-sm">
                                                <i className="fas fa-phone-slash me-1"></i> لم يرد
                                              </span>
                                            ) : (
                                              <span className="badge bg-danger fs-6 px-3 py-2 fw-bold shadow-sm">
                                                <i className="fas fa-times-circle me-1"></i> ملغي
                                              </span>
                                            )
                                          ) : (
                                            <span className="badge bg-secondary fs-6 px-3 py-2 fw-bold text-white-50">
                                              لم يُفتقد بعد
                                            </span>
                                          )}
                                        </td>
                                        <td className="font-monospace">{m.phone || m.phoneNumber || '-'}</td>
                                        <td>
                                          <div className="d-flex gap-1 justify-content-center">
                                            <button
                                              type="button"
                                              className="btn btn-sm py-1 px-3 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                                              style={{
                                                backgroundColor: '#8f1d2c',
                                                borderColor: '#8f1d2c',
                                                color: '#ffffff',
                                                borderRadius: '20px',
                                                fontSize: '0.82rem',
                                                transition: 'all 0.2s',
                                              }}
                                              onClick={() => handleStartCall(m)}
                                            >
                                              <i className="fas fa-phone-alt"></i> اتصال
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB: CLASS MAKHDOMEEN */}
              {activeTab === 'classMakhdomeenTab' && (() => {
                const myClasses = getServantClasses();
                const classMakhdomeenList = makhdomeen.filter(m => 
                  m.serviceYear === selectedYearForFilter &&
                  m.osra === activeService &&
                  m.stage === activeStage
                );
                
                const filteredMakhdomeen = classMakhdomeenList.filter(m => 
                  (m.name || '').toLowerCase().includes((makhdomeenSearchQuery || '').toLowerCase()) ||
                  (m.phone || m.phoneNumber || '').includes(makhdomeenSearchQuery || '')
                );

                return (
                  <div className="fade-in">
                    <div className="card shadow mb-4">
                      <div className="card-header py-3 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ backgroundColor: 'rgba(201,168,76,0.06)' }}>
                        <h6 className="mb-0 fw-bold text-warning">
                          <i className="fas fa-users me-2"></i> مخدومين المرحلة ({activeStage || 'كل المراحل'}) ✝
                        </h6>
                        <div className="input-group input-group-sm" style={{ maxWidth: '250px' }}>
                          <input
                            type="text"
                            className="form-control bg-dark border-secondary text-white"
                            placeholder="بحث باسم المخدوم أو الهاتف..."
                            value={makhdomeenSearchQuery}
                            onChange={(e) => setMakhdomeenSearchQuery(e.target.value)}
                          />
                          <span className="input-group-text bg-dark text-warning border-secondary"><i className="fas fa-search"></i></span>
                        </div>
                      </div>
                      <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredMakhdomeen.length === 0 ? (
                          <p className="text-muted text-center py-5 mb-0 small">لا يوجد مخدومين مسجلين في هذه المرحلة حالياً.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table align-middle text-center small mb-0 table-striped table-bordered">
                              <thead className="table-dark">
                                <tr>
                                  <th>#</th>
                                  <th>الاسم</th>
                                  <th>الفصل</th>
                                  <th>رقم الهاتف</th>
                                  <th>المنطقة</th>
                                  <th>الشارع</th>
                                  <th>رقم العمارة</th>
                                  <th>الدور</th>
                                  <th>رقم الشقة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMakhdomeen.map((m, idx) => (
                                  <tr key={m.id || m._id}>
                                    <td>{idx + 1}</td>
                                    <td className="fw-bold text-start">{m.name}</td>
                                    <td><span className="badge bg-secondary">{m.fasl || 'غير محدد'}</span></td>
                                    <td className="font-monospace">{m.phone || m.phoneNumber || '-'}</td>
                                    <td>{m.area || '-'}</td>
                                    <td>{m.street || '-'}</td>
                                    <td>{m.building || '-'}</td>
                                    <td>{m.floor || '-'}</td>
                                    <td>{m.apartment || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB: ATTENDANCE TRACKER */}
              {activeTab === 'attendanceTab' && (() => {
                const myClasses = getServantClasses();
                
                // Set default selected class if not set
                if (!selectedAttendanceClass && myClasses.length > 0) {
                  setSelectedAttendanceClass(myClasses[0]);
                  // Load records for first class if exist
                  const existing = attendance.find(a => 
                    a.serviceName === myClasses[0].serviceName && 
                    a.className === myClasses[0].className && 
                    a.date === attendanceDate
                  );
                  setAttendanceRecords(existing ? existing.records : {});
                }

                const currentClassMakhdomeen = selectedAttendanceClass 
                  ? makhdomeen.filter(m => m.osra === selectedAttendanceClass.serviceName && m.fasl === selectedAttendanceClass.className)
                  : [];

                // Filter attendance logs
                const attendanceLogs = [];
                attendance.forEach(a => {
                  if (selectedAttendanceClass && a.serviceName === selectedAttendanceClass.serviceName && a.className === selectedAttendanceClass.className) {
                    Object.entries(a.records || {}).forEach(([mId, status]) => {
                      const m = makhdomeen.find(x => x.id === mId || x._id === mId);
                      if (m) {
                        // Apply filters
                        const nameMatches = !filterMakhdoomName || m.name.includes(filterMakhdoomName);
                        const statusMatches = filterAttendanceStatus === 'all' || status === filterAttendanceStatus;
                        const dateAfter = !filterStartDate || a.date >= filterStartDate;
                        const dateBefore = !filterEndDate || a.date <= filterEndDate;

                        if (nameMatches && statusMatches && dateAfter && dateBefore) {
                          attendanceLogs.push({
                            id: `${a.id}-${mId}`,
                            date: a.date,
                            makhdoomName: m.name,
                            status: status === 'present' ? 'حضور' : status === 'absent' ? 'غياب' : 'اعتذار',
                            statusColor: status === 'present' ? 'bg-success' : status === 'absent' ? 'bg-danger' : 'bg-secondary'
                          });
                        }
                      }
                    });
                  }
                });

                // Sort logs by date descending
                attendanceLogs.sort((x, y) => y.date.localeCompare(x.date));

                return (
                  <div className="row">
                    {/* Record Attendance Card */}
                    <div className="col-lg-6 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-clipboard-list me-2"></i> تسجيل كشف الحضور والغياب</h5>
                        </div>
                        <div className="card-body">
                          {myClasses.length === 0 ? (
                            <p className="text-muted text-center py-4">أنت غير معين في أي فصل حالياً.</p>
                          ) : (
                            <form onSubmit={handleSaveAttendance}>
                              <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                  <label className="form-label">الفصل النشط</label>
                                  <div className="form-control bg-dark border-secondary text-warning fw-bold text-center">
                                    {selectedAttendanceClass ? `${selectedAttendanceClass.className} (${selectedAttendanceClass.stageName})` : '-'}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label">تاريخ الكشف</label>
                                  <input 
                                    type="date"
                                    className="form-control"
                                    value={attendanceDate}
                                    onChange={(e) => {
                                      const date = e.target.value;
                                      setAttendanceDate(date);
                                      if (selectedAttendanceClass) {
                                        const existing = attendance.find(a => 
                                          a.serviceName === selectedAttendanceClass.serviceName && 
                                          a.className === selectedAttendanceClass.className && 
                                          a.date === date
                                        );
                                        setAttendanceRecords(existing ? existing.records : {});
                                      }
                                    }}
                                  />
                                </div>
                              </div>

                              <h6 className="text-warning fw-bold mb-3 border-bottom pb-2">قائمة المخدومين في الفصل ({currentClassMakhdomeen.length})</h6>
                              {currentClassMakhdomeen.length === 0 ? (
                                <p className="text-muted text-center py-3">لا يوجد مخدومين مسجلين في هذا الفصل.</p>
                              ) : (
                                <div className="overflow-auto border mb-3 p-2" style={{ maxHeight: '350px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                                  {currentClassMakhdomeen.map(m => {
                                    const mId = m.id || m._id;
                                    const currentStatus = attendanceRecords[mId] || '';

                                    return (
                                      <div key={mId} className="p-2 border-bottom border-secondary d-flex flex-wrap align-items-center justify-content-between gap-2">
                                        <span className="fw-bold small">{m.name}</span>
                                        <div className="btn-group btn-group-sm" role="group">
                                          <button
                                            type="button"
                                            className={`btn btn-xs ${currentStatus === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                                            onClick={() => setAttendanceRecords({ ...attendanceRecords, [mId]: 'present' })}
                                          >
                                            حضور
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn btn-xs ${currentStatus === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                            onClick={() => setAttendanceRecords({ ...attendanceRecords, [mId]: 'absent' })}
                                          >
                                            غياب
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn btn-xs ${currentStatus === 'excused' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                            onClick={() => setAttendanceRecords({ ...attendanceRecords, [mId]: 'excused' })}
                                          >
                                            اعتذار
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {currentClassMakhdomeen.length > 0 && (
                                <button type="submit" className="btn btn-warning w-100 py-2" disabled={attendanceSaving}>
                                  {attendanceSaving ? 'جاري حفظ الكشف...' : 'حفظ كشف الحضور والغياب ✝'}
                                </button>
                              )}
                            </form>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Logs & Filters */}
                    <div className="col-lg-6">
                      <div className="card shadow mb-4">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-search me-2"></i> سجلات وفلاتر حضور المخدومين</h5>
                        </div>
                        <div className="card-body">
                          {/* Filter Inputs */}
                          <div className="row g-2 mb-3">
                            <div className="col-md-6">
                              <input 
                                type="text"
                                className="form-control form-control-sm"
                                value={filterMakhdoomName}
                                onChange={(e) => setFilterMakhdoomName(e.target.value)}
                              />
                            </div>
                            <div className="col-md-6">
                              <select 
                                className="form-select form-select-sm"
                                value={filterAttendanceStatus}
                                onChange={(e) => setFilterAttendanceStatus(e.target.value)}
                              >
                                <option value="all">كل الحالات</option>
                                <option value="present">حضور فقط</option>
                                <option value="absent">غياب فقط</option>
                                <option value="excused">اعتذار فقط</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="small text-white-50">من تاريخ</label>
                              <input 
                                type="date"
                                className="form-control form-control-sm"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="small text-white-50">إلى تاريخ</label>
                              <input 
                                type="date"
                                className="form-control form-control-sm"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Logs Table */}
                          {attendanceLogs.length === 0 ? (
                            <p className="text-muted text-center py-4 small">لا توجد سجلات حضور مطابقة للفلاتر.</p>
                          ) : (
                            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                              <table className="table align-middle table-sm text-center">
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th className="text-start">اسم المخدوم</th>
                                    <th>التاريخ</th>
                                    <th>الحالة</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attendanceLogs.map(log => (
                                    <tr key={log.id}>
                                      <td className="text-start fw-bold small">{log.makhdoomName}</td>
                                      <td><code>{log.date}</code></td>
                                      <td>
                                        <span className={`badge ${log.statusColor}`}>{log.status}</span>
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
                );
              })()}

              {/* TAB 2: MESSAGES */}
              {activeTab === 'messagesTab' && (
                <div className="row justify-content-center">
                  <div className="col-md-4">
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h6 className="mb-0 fw-bold text-warning"><i className="fas fa-hashtag me-2"></i> غرف الدردشة</h6>
                      </div>
                      <div className="list-group list-group-flush">
                        <button
                          type="button"
                          className={`list-group-item list-group-item-action bg-transparent border-bottom border-secondary d-flex align-items-center gap-2 ${activeChannel === 'عام' ? 'active' : ''}`}
                          onClick={() => setActiveChannel('عام')}
                        >
                          📢 دردشة الكنيسة العامة
                        </button>
                        {priestRecord.osras.map(o => (
                          <button
                            key={o.name}
                            type="button"
                            className={`list-group-item list-group-item-action bg-transparent border-bottom border-secondary d-flex align-items-center gap-2 ${activeChannel === o.name ? 'active' : ''}`}
                            onClick={() => setActiveChannel(o.name)}
                          >
                            👥 أسرة: {o.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="card shadow d-flex flex-column" style={{ height: '500px' }}>
                      <div className="card-header py-3 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-warning">
                          <i className="fas fa-comments me-2"></i> محادثة # {activeChannel}
                        </h5>
                      </div>
                      
                      <div className="card-body flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3" style={{ overflowY: 'scroll' }}>
                        {chatMessages.filter(m => m.channel === activeChannel).length === 0 ? (
                          <div className="text-center my-auto text-muted">لا توجد رسائل في هذه المجموعة بعد.</div>
                        ) : (
                          chatMessages.filter(m => m.channel === activeChannel).map((m) => (
                            <div
                              key={m.id}
                              className={`d-flex flex-column ${m.senderUser === currentUser.username ? 'align-self-end text-end' : 'align-self-start text-start'}`}
                              style={{ maxWidth: '70%' }}
                            >
                              <small className="text-warning mb-1" style={{ fontSize: '0.75rem' }}>{m.senderName} ({getRoleArabicName(m.senderRole)})</small>
                              <div
                                className="p-3 rounded-3"
                                style={{
                                  backgroundColor: m.senderUser === currentUser.username ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.08)',
                                  color: m.senderUser === currentUser.username ? '#000' : 'var(--color-text)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '12px'
                                }}
                              >
                                {m.message}
                              </div>
                              <small className="text-muted mt-1" style={{ fontSize: '0.65rem' }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef}></div>
                      </div>

                      <div className="card-footer p-3">
                        <form onSubmit={handleSendMessage} className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control"
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                          />
                          <button type="submit" className="btn btn-warning px-4"><i className="fas fa-paper-plane"></i></button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MY EVALUATIONS */}
              {activeTab === 'evaluationsTab' && (() => {
                try {
                const servantClasses = getServantClasses();
                const servantServices = [...new Set(servantClasses.map(c => c.serviceName))];
                const myTemplates = evaluationTemplates.filter(t => {
                  if (t.serviceYear !== selectedYearForFilter) return false;
                  if (!servantServices.includes(t.serviceName)) return false;
                  if (t.stageName && t.className) {
                    return servantClasses.some(c => c.serviceName === t.serviceName && c.stageName === t.stageName && c.className === t.className);
                  }
                  return true;
                });

                let weeksList = getWeeksForServiceDay(selectedYearForFilter, getServantServiceDay());
                if (selectedMonthFilter !== 'all') {
                  const targetMonthIndex = parseInt(selectedMonthFilter);
                  weeksList = weeksList.filter(wk => {
                    const parts = wk.split('-');
                    return parseInt(parts[1]) === targetMonthIndex;
                  });
                }
                const currentWeek = selectedWeekDate || weeksList[0] || '';

                let totalPoints = 0;
                let count = 0;
                myTemplates.forEach(t => {
                  const grade = servantEvaluations.find(e => e.templateId === t.id && e.servantUsername === currentUser.username && e.weekDate === currentWeek);
                  if (t.type === 'checkbox') {
                    totalPoints += (grade && grade.value) ? 100 : 0;
                    count++;
                  } else if (t.type === 'percentage') {
                    totalPoints += (grade && grade.value !== undefined && grade.value !== '') ? parseInt(grade.value) || 0 : 0;
                    count++;
                  } else if (t.type === 'qr_liturgy') {
                    totalPoints += (grade && grade.value) ? 100 : 0;
                    count++;
                  } else if (t.type === 'visitation') {
                    totalPoints += (grade && grade.value !== undefined) ? parseInt(grade.value) || 0 : 0;
                    count++;
                  }
                });
                const overallScore = count > 0 ? Math.round(totalPoints / count) : null;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUser.username)}`;

                return (
                  <div className="fade-in">
                    {/* Header with Filters */}
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                      <h4 className="fw-bold mb-0 text-warning">
                        <i className="fas fa-star me-2"></i> تقييماتي لعام {selectedYearForFilter}
                      </h4>
                      
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        {/* Year Selector */}
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-warning text-dark fw-bold px-3 py-2">عام: {selectedYearForFilter}</span>
                        </div>

                        {/* Date (Calendar) Selector */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="mb-0 small text-muted"><i className="fas fa-calendar-alt me-1 text-warning"></i> اختر تاريخ التقييم:</label>
                          <div className="position-relative" style={{ width: '160px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm fw-bold border-warning bg-dark text-warning text-center"
                              value={selectedWeekDate ? (() => {
                                const d = new Date(selectedWeekDate);
                                return isNaN(d.getTime()) ? '' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                              })() : ''}
                              readOnly
                              style={{ borderRadius: '8px', cursor: 'pointer' }}
                            />
                            <input
                              type="date"
                              className="position-absolute top-0 start-0 w-100 h-100"
                              style={{ opacity: 0, cursor: 'pointer' }}
                              value={selectedWeekDate}
                              onChange={(e) => setSelectedWeekDate(e.target.value)}
                              onClick={(e) => {
                                try {
                                  e.target.showPicker();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      {/* Left Column: QR Code & Overall Score */}
                      <div className="col-lg-4 mb-4">
                        <div className="card shadow text-center border-warning">
                          <div className="card-header bg-warning text-dark py-2">
                            <h6 className="mb-0 fw-bold"><i className="fas fa-qrcode me-2"></i> الـ QR Code الخاص بك</h6>
                          </div>
                          <div className="card-body py-4">
                            <p className="small text-muted mb-3">اعرض this الكود لأمين الخدمة أو أمين الأسرة لتسجيل حضور القداس</p>
                            <div className="qr-container p-3 bg-white d-inline-block rounded border mb-3">
                              <img src={qrUrl} alt="QR Code" style={{ width: '200px', height: '200px' }} />
                            </div>
                            <h6 className="fw-bold mb-0 text-primary">{currentUser.name}</h6>
                            <small className="text-muted">{currentUser.username}</small>
                          </div>
                        </div>

                        {/* Overall Grade Card */}
                        <div className="card shadow mt-4 text-center border-success">
                          <div className="card-header bg-success text-white py-2">
                            <h6 className="mb-0 fw-bold"><i className="fas fa-chart-line me-2"></i> التقييم للأسبوع الحالي</h6>
                          </div>
                          <div className="card-body py-4">
                            {overallScore !== null ? (
                              <div>
                                <h1 className="display-4 fw-bold text-success mb-1">{overallScore}%</h1>
                                <p className="text-muted mb-0">نسبة التقييم الإجمالية للأسبوع المختار بناءً على بنود التقييم</p>
                              </div>
                            ) : (
                              <p className="text-muted mb-0 py-3">لا توجد تقييمات مضافة لخدمتك بعد لحساب التقييم الكلي.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Evaluations Details Table */}
                      <div className="col-lg-8 mb-4">
                        <div className="card shadow">
                          <div className="card-header py-3">
                            <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-star me-2"></i> تفاصيل تقييماتي</h5>
                          </div>
                          <div className="card-body">
                            {(() => {
                              const myPrepEvaluations = (preparationSubmissions || []).filter(sub => {
                                  const subUser = (sub.servantUsername || sub.username || '').toLowerCase().trim();
                                  const targetUser = (currentUser.username || '').toLowerCase().trim();
                                  if (subUser !== targetUser) return false;
                                  if (sub.score === undefined || sub.score === null || sub.score === '') return false;
                                  if (sub.serviceYear && selectedYearForFilter && String(sub.serviceYear) !== String(selectedYearForFilter)) return false;
                                  return true;
                                }).map(sub => {
                                  const prep = (preparations || []).find(p => 
                                    String(p.id || '') === String(sub.preparationId || '') || 
                                    (p._id && String(p._id) === String(sub.preparationId || ''))
                                  );
                                  const lessonTitle = prep?.lessonName || sub.lessonName || sub.fileName || 'الدرس';
                                  return {
                                    id: sub.id || sub._id,
                                    isPrep: true,
                                    name: `تحضير درس: ${lessonTitle}`,
                                    type: 'percentage',
                                    score: sub.score,
                                    comment: sub.comment,
                                    evaluatedAt: sub.evaluatedAt
                                  };
                                });

                              const combinedList = [
                                ...myTemplates.map(t => ({ ...t, isPrep: false })),
                                ...myPrepEvaluations
                              ];

                              if (combinedList.length === 0) {
                                return <p className="text-center text-muted py-5 mb-0">لا توجد بنود تقييم مخصصة أو تحضيرات دروس مضافة لخدمتك في هذا العام بعد.</p>;
                              }

                              return (
                                <div className="table-responsive">
                                  <table className="table table-bordered table-striped align-middle text-center small mb-0">
                                    <thead className="table-dark">
                                      <tr>
                                        <th>اسم التقييم</th>
                                        <th>النوع</th>
                                        <th>التقييم / الدرجة</th>
                                        <th>آخر تحديث / تسجيل</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {combinedList.map(t => {
                                        if (t.isPrep) {
                                          return (
                                            <tr key={t.id}>
                                              <td className="fw-bold text-start text-info"><i className="fas fa-book-open me-2"></i>{t.name}</td>
                                              <td><span className="badge bg-info text-white">تحضير درس</span></td>
                                              <td>
                                                <span className="badge bg-success text-white py-1.5 px-3 fw-bold">{t.score}%</span>
                                                {t.comment && <div className="small text-muted mt-1">ملاحظة: {t.comment}</div>}
                                              </td>
                                              <td>
                                                {t.evaluatedAt ? new Date(t.evaluatedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                              </td>
                                            </tr>
                                          );
                                        }
                                        
                                      const grade = servantEvaluations.find(e => e.templateId === t.id && e.servantUsername === currentUser.username && e.weekDate === currentWeek);
                                      return (
                                        <tr key={t.id}>
                                          <td className="fw-bold text-start">{t.name}</td>
                                        <td>
                                          <span className="badge bg-secondary">
                                            {t.type === 'checkbox' ? 'علامة صح' : t.type === 'percentage' ? 'نسبة مئوية' : t.type === 'qr_liturgy' ? 'Qr Code' : 'افتقاد'}
                                          </span>
                                        </td>
                                        <td>
                                          {t.type === 'checkbox' ? (
                                            (grade && grade.value) ? (
                                              <span className="text-success fw-bold"><i className="fas fa-check-circle me-1"></i> ممتاز / تم</span>
                                            ) : (
                                              <span className="text-danger fw-bold"><i className="fas fa-times-circle me-1"></i> لم يتم بعد</span>
                                            )
                                          ) : t.type === 'percentage' ? (
                                            (grade && grade.value !== undefined) ? (
                                              <span className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>{grade.value}%</span>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )
                                          ) : t.type === 'qr_liturgy' ? (
                                            (grade && grade.value) ? (
                                              <span className="text-success fw-bold"><i className="fas fa-church me-1"></i> تم تسجيل الحضور</span>
                                            ) : (
                                              <span className="text-danger fw-bold"><i className="fas fa-times-circle me-1"></i> غائب</span>
                                            )
                                          ) : t.type === 'visitation' ? (
                                            <span className="fw-bold text-info" style={{ fontSize: '1.1rem' }}>
                                              {(grade && grade.value !== undefined) ? `${grade.value}%` : '0%'}
                                            </span>
                                          ) : (
                                            '-'
                                          )}
                                        </td>
                                        <td>
                                          {grade ? (
                                            <small className="text-muted">
                                              {new Date(grade.scannedAt).toLocaleDateString('ar-EG')} - {new Date(grade.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                          ) : (
                                            <span className="text-muted">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
                } catch (err) {
                  console.error("Crash in My Evaluations Tab:", err);
                  return <div className="alert alert-danger m-3 p-4 fw-bold text-center">حدث خطأ أثناء عرض التقييمات: {err.message}</div>;
                }
            })()}

              {/* TAB: LESSON PREPARATION */}
              {activeTab === 'preparationsTab' && (() => {
                try {
                const servantClasses = getServantClasses();
                const servantServices = [...new Set(servantClasses.map(c => c.serviceName))];
                const myPreps = preparations.filter(p => {
                  if (p.serviceYear && p.serviceYear !== selectedYearForFilter) return false;
                  if (!servantServices.includes(p.serviceName)) return false;
                  if (p.stageName) {
                    if (p.className) {
                      return servantClasses.some(c => c.serviceName === p.serviceName && c.stageName === p.stageName && c.className === p.className);
                    } else {
                      return servantClasses.some(c => c.serviceName === p.serviceName && c.stageName === p.stageName);
                    }
                  }
                  return true;
                });
                return (
                  <div className="fade-in">
                    <div className="card shadow">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-book-open me-2"></i> تحضير الدروس المطلوبة لخدمتك</h5>
                      </div>
                      <div className="card-body">
                        {myPreps.length === 0 ? (
                          <p className="text-center text-muted py-5 mb-0">لا توجد دروس مطلوبة للتحضير لخدمتك حالياً.</p>
                        ) : (
                          <div className="row g-4">
                            {myPreps.map(p => {
                              const submission = preparationSubmissions.find(s => s.preparationId === p.id && s.servantUsername === currentUser.username);
                              const isSubmitted = !!submission;
                              return (
                                <div key={p.id} className="col-md-6 col-lg-4">
                                  <div className={`card h-100 border ${isSubmitted ? 'border-success' : 'border-warning'}`} style={{ backgroundColor: 'var(--card-bg)' }}>
                                    <div className={`card-header d-flex justify-content-between align-items-center py-2 ${isSubmitted ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                                      <div className="d-flex align-items-center gap-2">
                                        <h6 className="mb-0 fw-bold">{p.lessonName}</h6>
                                        {p.stageName && p.className && (
                                          <span className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>
                                            {p.stageName} - {p.className}
                                          </span>
                                        )}
                                      </div>
                                      <span className="badge bg-dark small">
                                        {isSubmitted ? 'تم التسليم' : 'معلق'}
                                      </span>
                                    </div>
                                    <div className="card-body">
                                      <div className="mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                                        <strong className="small text-warning d-block mb-1"><i className="fas fa-bullseye me-1"></i> أهداف الدرس وملاحظات التحضير:</strong>
                                        <p className="small mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>{p.objectives || 'لا توجد ملاحظات مضافة.'}</p>
                                      </div>
                                      <div className="mb-3 small">
                                        <strong className="text-danger">آخر موعد للتسليم (الديدلاين):</strong>
                                        <span className="ms-1 fw-bold">{p.deadline}</span>
                                      </div>

                                      {isSubmitted ? (
                                        <div className="p-3 rounded border border-success" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                                          <div className="small text-success mb-2">
                                            <i className="fas fa-check-circle me-1"></i> تم تسليم التحضير بنجاح:
                                          </div>
                                          <div className="small text-muted mb-2 text-truncate">
                                            <strong>الملف:</strong> {submission.fileName}
                                          </div>
                                          <div className="small text-muted mb-2">
                                            <strong>التوقيت:</strong> {formatDate(submission.uploadedAt)}
                                          </div>
                                          {submission.score !== undefined && (
                                            <div className="small mb-2 text-warning fw-bold">
                                              <i className="fas fa-star me-1 text-warning"></i> التقييم: {submission.score}%
                                            </div>
                                          )}
                                          {submission.comment && (
                                            <div className="p-2 mb-3 rounded border border-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.03)', fontSize: '0.8rem', direction: 'rtl', textAlign: 'right' }}>
                                              <strong>تعليق المسؤول:</strong> {submission.comment}
                                            </div>
                                          )}
                                          <button 
                                            className="btn btn-sm btn-outline-success w-100 fw-bold"
                                            onClick={() => viewPdf(submission.fileData, submission.fileName)}
                                          >
                                            عرض الملف المرفوع <i className="fas fa-eye ms-1"></i>
                                          </button>
                                        </div>
                                      ) : (() => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const isExpired = p.deadline && p.deadline < todayStr;
                                        if (isExpired) {
                                          return (
                                            <div className="p-3 rounded border border-danger text-center" style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)' }}>
                                              <div className="small text-danger fw-bold">
                                                <i className="fas fa-exclamation-triangle me-1"></i> انتهى موعد التسليم (مغلق) ⚠️
                                              </div>
                                              <p className="small text-muted mb-0 mt-1">الديدلاين: {p.deadline}</p>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="p-3 rounded border border-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.02)' }}>
                                            <label className="form-label small fw-bold text-warning mb-2">اختر ملف التحضير بصيغة PDF:</label>
                                            <input
                                              type="file"
                                              className="form-control form-control-sm mb-2"
                                              accept="application/pdf"
                                              onChange={(e) => handleSelectPrepFile(e, p.id)}
                                            />
                                            {selectedFiles[p.id] && (
                                              <div className="mt-2 p-2 border rounded border-warning bg-dark text-center">
                                                <div className="small text-warning mb-2 text-truncate">
                                                  <i className="fas fa-file-pdf me-1"></i> {selectedFiles[p.id].name}
                                                </div>
                                                <button 
                                                  className="btn btn-sm btn-warning w-100 fw-bold"
                                                  onClick={() => handleConfirmUpload(p.id)}
                                                >
                                                  تأكيد الرفع ✝
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                } catch (err) {
                  console.error("Crash in Preparations Tab:", err);
                  return <div className="alert alert-danger m-3 p-4 fw-bold text-center">حدث خطأ أثناء عرض تحضير الدروس: {err.message}</div>;
                }
              })()}

              {/* TAB: PROMOTION UPDATES */}
              {activeTab === 'promotionUpdatesTab' && (() => {
                const myServiceStages = [];
                const userOsraName = currentUser.osra;
                if (userOsraName) {
                  for (const service of servicesList) {
                    if (service.osras) {
                      const osraObj = service.osras.find(o => o.name === userOsraName);
                      if (osraObj && osraObj.stages) {
                        myServiceStages.push(...osraObj.stages.map(st => st.name));
                      }
                    }
                  }
                }

                const pendingMembers = makhdomeen.filter(m => {
                  if (!m.pendingPromotionFrom) return false;
                  
                  const stageDef = stagesList.find(s => s.name === m.pendingPromotionFrom);
                  if (!stageDef) return true;

                  if (stageDef.promotionType === 'manual') {
                    const allowedTargets = stageDef.allowedTargets || [];
                    if (allowedTargets.length > 0) {
                      return allowedTargets.some(t => myServiceStages.includes(t));
                    }
                  }
                  return true;
                });

                return (
                  <div className="fade-in">
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-random me-2"></i> تسكين المخدومين الجدد في الخدمة ({currentUser.osra || 'غير محددة'})</h5>
                      </div>
                      <div className="card-body">
                        <div className="alert alert-info mb-4">
                          <h6 className="fw-bold"><i className="fas fa-info-circle me-2"></i> مخدومين بانتظار التسكين اليدوي:</h6>
                          <p className="mb-0 text-white-50 small">يظهر هنا المخدومون الذين تخرجوا من مرحلتهم السابقة (مثل خريجي إعدادي) وبانتظار تحديد مرحلتهم الجديدة في الثانوي وتسكينهم.</p>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead>
                              <tr className="text-warning">
                                <th>اسم المخدوم</th>
                                <th>النوع</th>
                                <th>المرحلة السابقة</th>
                                <th>تحديد المرحلة الجديدة</th>
                                <th>الإجراء</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingMembers.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="text-center py-4 text-muted">لا يوجد مخدومين بانتظار التسكين حالياً.</td>
                                </tr>
                              ) : (
                                pendingMembers.map(m => {
                                  const currentVal = selectedTargets[m.id] || '';
                                  return (
                                    <tr key={m.id}>
                                      <td className="fw-bold text-white">{m.name}</td>
                                      <td>
                                        <span className={`badge ${m.gender === 'ولد' || m.gender === 'ذكر' ? 'bg-primary' : 'bg-danger'}`}>
                                          {m.gender}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="badge bg-secondary">{m.pendingPromotionFrom}</span>
                                      </td>
                                      <td>
                                        {(() => {
                                          const stageDef = stagesList.find(s => s.name === m.pendingPromotionFrom);
                                          const allowedForThisMember = (stageDef && stageDef.allowedTargets && stageDef.allowedTargets.length > 0)
                                            ? stageDef.allowedTargets.filter(t => myServiceStages.includes(t))
                                            : myServiceStages;
                                          return (
                                            <select
                                              className="form-select form-select-sm"
                                              style={{ maxWidth: '200px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                              value={currentVal}
                                              onChange={(e) => setSelectedTargets(prev => ({ ...prev, [m.id]: e.target.value }))}
                                            >
                                              <option value="">-- اختر المرحلة --</option>
                                              {allowedForThisMember.map(stName => (
                                                <option key={stName} value={stName}>{stName}</option>
                                              ))}
                                            </select>
                                          );
                                        })()}
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-warning btn-sm fw-bold"
                                          onClick={() => handleAssignPendingMember(m.id, currentVal)}
                                          disabled={!currentVal}
                                        >
                                          تسكين المخدوم ✝
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB: SERVICE YEARS */}
              {activeTab === 'serviceYearsTab' && (
                <div className="fade-in">
                  <div className="row g-4 justify-content-center">
                    <div className="col-lg-6">
                      <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                        <div className="card-body p-4">
                          <h5 className="fw-bold text-warning mb-4"><i className="fas fa-calendar-alt me-2"></i> سنين الخدمة المسجلة</h5>
                          <div className="list-group">
                            {(serviceYearsList || []).map(yr => {
                              const isActive = selectedYearForFilter === yr;
                              return (
                                <div key={yr} className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary py-3 text-white">
                                  <div className="d-flex align-items-center gap-3 flex-grow-1">
                                    <input
                                      type="checkbox"
                                      className="form-check-input cursor-pointer"
                                      style={{ width: '1.4rem', height: '1.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                      checked={isActive}
                                      onChange={() => {
                                        if (!isActive) {
                                          setSelectedYearForFilter(yr);
                                          localStorage.setItem('activeServiceYear_' + currentUser.username, yr);
                                          window.customAlert(`تم تعيين سنة الخدمة النشطة لحسابك إلى: ${yr} ✝`);
                                          fetchInitialData();
                                        }
                                      }}
                                    />
                                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>سنة الخدمة {yr}</span>
                                  </div>
                                  {isActive && <span className="badge bg-warning text-dark fw-bold px-3 py-1.5">نشطة حالياً</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeTab === 'stPhilopateerCoreTab' && (
                <PhilopateerCoreView currentUser={currentUser} isManager={false} />
              )}

              {activeTab === 'managePhilopateerServicesTab' && (
                <PhilopateerCoreView currentUser={currentUser} isManager={true} />
              )}

              {activeTab === 'settingsTab' && (
                <div className="row justify-content-center">
                  <div className="col-md-8 col-lg-7 mb-4">
                    <div className="card shadow">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-user-edit me-2"></i> الإعدادات الشخصية</h5>
                      </div>
                      <div className="card-body">
                        {/* Profile Photo Editor */}
                        <div className="text-center mb-4">
                          <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={false} />
                          <small className="text-muted d-block mt-2">اضغط لتغيير أو حذف صورتك الشخصية</small>
                        </div>

                        <form onSubmit={handleUpdateSettings}>
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
                            <div className="col-md-6 mb-3">
                              <label className="form-label">البريد الإلكتروني (Gmail)</label>
                              <input
                                type="email"
                                className="form-control"
                                value={settingsEmail}
                                onChange={(e) => setSettingsEmail(e.target.value)}
                              />

                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">الكنيسة</label>
                              <input
                                type="text"
                                className="form-control"
                                value={settingsChurch}
                                onChange={(e) => setSettingsChurch(e.target.value)}
                                required
                                disabled={currentUser.username !== 'admin'}
                              />
                            </div>
                          </div>

                          <div className="mb-3">
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
                                className="btn btn-outline-warning"
                                onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                                style={{ border: '1px solid var(--border-color)', borderRight: 'none', backgroundColor: 'var(--bg-input)' }}
                              >
                                <i className={`fas ${showSettingsPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </button>
                            </div>
                          </div>

                          <button type="submit" className="btn btn-warning w-100 py-2 mt-3" disabled={updatingSettings}>
                            {updatingSettings ? 'جاري حفظ البيانات...' : 'حفظ التعديلات ✝'}
                          </button>
                          {settingsError && <div className="alert alert-danger mt-3 text-center py-2">{settingsError}</div>}
                          {settingsSuccess && <div className="alert alert-success mt-3 text-center py-2">{settingsSuccess}</div>}
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
        {activeCallMakhdoom && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', direction: 'rtl', zIndex: 2000 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
              <div className="modal-content text-center p-4 position-relative" style={{ backgroundColor: '#1a1d20', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px' }}>
                
                {/* Close Button */}
                <button 
                  type="button" 
                  className="btn-close btn-close-white position-absolute top-0 start-0 m-3" 
                  onClick={() => setActiveCallMakhdoom(null)}
                  aria-label="Close"
                ></button>

                <div className="modal-body p-0 mt-3 text-white">
                  {/* Purple Circular Call Icon Wrapper */}
                  <div 
                    className="d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(102, 16, 242, 0.15)',
                      border: '2px solid rgba(102, 16, 242, 0.4)',
                      color: '#6f42c1'
                    }}
                  >
                    <i className="fas fa-phone-alt fa-2x"></i>
                  </div>

                  <h4 className="fw-bold mb-2 text-warning">تسجيل نتيجة الاتصال</h4>
                  <p className="text-muted mb-4 fs-6">للمخدوم: <strong className="text-white">{activeCallMakhdoom.name}</strong></p>

                  {/* Option 1: Answered */}
                  <button
                    type="button"
                    className="btn btn-success w-100 py-3 rounded-pill mb-3 d-flex align-items-center justify-content-center gap-2 fw-bold text-white shadow-sm"
                    onClick={() => handleSaveVisitation('answered')}
                    style={{ transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-check-circle fa-lg"></i>
                    تم الرد (يحتسب افتقاد)
                  </button>

                  {/* Option 2: No Answer */}
                  <button
                    type="button"
                    className="btn btn-warning w-100 py-3 rounded-pill mb-3 d-flex align-items-center justify-content-center gap-2 fw-bold text-dark shadow-sm"
                    onClick={() => handleSaveVisitation('no_answer')}
                    style={{ transition: 'all 0.2s', backgroundColor: '#ffc107', borderColor: '#ffc107' }}
                  >
                    <i className="fas fa-exclamation-triangle fa-lg"></i>
                    لم يتم الرد (يحتسب محاولة)
                  </button>

                  {/* Option 3: Cancel */}
                  <button
                    type="button"
                    className="btn btn-danger w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-2 fw-bold text-white shadow-sm"
                    onClick={() => handleSaveVisitation('cancelled')}
                    style={{ transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-times-circle fa-lg"></i>
                    إلغاء الافتقاد (لا يُحتسب)
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
        <Footer />
      </div>
      </div>
    </div>
  );
}
