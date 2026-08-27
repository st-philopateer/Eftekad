import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

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

import ServiceTree from '../components/ServiceTree';
import Footer from '../components/Footer';
import NotificationsBell from '../components/NotificationsBell';
import ServiceDetailsView from './ServiceDetailsView';
import PhilopateerCoreView from './PhilopateerCoreView';

export default function CoordinatorDashboard({ isAssistant = false, isGeneral = false, onSwitchToAdmin }) {
  const navigate = useNavigate();
  const determinedRole = isGeneral ? 'general_coordinator' : (isAssistant ? 'assistant_family_coordinator' : 'family_coordinator');
  
  // User details local state (to dynamically update profile picture)
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [activeService, setActiveService] = useState(() => {
    return localStorage.getItem('activeService_' + (JSON.parse(localStorage.getItem('currentUser') || '{}').username || '')) || '';
  });
  const [activeStage, setActiveStage] = useState(() => {
    return localStorage.getItem('activeStage_' + (JSON.parse(localStorage.getItem('currentUser') || '{}').username || '')) || '';
  });
  const [selectedServiceForTree, setSelectedServiceForTree] = useState('');
  
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
    const stored = localStorage.getItem('coordinatorActiveTab') || 'treeTab';
    const tabPermMap = {
      treeTab: 'viewServiceTree',
      directEntryTab: 'addDirectVisitation',
      waznatTab: 'viewVisitationLogs',
      messagesTab: 'viewMessages',
      evaluationsTab: 'viewEvaluations',
      servantsEvaluationsTab: 'viewServantsEvaluations',
      preparationsTab: 'managePreparations',
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
      treeTab: 'viewServiceTree',
      directEntryTab: 'addDirectVisitation',
      waznatTab: 'viewVisitationLogs',
      messagesTab: 'viewMessages',
      evaluationsTab: 'viewEvaluations',
      servantsEvaluationsTab: 'viewServantsEvaluations',
      preparationsTab: 'managePreparations',
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
  const [services, setServices] = useState([]);
  const [selectedYearForFilter, setSelectedYearForFilter] = useState(() => {
    const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return localStorage.getItem('activeServiceYear_' + userObj.username) || new Date().getFullYear().toString();
  });
  const [serviceYearsList, setServiceYearsList] = useState([]);
  const [stagesList, setStagesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  useEffect(() => {
    if (activeService) {
      setSelectedServiceForTree(activeService);
    }
  }, [activeService]);

  const getUserServicesAndStages = () => {
    const usernameLower = (currentUser.username || '').toLowerCase();
    const myServices = [];
    
    (services || []).forEach(srv => {
      (srv.osras || []).forEach(osra => {
        const isOsraCoord = (osra.coordinatorUser || '').toLowerCase() === usernameLower;
        const isOsraAsst = (osra.assistantCoordinatorUser || '').toLowerCase() === usernameLower;
        const isFamilyCoord = (osra.familyCoordinatorUser || '').toLowerCase() === usernameLower;
        const isFamilyAsst = (osra.assistantFamilyCoordinatorUser || '').toLowerCase() === usernameLower;

        let assignedInStage = false;
        const matchedStages = [];
        (osra.stages || []).forEach(stage => {
          const isStgGeneral = (stage.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
          const isStgFamily = (stage.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
          const isStgAsstFamily = (stage.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
          if (isStgGeneral || isStgFamily || isStgAsstFamily) {
            assignedInStage = true;
            matchedStages.push(stage.name);
          }
        });

        if (isOsraCoord || isOsraAsst || isFamilyCoord || isFamilyAsst || assignedInStage) {
          myServices.push({
            name: osra.name,
            serviceDay: osra.serviceDay,
            allStages: (osra.stages || []).map(s => s.name),
            assignedStages: matchedStages,
            isOsraLevel: isOsraCoord || isOsraAsst || isFamilyCoord || isFamilyAsst
          });
        }
      });
    });
    
    return myServices;
  };
  const [selectedTargets, setSelectedTargets] = useState({});

  const [makhdomeen, setMakhdomeen] = useState([]);
  const [servants, setServants] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState('عام');
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [waznat, setWaznat] = useState([]);

  // Evaluations and preparations custom states
  const [evaluationTemplates, setEvaluationTemplates] = useState([]);
  const [servantEvaluations, setServantEvaluations] = useState([]);
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split('T')[0]);
  // Edit & Delete Service State
  const [editingServiceModal, setEditingServiceModal] = useState(null);
  const [deletingServiceModal, setDeletingServiceModal] = useState(null);

  const confirmDeleteService = async (serviceNameToDelete) => {
    try {
      const cleanServices = [...services];
      cleanServices.forEach(record => {
        const sYear = record.serviceYear || new Date().getFullYear().toString();
        if (sYear === selectedYearForFilter) {
          record.osras = (record.osras || []).filter(o => o.name !== serviceNameToDelete);
        }
      });

      const syncResponse = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanServices)
      });

      if (syncResponse.ok) {
        window.customAlert(`تم حذف خدمة "${serviceNameToDelete}" بنجاح! ✝`);
        setDeletingServiceModal(null);
        fetchInitialData();
      } else {
        window.customAlert('فشل حذف الخدمة من السيرفر.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء حذف الخدمة.');
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editingServiceModal || !editingServiceModal.name.trim()) return;

    const oldName = editingServiceModal.oldName;
    const newName = editingServiceModal.name.trim();
    const newDay = editingServiceModal.serviceDay || 'Friday';

    try {
      const cleanServices = [...services];
      let found = false;

      cleanServices.forEach(record => {
        const sYear = record.serviceYear || new Date().getFullYear().toString();
        if (sYear === selectedYearForFilter) {
          (record.osras || []).forEach(o => {
            if (o.name === oldName) {
              o.name = newName;
              o.serviceDay = newDay;
              found = true;
            }
          });
        }
      });

      if (!found) {
        window.customAlert('لم يتم العثور على الخدمة لتعديلها!');
        return;
      }

      const syncResponse = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanServices)
      });

      if (syncResponse.ok) {
        window.customAlert('تم تعديل بيانات الخدمة بنجاح! ✝');
        setEditingServiceModal(null);
        fetchInitialData();
      } else {
        window.customAlert('فشل حفظ التعديلات على السيرفر.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء تعديل الخدمة.');
    }
  };

  const handleDeleteService = async (serviceNameToDelete) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف خدمة "${serviceNameToDelete}" وكافة مراحلها وفصولها لعام ${selectedYearForFilter}؟`)) {
      return;
    }

    try {
      const cleanServices = [...services];
      cleanServices.forEach(record => {
        const sYear = record.serviceYear || new Date().getFullYear().toString();
        if (sYear === selectedYearForFilter) {
          record.osras = (record.osras || []).filter(o => o.name !== serviceNameToDelete);
        }
      });

      const syncResponse = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanServices)
      });

      if (syncResponse.ok) {
        window.customAlert(`تم حذف خدمة "${serviceNameToDelete}" بنجاح! ✝`);
        fetchInitialData();
      } else {
        window.customAlert('فشل حذف الخدمة من السيرفر.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء حذف الخدمة.');
    }
  };

  const [waznatWeekDate, setWaznatWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all');
  const [preparations, setPreparations] = useState([]);
  const [philopateerRequestsList, setPhilopateerRequestsList] = useState([]);
  const [preparationSubmissions, setPreparationSubmissions] = useState([]);
  const [servantVisitations, setServantVisitations] = useState([]);
  const [visibleVisitationDetailTemplateId, setVisibleVisitationDetailTemplateId] = useState(null);


  const [newEvalName, setNewEvalName] = useState('');
  const [newEvalType, setNewEvalType] = useState('checkbox');
  const [newEvalServiceName, setNewEvalServiceName] = useState('');
  const [newEvalClass, setNewEvalClass] = useState('all');
  const [newEvalTargetDay, setNewEvalTargetDay] = useState('Friday');
  const [showScannerTemplateId, setShowScannerTemplateId] = useState(null);
  const [evalSubTab, setEvalSubTab] = useState('criteria'); // 'criteria' or 'servants'
  const [selectedServantUsername, setSelectedServantUsername] = useState(null);
  const [servantSearchQuery, setServantSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null); // object to edit
  
  // Edit template form states
  const [editEvalName, setEditEvalName] = useState('');
  const [editEvalType, setEditEvalType] = useState('checkbox');
  const [editEvalServiceName, setEditEvalServiceName] = useState('');
  const [editEvalClass, setEditEvalClass] = useState('all');
  const [editEvalTargetDay, setEditEvalTargetDay] = useState('Friday');

  const [newPrepLessonName, setNewPrepLessonName] = useState('');
  const [newPrepObjectives, setNewPrepObjectives] = useState('');
  const [newPrepDeadline, setNewPrepDeadline] = useState('');
  const [newPrepServiceName, setNewPrepServiceName] = useState('');
  const [newPrepClass, setNewPrepClass] = useState('all');
  const [selectedPrepIdForSubmissions, setSelectedPrepIdForSubmissions] = useState(null);



  // Waznat form states
  const [newWaznaServant, setNewWaznaServant] = useState('');
  const [newWaznaOsra, setNewWaznaOsra] = useState('');
  const [newWaznaFasl, setNewWaznaFasl] = useState('');
  const [newWaznaName, setNewWaznaName] = useState('');
  const [newWaznaPhone, setNewWaznaPhone] = useState('');
  const [newWaznaAddress, setNewWaznaAddress] = useState('');
  const [newWaznaType, setNewWaznaType] = useState('اتصال');
  const [newWaznaNotes, setNewWaznaNotes] = useState('');
  const [newWaznaDate, setNewWaznaDate] = useState(new Date().toISOString().split('T')[0]);

  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef(null);

  const [pendingTransferNotif, setPendingTransferNotif] = useState(null);
  const [subScores, setSubScores] = useState({});
  const [savingGrades, setSavingGrades] = useState({});
  const [subComments, setSubComments] = useState({});
  const [transferGenderFilter, setTransferGenderFilter] = useState('all');

  const [settingsName, setSettingsName] = useState(currentUser.name || '');
  const [settingsUsername, setSettingsUsername] = useState(currentUser.username || '');
  const [settingsEmail, setSettingsEmail] = useState(currentUser.email || '');
  const [settingsChurch, setSettingsChurch] = useState(currentUser.church || '');
  const [settingsPassword, setSettingsPassword] = useState(currentUser.password || '');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    setSettingsName(currentUser.name || '');
    setSettingsUsername(currentUser.username || '');
    setSettingsEmail(currentUser.email || '');
    setSettingsChurch(currentUser.church || '');
    setSettingsPassword(currentUser.password || '');
  }, [currentUser.username, currentUser.name, currentUser.email, currentUser.church, currentUser.password]);

  useEffect(() => {
    setNewPrepServiceName(activeService || '');
    setNewEvalServiceName(activeService || '');
  }, [activeService]);

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

  const getMyAssignedClasses = (selectedService) => {
    const list = [];
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(o => {
          if (o.name === selectedService) {
            (o.stages || []).forEach(st => {
              const isStageCoord = 
                (st.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
                (st.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()) ||
                (st.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase());
              
              const isOsraCoord = 
                (o.coordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
                (o.assistantCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
                (o.familyCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
                (o.assistantFamilyCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase();

              (st.classes || []).forEach(c => {
                const isClassServantOrCoord = isOsraCoord || isStageCoord || (c.servants && c.servants.map(x => x.toLowerCase()).includes((currentUser.username || '').toLowerCase()));
                if (isClassServantOrCoord) {
                  list.push({ stageName: st.name, className: c.name });
                }
              });
            });
          }
        });
      }
    });
    return list;
  };

  const isServantInClass = (servantUsername, stageName, className) => {
    if (!stageName || !className) return true;
    let found = false;
    services.forEach(record => {
      (record.osras || []).forEach(o => {
        (o.stages || []).forEach(st => {
          if (st.name === stageName) {
            (st.classes || []).forEach(c => {
              if (c.name === className) {
                if (c.servants && c.servants.includes(servantUsername)) {
                  found = true;
                }
              }
            });
          }
        });
      });
    });
    return found;
  };

  const isServantInService = (servantUsername, serviceName) => {
    let found = false;
    services.forEach(record => {
      (record.osras || []).forEach(o => {
        if (o.name === serviceName) {
          (o.stages || []).forEach(st => {
            (st.classes || []).forEach(c => {
              if (c.servants && c.servants.includes(servantUsername)) {
                found = true;
              }
            });
          });
        }
      });
    });
    return found;
  };

  const isServantAssociatedWithTemplate = (servantUsername, t) => {
    if (t.stageName && t.className) {
      return isServantInClass(servantUsername, t.stageName, t.className);
    }
    if (isServantInService(servantUsername, t.serviceName)) {
      return true;
    }
    const servantObj = servants.find(s => s.username === servantUsername);
    if (servantObj?.osra === t.serviceName) {
      return true;
    }
    return false;
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
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
  };

  const getServantAssignedClasses = (username) => {
    if (!activeService) return 'غير موزع';
    const found = [];
    services.forEach(record => {
      (record.osras || []).forEach(o => {
        if (o.name === activeService) {
          (o.stages || []).forEach(st => {
            (st.classes || []).forEach(c => {
              if (c.servants && c.servants.includes(username)) {
                found.push(`${st.name} - ${c.name}`);
              }
            });
          });
        }
      });
    });
    return found.length > 0 ? found.join(', ') : 'غير موزع';
  };

  const getServantServiceFromTree = (username) => {
    let foundService = '';
    services.forEach(record => {
      (record.osras || []).forEach(o => {
        (o.stages || []).forEach(st => {
          (st.classes || []).forEach(c => {
            if (c.servants && c.servants.includes(username)) {
              foundService = o.name;
            }
          });
        });
      });
    });
    return foundService;
  };

  const getCoordinatorServicesList = () => {
    const managedServices = [];
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(o => {
          const isOsraCoord = 
            o.coordinatorUser === currentUser.username ||
            o.assistantCoordinatorUser === currentUser.username ||
            o.familyCoordinatorUser === currentUser.username ||
            o.assistantFamilyCoordinatorUser === currentUser.username;
          
          if (isOsraCoord) {
            if (!managedServices.includes(o.name)) managedServices.push(o.name);
          }

          (o.stages || []).forEach(st => {
            const isStageCoord = 
              (st.generalCoordinatorUsers || []).includes(currentUser.username) ||
              (st.familyCoordinatorUsers || []).includes(currentUser.username) ||
              (st.assistantFamilyCoordinatorUsers || []).includes(currentUser.username);
            
            if (isStageCoord || isOsraCoord) {
              if (!managedServices.includes(o.name)) managedServices.push(o.name);
            } else {
              (st.classes || []).forEach(c => {
                const isClassServantOrCoord = (c.servants && c.servants.includes(currentUser.username));
                if (isClassServantOrCoord) {
                  if (!managedServices.includes(o.name)) managedServices.push(o.name);
                }
              });
            }
          });
        });
      }
    });
    return managedServices;
  };

  const getWeeksListForSelectedService = () => {
    let osraName = '';
    if (selectedServantUsername) {
      const sObj = servants.find(s => s.username === selectedServantUsername);
      osraName = getServantServiceFromTree(selectedServantUsername) || sObj?.osra || '';
    }
    if (!osraName) {
      const coordServants = getCoordinatorServants ? getCoordinatorServants() : [];
      if (coordServants.length > 0 && coordServants[0].username) {
        const sObj = servants.find(s => s.username === coordServants[0].username);
        osraName = getServantServiceFromTree(coordServants[0].username) || sObj?.osra || '';
      }
    }
    if (!osraName) {
      const myOsras = getCoordinatorServicesList();
      if (myOsras.length > 0) osraName = myOsras[0];
    }
    if (!osraName) return [];
    
    let serviceDay = 'Friday';
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(o => {
          if (o.name === osraName && o.serviceDay) {
            serviceDay = o.serviceDay;
          }
        });
      }
    });
    
    let allWeeks = getWeeksForServiceDay(selectedYearForFilter, serviceDay);
    if (selectedMonthFilter !== 'all') {
      const targetMonthIndex = parseInt(selectedMonthFilter);
      allWeeks = allWeeks.filter(wk => {
        const parts = wk.split('-');
        return parseInt(parts[1]) === targetMonthIndex;
      });
    }
    return allWeeks;
  };

  const getCoordinatorServants = () => {
    const managedClasses = [];
    const managedServices = [];
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(o => {
          const isOsraCoord = 
            o.coordinatorUser === currentUser.username ||
            o.assistantCoordinatorUser === currentUser.username ||
            o.familyCoordinatorUser === currentUser.username ||
            o.assistantFamilyCoordinatorUser === currentUser.username;
          
          if (isOsraCoord) {
            managedServices.push(o.name);
          }

          (o.stages || []).forEach(st => {
            const isStageCoord = 
              (st.generalCoordinatorUsers || []).includes(currentUser.username) ||
              (st.familyCoordinatorUsers || []).includes(currentUser.username) ||
              (st.assistantFamilyCoordinatorUsers || []).includes(currentUser.username);
            
            if (isStageCoord || isOsraCoord) {
              (st.classes || []).forEach(c => {
                managedClasses.push({ serviceName: o.name, stageName: st.name, className: c.name, servants: c.servants || [] });
              });
            } else {
              (st.classes || []).forEach(c => {
                const isClassServantOrCoord = (c.servants && c.servants.includes(currentUser.username));
                if (isClassServantOrCoord) {
                  managedClasses.push({ serviceName: o.name, stageName: st.name, className: c.name, servants: c.servants || [] });
                }
              });
            }
          });
        });
      }
    });

    const servantUsernames = new Set();
    managedClasses.forEach(c => {
      c.servants.forEach(username => servantUsernames.add(username));
    });

    return servants.filter(s => {
      if (servantUsernames.has(s.username)) return true;
      if (s.osra && managedServices.includes(s.osra)) return true;
      return false;
    });
  };

  const handleStartEditTemplate = (tpl) => {
    setEditingTemplate(tpl);
    setEditEvalName(tpl.name || '');
    setEditEvalType(tpl.type || 'checkbox');
    setEditEvalServiceName(tpl.serviceName || '');
    const classVal = (tpl.stageName && tpl.className) ? `${tpl.stageName}|${tpl.className}` : 'all';
    setEditEvalClass(classVal);
    setEditEvalTargetDay(tpl.targetDay || 'Friday');
  };

  const handleUpdateEvalTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;
    const serviceName = activeService || editEvalServiceName;
    if (!editEvalName.trim() || !serviceName) {
      window.customAlert("يرجى كتابة اسم التقييم!");
      return;
    }
    let stageName = (activeStage && activeStage !== 'كل المراحل') ? activeStage : '';
    let className = '';
    try {
      const response = await fetch(`/api/evaluation-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEvalName.trim(),
          type: editEvalType,
          serviceName,
          stageName,
          className,
          targetDay: (editEvalType === 'qr_liturgy' || editEvalType === 'visitation') ? 'Friday' : undefined
        })
      });
      if (response.ok) {
        window.customAlert("تم تحديث بند التقييم بنجاح! ✝");
        setEditingTemplate(null);
        fetchInitialData();
      } else {
        window.customAlert("فشل تحديث بند التقييم.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMyServicesList = () => {
    const list = [];
    services.forEach(record => {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === selectedYearForFilter) {
        (record.osras || []).forEach(o => {
          const isCoord = 
            o.coordinatorUser === currentUser.username ||
            o.assistantCoordinatorUser === currentUser.username ||
            o.familyCoordinatorUser === currentUser.username ||
            o.assistantFamilyCoordinatorUser === currentUser.username ||
            (o.stages || []).some(st => 
              (st.generalCoordinatorUsers || []).includes(currentUser.username) ||
              (st.familyCoordinatorUsers || []).includes(currentUser.username) ||
              (st.assistantFamilyCoordinatorUsers || []).includes(currentUser.username)
            );
          if (isCoord && !list.includes(o.name)) {
            list.push(o.name);
          }
        });
      }
    });
    return list;
  };

  const handleCreateEvalTemplate = async (e) => {
    e.preventDefault();
    if (!newEvalName.trim() || !newEvalServiceName) {
      window.customAlert("يرجى كتابة اسم التقييم واختيار الخدمة!");
      return;
    }
    let stageName = '';
    let className = '';
    if (newEvalClass && newEvalClass !== 'all') {
      const parts = newEvalClass.split('|');
      stageName = parts[0];
      className = parts[1];
    }
    try {
      const response = await fetch('/api/evaluation-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEvalName.trim(),
          type: newEvalType,
          serviceName: newEvalServiceName,
          stageName,
          className,
          serviceYear: selectedYearForFilter,
          targetDay: (newEvalType === 'qr_liturgy' || newEvalType === 'visitation') ? 'Friday' : undefined
        })
      });
      if (response.ok) {
        window.customAlert("تم إضافة قالب التقييم بنجاح! ✝");
        setNewEvalName('');
        setNewEvalServiceName(activeService);
        setNewEvalClass('all');
        fetchInitialData();
      } else {
        window.customAlert("فشل إضافة قالب التقييم.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvalTemplate = async (id) => {
    window.customConfirm("هل أنت متأكد من حذف هذا التقييم نهائياً وكل درجات الخدام فيه؟", async () => {
      try {
        const response = await fetch(`/api/evaluation-templates/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          window.customAlert("تم حذف التقييم بنجاح.");
          fetchInitialData();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSaveServantGrade = async (templateId, servantUsername, val) => {
    const key = `${templateId}_${servantUsername}`;
    if (savingGrades[key]) return;
    
    setSavingGrades(prev => ({ ...prev, [key]: true }));

    let weekDateToSend = selectedWeekDate;
    if (!weekDateToSend) {
      const weeks = getWeeksListForSelectedService();
      if (weeks.length > 0) weekDateToSend = weeks[0];
      else weekDateToSend = new Date().toISOString().split('T')[0];
    }

    // Optimistically update frontend state
    setServantEvaluations(prev => {
      const filtered = prev.filter(e => !(e.templateId === templateId && e.servantUsername === servantUsername && e.weekDate === weekDateToSend));
      return [...filtered, { templateId, servantUsername, weekDate: weekDateToSend, value: val }];
    });

    try {
      const response = await fetch('/api/servant-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, servantUsername, value: val, weekDate: weekDateToSend })
      });
      if (response.ok) {
        // Quick background fetch
        const res = await fetch(`/api/initial-data?username=${encodeURIComponent(currentUser.username)}&church=${encodeURIComponent(currentUser.church)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setServantEvaluations(data.servantEvaluations || []);
        }
      }
    } catch (err) {
      console.error(err);
      fetchInitialData();
    } finally {
      setSavingGrades(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleEvaluateSubmission = async (sub) => {
    const scoreVal = subScores[sub.id] !== undefined ? subScores[sub.id] : sub.score;
    const commentVal = subComments[sub.id] !== undefined ? subComments[sub.id] : sub.comment;
    
    if (scoreVal === undefined || scoreVal === '') {
      window.customAlert("الرجاء تحديد درجة التقييم أولاً!");
      return;
    }

    try {
      const response = await fetch(`/api/preparations/submissions/${sub.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: parseInt(scoreVal, 10),
          comment: (commentVal || '').trim(),
          evaluatedBy: currentUser.username
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.customAlert("تم تسجيل التقييم والتعليق بنجاح! ✝");
        fetchInitialData();
      } else {
        window.customAlert(result.message || "فشل تسجيل التقييم.");
      }
    } catch (err) {
      console.error(err);
      window.customAlert("حدث خطأ أثناء الاتصال بالسيرفر.");
    }
  };

  const handleCreatePreparation = async (e) => {
    e.preventDefault();
    const serviceName = activeService || newPrepServiceName;
    if (!newPrepLessonName.trim() || !newPrepDeadline || !serviceName) {
      window.customAlert("يرجى ملء جميع الحقول المطلوبة!");
      return;
    }
    let stageName = (activeStage && activeStage !== 'كل المراحل') ? activeStage : '';
    let className = '';
    try {
      const response = await fetch('/api/preparations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonName: newPrepLessonName.trim(),
          objectives: newPrepObjectives.trim(),
          deadline: newPrepDeadline,
          serviceName,
          stageName,
          className,
          serviceYear: selectedYearForFilter
        })
      });
      if (response.ok) {
        window.customAlert("تم إضافة تحضير الدرس بنجاح! ✝");
        setNewPrepLessonName('');
        setNewPrepObjectives('');
        setNewPrepDeadline('');
        setNewPrepClass('all');
        fetchInitialData();
      } else {
        window.customAlert("فشل إضافة التحضير.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePreparation = async (id) => {
    window.customConfirm("هل أنت متأكد من حذف هذا الدرس والتحضيرات المرفوعة له نهائياً؟", async () => {
      try {
        const response = await fetch(`/api/preparations/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          window.customAlert("تم حذف الدرس.");
          fetchInitialData();
        }
      } catch (err) {
        console.error(err);
      }
    });
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

  // QR Code Scanner effect
  useEffect(() => {
    let html5QrCode = null;
    if (showScannerTemplateId) {
      html5QrCode = new Html5Qrcode("reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          try {
            let weekDateToSend = selectedWeekDate;
            if (!weekDateToSend) {
              const weeks = getWeeksListForSelectedService();
              if (weeks.length > 0) weekDateToSend = weeks[0];
            }
            const res = await fetch('/api/servant-evaluations/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                servantUsername: decodedText, 
                templateId: showScannerTemplateId,
                weekDate: weekDateToSend 
              })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              window.customAlert(`تم تسجيل حضور: ${data.servantName} بنجاح! ✝`);
              fetchInitialData();
              setShowScannerTemplateId(null);
            } else {
              window.customAlert(data.message || 'فشل تسجيل الحضور.');
            }
          } catch (e) {
            console.error(e);
          }
        },
        (errorMessage) => {}
      ).catch(err => {
        console.error("Unable to start scanner", err);
      });
    }

    return () => {
      if (html5QrCode) {
        // Stop only if it's scanning
        try {
          html5QrCode.stop().catch(err => {});
        } catch (e) {}
      }
    };
  }, [showScannerTemplateId]);

  // Socket
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('coordinatorActiveTab', activeTab);
  }, [activeTab]);

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
    const handleOpenTransferModal = (e) => {
      setPendingTransferNotif(e.detail);
      setTransferGenderFilter('all');
    };
    window.addEventListener('open-stage-transfer-modal', handleOpenTransferModal);
    return () => {
      window.removeEventListener('open-stage-transfer-modal', handleOpenTransferModal);
    };
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
      const response = await fetch(`/api/sync?t=${Date.now()}`);
      const data = await response.json();
      if (response.ok) {
        if (data.users) {
          const freshUser = data.users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (freshUser) {
            const correctRole = resolveFrontendDynamicRole(freshUser, data.priestServices, data.jobs);
            const currentActiveSrv = freshUser.activeService || currentUser.activeService || activeService;
            const mergedPerms = getMergedUserPermissions(freshUser, data.priestServices, data.jobs, currentActiveSrv);
            const updatedUser = {
              ...freshUser,
              role: currentUser.role || freshUser.role || correctRole,
              activeRole: determinedRole,
              activeService: currentUser.activeService || activeService,
              activeStage: currentUser.activeStage || activeStage,
              activeClass: currentUser.activeClass,
              permissions: mergedPerms
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
          }
        }

        setServices(data.priestServices || []);
        setMakhdomeen(data.makhdomeen || []);
        setWaznat(data.waznat || []);
        
        // Filter servants belonging to this church (excluding admins/priests)
        const filteredServants = (data.users || []).filter(s => s.church === currentUser.church && !['super_admin', 'admin', 'priest'].includes(s.role));
        setServants(filteredServants);

        // Load deadlines set by the priest of this church
        const priestUser = (data.priests || []).find(pr => pr.church === currentUser.church)?.username;
        if (priestUser && data.deadlines) {
          setDeadlines(data.deadlines[priestUser] || []);
        }

        // Load chat messages
        setChatMessages(data.chat_messages || []);

        // Load all users
        setAllUsers(data.users || []);

        // Load custom evaluations and preparations
        setEvaluationTemplates(data.evaluationTemplates || []);
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
      console.error('Error fetching coordinator dashboard data:', e);
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
        fetchInitialData();
      } else {
        window.customAlert(data.message || 'فشل تسكين المخدوم.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleAcceptTransfer = async () => {
    if (!pendingTransferNotif) return;
    try {
      const response = await fetch('/api/services/transfer-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: pendingTransferNotif.id,
          filter: transferGenderFilter
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.customAlert(result.message || 'تم قبول النقل ودمج المرحلة بنجاح! ✝');
        setPendingTransferNotif(null);
        fetchInitialData();
      } else {
        window.customAlert(result.message || 'فشل قبول طلب النقل.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleDeclineTransfer = async () => {
    if (!pendingTransferNotif) return;
    try {
      const response = await fetch(`/api/notifications/${pendingTransferNotif.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username })
      });
      if (response.ok) {
        window.customAlert('تم رفض طلب النقل وتجاهله.');
        setPendingTransferNotif(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncKeyToServer = async (key, dataToSync) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: dataToSync }),
      });
    } catch (e) {
      console.error(`Error syncing key ${key}:`, e);
    }
  };

  const handleAddWazna = async (e) => {
    e.preventDefault();
    if (!newWaznaServant || !newWaznaName.trim()) {
      window.customAlert('الرجاء اختيار الخادم وكتابة اسم المخدوم!');
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
    window.customAlert('تم تسجيل الافتقاد بنجاح! ✝');
    setActiveTab('waznatTab');
  };

  const handleToggleWaznaChecked = async (waznaId) => {
    const updated = waznat.map(w => {
      if (w.id === waznaId) {
        return { ...w, checked: !w.checked };
      }
      return w;
    });
    setWaznat(updated);
    await syncKeyToServer('waznat', updated);
  };

  const handleDeleteWazna = async (waznaId) => {
    window.customConfirm('هل أنت متأكد من حذف زيارة الافتقاد هذه؟', async () => {
      const updated = waznat.filter(w => w.id !== waznaId);
      setWaznat(updated);
      await syncKeyToServer('waznat', updated);
    });
  };

  // Find the service managed by this coordinator
  const findAssignedService = () => {
    // 1. Search in services collection for assignment mapping
    for (const record of services) {
      const osra = (record.osras || []).find(o => 
        o.coordinatorUser === currentUser.username ||
        o.assistantCoordinatorUser === currentUser.username ||
        o.familyCoordinatorUser === currentUser.username ||
        o.assistantFamilyCoordinatorUser === currentUser.username
      );
      if (osra) return osra.name;
    }
    
    // 2. Fallback to user profile osra field
    return currentUser.osra;
  };

  const assignedServiceName = findAssignedService();

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

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const activeDeadlines = deadlines.filter(d => !d.applied);
  const getRoleArabicName = (roleKey) => {
    switch (roleKey) {
      case 'service_coordinator': return 'أمين الخدمة';
      case 'assistant_service_coordinator': return 'مساعد أمين الخدمة';
      case 'family_coordinator': return 'أمين الأسرة';
      case 'assistant_family_coordinator': return 'مساعد أمين الأسرة';
      case 'general_coordinator': return 'أمين عام الخدمة';
      default: return roleKey;

    }
  };

  // --- USER SERVICES & STAGES FOR COORDINATOR ---
  const myServices = getUserServicesAndStages();

  // --- SERVICE SELECTION OVERLAY ---
  if (!activeService) {
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
                      setSelectedServiceForTree(o.name);
                      
                      const stages = o.isOsraLevel ? ["كل المراحل", ...o.allStages] : o.assignedStages;
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
                        المراحل التابع لها: {o.assignedStages.join('، ') || 'كل المراحل'}
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
            <li className={activeTab === 'treeTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('treeTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-sitemap"></i> شجرة الخدمة
              </a>
            </li>
            <li className={activeTab === 'waznatTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('waznatTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-hand-holding-heart"></i> إدارة الوزنات
              </a>
            </li>
            <li className={activeTab === 'preparationsTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('preparationsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-book-open"></i> تحضير الدروس
              </a>
            </li>
            <li className={activeTab === 'servantsEvaluationsTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('servantsEvaluationsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-user-check"></i> تقييمات الخدام
              </a>
            </li>
            {hasPermission('viewServiceDetails') && (
              <li className={activeTab === 'serviceDetailsTab' ? 'active' : ''}>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('serviceDetailsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                  <i className="fas fa-chart-line"></i> تفاصيل الخدمة
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
            <li className={activeTab === 'evaluationsTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('evaluationsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-list-check"></i> بنود التقييمات
              </a>
            </li>
            <li className={activeTab === 'serviceYearsTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('serviceYearsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-calendar-alt"></i> سنين الخدمة
              </a>
            </li>
            <li className={activeTab === 'messagesTab' ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('messagesTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                <i className="fas fa-envelope"></i> الرسائل
              </a>
            </li>
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
                <p className="mt-3 text-warning">جاري المزامنة وجلب شجرة الخدمة الدراسية...</p>
              </div>
            ) : (
              <div className="fade-in">

                {/* TAB 1: SERVICE TREE */}
                {activeTab === 'treeTab' && (
                  <div>
                    {(() => {
                      const myAssignedServices = getMyServicesList();
                      const allServicesList = [];
                      services.forEach(record => {
                        const rYear = record.serviceYear || new Date().getFullYear().toString();
                        if (rYear === selectedYearForFilter) {
                          (record.osras || []).forEach(o => {
                            if (myAssignedServices.length === 0 || myAssignedServices.includes(o.name) || o.name === activeService) {
                              allServicesList.push(o);
                            }
                          });
                        }
                      });

                      if (!selectedServiceForTree) {
                        return (
                          <div className="fade-in">
                            <div className="col-12 d-flex justify-content-center mb-4">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-warning text-dark fw-bold px-3 py-2">سنة الخدمة: {selectedYearForFilter}</span>
                              </div>
                            </div>

                            <h5 className="fw-bold text-warning mb-4 text-center">
                              <i className="fas fa-church me-2"></i> الرجاء اختيار الخدمة لعرض شجرتها ✝
                            </h5>
                            {allServicesList.length > 0 ? (
                              <div className="row col-lg-9 g-4 justify-content-center mx-auto">
                                {allServicesList.map(o => (
                                  <div className="col-md-6 col-lg-4" key={o.name}>
                                    <div 
                                      className="card h-100 service-select-card cursor-pointer shadow-sm"
                                      style={{
                                        backgroundColor: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '16px',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onClick={() => setSelectedServiceForTree(o.name)}
                                    >
                                      <div className="card-body p-4 text-center d-flex flex-column">
                                        <div className="service-icon-circle mb-3 mx-auto" style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <i className="fas fa-church text-warning fa-2x"></i>
                                        </div>
                                        <h4 className="fw-bold mb-2 text-warning">{o.name}</h4>
                                        <div className="mb-3">
                                          <span className="badge bg-danger px-3 py-2" style={{ borderRadius: '20px', fontSize: '0.85rem' }}>
                                            يوم {o.serviceDay === 'Friday' ? 'الجمعة' : o.serviceDay}
                                          </span>
                                        </div>
                                        <p className="text-muted small mb-4">
                                          المراحل: {o.stages ? o.stages.length : 0} | الفصول: {o.stages ? o.stages.reduce((acc, st) => acc + (st.classes ? st.classes.length : 0), 0) : 0}
                                        </p>
                                        <button 
                                          type="button" 
                                          className="btn w-100 fw-bold py-2 mt-auto shadow-sm" 
                                          style={{ backgroundColor: 'var(--gold-accent)', color: 'var(--sidebar-bg)', borderRadius: '25px', border: 'none' }}
                                          onClick={() => setSelectedServiceForTree(o.name)}
                                        >
                                          عرض الخدمة
                                        </button>
                                        {hasPermission('editServiceTree') && (
                                          <div className="d-flex gap-2 w-100 mt-3">
                                            <button
                                              type="button"
                                              className="btn btn-sm flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                                              style={{
                                                backgroundColor: 'rgba(201, 168, 76, 0.08)',
                                                border: '1.5px solid var(--gold-accent, #c9a84c)',
                                                color: 'var(--text-color, #f4e3b5)',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                padding: '6px 12px',
                                                transition: 'all 0.2s ease',
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingServiceModal({ oldName: o.name, name: o.name, serviceDay: o.serviceDay || 'Friday' });
                                              }}
                                              title="تعديل اسم أو يوم الخدمة"
                                            >
                                              <i className="fas fa-edit text-warning me-1"></i> تعديل
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-sm flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                                              style={{
                                                backgroundColor: 'rgba(220, 53, 69, 0.08)',
                                                border: '1.5px solid #dc3545',
                                                color: '#dc3545',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                padding: '6px 12px',
                                                transition: 'all 0.2s ease',
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingServiceModal(o.name);
                                              }}
                                              title="حذف الخدمة"
                                            >
                                              <i className="fas fa-trash-alt text-danger me-1"></i> حذف
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-muted py-5">لا توجد خدمات مسجلة في شجرة الخدمة في هذا العام.</p>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="fade-in">
                          {/* Header back button matching AdminDashboard */}
                          <div className="d-flex align-items-center mb-3">
                            <button 
                              className="btn btn-danger px-4 py-2 d-flex align-items-center gap-2 fw-bold shadow-sm"
                              onClick={() => setSelectedServiceForTree('')}
                              style={{ borderRadius: '25px', backgroundColor: '#8f1d2c', borderColor: '#8f1d2c', color: '#ffffff', fontSize: '0.95rem' }}
                            >
                              <i className="fas fa-arrow-right me-1"></i> العودة لاختيار الخدمة ⛪
                            </button>
                          </div>

                          <ServiceTree
                            serviceName={selectedServiceForTree}
                            serviceYear={selectedYearForFilter}
                            allUsers={allUsers}
                            servants={servants}
                            makhdomeen={makhdomeen}
                            priestServices={services}
                            onUpdateServices={fetchInitialData}
                            onUpdateMakhdomeen={handleUpdateMakhdomeenState}
                            readOnly={!hasPermission('editServiceTree')}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB: WAZNAT MANAGEMENT / VISITATION LOGS */}
                {activeTab === 'waznatTab' && (() => {
                  const getWaznaTargetDay = () => {
                    const visTemplate = (evaluationTemplates || []).find(t => t.type === 'visitation');
                    if (visTemplate && visTemplate.targetDay) {
                      return visTemplate.targetDay;
                    }
                    return 'الجمعة';
                  };

                  const currentWeek = waznatWeekDate;
                  const assignedMakhdomeen = makhdomeen.filter(m => {
                    if (activeService && m.osra !== activeService) return false;
                    if (activeStage && activeStage !== 'كل المراحل' && m.stage !== activeStage) return false;
                    if (m.serviceYear !== selectedYearForFilter) return false;
                    return true;
                  });

                  return (
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="card shadow">
                          <div className="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <h5 className="mb-0 fw-bold text-warning">
                              <i className="fas fa-hand-holding-heart me-2"></i> إدارة الوزنات (المخدومين المسؤول عنهم الخدام) ✝
                            </h5>
                            {/* Calendar Filter in Waznat */}
                            <div className="d-flex align-items-center gap-2">
                              <label className="mb-0 small text-muted"><i className="fas fa-calendar-alt me-1 text-warning"></i> تاريخ الافتقاد:</label>
                              <div className="position-relative" style={{ width: '160px' }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm fw-bold border-warning bg-dark text-warning text-center"
                                  value={waznatWeekDate ? (() => {
                                    const d = new Date(waznatWeekDate);
                                    return isNaN(d.getTime()) ? '' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                  })() : ''}
                                  readOnly
                                  style={{ borderRadius: '8px', cursor: 'pointer' }}
                                />
                                <input
                                  type="date"
                                  className="position-absolute top-0 start-0 w-100 h-100"
                                  style={{ opacity: 0, cursor: 'pointer' }}
                                  value={waznatWeekDate}
                                  onChange={(e) => setWaznatWeekDate(e.target.value)}
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
                          <div className="card-body">
                            {assignedMakhdomeen.length === 0 ? (
                              <p className="text-muted text-center py-4">لا توجد وزنات مخصصة للخدام حالياً.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table align-middle text-center table-bordered table-striped">
                                  <thead className="table-dark">
                                    <tr>
                                      <th>#</th>
                                      <th>المخدوم</th>
                                      <th>الفصل</th>
                                      <th>الخادم المسؤول</th>
                                      <th>رقم الهاتف</th>
                                      <th>حالة الافتقاد للأسبوع الحالي</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {assignedMakhdomeen.map((m, idx) => {
                                      const visit = (servantVisitations || []).find(
                                        v => v.servantUsername === m.assignedServant && 
                                             v.makhdoomId === (m.id || m._id) && 
                                             v.weekDate === currentWeek
                                      );
                                      const servantObj = servants.find(s => s.username === m.assignedServant);
                                      return (
                                        <tr key={m.id || m._id}>
                                          <td>{idx + 1}</td>
                                          <td className="fw-bold text-start">{m.name}</td>
                                          <td>{m.fasl || <span className="text-muted">غير محدد</span>}</td>
                                          <td className="fw-bold">{servantObj ? servantObj.name : (m.assignedServant || <span className="text-muted">غير موزع</span>)}</td>
                                          <td className="font-monospace">{m.phone || m.phoneNumber || '-'}</td>
                                          <td>
                                            {visit ? (
                                              visit.result === 'answered' ? (
                                                <span className="badge bg-success text-white px-3 py-2 fw-bold" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>تم الرد</span>
                                              ) : visit.result === 'no_answer' ? (
                                                <span className="badge bg-warning text-dark px-3 py-2 fw-bold" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>لم يتم الرد</span>
                                              ) : (
                                                <span className="badge bg-secondary text-white px-3 py-2 fw-bold" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>ملغي</span>
                                              )
                                            ) : (
                                              <span className="badge bg-danger text-white px-3 py-2 fw-bold" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>لم يتم الافتقاد</span>
                                            )}
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


                {/* TAB 2: MESSAGES */}
                {activeTab === 'messagesTab' && (
                  <div className="row">
                    {/* Chat channels */}
                    <div className="col-md-4 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-hashtag me-2"></i> قنوات المحادثة</h5>
                        </div>
                        <div className="list-group list-group-flush">
                          <button
                            onClick={() => setActiveChannel('عام')}
                            className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-3 ${activeChannel === 'عام' ? 'text-warning fw-bold border-start border-3 border-warning' : ''}`}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            ✝ القناة العامة للخدام
                          </button>
                          {assignedServiceName && (
                            <button
                              onClick={() => setActiveChannel(assignedServiceName)}
                              className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-3 ${activeChannel === assignedServiceName ? 'text-warning fw-bold border-start border-3 border-warning' : ''}`}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              ✦ مجموعة: {assignedServiceName}
                            </button>
                          )}
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

                {/* TAB: CUSTOM EVALUATIONS (بنود التقييمات) */}
                {activeTab === 'evaluationsTab' && (
                  <div className="fade-in">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                      <h4 className="fw-bold mb-0 text-warning">
                        <i className="fas fa-list-check me-2"></i> بنود التقييمات (لسنة الخدمة: {selectedYearForFilter})
                      </h4>
                    </div>

                    {/* Add Evaluation Template Card */}
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-plus-circle me-2"></i> إضافة تقييم مخصص جديد للعام {selectedYearForFilter}</h5>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleCreateEvalTemplate} className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">اسم التقييم</label>
                            <input
                              type="text"
                              className="form-control"
                              value={newEvalName}
                              onChange={(e) => setNewEvalName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">نوع التقييم</label>
                            <select
                              className="form-select"
                              value={newEvalType}
                              onChange={(e) => setNewEvalType(e.target.value)}
                            >
                              <option value="checkbox">علامة صح (نعم/لا)</option>
                              <option value="percentage">نسبة مئوية (0 - 100%)</option>
                              <option value="qr_liturgy">Qr Code</option>
                              <option value="visitation">افتقاد</option>
                            </select>
                          </div>
                          {(newEvalType === 'qr_liturgy' || newEvalType === 'visitation') && (
                            <div className="col-md-3">
                              <label className="form-label text-warning fw-bold">يوم التكرار الأسبوعي</label>
                              <select
                                className="form-select border-warning bg-dark text-warning fw-bold"
                                value={newEvalTargetDay}
                                onChange={(e) => setNewEvalTargetDay(e.target.value)}
                              >
                                <option value="Friday">الجمعة</option>
                                <option value="Saturday">السبت</option>
                                <option value="Sunday">الأحد</option>
                                <option value="Monday">الاثنين</option>
                                <option value="Tuesday">الثلاثاء</option>
                                <option value="Wednesday">الأربعاء</option>
                                <option value="Thursday">الخميس</option>
                              </select>
                            </div>
                          )}

                          <div className="col-12 mt-3">
                            <button type="submit" className="btn btn-warning fw-bold px-4">إضافة التقييم ✝</button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* List of Criteria Table */}
                    <div className="card shadow mt-4">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-list me-2"></i> البنود المضافة لعام {selectedYearForFilter}</h5>
                      </div>
                      <div className="card-body">
                        {evaluationTemplates.filter(t => t.serviceYear === selectedYearForFilter && (getMyServicesList().length === 0 || getMyServicesList().includes(t.serviceName))).length === 0 ? (
                          <p className="text-center text-muted py-4 mb-0">لا توجد بنود تقييم مضافة في هذا سنة الخدمة بعد.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-bordered table-striped align-middle text-center small mb-0">
                              <thead className="table-dark">
                                <tr>
                                  <th>اسم بند التقييم</th>
                                  <th>النوع</th>
                                  <th>الخدمة</th>
                                  <th>المرحلة</th>
                                  <th>إجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {evaluationTemplates.filter(t => t.serviceYear === selectedYearForFilter && (getMyServicesList().length === 0 || getMyServicesList().includes(t.serviceName)) && (!activeStage || activeStage === 'كل المراحل' || !t.stageName || t.stageName === activeStage)).map(t => (
                                  <tr key={t.id}>
                                    <td className="fw-bold text-start">{t.name}</td>
                                    <td>
                                      <span className="badge bg-warning text-dark">
                                        {t.type === 'checkbox' ? 'علامة صح' : t.type === 'percentage' ? 'نسبة مئوية' : t.type === 'qr_liturgy' ? 'حضور القداس (QR)' : 'افتقاد'}
                                      </span>
                                    </td>
                                    <td>{t.serviceName}</td>
                                    <td>{t.stageName || activeStage}</td>
                                    <td>
                                      <div className="d-flex gap-1 justify-content-center">
                                        <button className="btn btn-sm btn-outline-warning fw-bold py-1 px-3" onClick={() => handleStartEditTemplate(t)}>
                                          <i className="fas fa-edit me-1"></i> تعديل
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger fw-bold py-1 px-3" onClick={() => handleDeleteEvalTemplate(t.id)}>
                                          <i className="fas fa-trash-alt me-1"></i> حذف
                                        </button>
                                      </div>
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
                )}

                {/* TAB: SERVANTS EVALUATIONS (تقييمات الخدام) */}
                {activeTab === 'servantsEvaluationsTab' && (() => {
                  const coordServants = getCoordinatorServants();
                  const filteredServants = coordServants.filter(s => 
                    (s.name || '').toLowerCase().includes(servantSearchQuery.toLowerCase()) ||
                    (s.username || '').toLowerCase().includes(servantSearchQuery.toLowerCase())
                  );

                  return (
                    <div className="fade-in">
                      {/* Header with Filters */}
                      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <h4 className="fw-bold mb-0 text-warning">
                          <i className="fas fa-users-cog me-2"></i> تقييمات الخدام
                        </h4>
                        
                        <div className="d-flex align-items-center gap-3 flex-wrap">




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
                        {/* Left column: list of servants */}
                        <div className="col-lg-4 mb-4">
                          <div className="card shadow">
                            <div className="card-header py-3">
                              <h5 className="mb-2 fw-bold text-warning"><i className="fas fa-users me-2"></i> الخدام المسؤول عنهم</h5>
                              <input
                                type="text"
                                className="form-control form-control-sm mt-2"
                                value={servantSearchQuery}
                                onChange={(e) => setServantSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="card-body p-0" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                              {filteredServants.length === 0 ? (
                                <p className="text-center text-muted py-4 mb-0">لا يوجد خدام مطابقين للبحث.</p>
                              ) : (
                                <div className="list-group list-group-flush">
                                  {filteredServants.map(servant => (
                                    <button
                                      key={servant.username}
                                      type="button"
                                      className={`list-group-item list-group-item-action ${selectedServantUsername === servant.username ? 'border-warning text-warning' : ''}`}
                                      style={selectedServantUsername === servant.username ? { backgroundColor: 'rgba(255, 193, 7, 0.12)', borderColor: 'var(--color-warning)' } : {}}
                                      onClick={() => setSelectedServantUsername(servant.username)}
                                    >
                                      <div className="d-flex w-100 justify-content-between align-items-center">
                                        <span className="fw-bold">{servant.name}</span>
                                        <span className={`badge ${selectedServantUsername === servant.username ? 'bg-warning text-dark' : 'bg-secondary text-white'} small`}>
                                          {getServantAssignedClasses(servant.username)}
                                        </span>
                                      </div>
                                      <small className={`d-block mt-1 ${selectedServantUsername === servant.username ? 'text-warning' : 'text-muted'}`}>{servant.username}</small>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right column: detailed evaluation sheet */}
                        <div className="col-lg-8 mb-4">
                          {selectedServantUsername ? (() => {
                            const servantObj = servants.find(s => s.username === selectedServantUsername);
                            // Filter templates by selected service and year
                            const myTemplates = evaluationTemplates.filter(t => t.serviceYear === selectedYearForFilter && isServantAssociatedWithTemplate(selectedServantUsername, t));
                            
                            const weeksList = getWeeksListForSelectedService();
                            const currentWeek = selectedWeekDate || weeksList[0];

                            // Calculate dynamic overall score for this servant for this week
                            let totalPoints = 0;
                            let count = 0;
                            myTemplates.forEach(t => {
                              const inClass = isServantInClass(selectedServantUsername, t.stageName, t.className);
                              if (inClass) {
                                const grade = servantEvaluations.find(e => e.templateId === t.id && e.servantUsername === selectedServantUsername && e.weekDate === currentWeek);
                                if (t.type === 'checkbox') {
                                  totalPoints += (grade && grade.value) ? 100 : 0;
                                  count++;
                                } else if (t.type === 'percentage') {
                                  totalPoints += (grade && grade.value !== undefined && grade.value !== '') ? parseInt(grade.value) || 0 : 0;
                                  count++;
                                } else if (t.type === 'qr_liturgy') {
                                  totalPoints += (grade && grade.value) ? 100 : 0;
                                  count++;
                                }
                              }
                            });
                            const overallScore = count > 0 ? Math.round(totalPoints / count) : null;

                            const myPrepEvaluations = (preparationSubmissions || []).filter(sub => {
                              const subUser = (sub.servantUsername || sub.username || '').toLowerCase().trim();
                              const targetUser = (selectedServantUsername || '').toLowerCase().trim();
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

                            return (
                              <div className="card shadow border-warning">
                                <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(255, 193, 7, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
                                  <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-star me-2"></i> استمارة تقييم الخادم: {servantObj?.name}</h5>
                                  {overallScore !== null && (
                                    <span className="badge bg-warning text-dark fw-bold fs-6">التقييم للأسبوع الحالي: {overallScore}%</span>
                                  )}
                                </div>
                                <div className="card-body">
                                  {combinedList.length === 0 ? (
                                    <p className="text-center text-muted py-5 mb-0">لا توجد بنود تقييم مخصصة أو تحضيرات دروس مضافة لخدمة هذا الخادم للعام {selectedYearForFilter}.</p>
                                  ) : (<>
                                    <div className="table-responsive">
                                      <table className="table table-bordered table-striped align-middle text-center small mb-0">
                                        <thead className="table-dark">
                                          <tr>
                                            <th>بند التقييم</th>
                                            <th>النوع</th>
                                            <th>التوجيه</th>
                                            <th>رصد التقييم / الدرجة</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {combinedList.map(t => {
                                            if (t.isPrep) {
                                              return (
                                                <tr key={t.id}>
                                                  <td className="fw-bold text-start text-info"><i className="fas fa-book-open me-2"></i>{t.name}</td>
                                                  <td><span className="badge bg-info text-white">تحضير درس</span></td>
                                                  <td><span className="badge bg-dark text-white">تحضير</span></td>
                                                  <td>
                                                    <div className="input-group input-group-sm mx-auto" style={{ maxWidth: '95px' }}>
                                                      <input
                                                        type="number"
                                                        className="form-control text-center"
                                                        value={t.score}
                                                        disabled={true}
                                                      />
                                                      <span className="input-group-text bg-dark text-warning border-secondary">%</span>
                                                    </div>
                                                    {t.comment && <div className="small text-muted mt-1">ملاحظة: {t.comment}</div>}
                                                    {t.evaluatedAt && (
                                                      <div className="small text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                                                        <i className="fas fa-clock me-1 text-warning"></i>
                                                        تم التقييم: {new Date(t.evaluatedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                      </div>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            }
                                            
                                            const inClass = isServantInClass(selectedServantUsername, t.stageName, t.className);
                                            if (!inClass) {
                                              return (
                                                <tr key={t.id}>
                                                  <td className="fw-bold text-start">{t.name}</td>
                                                  <td><span className="badge bg-secondary">{t.type === 'checkbox' ? 'علامة صح' : t.type === 'percentage' ? 'نسبة مئوية' : t.type === 'qr_liturgy' ? 'Qr Code' : 'افتقاد'}</span></td>
                                                  <td><span className="badge bg-dark text-white">{t.stageName} - {t.className}</span></td>
                                                  <td className="text-muted bg-light small">غير متوزع في هذا الفصل</td>
                                                </tr>
                                              );
                                            }
                                            const grade = servantEvaluations.find(e => e.templateId === t.id && e.servantUsername === selectedServantUsername && e.weekDate === currentWeek);
                                            
                                            // Compute yearly statistics for this template
                                            const tGrades = servantEvaluations.filter(e => e.templateId === t.id && e.servantUsername === selectedServantUsername);
                                            const recordedWeeks = tGrades.length;
                                            let completedWeeks = 0;
                                            tGrades.forEach(g => {
                                              if (t.type === 'checkbox' || t.type === 'qr_liturgy') {
                                                if (g.value === true || g.value === 'true') completedWeeks++;
                                              } else if (t.type === 'percentage') {
                                                if (parseInt(g.value) >= 50) completedWeeks++;
                                              }
                                            });
                                            const completionPercent = recordedWeeks > 0 ? Math.round((completedWeeks / recordedWeeks) * 100) : 0;

                                            return (
                                              <tr key={t.id}>
                                                <td className="fw-bold text-start">{t.name}</td>
                                                <td>
                                                  <span className="badge bg-secondary">
                                                    {t.type === 'checkbox' ? 'علامة صح' : t.type === 'percentage' ? 'نسبة مئوية' : t.type === 'qr_liturgy' ? 'Qr Code' : 'افتقاد'}
                                                  </span>
                                                </td>
                                                <td>
                                                  <span className="badge bg-dark text-white">
                                                    {t.stageName && t.className ? `${t.stageName} - ${t.className}` : 'عام للخدمة'}
                                                  </span>
                                                </td>
                                                <td>
                                                  {t.type === 'checkbox' ? (
                                                    <div className="form-check form-switch d-flex justify-content-center">
                                                      <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        style={{ cursor: 'pointer' }}
                                                        checked={!!(grade && grade.value)}
                                                        disabled={savingGrades[`${t.id}_${selectedServantUsername}`]}
                                                        onChange={(e) => handleSaveServantGrade(t.id, selectedServantUsername, e.target.checked)}
                                                      />
                                                    </div>
                                                  ) : t.type === 'percentage' ? (
                                                    <div className="input-group input-group-sm mx-auto" style={{ maxWidth: '95px' }}>
                                                      <input
                                                        type="number"
                                                        className="form-control text-center"
                                                        min="0"
                                                        max="100"
                                                        placeholder="%"
                                                        value={(grade && grade.value) !== undefined ? grade.value : ''}
                                                        onChange={(e) => {
                                                          const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                          handleSaveServantGrade(t.id, selectedServantUsername, val);
                                                        }}
                                                      />
                                                      <span className="input-group-text bg-dark text-warning border-secondary">%</span>
                                                    </div>
                                                  ) : t.type === 'qr_liturgy' ? (
                                                    <div className="d-flex flex-column align-items-center gap-1 justify-content-center">
                                                      {grade && grade.value ? (
                                                        <span className="text-success fw-bold d-flex align-items-center gap-1">
                                                          <i className="fas fa-check-circle"></i>
                                                          <small style={{ fontSize: '0.7rem' }}>
                                                            {new Date(grade.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                          </small>
                                                        </span>
                                                      ) : (
                                                        <span className="text-danger"><i className="fas fa-times-circle"></i></span>
                                                      )}
                                                      <div className="d-flex gap-1 mt-1">
                                                        <button 
                                                          className="btn btn-sm btn-outline-warning py-0 px-2 fw-bold" 
                                                          style={{ fontSize: '0.65rem' }}
                                                          onClick={() => setShowScannerTemplateId(t.id)}
                                                        >
                                                          مسح QR الكود
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : t.type === 'visitation' ? (
                                                    <div className="d-flex flex-column align-items-center gap-1 justify-content-center">
                                                      <span className="fw-bold text-info fs-6">
                                                        {(grade && grade.value) !== undefined ? `${grade.value}%` : '0%'}
                                                      </span>
                                                      <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-info py-0 px-2 fw-bold"
                                                        style={{ fontSize: '0.65rem' }}
                                                        onClick={() => setVisibleVisitationDetailTemplateId(visibleVisitationDetailTemplateId === t.id ? null : t.id)}
                                                      >
                                                        <i className="fas fa-info-circle me-1"></i>
                                                        {visibleVisitationDetailTemplateId === t.id ? 'إخفاء التفاصيل' : 'عرض تفاصيل الافتقاد'}
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    '-'
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                    {myTemplates.some(t => t.type === 'visitation') && (
                                      <div className="mt-4">
                                        {myTemplates.filter(t => t.type === 'visitation' && t.id === visibleVisitationDetailTemplateId && isServantInClass(selectedServantUsername, t.stageName, t.className)).map(t => {
                                          const servantMakhdomeen = makhdomeen.filter(m => m.assignedServant === selectedServantUsername);
                                          let targetMakhdomeen = servantMakhdomeen;
                                          if (t.stageName && t.className) {
                                            targetMakhdomeen = servantMakhdomeen.filter(m => m.osra === t.serviceName && m.stage === t.stageName && m.fasl === t.className);
                                          } else if (t.serviceName) {
                                            targetMakhdomeen = servantMakhdomeen.filter(m => m.osra === t.serviceName);
                                          }
                                          
                                          const weekVisits = (servantVisitations || []).filter(v => v.servantUsername === selectedServantUsername && v.weekDate === currentWeek);
                                          
                                          const answered = [];
                                          const noAnswer = [];
                                          const pending = [];
                                          
                                          targetMakhdomeen.forEach(m => {
                                            const v = weekVisits.find(x => x.makhdoomId === (m.id || m._id));
                                            if (v) {
                                              if (v.result === 'answered') answered.push({ name: m.name, date: v.date });
                                              else if (v.result === 'no_answer') noAnswer.push({ name: m.name, date: v.date });
                                              else pending.push(m.name);
                                            } else {
                                              pending.push(m.name);
                                            }
                                          });
                                          
                                          return (
                                            <div key={t.id} className="card bg-dark border border-secondary text-start text-white p-3 mb-3 mt-3">
                                              <h6 className="text-warning fw-bold mb-2">
                                                <i className="fas fa-phone-alt me-1"></i> تفاصيل الافتقاد: {t.name}
                                              </h6>
                                              <div className="row">
                                                <div className="col-md-4 mb-2">
                                                  <span className="badge bg-success mb-2">تم الافتقاد ({answered.length})</span>
                                                  {answered.length === 0 ? (
                                                    <div className="text-muted small">لا يوجد مخدومين</div>
                                                  ) : (
                                                    <ul className="list-unstyled ps-2 mb-0 text-muted small">
                                                      {answered.map((x, idx) => (
                                                        <li key={idx}>✝ {x.name} <br/> <small>({new Date(x.date).toLocaleDateString('ar-EG')} في {new Date(x.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</small></li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                </div>
                                                
                                                <div className="col-md-4 mb-2">
                                                  <span className="badge bg-warning text-dark mb-2">محاولة اتصال ({noAnswer.length})</span>
                                                  {noAnswer.length === 0 ? (
                                                    <div className="text-muted small">لا يوجد مخدومين</div>
                                                  ) : (
                                                    <ul className="list-unstyled ps-2 mb-0 text-muted small">
                                                      {noAnswer.map((x, idx) => (
                                                        <li key={idx}>✝ {x.name} <br/> <small>({new Date(x.date).toLocaleDateString('ar-EG')} في {new Date(x.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</small></li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                </div>
                                                
                                                <div className="col-md-4 mb-2">
                                                  <span className="badge bg-secondary mb-2">لم يتم الاتصال ({pending.length})</span>
                                                  {pending.length === 0 ? (
                                                    <div className="text-muted small">لا يوجد مخدومين</div>
                                                  ) : (
                                                    <ul className="list-unstyled ps-2 mb-0 text-muted small">
                                                      {pending.map((name, idx) => (
                                                        <li key={idx}>✝ {name}</li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>)}
                                </div>
                              </div>
                            );
                          })() : (
                            <div className="text-center text-muted py-5 border rounded" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                              <i className="fas fa-arrow-right fa-2x mb-3 text-warning"></i>
                              <p>الرجاء تحديد خادم من القائمة الجانبية لعرض استمارة التقييم الخاصة به ورصد الدرجات.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB: LESSON PREPARATION */}
                {activeTab === 'preparationsTab' && (
                  <div className="fade-in">
                    {/* Add Lesson Preparation Task Card */}
                    <div className="card shadow mb-4">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-plus-circle me-2"></i> إضافة تحضير درس جديد</h5>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleCreatePreparation} className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">اسم الدرس</label>
                            <input
                              type="text"
                              className="form-control"
                              value={newPrepLessonName}
                              onChange={(e) => setNewPrepLessonName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">الديدلاين (آخر موعد للتسليم)</label>
                            <input
                              type="date"
                              className="form-control"
                              value={newPrepDeadline}
                              onChange={(e) => setNewPrepDeadline(e.target.value)}
                              required
                            />
                          </div>

                          <div className="col-12">
                            <label className="form-label">أهداف الدرس وملاحظات التحضير</label>
                            <textarea
                              className="form-control"
                              rows="3"
                              value={newPrepObjectives}
                              onChange={(e) => setNewPrepObjectives(e.target.value)}
                            ></textarea>
                          </div>
                          <div className="col-12 mt-3">
                            <button type="submit" className="btn btn-warning fw-bold px-4">نشر التحضير للخدام ✝</button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Lesson Preparations List Card */}
                    <div className="card shadow">
                      <div className="card-header py-3">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-book-open me-2"></i> الدروس والتسليمات المطلوبة لعام {selectedYearForFilter}</h5>
                      </div>
                      <div className="card-body">
                        {preparations.filter(p => p.serviceYear === selectedYearForFilter && (getMyServicesList().length === 0 || getMyServicesList().includes(p.serviceName))).length === 0 ? (
                          <p className="text-center text-muted py-4 mb-0">لا توجد دروس مطلوبة للتحضير بعد في هذا سنة الخدمة.</p>
                        ) : (
                          <div className="row">
                            {/* Left column: list of preparation tasks */}
                            <div className="col-lg-5 mb-4">
                              <div className="list-group">
                                {preparations.filter(p => p.serviceYear === selectedYearForFilter && (getMyServicesList().length === 0 || getMyServicesList().includes(p.serviceName))).map(p => {
                                  const subsCount = preparationSubmissions.filter(s => s.preparationId === p.id).length;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      className={`list-group-item list-group-item-action ${selectedPrepIdForSubmissions === p.id ? 'active' : ''}`}
                                      onClick={() => setSelectedPrepIdForSubmissions(p.id)}
                                    >
                                      <div className="d-flex w-100 justify-content-between align-items-center">
                                        <h6 className="mb-1 fw-bold">{p.lessonName}</h6>
                                        <span className="badge bg-warning text-dark">{subsCount} تسليم</span>
                                      </div>
                                      <p className="mb-1 small text-muted text-truncate">{p.objectives || 'لا توجد أهداف مكتوبة.'}</p>
                                      <div className="d-flex justify-content-between align-items-center mt-2 small text-muted">
                                        <span>آخر موعد: {p.deadline}</span>
                                        <button 
                                          className="btn btn-sm btn-link text-danger p-0" 
                                          onClick={(e) => { e.stopPropagation(); handleDeletePreparation(p.id); }}
                                        >
                                          <i className="fas fa-trash-alt me-1"></i> حذف الدرس
                                        </button>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right column: list of submissions for the selected preparation task */}
                            <div className="col-lg-7">
                              {selectedPrepIdForSubmissions ? (() => {
                                const selectedPrep = preparations.find(p => p.id === selectedPrepIdForSubmissions);
                                const subs = preparationSubmissions.filter(s => s.preparationId === selectedPrepIdForSubmissions);
                                return (
                                  <div className="card border-warning">
                                    <div className="card-header bg-warning text-dark py-2">
                                      <h6 className="mb-0 fw-bold"><i className="fas fa-file-pdf me-2"></i> تسليمات درس: {selectedPrep?.lessonName}</h6>
                                    </div>
                                    <div className="card-body p-0">
                                      {subs.length === 0 ? (
                                        <p className="text-center text-muted py-5 mb-0">لا توجد تسليمات مرفوعة من الخدام بعد لهذا الدرس.</p>
                                      ) : (
                                        <div className="table-responsive">
                                          <table className="table table-striped align-middle text-center mb-0 small">
                                            <thead>
                                              <tr>
                                                <th>الخادم</th>
                                                <th>تاريخ الرفع</th>
                                                <th>الملف</th>
                                                <th>التقييم (%)</th>
                                                <th>التعليق / الملاحظة</th>
                                                <th>إجراء</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {subs.map(s => {
                                                const uploadDate = new Date(s.uploadedAt);
                                                return (
                                                  <tr key={s.id}>
                                                    <td className="fw-bold">{s.servantName}</td>
                                                    <td>
                                                      {formatDate(s.uploadedAt)}
                                                    </td>
                                                    <td>
                                                      <button 
                                                        className="btn btn-sm btn-outline-warning fw-bold py-1" 
                                                        onClick={() => viewPdf(s.fileData, s.fileName)}
                                                        style={{ fontSize: '0.75rem' }}
                                                      >
                                                        عرض PDF <i className="fas fa-eye ms-1"></i>
                                                      </button>
                                                    </td>
                                                    <td>
                                                      <div className="input-group input-group-sm mx-auto" style={{ width: '90px' }}>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          max="100"
                                                          className="form-control text-center"
                                                          placeholder="%"
                                                          value={subScores[s.id] !== undefined ? subScores[s.id] : (s.score !== undefined ? s.score : '')}
                                                          onChange={(e) => {
                                                            const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                            setSubScores(prev => ({ ...prev, [s.id]: val }));
                                                          }}
                                                        />
                                                        <span className="input-group-text bg-dark text-warning border-secondary">%</span>
                                                      </div>
                                                    </td>
                                                    <td>
                                                      <input
                                                        type="text"
                                                        className="form-control form-control-sm text-center"
                                                        placeholder="أضف تعليقاً..."
                                                        value={subComments[s.id] !== undefined ? subComments[s.id] : (s.comment || '')}
                                                        onChange={(e) => {
                                                          setSubComments(prev => ({ ...prev, [s.id]: e.target.value }));
                                                        }}
                                                        style={{ minWidth: '150px' }}
                                                      />
                                                    </td>
                                                    <td>
                                                      <button
                                                        className="btn btn-sm btn-warning fw-bold px-2 py-1"
                                                        onClick={() => handleEvaluateSubmission(s)}
                                                        style={{ fontSize: '0.75rem' }}
                                                      >
                                                        تأكيد ✝
                                                      </button>
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
                                );
                              })() : (
                                <div className="text-center text-muted py-5 border rounded" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                                  <i className="fas fa-arrow-right fa-2x mb-3 text-warning"></i>
                                  <p>الرجاء تحديد درس من القائمة الجانبية لعرض تسليمات الخدام الخاصة به.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                                        <select
                                          className="form-select form-select-sm"
                                          style={{ maxWidth: '200px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                          value={currentVal}
                                          onChange={(e) => setSelectedTargets(prev => ({ ...prev, [m.id]: e.target.value }))}
                                        >
                                          <option value="">-- اختر المرحلة --</option>
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

                {/* TAB 3: SETTINGS */}
                {/* TAB: SERVICE YEARS */}
                {activeTab === 'serviceYearsTab' && (
                  <div className="fade-in">
                    <div className="row g-4 justify-content-center">
                      <div className="col-lg-6">
                        <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <div className="card-body p-4">
                            <h5 className="fw-bold text-warning mb-4"><i className="fas fa-calendar-alt me-2"></i> سنين الخدمة المسجلة</h5>
                            <div className="list-group">
                              {(serviceYearsList.length > 0 ? serviceYearsList : ['2024', '2025', '2026', '2027', '2028', '2029', '2030']).map(yrObj => {
                                const yr = typeof yrObj === 'object' ? yrObj.year : yrObj;
                                if (!yr) return null;
                                const isActive = String(selectedYearForFilter) === String(yr);
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

                {activeTab === 'stPhilopateerCoreTab' && (
                  <PhilopateerCoreView currentUser={currentUser} isManager={false} />
                )}

                {activeTab === 'managePhilopateerServicesTab' && (
                  <PhilopateerCoreView currentUser={currentUser} isManager={true} />
                )}

                {activeTab === 'serviceDetailsTab' && (
                  <ServiceDetailsView
                    currentUser={currentUser}
                    services={services}
                    servants={servants}
                    evaluationTemplates={evaluationTemplates}
                    servantEvaluations={servantEvaluations}
                    preparations={preparations}
                    preparationSubmissions={preparationSubmissions}
                    selectedYearForFilter={selectedYearForFilter}
                  />
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
        </div>
      </div>
      <Footer />
      {/* Modal: Confirm and Merge Stage Transfer */}
      {pendingTransferNotif && (() => {
        const { sourceService, sourceStage, targetService, targetStage, sender } = pendingTransferNotif.payload;
        return (
          <div className="modal d-block fade show" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                <div className="modal-header border-bottom border-secondary">
                  <h5 className="modal-title text-warning fw-bold"><i className="fas fa-clipboard-check me-2"></i> طلب نقل وهيكلة مرحلة معلق</h5>
                  <button type="button" className="btn-close" onClick={() => setPendingTransferNotif(null)}></button>
                </div>
                <div className="modal-body">
                  <p className="small mb-3">
                    يرغب أمين الخدمة في نقل بيانات مرحلته إلى مرحلتك المستهدفة:
                  </p>
                  <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                    <div className="mb-2"><strong>المصدر:</strong> {sourceService} - {sourceStage}</div>
                    <div className="mb-2"><strong>المستهدف:</strong> {targetService} - {targetStage}</div>
                    <div><strong>المرسل:</strong> {sender}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-warning">تصفية ونقل مخدومي الجنس:</label>
                    <select 
                      className="form-select" 
                      value={transferGenderFilter} 
                      onChange={(e) => setTransferGenderFilter(e.target.value)}
                    >
                      <option value="all">الكل (ذكور وإناث)</option>
                      <option value="male">ذكر فقط</option>
                      <option value="female">أنثى فقط</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-outline-danger btn-sm px-3" onClick={handleDeclineTransfer}>رفض الطلب</button>
                  <button type="button" className="btn btn-success btn-sm px-4" onClick={handleAcceptTransfer}>قبول ودمج المرحلة ✝</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: QR Code Scanner for Liturgy Attendance */}
      {showScannerTemplateId && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', direction: 'rtl', zIndex: 1200 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h5 className="modal-title text-warning fw-bold"><i className="fas fa-camera me-2"></i> مسح كود حضور القداس للخدام</h5>
                <button type="button" className="btn-close btn-close-white ms-0 me-auto" onClick={() => setShowScannerTemplateId(null)}></button>
              </div>
              <div className="modal-body text-center">
                <p className="text-muted small">ضع كود الـ QR الخاص بالخادم أمام الكاميرا لتسجيل حضوره تلقائياً</p>
                <div id="reader" className="mx-auto rounded border" style={{ width: '100%', maxWidth: '350px', overflow: 'hidden' }}></div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary w-100" onClick={() => setShowScannerTemplateId(null)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Evaluation Template */}
      {editingTemplate && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', direction: 'rtl', zIndex: 1200 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-start" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h5 className="modal-title text-warning fw-bold"><i className="fas fa-edit me-2"></i> تعديل بند التقييم</h5>
                <button type="button" className="btn-close btn-close-white ms-0 me-auto" onClick={() => setEditingTemplate(null)}></button>
              </div>
              <form onSubmit={handleUpdateEvalTemplate}>
                <div className="modal-body text-start">
                  <div className="mb-3">
                    <label className="form-label">اسم التقييم</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEvalName}
                      onChange={(e) => setEditEvalName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">نوع التقييم</label>
                    <select
                      className="form-select"
                      value={editEvalType}
                      onChange={(e) => setEditEvalType(e.target.value)}
                    >
                      <option value="checkbox">علامة صح (نعم/لا)</option>
                      <option value="percentage">نسبة مئوية (0 - 100%)</option>
                      <option value="qr_liturgy">Qr Code</option>
                      <option value="visitation">افتقاد</option>
                    </select>
                  </div>


                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setEditingTemplate(null)}>إلغاء</button>
                  <button type="submit" className="btn btn-warning btn-sm px-4 fw-bold">حفظ التغييرات ✝</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {editingServiceModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1090 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', direction: 'rtl' }}>
              <div className="modal-header border-bottom border-secondary d-flex justify-content-between align-items-center p-3">
                <h5 className="modal-title fw-bold text-warning mb-0">
                  <i className="fas fa-edit me-2"></i> تعديل بيانات الخدمة: {editingServiceModal.oldName}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingServiceModal(null)}></button>
              </div>
              <form onSubmit={handleUpdateService}>
                <div className="modal-body p-4 text-start">
                  <div className="mb-3">
                    <label className="form-label text-white fw-bold">اسم الخدمة</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: '#fff', borderRadius: '10px' }}
                      value={editingServiceModal.name}
                      onChange={(e) => setEditingServiceModal({ ...editingServiceModal, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-white fw-bold">يوم الخدمة</label>
                    <select
                      className="form-select"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: '#fff', borderRadius: '10px' }}
                      value={editingServiceModal.serviceDay}
                      onChange={(e) => setEditingServiceModal({ ...editingServiceModal, serviceDay: e.target.value })}
                    >
                      <option value="Friday">الجمعة</option>
                      <option value="Saturday">السبت</option>
                      <option value="Sunday">الأحد</option>
                      <option value="Monday">الاثنين</option>
                      <option value="Tuesday">الثلاثاء</option>
                      <option value="Wednesday">الأربعاء</option>
                      <option value="Thursday">الخميس</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary d-flex justify-content-between p-3">
                  <button type="button" className="btn btn-secondary px-4 fw-bold" style={{ borderRadius: '12px' }} onClick={() => setEditingServiceModal(null)}>إلغاء</button>
                  <button type="submit" className="btn btn-warning fw-bold px-4" style={{ borderRadius: '12px' }}>حفظ التعديلات ✝</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {deletingServiceModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1090 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '20px', direction: 'rtl' }}>
              <div className="modal-header border-bottom border-secondary d-flex justify-content-between align-items-center p-3">
                <h5 className="modal-title fw-bold text-danger mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i> تأكيد حذف الخدمة ✝
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setDeletingServiceModal(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="mb-3">
                  <i className="fas fa-trash-alt text-danger fa-3x mb-3 animate-pulse"></i>
                  <h5 className="text-white fw-bold mb-2">
                    هل أنت متأكد من رغبتك في حذف خدمة <span className="text-warning">"{deletingServiceModal}"</span>؟
                  </h5>
                  <p className="text-muted small mb-0">
                    سيتم حذف الخدمة وكافة مراحلها وفصولها المسجلة لعام {selectedYearForFilter}.
                  </p>
                </div>
              </div>
              <div className="modal-footer border-top border-secondary d-flex justify-content-between p-3">
                <button type="button" className="btn btn-secondary px-4 fw-bold" style={{ borderRadius: '12px' }} onClick={() => setDeletingServiceModal(null)}>
                  إلغاء
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-bold px-4 shadow-sm"
                  style={{ borderRadius: '12px', backgroundColor: '#8f1d2c', borderColor: '#8f1d2c' }}
                  onClick={() => confirmDeleteService(deletingServiceModal)}
                >
                  <i className="fas fa-trash-alt me-1"></i> نعم، احذف الخدمة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
