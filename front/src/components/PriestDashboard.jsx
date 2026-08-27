import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilePicEditor from '../components/ProfilePicEditor';
import ThemeToggle from '../components/ThemeToggle';
import PhilopateerCoreView from './PhilopateerCoreView';

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

import ServiceTree from '../components/ServiceTree';
import Footer from '../components/Footer';
import NotificationsBell from '../components/NotificationsBell';
import ServiceDetailsView from './ServiceDetailsView';

export default function PriestDashboard() {
  const navigate = useNavigate();
  const determinedRole = 'priest';
  
  // User details local state (to dynamically update profile picture)
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));
  
  // Tab Management
  const tabPermMap = {
    manageOsrasTab: 'viewServiceTree',
    waznatTab: 'viewVisitationLogs',
    evaluationTab: 'viewEvaluations',
    reportsTab: 'viewServiceDetails',
    messagesTab: 'viewMessages',
    serviceDetailsTab: 'viewServiceDetails',
    deadlineTab: 'manageDeadlines',
    promotionUpdatesTab: 'manageStagePromotion',
    serviceYearsTab: 'manageServiceYears',
    stPhilopateerCoreTab: 'requestPhilopateerServices',
    managePhilopateerServicesTab: 'managePhilopateerServices'
  };

  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('priestActiveTab') || 'manageOsrasTab';
    const reqPerm = tabPermMap[stored];
    if (reqPerm && !hasPermission(reqPerm)) {
      const allowed = Object.keys(tabPermMap).find(t => hasPermission(tabPermMap[t]));
      return allowed || 'settingsTab';
    }
    return stored;
  });

  useEffect(() => {
    const reqPerm = tabPermMap[activeTab];
    if (reqPerm && !hasPermission(reqPerm)) {
      const allowed = Object.keys(tabPermMap).find(t => hasPermission(tabPermMap[t]));
      setActiveTab(allowed || 'settingsTab');
    }
  }, [currentUser, activeTab]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarShowMobile, setSidebarShowMobile] = useState(false);

  // Database States
  const [priestServicesList, setPriestServicesList] = useState([]);
  const [selectedYearForFilter, setSelectedYearForFilter] = useState(() => {
    const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return localStorage.getItem('activeServiceYear_' + userObj.username) || new Date().getFullYear().toString();
  });
  const [serviceYearsList, setServiceYearsList] = useState([]);
  const [stagesList, setStagesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState({});
  const [waznat, setWaznat] = useState([]);

  const [servants, setServants] = useState([]);
  const [makhdomeen, setMakhdomeen] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState('عام');
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const priestRecord = priestServicesList.find(r => 
    (r.serviceYear || new Date().getFullYear().toString()) === selectedYearForFilter
  ) || { priestUser: currentUser.username, serviceYear: selectedYearForFilter, osras: [] };

  const userPerms = currentUser.permissions || {};
  const hasPermission = (permKey, defaultValue = true) => {
    if (determinedRole === 'admin' || determinedRole === 'super_admin') {
      return true;
    }
    if (userPerms[permKey] !== undefined) {
      return !!userPerms[permKey];
    }
    return defaultValue;
  };

  // Settings Form States


  const [settingsName, setSettingsName] = useState(currentUser.name || '');
  const [settingsUsername, setSettingsUsername] = useState(currentUser.username || '');
  const [settingsEmail, setSettingsEmail] = useState(currentUser.email || '');
  const [settingsChurch, setSettingsChurch] = useState(currentUser.church || '');
  const [settingsPassword, setSettingsPassword] = useState(currentUser.password || '');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    setSettingsName(currentUser.name || '');
    setSettingsUsername(currentUser.username || '');
    setSettingsEmail(currentUser.email || '');
    setSettingsChurch(currentUser.church || '');
    setSettingsPassword(currentUser.password || '');
  }, [currentUser.username, currentUser.name, currentUser.email, currentUser.church, currentUser.password]);



  // Form States
  const [newWaznaServant, setNewWaznaServant] = useState('');
  const [newWaznaOsra, setNewWaznaOsra] = useState('');
  const [newWaznaFasl, setNewWaznaFasl] = useState('');
  const [newWaznaName, setNewWaznaName] = useState('');
  const [newWaznaPhone, setNewWaznaPhone] = useState('');
  const [newWaznaAddress, setNewWaznaAddress] = useState('');
  const [newWaznaType, setNewWaznaType] = useState('افتقاد');
  const [newWaznaNotes, setNewWaznaNotes] = useState('');
  const [newWaznaDate, setNewWaznaDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Chat States
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef(null);

  // evaluations states
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationTemplates, setEvaluationTemplates] = useState([]);
  const [servantEvaluations, setServantEvaluations] = useState([]);
  const [preparationSubmissions, setPreparationSubmissions] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [philopateerRequestsList, setPhilopateerRequestsList] = useState([]);
  const [selectedEvalServant, setSelectedEvalServant] = useState('');
  const [evalWeekDate, setEvalWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [evalLiturgy, setEvalLiturgy] = useState(false);
  const [evalService, setEvalService] = useState(false);
  const [evalVisitation, setEvalVisitation] = useState(false);
  const [evalPreparation, setEvalPreparation] = useState(false);
  const [evalFamilyMeeting, setEvalFamilyMeeting] = useState(false);
  const [evalServantMeeting, setEvalServantMeeting] = useState(false);
  const [evalSaving, setEvalSaving] = useState(false);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/evaluations');
      const data = await res.json();
      if (res.ok && data.success) {
        setEvaluations(data.evaluations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedEvalServant || !evalWeekDate) {
      window.customAlert('الرجاء اختيار الخادم وتحديد التاريخ!');
      return;
    }
    setEvalSaving(true);
    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servantUsername: selectedEvalServant,
          weekDate: evalWeekDate,
          liturgy: evalLiturgy,
          service: evalService,
          visitation: evalVisitation,
          preparation: evalPreparation,
          familyMeeting: evalFamilyMeeting,
          servantMeeting: evalServantMeeting,
          priestUsername: currentUser.username
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.customAlert('تم حفظ تقييم الخادم بنجاح! ✝');
        fetchEvaluations();
      } else {
        window.customAlert(data.message || 'فشل حفظ التقييم.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء حفظ التقييم.');
    } finally {
      setEvalSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'evaluationTab') {
      fetchEvaluations();
    }
  }, [activeTab]);

  // Deadlines States
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  // Selected Osra for Service Tree tab
  const [selectedServiceForTree, setSelectedServiceForTree] = useState('');

  // Socket
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('priestActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchInitialData();
    
    if (window.io) {
      const socket = window.io();
      socketRef.current = socket;
      
      let debounceTimer;
      const debouncedFetch = (changeInfo) => {
        console.log('🔄 Data changed on server:', changeInfo);
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

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      if (response.ok) {
        if (data.users) {
          const freshUser = data.users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (freshUser) {
            const correctRole = resolveFrontendDynamicRole(freshUser, data.priestServices, data.jobs);
            const mergedUser = {
              ...freshUser,
              role: currentUser.role || freshUser.role || correctRole,
              activeRole: determinedRole,
              activeService: currentUser.activeService,
              activeStage: currentUser.activeStage
            };
            localStorage.setItem('currentUser', JSON.stringify(mergedUser));
            setCurrentUser(mergedUser);
          }
        }

        // Extract this priest's records
        const records = (data.priestServices || []).filter(r => (r.priestUser || '').toLowerCase() === (currentUser.username || '').toLowerCase());
        setPriestServicesList(records);

        // No auto-select first service to show selector screen first
        
        setWaznat(data.waznat || []);
        
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

        // Filter servants belonging to this priest's church (excluding admins/priests)
        const filteredServants = (data.users || []).filter(s => s.church === currentUser.church && !['super_admin', 'admin', 'priest'].includes(s.role));
        setServants(filteredServants);

        // Load deadlines
        let priestDeadlines = [];
        if (data.deadlines) {
          const dlKey = Object.keys(data.deadlines).find(k => k.toLowerCase() === (currentUser.username || '').toLowerCase());
          if (dlKey) priestDeadlines = data.deadlines[dlKey];
        }
        setDeadlines(priestDeadlines);

        // Load chat messages
        setChatMessages(data.chat_messages || []);

        // Load makhdomeen
        setMakhdomeen(data.makhdomeen || []);

        // Load all users
        setAllUsers(data.users || []);
        setEvaluationTemplates(data.evaluationTemplates || []);
        setServantEvaluations(data.servantEvaluations || []);
        setPreparationSubmissions(data.preparationSubmissions || []);
        setPreparations(data.preparations || []);

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
      console.error('Error fetching dashboard sync data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMakhdomeenState = (updated) => {
    if (!updated) {
      fetchInitialData();
      return;
    }
    if (Array.isArray(updated)) {
      setMakhdomeen(prev => {
        const copy = [...prev];
        updated.forEach(item => {
          const idx = copy.findIndex(m => m.id === item.id || m._id === item._id || m.id === item._id || m._id === item.id);
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], ...item };
          } else {
            copy.push(item);
          }
        });
        return copy;
      });
    } else if (typeof updated === 'object') {
      setMakhdomeen(prev => prev.map(m => {
        const isMatch = m.id === updated.id || m._id === updated._id || m.id === updated._id || m._id === updated.id;
        return isMatch ? { ...m, ...updated } : m;
      }));
    } else {
      fetchInitialData();
    }
  };

  const handleAssignPendingMember = async (memberId, targetStageName, targetOsraName) => {
    if (!targetStageName || !targetOsraName) {
      window.customAlert('يرجى اختيار الخدمة والمرحلة أولاً!');
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
          osra: targetOsraName,
          stage: targetStageName,
          fasl: '',
          pendingPromotionFrom: ''
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        window.customAlert('تم تسكين المخدوم بنجاح! ✝');
        fetchInitialData();
      } else {
        window.customAlert(data.message || 'فشل تسكين المخدوم.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const syncKeyToServer = async (key, dataToSync) => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: dataToSync }),
      });
    } catch (e) {
      console.error(`Error syncing key ${key}:`, e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // --- WAZNAT MANAGEMENT ---
  const handleAddWazna = async (e) => {
    e.preventDefault();
    if (!newWaznaServant || !newWaznaName.trim()) {
      alert('الرجاء اختيار الخادم وكتابة اسم المخدوم!');
      return;
    }

    const newWazna = {
      id: Date.now() + Math.random().toString(),
      servantUser: newWaznaServant,
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

    const updatedWaznat = [newWazna, ...waznat];
    setWaznat(updatedWaznat);
    
    setNewWaznaName('');
    setNewWaznaPhone('');
    setNewWaznaAddress('');
    setNewWaznaNotes('');

    await syncKeyToServer('waznat', updatedWaznat);
  };

  const handleToggleWaznaChecked = async (waznaId) => {
    const updatedWaznat = waznat.map(w => {
      if (w.id === waznaId || w.id === String(waznaId)) {
        return { ...w, checked: !w.checked };
      }
      return w;
    });
    setWaznat(updatedWaznat);
    await syncKeyToServer('waznat', updatedWaznat);
  };

  const handleDeleteWazna = async (waznaId) => {
    window.customConfirm('هل أنت متأكد من حذف سجل الافتقاد هذا؟', async () => {
      const updatedWaznat = waznat.filter(w => w.id !== waznaId && w.id !== String(waznaId));
      setWaznat(updatedWaznat);
      await syncKeyToServer('waznat', updatedWaznat);
    });
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

  // --- DEADLINE MANAGEMENT ---
  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!deadlineDate || !deadlineTime) return;

    const newDeadline = {
      id: Date.now().toString(),
      scope: 'all',
      scopeValue: '',
      date: deadlineDate,
      time: deadlineTime,
      applied: false
    };

    const updatedDeadlines = [...deadlines, newDeadline];
    setDeadlines(updatedDeadlines);
    setDeadlineDate('');
    setDeadlineTime('');

    try {
      const res = await fetch('/api/sync');
      const allData = await res.json();
      let allDeadlines = allData.deadlines || {};
      allDeadlines[currentUser.username] = updatedDeadlines;
      await syncKeyToServer('deadlines', allDeadlines);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDeadline = async (id) => {
    window.customConfirm('هل أنت متأكد من حذف هذا الميعاد؟', async () => {
      const updatedDeadlines = deadlines.filter(d => d.id !== id);
      setDeadlines(updatedDeadlines);

      try {
        const res = await fetch('/api/sync');
        const allData = await res.json();
        let allDeadlines = allData.deadlines || {};
        allDeadlines[currentUser.username] = updatedDeadlines;
        await syncKeyToServer('deadlines', allDeadlines);
      } catch (err) {
        console.error(err);
      }
    });
  };

  // --- CHAT MESSAGES ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      senderName: currentUser.name,
      senderUser: currentUser.username,
      senderRole: 'priest',
      message: newMessageText.trim(),
      channel: activeChannel,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setNewMessageText('');

    await syncKeyToServer('chat_messages', updatedMessages);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <div className={`wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* Sidebar Backdrop Mobile */}
        {sidebarShowMobile && (
          <div className="sidebar-backdrop show" onClick={() => setSidebarShowMobile(false)}></div>
        )}

        {/* Sidebar (Right-aligned) */}
        <nav id="sidebar" className={`${sidebarShowMobile ? 'show' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header" style={{ padding: '20px', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}>
            
            {/* Base64 Profile Photo Editor */}
            <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={true} />

            <div className="text-center mt-2">
              <h5 className="fw-bold mb-0" style={{ fontSize: '1rem' }}>{currentUser.name}</h5>
              <small className="church-name-sidebar" style={{ fontSize: '0.8rem' }}>{currentUser.church}</small>
            </div>



          </div>

          <ul className="list-unstyled components" style={{ overflowY: 'auto', flexGrow: 1 }}>

            <li className={`nav-item ${activeTab === 'manageOsrasTab' ? 'active' : ''}`} onClick={() => { setActiveTab('manageOsrasTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-sitemap me-2"></i> شجرة الخدمة</a>
            </li>
            <li className={`nav-item ${activeTab === 'waznatTab' ? 'active' : ''}`} onClick={() => { setActiveTab('waznatTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-book-open me-2"></i> سجل الافتقاد (الوزنات)</a>
            </li>
            <li className={`nav-item ${activeTab === 'evaluationTab' ? 'active' : ''}`} onClick={() => { setActiveTab('evaluationTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-clipboard-list me-2"></i> تقييم الخدام</a>
            </li>
            <li className={`nav-item ${activeTab === 'reportsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('reportsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-chart-line me-2"></i> التقارير والتحليلات</a>
            </li>
            <li className={`nav-item ${activeTab === 'messagesTab' ? 'active' : ''}`} onClick={() => { setActiveTab('messagesTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-comments me-2"></i> صندوق الرسائل</a>
            </li>
            <li className={`nav-item ${activeTab === 'serviceDetailsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('serviceDetailsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-chart-line me-2"></i> تفاصيل الخدمة</a>
            </li>
            <li className={`nav-item ${activeTab === 'deadlineTab' ? 'active' : ''}`} onClick={() => { setActiveTab('deadlineTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-clock me-2"></i> تحديد المواعيد</a>
            </li>
            <li className={`nav-item ${activeTab === 'promotionUpdatesTab' ? 'active' : ''}`} onClick={() => { setActiveTab('promotionUpdatesTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-random me-2"></i> تحديث المراحل</a>
            </li>
            <li className={`nav-item ${activeTab === 'serviceYearsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('serviceYearsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-calendar-alt me-2"></i> سنين الخدمة</a>
            </li>
            {hasPermission('requestPhilopateerServices') && !hasPermission('managePhilopateerServices') && (
              <li className={`nav-item ${activeTab === 'stPhilopateerCoreTab' ? 'active' : ''}`} onClick={() => { setActiveTab('stPhilopateerCoreTab'); setSidebarShowMobile(false); }}>
                <a href="#">
                  <i className="fas fa-broadcast-tower me-2"></i>
                  <span className="menu-text">st-philopateer-core</span>
                </a>
              </li>
            )}
            {hasPermission('managePhilopateerServices') && (
              <li className={`nav-item ${activeTab === 'managePhilopateerServicesTab' ? 'active' : ''}`} onClick={() => { setActiveTab('managePhilopateerServicesTab'); setSidebarShowMobile(false); }}>
                <a href="#" className="d-flex align-items-center justify-content-between">
                  <div>
                    <i className="fas fa-tasks me-2"></i>
                    <span className="menu-text">إدارة طلبات سان فيلوباتير</span>
                  </div>
                  {philopateerRequestsList.filter(r => !r.seen).length > 0 && (
                    <span className="badge bg-danger rounded-circle font-monospace ms-2" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      {philopateerRequestsList.filter(r => !r.seen).length}
                    </span>
                  )}
                </a>
              </li>
            )}
            <li className={`nav-item ${activeTab === 'settingsTab' ? 'active' : ''}`} onClick={() => { setActiveTab('settingsTab'); setSidebarShowMobile(false); }}>
              <a href="#"><i className="fas fa-cog me-2"></i> الإعدادات</a>
            </li>
            <li className="nav-item" style={{ borderTop: '1px solid rgba(201, 168, 76, 0.2)', marginTop: '10px', paddingTop: '5px' }} onClick={() => { window.location.href = '/login'; }}>
              <a href="#" style={{ color: 'var(--gold-accent, #f4e3b5)' }}><i className="fas fa-exchange-alt me-2"></i> تبديل الخدمة</a>
            </li>
          </ul>

          <div className="sidebar-footer" style={{ padding: '15px', position: 'absolute', bottom: '0', width: '100%', borderTop: '1px solid rgba(201, 168, 76, 0.1)' }}>
            <button className="btn btn-danger btn-sm w-100 py-2" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i> تسجيل الخروج
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div id="content">
          
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
                  <NotificationsBell user={currentUser} onNavigateTab={(tab) => setActiveTab(tab)} />
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
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
                <p className="mt-3 text-warning">جاري مزامنة البيانات وتحديث الجدول...</p>
              </div>
            ) : (
              <div className="fade-in">

                {/* TAB 1: SERVICE TREE */}
                {activeTab === 'manageOsrasTab' && (
                  <div>
                    {!selectedServiceForTree ? (
                      <div className="fade-in">
                        <div className="col-12 d-flex justify-content-center mb-4">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning text-dark fw-bold px-3 py-2">سنة الخدمة: {selectedYearForFilter}</span>
                          </div>
                        </div>

                        <h5 className="fw-bold text-warning mb-4 text-center">
                          <i className="fas fa-church me-2"></i> الرجاء اختيار الخدمة لعرض شجرتها ✝
                        </h5>
                        {priestRecord.osras.length > 0 ? (
                          <div className="row col-lg-9 g-4 justify-content-center mx-auto">
                            {priestRecord.osras.map(o => (
                              <div className="col-md-6 col-lg-4" key={o.name}>
                                <div 
                                  className="card h-100 text-center service-select-card cursor-pointer"
                                  onClick={() => setSelectedServiceForTree(o.name)}
                                >
                                  <div className="card-body py-4">
                                    <div className="service-icon-circle mb-3 mx-auto">
                                      <i className="fas fa-church text-warning fa-2x"></i>
                                    </div>
                                    <h5 className="fw-bold mb-2 text-primary">{o.name}</h5>
                                    <span className="badge bg-warning text-dark mb-1">يوم {o.serviceDay === 'Friday' ? 'الجمعة' : o.serviceDay}</span>
                                    <p className="text-muted small mb-0 mt-2">
                                      المراحل: {o.stages ? o.stages.length : 0} | الفصول: {o.stages ? o.stages.reduce((acc, st) => acc + (st.classes ? st.classes.length : 0), 0) : 0}
                                    </p>
                                    <button className="btn btn-warning btn-sm mt-3 w-100 fw-bold">
                                      <i className="fas fa-eye me-1"></i> عرض الخدمة
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="alert alert-warning text-center">قدسك غير معين كمسئول عن أي خدمة حالياً في هذا العام. يرجى التواصل مع الأدمن لتوزيع الخدمات.</div>
                        )}
                      </div>
                    ) : (
                      <div className="fade-in">
                        {/* Header back button */}
                        <div className="d-flex align-items-center mb-3">
                          <button 
                            className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2"
                            onClick={() => setSelectedServiceForTree('')}
                            style={{ borderRadius: '8px' }}
                          >
                            <i className="fas fa-arrow-right"></i> العودة لاختيار الخدمة
                          </button>
                        </div>

                        <ServiceTree
                          serviceName={selectedServiceForTree}
                          serviceYear={selectedYearForFilter}
                          allUsers={allUsers}
                          servants={servants}
                          makhdomeen={makhdomeen}
                          priestServices={[priestRecord]}
                          onUpdateServices={fetchInitialData}
                          onUpdateMakhdomeen={handleUpdateMakhdomeenState}
                          readOnly={false}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SERVANT EVALUATION */}
                {activeTab === 'evaluationTab' && (
                  <div className="row">
                    {/* Add Evaluation Form */}
                    <div className="col-lg-5 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-clipboard-list me-2"></i> تقييم خادم جديد</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleSaveEvaluation}>
                            <div className="mb-3">
                              <label className="form-label">الخادم المراد تقييمه</label>
                              <select
                                className="form-select"
                                value={selectedEvalServant}
                                onChange={(e) => {
                                  const username = e.target.value;
                                  setSelectedEvalServant(username);
                                  // Load existing evaluation for this servant and date if exists
                                  const existing = evaluations.find(ev => ev.servantUsername === username && ev.weekDate === evalWeekDate);
                                  if (existing) {
                                    setEvalLiturgy(existing.liturgy);
                                    setEvalService(existing.service);
                                    setEvalVisitation(existing.visitation);
                                    setEvalPreparation(existing.preparation);
                                    setEvalFamilyMeeting(existing.familyMeeting);
                                    setEvalServantMeeting(existing.servantMeeting);
                                  } else {
                                    setEvalLiturgy(false);
                                    setEvalService(false);
                                    setEvalVisitation(false);
                                    setEvalPreparation(false);
                                    setEvalFamilyMeeting(false);
                                    setEvalServantMeeting(false);
                                  }
                                }}
                                required
                              >
                                <option value="">-- اختر خادم --</option>
                                {servants.map(s => (
                                  <option key={s.username} value={s.username}>{s.name} ({s.systemCode})</option>
                                ))}
                              </select>
                            </div>

                            <div className="mb-3">
                              <label className="form-label">تاريخ أسبوع التقييم</label>
                              <input
                                type="date"
                                className="form-control"
                                value={evalWeekDate}
                                onChange={(e) => {
                                  const date = e.target.value;
                                  setEvalWeekDate(date);
                                  // Load existing evaluation for this servant and date if exists
                                  const existing = evaluations.find(ev => ev.servantUsername === selectedEvalServant && ev.weekDate === date);
                                  if (existing) {
                                    setEvalLiturgy(existing.liturgy);
                                    setEvalService(existing.service);
                                    setEvalVisitation(existing.visitation);
                                    setEvalPreparation(existing.preparation);
                                    setEvalFamilyMeeting(existing.familyMeeting);
                                    setEvalServantMeeting(existing.servantMeeting);
                                  } else {
                                    setEvalLiturgy(false);
                                    setEvalService(false);
                                    setEvalVisitation(false);
                                    setEvalPreparation(false);
                                    setEvalFamilyMeeting(false);
                                    setEvalServantMeeting(false);
                                  }
                                }}
                                required
                              />
                            </div>

                            <h6 className="text-warning fw-bold mb-3 border-bottom pb-2">بنود التقييم</h6>

                            <div className="form-check p-2 border-bottom border-secondary mb-2 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="evalLiturgy"
                                checked={evalLiturgy}
                                onChange={(e) => setEvalLiturgy(e.target.checked)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              <label className="form-check-label ms-2 cursor-pointer" htmlFor="evalLiturgy">حضور القداس الإلهي</label>
                            </div>

                            <div className="form-check p-2 border-bottom border-secondary mb-2 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="evalService"
                                checked={evalService}
                                onChange={(e) => setEvalService(e.target.checked)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              <label className="form-check-label ms-2 cursor-pointer" htmlFor="evalService">حضور الخدمة (الافتتاح والمدارس)</label>
                            </div>

                            <div className="form-check p-2 border-bottom border-secondary mb-2 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="evalVisitation"
                                checked={evalVisitation}
                                onChange={(e) => setEvalVisitation(e.target.checked)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              <label className="form-check-label ms-2 cursor-pointer" htmlFor="evalVisitation">متابعة الافتقاد الهاتفي</label>
                            </div>

                            <div className="form-check p-2 border-bottom border-secondary mb-2 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="evalPreparation"
                                checked={evalPreparation}
                                onChange={(e) => setEvalPreparation(e.target.checked)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              <label className="form-check-label ms-2 cursor-pointer" htmlFor="evalPreparation">تحضير الدروس والأنشطة</label>
                            </div>

                            <div className="form-check p-2 border-bottom border-secondary mb-2 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="evalFamilyMeeting"
                                checked={evalFamilyMeeting}
                                onChange={(e) => setEvalFamilyMeeting(e.target.checked)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              <label className="form-check-label ms-2 cursor-pointer" htmlFor="evalFamilyMeeting">حضور اجتماع الأسرة</label>
                            </div>

                            <div className="form-check p-2 border-bottom border-secondary mb-3 d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="evalServantMeeting"
                                checked={evalServantMeeting}
                                onChange={(e) => setEvalServantMeeting(e.target.checked)}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              <label className="form-check-label ms-2 cursor-pointer" htmlFor="evalServantMeeting">حضور اجتماع الخدام</label>
                            </div>

                            <button type="submit" className="btn btn-warning w-100 py-2" disabled={evalSaving}>
                              {evalSaving ? 'جاري الحفظ...' : 'حفظ التقييم ✝'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {/* Evaluations History List */}
                    <div className="col-lg-7">
                      <div className="card shadow mb-4">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-history me-2"></i> سجل تقييمات الخدام</h5>
                        </div>
                        <div className="card-body">
                          {evaluations.length === 0 ? (
                            <p className="text-muted text-center py-5">لا توجد تقييمات مسجلة بعد.</p>
                          ) : (
                            <div className="table-responsive">
                              <table className="table align-middle text-center">
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th className="text-start">الخادم</th>
                                    <th>التاريخ</th>
                                    <th>قداس</th>
                                    <th>خدمة</th>
                                    <th>افتقاد</th>
                                    <th>تحضير</th>
                                    <th>أسرة</th>
                                    <th>خدام</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {evaluations.map((ev) => {
                                    const srv = servants.find(s => s.username === ev.servantUsername);
                                    return (
                                      <tr key={ev.id}>
                                        <td className="text-start fw-bold">{srv ? srv.name : ev.servantUsername}</td>
                                        <td><code>{ev.weekDate}</code></td>
                                        <td>{ev.liturgy ? '✅' : '❌'}</td>
                                        <td>{ev.service ? '✅' : '❌'}</td>
                                        <td>{ev.visitation ? '✅' : '❌'}</td>
                                        <td>{ev.preparation ? '✅' : '❌'}</td>
                                        <td>{ev.familyMeeting ? '✅' : '❌'}</td>
                                        <td>{ev.servantMeeting ? '✅' : '❌'}</td>
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
                )}

                {/* TAB 2: WAZNAT (VISITATIONS) */}
                {activeTab === 'waznatTab' && (
                  <div className="row">
                    {/* Add Wazna Form */}
                    <div className="col-lg-4 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-plus-circle me-2"></i> تسجيل افتقاد مباشر</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleAddWazna}>
                            <div className="mb-3">
                              <label className="form-label">الخادم</label>
                              <select
                                className="form-select"
                                value={newWaznaServant}
                                onChange={(e) => setNewWaznaServant(e.target.value)}
                                required
                              >
                                <option value="">-- اختر خادم --</option>
                                {servants.map(s => (
                                  <option key={s.username} value={s.username}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">اسم المخدوم</label>
                              <input
                                type="text"
                                className="form-control"
                                value={newWaznaName}
                                onChange={(e) => setNewWaznaName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">الأسرة</label>
                              <select
                                className="form-select"
                                value={newWaznaOsra}
                                onChange={(e) => {
                                  setNewWaznaOsra(e.target.value);
                                  setNewWaznaFasl('');
                                }}
                              >
                                <option value="">-- اختر أسرة --</option>
                                {priestRecord.osras.map(o => (
                                  <option key={o.name} value={o.name}>{o.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">الفصل</label>
                              <select
                                className="form-select"
                                value={newWaznaFasl}
                                onChange={(e) => {
                                  const selectedVal = e.target.value;
                                  setNewWaznaFasl(selectedVal);
                                  if (selectedVal && !newWaznaOsra) {
                                    const parentOsra = priestRecord.osras.find(o => {
                                      const yearsKeys = o.years ? Object.keys(o.years) : [];
                                      const latestYear = yearsKeys.length > 0 ? yearsKeys[yearsKeys.length - 1] : null;
                                      const list = latestYear 
                                        ? (o.years[latestYear]?.classes || []) 
                                        : (o.fasls || o.classes || []);
                                      return list.includes(selectedVal);
                                    });
                                    if (parentOsra) {
                                      setNewWaznaOsra(parentOsra.name);
                                    }
                                  }
                                }}
                              >
                                <option value="">-- اختر فصل --</option>
                                 {(() => {
                                   let classesList = [];
                                   if (newWaznaOsra) {
                                     const selectedOsraObj = priestRecord.osras.find(o => o.name === newWaznaOsra);
                                     if (selectedOsraObj) {
                                       const yearsKeys = selectedOsraObj.years ? Object.keys(selectedOsraObj.years) : [];
                                       const latestYear = yearsKeys.length > 0 ? yearsKeys[yearsKeys.length - 1] : null;
                                       classesList = latestYear 
                                         ? (selectedOsraObj.years[latestYear]?.classes || []) 
                                         : (selectedOsraObj.fasls || selectedOsraObj.classes || []);
                                     }
                                   } else {
                                     priestRecord.osras.forEach(o => {
                                       const yearsKeys = o.years ? Object.keys(o.years) : [];
                                       const latestYear = yearsKeys.length > 0 ? yearsKeys[yearsKeys.length - 1] : null;
                                       const list = latestYear 
                                         ? (o.years[latestYear]?.classes || []) 
                                         : (o.fasls || o.classes || []);
                                       list.forEach(c => {
                                         if (!classesList.includes(c)) classesList.push(c);
                                       });
                                     });
                                   }
                                   classesList = classesList.filter(c => c && c !== 'عام');
                                   return classesList.map(c => (
                                     <option key={c} value={c}>{c}</option>
                                   ));
                                 })()}
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">نوع الافتقاد</label>
                              <select
                                className="form-select"
                                value={newWaznaType}
                                onChange={(e) => setNewWaznaType(e.target.value)}
                              >
                                <option value="افتقاد">زيارة منزلية (افتقاد)</option>
                                <option value="مكالمة">مكالمة تليفونية</option>
                                <option value="قناة">متابعة إلكترونية / شات</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">تاريخ الافتقاد</label>
                              <input
                                type="date"
                                className="form-control"
                                value={newWaznaDate}
                                onChange={(e) => setNewWaznaDate(e.target.value)}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">ملاحظات</label>
                              <textarea
                                className="form-control"
                                value={newWaznaNotes}
                                onChange={(e) => setNewWaznaNotes(e.target.value)}
                                rows="3"
                              ></textarea>
                            </div>
                            <button type="submit" className="btn btn-warning w-100 py-2">تسجيل الافتقاد</button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {/* Waznat list */}
                    <div className="col-lg-8">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-history me-2"></i> سجلات الافتقاد المسجلة</h5>
                        </div>
                        <div className="card-body">
                          {waznat.length === 0 ? (
                            <p className="text-muted text-center py-4">لم يتم تسجيل أي زيارة افتقاد بعد.</p>
                          ) : (
                            <div className="table-responsive">
                              <table className="table align-middle">
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th>المخدوم</th>
                                    <th>الخادم</th>
                                    <th>النوع</th>
                                    <th>التاريخ</th>
                                    <th>الملاحظات</th>
                                    <th className="text-center">الحالة</th>
                                    <th className="text-center">إجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {waznat.map((w) => (
                                    <tr key={w.id}>
                                      <td className="fw-bold">{w.name}</td>
                                      <td>{servants.find(s => s.username === w.servantUser)?.name || w.servantUser}</td>
                                      <td>{w.type}</td>
                                      <td>{w.date}</td>
                                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.notes || '-'}</td>
                                      <td className="text-center">
                                        <span
                                          onClick={() => handleToggleWaznaChecked(w.id)}
                                          className={`badge cursor-pointer ${w.checked ? 'bg-success' : 'bg-warning text-dark'}`}
                                          style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                          title="اضغط للتعديل"
                                        >
                                          {w.checked ? 'تم المتابعة ✝' : 'جاري التدقيق'}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteWazna(w.id)}>
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

                {/* TAB 3: REPORTS & CHARTS */}
                {activeTab === 'reportsTab' && (
                  <div className="row justify-content-center">
                    <div className="col-md-8 text-center py-5">
                      <div className="card shadow py-5">
                        <span style={{ fontSize: '3rem' }}>📊</span>
                        <h4 className="mt-3 fw-bold text-warning">التقارير الإحصائية</h4>
                        <p className="px-4 text-muted" style={{ fontSize: '0.95rem' }}>
                          في هذا التبويب سيتم احتساب إحصائيات الافتقاد الأسبوعية والشهرية، وعرض نسب الافتقاد ومقارنتها بتواريخ تسليم الوزنات للخدام ومقارنة غياب المخدمين بطرق ذكية.
                        </p>
                        <div className="d-flex justify-content-center gap-3 mt-4">
                          <div className="p-3 border rounded border-warning" style={{ width: '150px' }}>
                            <h2 className="fw-bold">{waznat.length}</h2>
                            <small className="text-muted">إجمالي الافتقادات</small>
                          </div>
                          <div className="p-3 border rounded border-success" style={{ width: '150px' }}>
                            <h2 className="fw-bold">{waznat.filter(w => w.checked).length}</h2>
                            <small className="text-muted">مكتملة المتابعة</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: CHAT MESSAGES */}
                {activeTab === 'messagesTab' && (
                  <div className="row">
                    {/* Chat channels */}
                    <div className="col-md-4 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-hashtag me-2"></i> قنوات المحادثة</h5>
                        </div>
                        <div className="list-group list-group-flush" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                          <button
                            onClick={() => setActiveChannel('عام')}
                            className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-3 ${activeChannel === 'عام' ? 'text-warning fw-bold border-start border-3 border-warning' : ''}`}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            ✝ القناة العامة للخدام
                          </button>
                          {priestRecord.osras.map(osra => (
                            <button
                              key={osra.name}
                              onClick={() => setActiveChannel(osra.name)}
                              className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-3 ${activeChannel === osra.name ? 'text-warning fw-bold border-start border-3 border-warning' : ''}`}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              ✦ مجموعة: {osra.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Chat screen */}
                    <div className="col-md-8">
                      <div className="card shadow d-flex flex-column" style={{ height: '500px' }}>
                        <div className="card-header py-3 d-flex justify-content-between align-items-center">
                          <h5 className="mb-0 fw-bold text-warning">
                            <i className="fas fa-comments me-2"></i> محادثة # {activeChannel}
                          </h5>
                        </div>
                        
                        <div className="card-body flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3" style={{ overflowY: 'scroll' }}>
                          {chatMessages.filter(m => m.channel === activeChannel).length === 0 ? (
                            <div className="text-center my-auto text-muted">لا توجد رسائل في هذه المجموعة بعد. ابدأ بكتابة رسالة!</div>
                          ) : (
                            chatMessages.filter(m => m.channel === activeChannel).map((m) => (
                              <div
                                key={m.id}
                                className={`d-flex flex-column ${m.senderUser === currentUser.username ? 'align-self-end text-end' : 'align-self-start text-start'}`}
                                style={{ maxWidth: '70%' }}
                              >
                                <small className="text-warning mb-1" style={{ fontSize: '0.75rem' }}>{m.senderName} ({m.senderRole === 'priest' ? 'كاهن' : 'خادم'})</small>
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

                {/* TAB 5: DEADLINES (SCHEDULES) */}
                {activeTab === 'deadlineTab' && (
                  <div className="row">
                    <div className="col-lg-5 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-calendar-plus me-2"></i> تحديد ميعاد جديد لتسليم الافتقاد</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleAddDeadline}>
                            <div className="mb-3">
                              <label className="form-label">التاريخ الأقصى للتسليم</label>
                              <input
                                type="date"
                                className="form-control"
                                value={deadlineDate}
                                onChange={(e) => setDeadlineDate(e.target.value)}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">الوقت الأقصى للتسليم</label>
                              <input
                                type="time"
                                className="form-control"
                                value={deadlineTime}
                                onChange={(e) => setDeadlineTime(e.target.value)}
                                required
                              />
                            </div>
                            <button type="submit" className="btn btn-warning w-100 py-2">حفظ وتعميم الميعاد</button>
                          </form>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-7">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-stopwatch me-2"></i> المواعيد المحددة للخدام</h5>
                        </div>
                        <div className="card-body">
                          {deadlines.length === 0 ? (
                            <p className="text-muted text-center py-4">لم يتم تحديد أي مواعيد لتسليم الافتقادات حتى الآن.</p>
                          ) : (
                            <div className="table-responsive">
                              <table className="table align-middle">
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th>التاريخ</th>
                                    <th>الوقت</th>
                                    <th className="text-center">إجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {deadlines.map((dl) => (
                                    <tr key={dl.id}>
                                      <td className="fw-bold">{dl.date}</td>
                                      <td>{dl.time}</td>
                                      <td className="text-center">
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDeadline(dl.id)}>
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

              {/* TAB: PROMOTION UPDATES */}
              {activeTab === 'promotionUpdatesTab' && (() => {
                const myAllOsraStages = (priestRecord.osras || []).flatMap(o => (o.stages || []).map(st => st.name));

                const pendingMembers = makhdomeen.filter(m => {
                  if (!m.pendingPromotionFrom) return false;
                  
                  const stageDef = stagesList.find(s => s.name === m.pendingPromotionFrom);
                  if (!stageDef) return true;

                  if (stageDef.promotionType === 'manual') {
                    const allowedTargets = stageDef.allowedTargets || [];
                    if (allowedTargets.length > 0) {
                      return allowedTargets.some(t => myAllOsraStages.includes(t));
                    }
                  }
                  return true;
                });

                return (
                  <div className="fade-in">
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-random me-2"></i> تسكين المخدومين الجدد في قطاعات الخدمة</h5>
                      </div>
                      <div className="card-body">
                        <div className="alert alert-info mb-4">
                          <h6 className="fw-bold"><i className="fas fa-info-circle me-2"></i> مخدومين بانتظار التسكين اليدوي:</h6>
                          <p className="mb-0 text-white-50 small">يظهر هنا المخدومون الذين تخرجوا من مرحلتهم السابقة وبانتظار تحديد الخدمة والمرحلة الجديدة وتسكينهم.</p>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead>
                              <tr className="text-warning">
                                <th>اسم المخدوم</th>
                                <th>النوع</th>
                                <th>المرحلة السابقة</th>
                                <th>تحديد الخدمة الجديدة</th>
                                <th>تحديد المرحلة الجديدة</th>
                                <th>الإجراء</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingMembers.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">لا يوجد مخدومين بانتظار التسكين حالياً.</td>
                                </tr>
                              ) : (
                                pendingMembers.map(m => {
                                  const currentSelection = selectedTargets[m.id] || { osra: '', stage: '' };
                                  const selectedOsraObj = (priestRecord.osras || []).find(o => o.name === currentSelection.osra);
                                  const osraStages = selectedOsraObj ? (selectedOsraObj.stages || []).map(st => st.name) : [];
                                  
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
                                        <select
                                          className="form-select form-select-sm"
                                          style={{ maxWidth: '180px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                          value={currentSelection.osra}
                                          onChange={(e) => setSelectedTargets(prev => ({
                                            ...prev,
                                            [m.id]: { osra: e.target.value, stage: '' }
                                          }))}
                                        >
                                          <option value="">-- اختر الخدمة --</option>
                                          {(priestRecord.osras || []).map(o => (
                                            <option key={o.name} value={o.name}>{o.name}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          style={{ maxWidth: '180px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                          value={currentSelection.stage}
                                          onChange={(e) => setSelectedTargets(prev => ({
                                            ...prev,
                                            [m.id]: { ...prev[m.id], stage: e.target.value }
                                          }))}
                                          disabled={!currentSelection.osra}
                                        >
                                          <option value="">-- اختر المرحلة --</option>
                                          {osraStages.map(stName => (
                                            <option key={stName} value={stName}>{stName}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-warning btn-sm fw-bold"
                                          onClick={() => handleAssignPendingMember(m.id, currentSelection.stage, currentSelection.osra)}
                                          disabled={!currentSelection.osra || !currentSelection.stage}
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

                {/* TAB 6: SETTINGS */}
                {/* TAB: SERVICE YEARS */}
                {activeTab === 'serviceYearsTab' && (
                  <div className="fade-in">
                    <div className="row g-4 justify-content-center">
                      <div className="col-lg-6">
                        <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <div className="card-body p-4">
                            <h5 className="fw-bold text-warning mb-4"><i className="fas fa-calendar-alt me-2"></i> سنين الخدمة المسجلة</h5>
                            <div className="list-group">
                              {serviceYearsList.map(yr => {
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

                {activeTab === 'serviceDetailsTab' && (
                  <ServiceDetailsView
                    currentUser={currentUser}
                    priestServicesList={priestServicesList}
                    servants={servants}
                    evaluationTemplates={evaluationTemplates}
                    servantEvaluations={servantEvaluations}
                    preparations={preparations}
                    preparationSubmissions={preparationSubmissions}
                    selectedYearForFilter={selectedYearForFilter}
                  />
                )}

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
          <Footer />
        </div>

      </div>
    </div>
  );
}
