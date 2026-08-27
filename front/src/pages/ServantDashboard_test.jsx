import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicEditor from '../components/ProfilePicEditor';
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
  const hasPermission = (permKey, defaultValue = true) => {
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
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
      attendanceTab: 'viewServiceTree',
      messagesTab: 'viewMessages',
      evaluationsTab: 'viewEvaluations',
      preparationsTab: 'viewPreparations'
    };
    const reqPerm = tabPermMap[stored];
    if (reqPerm && userPerms[reqPerm] === false) {
      const allowed = Object.keys(tabPermMap).find(t => userPerms[tabPermMap[t]] !== false);
      return allowed || 'settingsTab';
    }
    return stored;
  });
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
  const [activeChannel, setActiveChannel] = useState('عا�&');
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
  const [newWaznaType, setNewWaznaType] = useState('افت�اد');
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

  const getMergedUserPermissions = (user, services, jobs) => {
    const basePermissions = { ...(user.permissions || {}) };
    const usernameLower = (user.username || '').toLowerCase();
    
    (services || []).forEach(srv => {
      (srv.osras || []).forEach(osra => {
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
        // Sync currentUser permissions if user updated in backend
        if (data.users) {
          const freshUser = data.users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (freshUser) {
            const correctRole = resolveFrontendDynamicRole(freshUser, data.priestServices, data.jobs);
            if (correctRole !== currentUser.role) {
              localStorage.removeItem('currentUser');
              localStorage.removeItem('activeService_' + currentUser.username);
              localStorage.removeItem('activeStage_' + currentUser.username);
              window.location.href = '/login?session_expired=true';
              return;
            }
            const mergedPerms = getMergedUserPermissions(freshUser, data.priestServices, data.jobs);
            const mergedUser = {
              ...freshUser,
              role: correctRole,
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
      window.customAlert('�`رج�0 اخت�`ار ا��&رح�ة أ���ا�9!');
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
        window.customAlert('ت�& تسْ�`�  ا��&خد���& ب� جاح! �S�');
        fetchData();
      } else {
        window.customAlert(data.message || 'فش� تسْ�`�  ا��&خد���&.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أث� اء ا�اتصا� با�س�`رفر.');
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
    const ampm = hours >= 12 ? '�&' : 'ص';
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
      window.customAlert("ا�رجاء اخت�`ار �&�ف بص�`غة PDF ف�ط!");
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
      window.customAlert("ا�رجاء اخت�`ار �&�ف أ���ا�9!");
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
        window.customAlert("ت�& رفع ا�تحض�`ر ب� جاح! �S�");
        setSelectedFiles(prev => {
          const copy = { ...prev };
          delete copy[preparationId];
          return copy;
        });
        fetchInitialData();
      } else {
        window.customAlert("فش� رفع ا�تحض�`ر.");
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
      window.customAlert("ا�رجاء ا�س�&اح ��� ��افذ ا��&� بث�ة (Popups) �عرض �&�ف ا�٬ PDF.");
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedAttendanceClass || !attendanceDate) {
      window.customAlert('ا�رجاء اخت�`ار ا�فص� ��تحد�`د ا�تار�`خ!');
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
        window.customAlert('ت�& حفظ ْشف ا�حض��ر ��ا�غ�`اب ب� جاح! �S�');
        fetchAttendance();
      } else {
        window.customAlert(data.message || 'فش� حفظ ا�ْشف.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أث� اء حفظ ْشف ا�حض��ر.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const activeDeadlines = deadlines.filter(d => {
    const dlDateTime = new Date(`${d.date}T${d.time}`);
    return dlDateTime > new Date();
  });

  const getRoleArabicName = (r) => {
    if (r === 'admin') return 'أد�&� ';
    if (r === 'priest') return 'ْا�!� ';
    if (r === 'coordinator') return 'أ�&�`�  خد�&ة';
    if (r === 'assistant_coordinator') return '�&ساعد أ�&�`�  خد�&ة';
    if (r === 'family_coordinator') return 'أ�&�`�  أسرة';
    if (r === 'assistant_family_coordinator') return '�&ساعد أ�&�`�  أسرة';
    if (r === 'general_coordinator') return 'أ�&�`�  عا�& ا�خد�&ة';
    return 'خاد�&';

  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleAddWazna = async (e) => {
    e.preventDefault();
    if (!newWaznaName.trim()) {
      window.customAlert('ا�رجاء ْتابة اس�& ا��&خد���&!');
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
        window.customAlert('ت�& تسج�`� ا�افت�اد ب� جاح! �S�');
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
      window.customAlert("�ا �`��جد ر��& �!اتف �&سج� ��!ذا ا��&خد���&!");
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
        window.customAlert("ت�& تسج�`� � ت�`جة ا�اتصا� ب� جاح! �S�");
        setActiveCallMakhdoom(null);
        fetchInitialData();
      } else {
        window.customAlert("حدث خطأ أث� اء حفظ ا�� ت�`جة.");
      }
    } catch (e) {
      console.error(e);
      window.customAlert("حدث خطأ ف�` ا�اتصا� با�خاد�&.");
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
      setSettingsError('ا�رجاء إدخا� ْافة ا�ب�`ا� ات ا��&ط���بة!');
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
        setSettingsSuccess('ت�& تحد�`ث ا�ب�`ا� ات ب� جاح! �S�');
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        setCurrentUser(result.user);
        fetchInitialData();
      } else {
        setSettingsError(result.message || 'فش� تحد�`ث ا�ب�`ا� ات.');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('حدث خطأ أث� اء ا�اتصا� با�س�`رفر.');
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
        <div className="auth-cross-watermark" style={{ top: '10%', left: '5%', fontSize: '100px' }}>�S�</div>
        <div className="auth-cross-watermark" style={{ top: '65%', left: '82%', fontSize: '120px' }}>�S�</div>
        <div className="auth-cross-watermark" style={{ top: '35%', left: '88%', fontSize: '70px' }}>�S�</div>
        <div className="auth-cross-watermark" style={{ top: '80%', left: '10%', fontSize: '90px' }}>�S�</div>

        <div className="auth-glass-card p-5 text-center" style={{ maxWidth: '900px', width: '100%', borderRadius: '24px' }}>
          <div className="church-icon mb-4">
            <img src="/logo-removebg-preview.png" alt="شعار ا�ْ� �`سة" className="church-logo-img" style={{ width: '80px', height: '80px' }} />
          </div>
          <h2 className="text-warning fw-bold mb-2">�&رحبا�9 بْ �`ا {currentUser.name} �S�</h2>
          <p className="text-muted mb-4">ا�رجاء اخت�`ار ا�خد�&ة ��بدء ف�` استخدا�& ا�� ظا�&:</p>
          
          {myServices.length > 0 ? (
            <>
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
                        <span className="badge bg-warning text-dark mb-1">�`���& {o.serviceDay === 'Friday' ? 'ا�ج�&عة' : o.serviceDay}</span>
                        <p className="text-muted small mb-0 mt-2">
                          ا��&راح� ا�تابع ��!ا: {getUserStagesInOsra(o).join('�R ') || 'غ�`ر �&حدد'}
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
                        <h5 className="fw-bold mb-2 text-warning">ا�� ظا�&</h5>
                        <p className="text-muted small mb-0 mt-2">
                          ا�دخ��� ��� ظا�& بْافة ا�ص�اح�`ات ��إدارة ا�ْ� �`سة.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Added Logout button for when user has services but wants to log out */}
              <div className="mt-5 text-center">
                <button 
                  className="btn btn-outline-danger fw-bold px-4"
                  onClick={() => {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('activeService_' + currentUser.username);
                    localStorage.removeItem('activeStage_' + currentUser.username);
                    window.location.href = '/login';
                  }}
                  style={{ borderRadius: '12px' }}
                >
                  <i className="fas fa-sign-out-alt me-2"></i> تسج�`� ا�خر��ج
                </button>
              </div>
            </>
          ) : (
            <div>
              <p className="text-danger py-4 fw-bold">��& �`ت�& ت��ز�`عْ ف�` أ�` خد�&ة بعد ف�` شجرة ا�خد�&ة �س� ة {selectedYearForFilter} �S�</p>
              <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i> تسج�`� ا�خر��ج
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- STAGE SELECTION OVERLAY ---
  if (activeService && !activeStage) {
    const oRecord = services.flatMap(s => s.osras || []).find(o => o.name === activeService);
    const myStages = oRecord ? getUserStagesInOsra(oRecord) : [];

    if (myStages.length === 1) {
      localStorage.setItem('activeStage_' + currentUser.username, myStages[0]);
      setActiveStage(myStages[0]);
    } else if (myStages.length > 1) {
      return (
        <div id="authSection" data-auth-theme="dark" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="auth-cross-watermark" style={{ top: '10%', left: '5%', fontSize: '100px' }}>�S�</div>
          <div className="auth-cross-watermark" style={{ top: '65%', left: '82%', fontSize: '120px' }}>�S�</div>
          <div className="auth-cross-watermark" style={{ top: '35%', left: '88%', fontSize: '70px' }}>�S�</div>
          <div className="auth-cross-watermark" style={{ top: '80%', left: '10%', fontSize: '90px' }}>�S�</div>

          <div className="auth-glass-card p-5 text-center" style={{ maxWidth: '900px', width: '100%', borderRadius: '24px' }}>
            <div className="church-icon mb-4">
              <img src="/logo-removebg-preview.png" alt="شعار ا�ْ� �`سة" className="church-logo-img" style={{ width: '80px', height: '80px' }} />
            </div>
            <h2 className="text-warning fw-bold mb-2">خد�&ة {activeService} �S�</h2>
            <p className="text-muted mb-5">ا�رجاء اخت�`ار ا��&رح�ة ا�خد�&�`ة ا�ت�` تر�`د ا�دخ��� ع��`�!ا:</p>

            <div className="row g-4 justify-content-center">
              {myStages.map(stageName => (
                <div className="col-md-6 col-lg-4" key={stageName}>
                  <div 
                    className="card h-100 text-center service-select-card cursor-pointer"
                    style={{ transition: 'all 0.3s ease', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '16px' }}
                    onClick={() => {
                      localStorage.setItem('activeStage_' + currentUser.username, stageName);
                      setActiveStage(stageName);
                    }}
                  >
                    <div className="card-body py-4">
                      <div className="service-icon-circle mb-3 mx-auto" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-sitemap text-warning fa-lg"></i>
                      </div>
                      <h5 className="fw-bold mb-2 text-primary">{stageName}</h5>
                      <span className="badge bg-warning text-dark mb-1">{activeService}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-5 d-flex justify-content-center gap-3">
              <button 
                className="btn btn-outline-warning fw-bold px-4"
                onClick={() => {
                  localStorage.removeItem('activeService_' + currentUser.username);
                  setActiveService('');
                }}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-arrow-right me-2"></i> ا�ع��دة �اخت�`ار خد�&ة أخر�0
              </button>
              
              <button 
                className="btn btn-outline-danger fw-bold px-4"
                onClick={() => {
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('activeService_' + currentUser.username);
                  localStorage.removeItem('activeStage_' + currentUser.username);
                  window.location.href = '/login';
                }}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-sign-out-alt me-2"></i> تسج�`� ا�خر��ج
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div id="authSection" data-auth-theme="dark" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="auth-glass-card p-5 text-center" style={{ maxWidth: '500px', width: '100%', borderRadius: '24px' }}>
            <h5 className="text-danger fw-bold mb-3">خطأ ف�` ا�ت��ز�`ع �S�</h5>
            <p className="text-muted mb-4">أ� ت �&��زع ف�` خد�&ة {activeService} ���ْ�  ��& �`ت�& إ�`جاد أ�` �&راح� �&خصصة �ْ بعد.</p>
            <div className="d-flex flex-column gap-3">
              <button 
                className="btn btn-warning fw-bold w-100"
                onClick={() => {
                  localStorage.removeItem('activeService_' + currentUser.username);
                  setActiveService('');
                }}
                style={{ borderRadius: '12px' }}
              >
                ا�ع��دة �اخت�`ار خد�&ة أخر�0
              </button>
              
              <button 
                className="btn btn-outline-danger fw-bold w-100"
                onClick={() => {
                  localStorage.removeItem('currentUser');
                  localStorage.removeItem('activeService_' + currentUser.username);
                  localStorage.removeItem('activeStage_' + currentUser.username);
                  window.location.href = '/login';
                }}
                style={{ borderRadius: '12px' }}
              >
                <i className="fas fa-sign-out-alt me-2"></i> تسج�`� ا�خر��ج
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ minHeight: '100vh' }}>
      {/* Sidebar Drawer */}
      <nav id="sidebar" className={`${sidebarShowMobile ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {sidebarShowMobile && (
          <div className="sidebar-backdrop" onClick={() => setSidebarShowMobile(false)}></div>
        )}

        <div className="sidebar-header border-bottom border-secondary py-4 text-center">
          <ProfilePicEditor user={currentUser} readOnly={true} />
          <div className="text-center mt-2">
            <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{currentUser.name}</h5>
          </div>
          <div className="active-service-badge mt-2 text-center">
            <span className="badge bg-warning text-dark fw-bold px-3 py-1.5 text-wrap" style={{ fontSize: '0.8rem' }}>
              <i className="fas fa-church me-1"></i> {activeService} {activeStage ? ` - ${activeStage}` : ''}
            </span>
            <button 
              onClick={() => {
                localStorage.removeItem('activeService_' + currentUser.username);
                localStorage.removeItem('activeStage_' + currentUser.username);
                window.location.href = '/login';
              }}
              className="btn btn-outline-warning btn-sm d-block mx-auto mt-2 fw-bold"
              style={{ fontSize: '0.8rem', borderRadius: '8px', padding: '4px 12px', border: '1px solid rgba(201, 168, 76, 0.4)' }}
            >
              <i className="fas fa-exchange-alt me-1"></i> تغ�`�`ر ا�خد�&ة �S�
            </button>
          </div>


        </div>

        <ul className="list-unstyled components" style={{ padding: '15px 0 80px 0', overflowY: 'auto', flexGrow: 1 }}>


          <li className={`nav-item ${activeTab === 'addWaznaTab' ? 'active' : ''}`} onClick={() => { setActiveTab('addWaznaTab'); setSidebarShowMobile(false); }}>
            <a href="#"><i className="fas fa-hand-holding-heart me-2"></i> ا���ز� ات</a>
          </li>
          <li className={`nav-item ${activeTab === 'classMakhdomeenTab' ? 'active' : ''}`} onClick={() => { setActiveTab('classMakhdomeenTab'); setSidebarShowMobile(false); }}>
            <a href="#"><i className="fas fa-users me-2"></i> �&خد���&�`�  ا�فص�</a>
          </li>
          {hasPermission('viewServiceTree') && (
            <li className={`nav-item ${activeTab === 'attendanceTab' ? 'active' : ''}`} onClick={() => { setActiveTab('attendanceTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-clipboard-check me-2"></i> ْشف ا�حض��ر ��ا�غ�`اب</a>
            </li>
          )}
          {hasPermission('viewEvaluations') && (
            <li className={`nav-item ${activeTab === 'evaluationsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('evaluationsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-star me-2"></i> ت��`�`�&ات�`</a>
            </li>
          )}
          {hasPermission('viewPreparations') && (
            <li className={`nav-item ${activeTab === 'preparationsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('preparationsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-book-open me-2"></i> تحض�`ر ا�در��س</a>
            </li>
          )}
          {hasPermission('viewMessages') && (
            <li className={`nav-item ${activeTab === 'messagesTab' ? 'active' : ''}`} onClick={() => { setActiveTab('messagesTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-comments me-2"></i> ص� د��� ا�رسائ�</a>
            </li>
          )}
          <li className={`nav-item ${activeTab === 'promotionUpdatesTab' ? 'active' : ''}`} onClick={() => { setActiveTab('promotionUpdatesTab'); setSidebarShowMobile(false); }}>
            <a href="#"><i className="fas fa-random me-2"></i> تحد�`ث ا��&راح� �`د���`ا�9</a>
          </li>
          <li className={`nav-item ${activeTab === 'serviceYearsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('serviceYearsTab'); setSidebarShowMobile(false); }}>
            <a href="#"><i className="fas fa-calendar-alt me-2"></i> س� �`�  ا�خد�&ة</a>
          </li>
          <li className={`nav-item ${activeTab === 'settingsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('settingsTab'); setSidebarShowMobile(false); }}>
            <a href="#"><i className="fas fa-cog me-2"></i> ا�إعدادات</a>
          </li>
        </ul>

        {/* Fixed Logout Button at the bottom */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.1)', paddingBottom: '15px' }}>
          <ul className="list-unstyled mb-0 w-100">
            <li>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="text-danger fw-bold"
              >
                <i className="fas fa-sign-out-alt me-2 text-danger"></i> <span>تسج�`� ا�خر��ج</span>
              </a>
            </li>
          </ul>
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
                className="btn btn-outline-light btn-sm d-lg-none"
                onClick={() => setSidebarShowMobile(true)}
                style={{ border: 'none', background: 'transparent' }}
              >
                <i className="fas fa-bars text-white fs-4"></i>
              </button>
              <button
                type="button"
                id="sidebarToggleBtn"
                className="btn btn-outline-light btn-sm d-none d-lg-inline"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ border: '1px solid rgba(255,255,255,0.5)', background: 'transparent', borderRadius: '10px', padding: '5px 10px' }}
              >
                <i className="fas fa-bars text-white fs-4"></i>
              </button>
              <h5 className="mb-0 fw-bold text-white d-none d-md-inline" id="topBarChurchName" style={{fontFamily: 'Cairo, sans-serif'}}>{currentUser.church}</h5>
            </div>

            {/* Center - Logo / Title */}
            <div className="position-absolute start-50 translate-middle-x text-center d-none d-xl-block">
              <h4 className="mb-0 fw-bold text-white d-flex align-items-center gap-2" style={{ fontFamily: "'DecoType Thuluth', 'Aref Ruqaa', serif" }}>
                <i className="fas fa-cross"></i> 19J) 'DDG <i className="fas fa-cross"></i>
              </h4>
            </div>

            {/* Left Side (RTL context) - Actions */}
            <div className="d-flex align-items-center gap-3">
              {/* 1. Empty Box for Clock (Rightmost in this group due to RTL) */}
              <div className="d-none d-md-flex" style={{ background: '#fff', borderRadius: '25px', padding: '5px 20px', minWidth: '100px', height: '40px', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                {/* Empty for now, will hold the clock */}
              </div>

              {/* 2. Theme Toggle (Middle) */}
              <ThemeToggle />

              {/* 3. Notifications Bell (Middle) */}
              <NotificationsBell user={currentUser} onNavigateTab={(tab) => { if (tab === 'waznatTab' || tab === 'waznaTab') setActiveTab('addWaznaTab'); else setActiveTab(tab); }} />

              {/* 4. Username Box (Leftmost) */}
              <div className="d-none d-md-flex" style={{ background: 'var(--primary-color)', borderRadius: '25px', padding: '5px 20px', minWidth: '100px', height: '40px', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                <span className="text-white fw-bold"><i className="fas fa-user-circle me-1"></i> {currentUser.name}</span>
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
                <h6 className="fw-bold mb-1 text-warning">ت� ب�`�! �تس��`�& ا���ز� ات!</h6>
                <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                  ا��&�`عاد ا�أ�ص�0 �تس��`�& افت�اد ا�خد�&ة �!��: <strong>{activeDeadlines[0].date}</strong> ف�` ت�&ا�& ا�ساعة <strong>{activeDeadlines[0].time}</strong>.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="mt-3 text-warning">جار�` ا��&زا�&� ة ��ج�ب ا�ب�`ا� ات ا�خد�&�`ة...</p>
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
                    {/* Makhdomeen (ا���ز� ات) table */}
                    <div className="col-12">
                      {/* Makhdomeen (ا���ز� ات) Table Card */}
                      <div className="card shadow mb-4">
                        <div className="card-header py-3" style={{ backgroundColor: 'rgba(201,168,76,0.06)' }}>
                          <h6 className="mb-0 fw-bold text-warning">
                            <i className="fas fa-hand-holding-heart me-2"></i> ا��&خد���&�`�  ا��&سؤ��� ع� �!�& (ا���ز� ات) �S�
                          </h6>
                        </div>
                        <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                          {assignedMakhdomeen.length === 0 ? (
                            <p className="text-muted text-center py-5 mb-0 small">��& �`ت�& تع�`�`�  ��ز� ات �&خصصة �ْ بعد.</p>
                          ) : (
                            <div className="table-responsive">
                              <table className="table align-middle text-center small mb-0 table-striped table-bordered text-start">
                                <thead className="table-dark">
                                  <tr>
                                    <th>#</th>
                                    <th>ا�اس�&</th>
                                    <th>حا�ة ا�افت�اد</th>
                                    <th>ر��& ا��!اتف</th>
                                    <th>ا�إجراءات</th>
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
                                                <i className="fas fa-check-circle me-1"></i> ت�& ا�رد
                                              </span>
                                            ) : visit.result === 'no_answer' ? (
                                              <span className="badge bg-warning text-dark fs-6 px-3 py-2 fw-bold shadow-sm">
                                                <i className="fas fa-phone-slash me-1"></i> ��& �`رد
                                              </span>
                                            ) : (
                                              <span className="badge bg-danger fs-6 px-3 py-2 fw-bold shadow-sm">
                                                <i className="fas fa-times-circle me-1"></i> �&�غ�`
                                              </span>
                                            )
                                          ) : (
                                            <span className="badge bg-secondary fs-6 px-3 py-2 fw-bold text-white-50">
                                              ��& �`ُفت�د بعد
                                            </span>
                                          )}
                                        </td>
                                        <td className="font-monospace">{m.phone || m.phoneNumber || '-'}</td>
                                        <td>
                                          <div className="d-flex gap-1 justify-content-center">
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-primary py-1 px-2 fw-bold"
                                              onClick={() => handleStartCall(m)}
                                            >
                                              <i className="fas fa-phone-alt"></i> اتصا�
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
                          <i className="fas fa-users me-2"></i> �&خد���&�`�  ا��&رح�ة ({activeStage || 'ْ� ا��&راح�'}) �S�
                        </h6>
                        <div className="input-group input-group-sm" style={{ maxWidth: '250px' }}>
                          <input
                            type="text"
                            className="form-control bg-dark border-secondary text-white"
                            placeholder="بحث باس�& ا��&خد���& أ�� ا��!اتف..."
                            value={makhdomeenSearchQuery}
                            onChange={(e) => setMakhdomeenSearchQuery(e.target.value)}
                          />
                          <span className="input-group-text bg-dark text-warning border-secondary"><i className="fas fa-search"></i></span>
                        </div>
                      </div>
                      <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredMakhdomeen.length === 0 ? (
                          <p className="text-muted text-center py-5 mb-0 small">�ا �`��جد �&خد���&�`�  �&سج��`�  ف�` �!ذ�! ا��&رح�ة حا��`ا�9.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table align-middle text-center small mb-0 table-striped table-bordered">
                              <thead className="table-dark">
                                <tr>
                                  <th>#</th>
                                  <th>ا�اس�&</th>
                                  <th>ا�فص�</th>
                                  <th>ر��& ا��!اتف</th>
                                  <th>ا��&� ط�ة</th>
                                  <th>ا�شارع</th>
                                  <th>ر��& ا�ع�&ارة</th>
                                  <th>ا�د��ر</th>
                                  <th>ر��& ا�ش�ة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMakhdomeen.map((m, idx) => (
                                  <tr key={m.id || m._id}>
                                    <td>{idx + 1}</td>
                                    <td className="fw-bold text-start">{m.name}</td>
                                    <td><span className="badge bg-secondary">{m.fasl || 'غ�`ر �&حدد'}</span></td>
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
                            status: status === 'present' ? 'حض��ر' : status === 'absent' ? 'غ�`اب' : 'اعتذار',
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
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-clipboard-list me-2"></i> تسج�`� ْشف ا�حض��ر ��ا�غ�`اب</h5>
                        </div>
                        <div className="card-body">
                          {myClasses.length === 0 ? (
                            <p className="text-muted text-center py-4">أ� ت غ�`ر �&ع�`�  ف�` أ�` فص� حا��`ا�9.</p>
                          ) : (
                            <form onSubmit={handleSaveAttendance}>
                              <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                  <label className="form-label">ا�فص� ا�� شط</label>
                                  <div className="form-control bg-dark border-secondary text-warning fw-bold text-center">
                                    {selectedAttendanceClass ? `${selectedAttendanceClass.className} (${selectedAttendanceClass.stageName})` : '-'}
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label">تار�`خ ا�ْشف</label>
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

                              <h6 className="text-warning fw-bold mb-3 border-bottom pb-2">�ائ�&ة ا��&خد���&�`�  ف�` ا�فص� ({currentClassMakhdomeen.length})</h6>
                              {currentClassMakhdomeen.length === 0 ? (
                                <p className="text-muted text-center py-3">�ا �`��جد �&خد���&�`�  �&سج��`�  ف�` �!ذا ا�فص�.</p>
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
                                            حض��ر
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn btn-xs ${currentStatus === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                                            onClick={() => setAttendanceRecords({ ...attendanceRecords, [mId]: 'absent' })}
                                          >
                                            غ�`اب
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
                                  {attendanceSaving ? 'جار�` حفظ ا�ْشف...' : 'حفظ ْشف ا�حض��ر ��ا�غ�`اب �S�'}
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
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-search me-2"></i> سج�ات ��ف�اتر حض��ر ا��&خد���&�`� </h5>
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
                                <option value="all">ْ� ا�حا�ات</option>
                                <option value="present">حض��ر ف�ط</option>
                                <option value="absent">غ�`اب ف�ط</option>
                                <option value="excused">اعتذار ف�ط</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="small text-white-50">�&�  تار�`خ</label>
                              <input 
                                type="date"
                                className="form-control form-control-sm"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="small text-white-50">إ��0 تار�`خ</label>
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
                            <p className="text-muted text-center py-4 small">�ا ت��جد سج�ات حض��ر �&طاب�ة ��ف�اتر.</p>
                          ) : (
                            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                              <table className="table align-middle table-sm text-center">
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th className="text-start">اس�& ا��&خد���&</th>
                                    <th>ا�تار�`خ</th>
                                    <th>ا�حا�ة</th>
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
                        <h6 className="mb-0 fw-bold text-warning"><i className="fas fa-hashtag me-2"></i> غرف ا�دردشة</h6>
                      </div>
                      <div className="list-group list-group-flush">
                        <button
                          type="button"
                          className={`list-group-item list-group-item-action bg-transparent border-bottom border-secondary d-flex align-items-center gap-2 ${activeChannel === 'عا�&' ? 'active' : ''}`}
                          onClick={() => setActiveChannel('عا�&')}
                        >
                          �x� دردشة ا�ْ� �`سة ا�عا�&ة
                        </button>
                        {priestRecord.osras.map(o => (
                          <button
                            key={o.name}
                            type="button"
                            className={`list-group-item list-group-item-action bg-transparent border-bottom border-secondary d-flex align-items-center gap-2 ${activeChannel === o.name ? 'active' : ''}`}
                            onClick={() => setActiveChannel(o.name)}
                          >
                            �x� أسرة: {o.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="card shadow d-flex flex-column" style={{ height: '500px' }}>
                      <div className="card-header py-3 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold text-warning">
                          <i className="fas fa-comments me-2"></i> �&حادثة # {activeChannel}
                        </h5>
                      </div>
                      
                      <div className="card-body flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3" style={{ overflowY: 'scroll' }}>
                        {chatMessages.filter(m => m.channel === activeChannel).length === 0 ? (
                          <div className="text-center my-auto text-muted">�ا ت��جد رسائ� ف�` �!ذ�! ا��&ج�&��عة بعد.</div>
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
                        <i className="fas fa-star me-2"></i> ت��`�`�&ات�` �عا�& {selectedYearForFilter}
                      </h4>
                      
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        {/* Year Selector */}
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-warning text-dark fw-bold px-3 py-2">عا�&: {selectedYearForFilter}</span>
                        </div>

                        {/* Date (Calendar) Selector */}
                        <div className="d-flex align-items-center gap-2">
                          <label className="mb-0 small text-muted"><i className="fas fa-calendar-alt me-1 text-warning"></i> اختر تار�`خ ا�ت��`�`�&:</label>
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
                            <h6 className="mb-0 fw-bold"><i className="fas fa-qrcode me-2"></i> ا�٬ QR Code ا�خاص بْ</h6>
                          </div>
                          <div className="card-body py-4">
                            <p className="small text-muted mb-3">اعرض this ا�ْ��د �أ�&�`�  ا�خد�&ة أ�� أ�&�`�  ا�أسرة �تسج�`� حض��ر ا��داس</p>
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
                            <h6 className="mb-0 fw-bold"><i className="fas fa-chart-line me-2"></i> ا�ت��`�`�& ��أسب��ع ا�حا��`</h6>
                          </div>
                          <div className="card-body py-4">
                            {overallScore !== null ? (
                              <div>
                                <h1 className="display-4 fw-bold text-success mb-1">{overallScore}%</h1>
                                <p className="text-muted mb-0">� سبة ا�ت��`�`�& ا�إج�&ا��`ة ��أسب��ع ا��&ختار ب� اء�9 ع��0 ب� ��د ا�ت��`�`�&</p>
                              </div>
                            ) : (
                              <p className="text-muted mb-0 py-3">�ا ت��جد ت��`�`�&ات �&ضافة �خد�&تْ بعد �حساب ا�ت��`�`�& ا�ْ��`.</p>
                            )}
                          </div>
                        </div>
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
                                        }    name: prep ? `تحضير: ${prep.lessonName}` : 'تحضير درس',
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
                                return <p className="text-center text-muted py-5 mb-0">�ا ت��جد ب� ��د ت��`�`�& �&خصصة أ�� تحض�`رات در��س �&ضافة �خد�&تْ ف�` �!ذا ا�عا�& بعد.</p>;
                              }

                              return (
                                <div className="table-responsive">
                                  <table className="table table-bordered table-striped align-middle text-center small mb-0">
                                    <thead className="table-dark">
                                      <tr>
                                        <th>اس�& ا�ت��`�`�&</th>
                                        <th>ا�� ��ع</th>
                                        <th>ا�ت��`�`�& / ا�درجة</th>
                                        <th>آخر تحد�`ث / تسج�`�</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {combinedList.map(t => {
                                        if (t.isPrep) {
                                          return (
                                            <tr key={t.id}>
                                              <td className="fw-bold text-start text-info"><i className="fas fa-book-open me-2"></i>{t.name}</td>
                                              <td><span className="badge bg-info text-white">تحض�`ر درس</span></td>
                                              <td><span className="badge bg-info text-white">تحض`ر درس</span></td>
                                              <td>
                                                <span className="badge bg-success text-white py-1.5 px-3 fw-bold">{t.score}%</span>
                                                {t.comment && <div className="small text-muted mt-1">& احظة: {t.comment}</div>}
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
                                            {t.type === 'checkbox' ? 'ع�ا�&ة صح' : t.type === 'percentage' ? '� سبة �&ئ���`ة' : t.type === 'qr_liturgy' ? 'Qr Code' : 'افت�اد'}
                                          </span>
                                        </td>
                                        <td>
                                          {t.type === 'checkbox' ? (
                                            (grade && grade.value) ? (
                                              <span className="text-success fw-bold"><i className="fas fa-check-circle me-1"></i> �&�&تاز / ت�&</span>
                                            ) : (
                                              <span className="text-danger fw-bold"><i className="fas fa-times-circle me-1"></i> ��& �`ت�& بعد</span>
                                            )
                                          ) : t.type === 'percentage' ? (
                                            (grade && grade.value !== undefined) ? (
                                              <span className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>{grade.value}%</span>
                                            ) : (
                                              <span className="text-muted">-</span>
                                            )
                                          ) : t.type === 'qr_liturgy' ? (
                                            (grade && grade.value) ? (
                                              <span className="text-success fw-bold"><i className="fas fa-church me-1"></i> ت�& تسج�`� ا�حض��ر</span>
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
                  return <div className="alert alert-danger m-3 p-4 fw-bold text-center">حدث خطأ أث� اء عرض ا�ت��`�`�&ات: {err.message}</div>;
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
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-book-open me-2"></i> تحض�`ر ا�در��س ا��&ط���بة �خد�&تْ</h5>
                      </div>
                      <div className="card-body">
                        {myPreps.length === 0 ? (
                          <p className="text-center text-muted py-5 mb-0">�ا ت��جد در��س �&ط���بة ��تحض�`ر �خد�&تْ حا��`ا�9.</p>
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
                                        {isSubmitted ? 'ت�& ا�تس��`�&' : '�&ع��'}
                                      </span>
                                    </div>
                                    <div className="card-body">
                                      <div className="mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                                        <strong className="small text-warning d-block mb-1"><i className="fas fa-bullseye me-1"></i> أ�!داف ا�درس ���&�احظات ا�تحض�`ر:</strong>
                                        <p className="small mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>{p.objectives || '�ا ت��جد �&�احظات �&ضافة.'}</p>
                                      </div>
                                      <div className="mb-3 small">
                                        <strong className="text-danger">آخر �&��عد ��تس��`�& (ا�د�`د�ا�`� ):</strong>
                                        <span className="ms-1 fw-bold">{p.deadline}</span>
                                      </div>

                                      {isSubmitted ? (
                                        <div className="p-3 rounded border border-success" style={{ backgroundColor: 'rgba(25, 135, 84, 0.05)' }}>
                                          <div className="small text-success mb-2">
                                            <i className="fas fa-check-circle me-1"></i> ت�& تس��`�& ا�تحض�`ر ب� جاح:
                                          </div>
                                          <div className="small text-muted mb-2 text-truncate">
                                            <strong>ا��&�ف:</strong> {submission.fileName}
                                          </div>
                                          <div className="small text-muted mb-2">
                                            <strong>ا�ت����`ت:</strong> {formatDate(submission.uploadedAt)}
                                          </div>
                                          {submission.score !== undefined && (
                                            <div className="small mb-2 text-warning fw-bold">
                                              <i className="fas fa-star me-1 text-warning"></i> ا�ت��`�`�&: {submission.score}%
                                            </div>
                                          )}
                                          {submission.comment && (
                                            <div className="p-2 mb-3 rounded border border-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.03)', fontSize: '0.8rem', direction: 'rtl', textAlign: 'right' }}>
                                              <strong>تع��`� ا��&سؤ���:</strong> {submission.comment}
                                            </div>
                                          )}
                                          <button 
                                            className="btn btn-sm btn-outline-success w-100 fw-bold"
                                            onClick={() => viewPdf(submission.fileData, submission.fileName)}
                                          >
                                            عرض ا��&�ف ا��&رف��ع <i className="fas fa-eye ms-1"></i>
                                          </button>
                                        </div>
                                      ) : (() => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const isExpired = p.deadline && p.deadline < todayStr;
                                        if (isExpired) {
                                          return (
                                            <div className="p-3 rounded border border-danger text-center" style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)' }}>
                                              <div className="small text-danger fw-bold">
                                                <i className="fas fa-exclamation-triangle me-1"></i> ا� ت�!�0 �&��عد ا�تس��`�& (�&غ��) �a�️
                                              </div>
                                              <p className="small text-muted mb-0 mt-1">ا�د�`د�ا�`� : {p.deadline}</p>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="p-3 rounded border border-warning" style={{ backgroundColor: 'rgba(255, 193, 7, 0.02)' }}>
                                            <label className="form-label small fw-bold text-warning mb-2">اختر �&�ف ا�تحض�`ر بص�`غة PDF:</label>
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
                                                  تأْ�`د ا�رفع �S�
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
                  return <div className="alert alert-danger m-3 p-4 fw-bold text-center">حدث خطأ أث� اء عرض تحض�`ر ا�در��س: {err.message}</div>;
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
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-random me-2"></i> تسْ�`�  ا��&خد���&�`�  ا�جدد ف�` ا�خد�&ة ({currentUser.osra || 'غ�`ر �&حددة'})</h5>
                      </div>
                      <div className="card-body">
                        <div className="alert alert-info mb-4">
                          <h6 className="fw-bold"><i className="fas fa-info-circle me-2"></i> �&خد���&�`�  با� تظار ا�تسْ�`�  ا��`د���`:</h6>
                          <p className="mb-0 text-white-50 small">�`ظ�!ر �!� ا ا��&خد���&���  ا�ذ�`�  تخرج��ا �&�  �&رح�ت�!�& ا�ساب�ة (�&ث� خر�`ج�` إعداد�`) ��با� تظار تحد�`د �&رح�ت�!�& ا�جد�`دة ف�` ا�ثا� ���` ��تسْ�`� �!�&.</p>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead>
                              <tr className="text-warning">
                                <th>اس�& ا��&خد���&</th>
                                <th>ا�� ��ع</th>
                                <th>ا��&رح�ة ا�ساب�ة</th>
                                <th>تحد�`د ا��&رح�ة ا�جد�`دة</th>
                                <th>ا�إجراء</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingMembers.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="text-center py-4 text-muted">�ا �`��جد �&خد���&�`�  با� تظار ا�تسْ�`�  حا��`ا�9.</td>
                                </tr>
                              ) : (
                                pendingMembers.map(m => {
                                  const currentVal = selectedTargets[m.id] || '';
                                  return (
                                    <tr key={m.id}>
                                      <td className="fw-bold text-white">{m.name}</td>
                                      <td>
                                        <span className={`badge ${m.gender === '���د' || m.gender === 'ذْر' ? 'bg-primary' : 'bg-danger'}`}>
                                          {m.gender}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="badge bg-secondary">{m.pendingPromotionFrom}</span>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          style={{ maxWidth: '200px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                          value={currentVal}
                                          onChange={(e) => setSelectedTargets(prev => ({ ...prev, [m.id]: e.target.value }))}
                                        >
                                          <option value="">-- اختر ا��&رح�ة --</option>
                                          {myServiceStages.map(stName => (
                                            <option key={stName} value={stName}>{stName}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-warning btn-sm fw-bold"
                                          onClick={() => handleAssignPendingMember(m.id, currentVal)}
                                          disabled={!currentVal}
                                        >
                                          تسْ�`�  ا��&خد���& �S�
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
                          <h5 className="fw-bold text-warning mb-4"><i className="fas fa-calendar-alt me-2"></i> س� �`�  ا�خد�&ة ا��&سج�ة</h5>
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
                                          window.customAlert(`ت�& تع�`�`�  س� ة ا�خد�&ة ا�� شطة �حسابْ إ��0: ${yr} �S�`);
                                          fetchInitialData();
                                        }
                                      }}
                                    />
                                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>س� ة ا�خد�&ة {yr}</span>
                                  </div>
                                  {isActive && <span className="badge bg-warning text-dark fw-bold px-3 py-1.5">� شطة حا��`ا�9</span>}
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
              {activeTab === 'settingsTab' && (
                <div className="row justify-content-center">
                  <div className="col-md-8 col-lg-7 mb-4">
                    <div className="card shadow">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-user-edit me-2"></i> ا�إعدادات ا�شخص�`ة</h5>
                      </div>
                      <div className="card-body">
                        {/* Profile Photo Editor */}
                        <div className="text-center mb-4">
                          <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={false} />
                          <small className="text-muted d-block mt-2">اضغط �تغ�`�`ر أ�� حذف ص��رتْ ا�شخص�`ة</small>
                        </div>

                        <form onSubmit={handleUpdateSettings}>
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">ا�اس�& با�ْا�&�</label>
                              <input
                                type="text"
                                className="form-control"
                                value={settingsName}
                                onChange={(e) => setSettingsName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">اس�& ا��&ستخد�&</label>
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
                              <label className="form-label">ا�بر�`د ا�إ�ْتر��� �` (Gmail)</label>
                              <input
                                type="email"
                                className="form-control"
                                value={settingsEmail}
                                onChange={(e) => setSettingsEmail(e.target.value)}
                              />

                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">ا�ْ� �`سة</label>
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
                            <label className="form-label">ْ��&ة ا��&ر��ر</label>
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
                            {updatingSettings ? 'جار�` حفظ ا�ب�`ا� ات...' : 'حفظ ا�تعد�`�ات �S�'}
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

                  <h4 className="fw-bold mb-2 text-warning">تسج�`� � ت�`جة ا�اتصا�</h4>
                  <p className="text-muted mb-4 fs-6">���&خد���&: <strong className="text-white">{activeCallMakhdoom.name}</strong></p>

                  {/* Option 1: Answered */}
                  <button
                    type="button"
                    className="btn btn-success w-100 py-3 rounded-pill mb-3 d-flex align-items-center justify-content-center gap-2 fw-bold text-white shadow-sm"
                    onClick={() => handleSaveVisitation('answered')}
                    style={{ transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-check-circle fa-lg"></i>
                    ت�& ا�رد (�`حتسب افت�اد)
                  </button>

                  {/* Option 2: No Answer */}
                  <button
                    type="button"
                    className="btn btn-warning w-100 py-3 rounded-pill mb-3 d-flex align-items-center justify-content-center gap-2 fw-bold text-dark shadow-sm"
                    onClick={() => handleSaveVisitation('no_answer')}
                    style={{ transition: 'all 0.2s', backgroundColor: '#ffc107', borderColor: '#ffc107' }}
                  >
                    <i className="fas fa-exclamation-triangle fa-lg"></i>
                    ��& �`ت�& ا�رد (�`حتسب �&حا���ة)
                  </button>

                  {/* Option 3: Cancel */}
                  <button
                    type="button"
                    className="btn btn-danger w-100 py-3 rounded-pill d-flex align-items-center justify-content-center gap-2 fw-bold text-white shadow-sm"
                    onClick={() => handleSaveVisitation('cancelled')}
                    style={{ transition: 'all 0.2s' }}
                  >
                    <i className="fas fa-times-circle fa-lg"></i>
                    إ�غاء ا�افت�اد (�ا �`ُحتسب)
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}
