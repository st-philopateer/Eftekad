import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ProfilePicEditor from '../components/ProfilePicEditor';
import ThemeToggle from '../components/ThemeToggle';
import ServiceTree from '../components/ServiceTree';
import Footer from '../components/Footer';
import NotificationsBell from '../components/NotificationsBell';
import ServantDashboard from '../components/ServantDashboard';
import CoordinatorDashboard from '../components/CoordinatorDashboard';

const isRealMemberCode = (code) => {
  if (!code) return false;
  const autoGenRegex = /^(fr|hs|ahs|gc|sv|ad|usr)\d+$/i;
  return !autoGenRegex.test(code.trim());
};

// Custom component to select permissions organized by category
const PermissionsSelector = ({ permissionsState, onChangePermission }) => {
  const categories = [
    {
      title: "شجرة الخدمة والتقارير والتقييمات الإجمالية",
      icon: "fa-sitemap",
      items: [
        { key: "viewServiceTree", label: "شجرة الخدمة" },
        { key: "editServiceTree", label: "تعديل شجرة الخدمة" },
        { key: "viewServicesStructure", label: "هيكل الخدمات" },
        { key: "manageServiceYears", label: "سنوات الخدمة (إضافة/حذف)" },
        { key: "selectServiceYears", label: "تحديد سنوات الخدمة" },
        { key: "viewVisitationLogs", label: "سجلات الافتقاد" },
        { key: "deleteVisitationLogs", label: "حذف سجلات الافتقاد" },
        { key: "viewEvaluations", label: "تقارير تقييمات الوزنات (للمنسقين والخدام)" },
        { key: "viewServantsEvaluations", label: "تقييمات الخدام (رؤية وتقييم الخدام للمنسقين)" },
        { key: "viewServiceDetails", label: "تفاصيل الخدمة والتقييمات الإجمالية (لأمين الأسرة والكاهن)" }
      ]
    },
    {
      title: "إدارة الوزنات والافتقادات المباشرة",
      icon: "fa-hand-holding-heart",
      items: [
        { key: "viewWaznat", label: "إدارة وعرض الوزنات" },
        { key: "addWaznat", label: "إضافة وزنة مخدوم جديدة" },
        { key: "editWaznat", label: "تعديل بيانات الوزنات" },
        { key: "deleteWaznat", label: "حذف الوزنات" },
        { key: "addDirectVisitation", label: "تسجيل افتقاد مباشر" }
      ]
    },
    {
      title: "الأعضاء والمراحل",
      icon: "fa-users-cog",
      items: [
        { key: "viewMembers", label: "قائمة الأعضاء" },
        { key: "addMembers", label: "إضافة مخدوم" },
        { key: "editMembers", label: "تعديل مخدوم" },
        { key: "deleteMembers", label: "حذف مخدوم" },
        { key: "manageStagesList", label: "إدارة المراحل الدراسية" },
        { key: "manageStagePromotion", label: "تحديث المراحل" }
      ]
    },
    {
      title: "الحسابات والصلاحيات",
      icon: "fa-user-shield",
      items: [
        { key: "manageServants", label: "الحسابات المسجلة وإنشاء حساب جديد" },
        { key: "manageJobs", label: "إدارة الوظائف" }
      ]
    },
    {
      title: "التحضيرات والرسائل",
      icon: "fa-comments",
      items: [
        { key: "viewMessages", label: "صندوق الرسائل" },
        { key: "sendMessages", label: "إرسال رسالة" },
        { key: "manageDeadlines", label: "تحديد مواعيد التسليم" },
        { key: "managePreparations", label: "إدارة التحضيرات" },
        { key: "viewPreparations", label: "عرض التحضيرات وتنزيلها" }
      ]
    },
    {
      title: "خدمات سان فيلوباتير (On Air / Sound)",
      icon: "fa-broadcast-tower",
      items: [
        { key: "requestPhilopateerServices", label: "طلب خدمات سان فيلوباتير (أمين الأسرة)" },
        { key: "managePhilopateerServices", label: "إدارة خدمات سان فيلوباتير والقواعد والطلبات (أمين خدمة فيلوباتير)" }
      ]
    }
  ];

  return (
    <div className="card border-warning mb-4" style={{ backgroundColor: 'rgba(201, 168, 76, 0.02)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
      <div className="card-header py-2" style={{ backgroundColor: 'rgba(201, 168, 76, 0.08)' }}>
        <h6 className="mb-0 text-warning fw-bold small">
          <i className="fas fa-shield-alt me-2"></i> تحديد الصلاحيات المخصصة لهذا الحساب
        </h6>
      </div>
      <div className="card-body p-3">
        <div className="row g-3">
          {categories.map((cat, idx) => (
            <div className="col-md-6" key={idx}>
              <div className="p-2 rounded h-100" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <span className="fw-bold text-warning d-block border-bottom pb-1 mb-2 small">
                  <i className={`fas ${cat.icon} me-1`}></i> {cat.title}
                </span>
                <div className="d-flex flex-column gap-2">
                  {cat.items.map(item => (
                    <div key={item.key} className="form-check form-switch mb-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`perm-${item.key}`}
                        checked={!!permissionsState[item.key]}
                        onChange={() => onChangePermission(item.key)}
                      />
                      <label className="form-check-label small text-white-50" htmlFor={`perm-${item.key}`}>
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function SearchableSelect({ value, onChange, options, placeholder, allLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [hoveredAll, setHoveredAll] = useState(false);

  useEffect(() => {
    setSearchTerm(value === 'all' ? '' : value);
  }, [value]);

  const filteredOptions = options.filter(opt =>
    (opt || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="position-relative w-100" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <input
        type="text"
        className="form-control form-control-sm"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value || 'all');
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
          color: 'var(--color-text)',
          paddingRight: '30px'
        }}
      />
      <span
        className="position-absolute d-flex align-items-center justify-content-center"
        style={{
          right: '8px',
          top: '0',
          bottom: '0',
          color: 'var(--gold-accent)',
          fontSize: '0.65rem',
          pointerEvents: 'none'
        }}
      >
        ▼
      </span>
      {isOpen && (
        <div
          className="position-absolute w-100 shadow border rounded mt-1"
          style={{
            zIndex: 1000,
            maxHeight: '180px',
            overflowY: 'auto',
            backgroundColor: '#1b1e22',
            borderColor: 'rgba(201, 168, 76, 0.25)'
          }}
        >
          <div
            className="p-2 cursor-pointer fw-bold"
            onMouseEnter={() => setHoveredAll(true)}
            onMouseLeave={() => setHoveredAll(false)}
            onMouseDown={() => {
              onChange('all');
              setSearchTerm('');
              setIsOpen(false);
            }}
            style={{
              fontSize: '0.85rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              backgroundColor: hoveredAll ? 'rgba(201, 168, 76, 0.2)' : 'transparent',
              color: 'var(--gold-accent)'
            }}
          >
            {allLabel}
          </div>
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-muted small">لا يوجد نتائج</div>
          ) : (
            filteredOptions.map((opt, i) => (
              <div
                key={i}
                className="p-2 cursor-pointer text-white"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(-1)}
                onMouseDown={() => {
                  onChange(opt);
                  setSearchTerm(opt);
                  setIsOpen(false);
                }}
                style={{
                  fontSize: '0.85rem',
                  backgroundColor: hoveredIndex === i ? 'rgba(201, 168, 76, 0.15)' : 'transparent'
                }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('adminActiveTab') || 'trees'); 
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [makhdomeen, setMakhdomeen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mobile menu state
  const [sidebarShowMobile, setSidebarShowMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // User details local state (to dynamically update profile picture)
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser') || '{}'));

  const getAdminAssignments = () => {
    const usernameLower = (currentUser.username || '').toLowerCase();
    const assignments = [];
    
    (services || []).forEach(srv => {
      (srv.osras || []).forEach(osra => {
        const isOsraCoord = (osra.coordinatorUser || '').toLowerCase() === usernameLower;
        const isOsraAsst = (osra.assistantCoordinatorUser || '').toLowerCase() === usernameLower;
        const isFamilyCoord = (osra.familyCoordinatorUser || '').toLowerCase() === usernameLower;
        const isFamilyAsst = (osra.assistantFamilyCoordinatorUser || '').toLowerCase() === usernameLower;

        if (isOsraCoord || isOsraAsst || isFamilyCoord || isFamilyAsst) {
          assignments.push({
            type: 'coordinator',
            roleName: isOsraCoord || isOsraAsst ? 'أمين الأسرة' : 'مساعد أمين الأسرة',
            serviceName: osra.name,
            stageName: 'كل المراحل',
            targetPath: isOsraCoord || isOsraAsst ? '/general-coordinator' : '/family-coordinator',
          });
        }

        (osra.stages || []).forEach(stage => {
          const isStgGeneral = (stage.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
          const isStgFamily = (stage.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
          const isStgAsstFamily = (stage.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);

          if (isStgGeneral || isStgFamily || isStgAsstFamily) {
            assignments.push({
              type: 'coordinator',
              roleName: isStgGeneral ? 'أمين الأسرة' : 'مساعد أمين الأسرة',
              serviceName: osra.name,
              stageName: stage.name,
              targetPath: isStgGeneral ? '/general-coordinator' : '/family-coordinator',
            });
          }

          (stage.classes || []).forEach(cls => {
            const isServant = (cls.servants || []).map(x => x.toLowerCase()).includes(usernameLower);
            if (isServant) {
              assignments.push({
                type: 'servant',
                roleName: 'خادم',
                serviceName: osra.name,
                stageName: stage.name,
                className: cls.name,
                targetPath: '/servant',
              });
            }
          });
        });
      });
    });
    
    return assignments;
  };
  const [dashboardMode, setDashboardMode] = useState(() => {
    const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (userObj.username === 'admin') return 'admin';
    return localStorage.getItem('dashboardMode_' + userObj.username) || 'service';
  });

  const switchDashboardMode = (mode) => {
    setDashboardMode(mode);
    localStorage.setItem('dashboardMode_' + currentUser.username, mode);
  };

  // Edit & Delete Service Modals State
  const [editingServiceModal, setEditingServiceModal] = useState(null);
  const [deletingServiceModal, setDeletingServiceModal] = useState(null);

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
        fetchInitialData(true);
      } else {
        window.customAlert('فشل حفظ التعديلات على السيرفر.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء تعديل الخدمة.');
    }
  };

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
        fetchInitialData(true);
      } else {
        window.customAlert('فشل حذف الخدمة من السيرفر.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء حذف الخدمة.');
    }
  };

  // Create User Form States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [email, setEmail] = useState('');
  const [church, setChurch] = useState('');
  const [role, setRole] = useState('servant');
  const [osra, setOsra] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createUserMemberCode, setCreateUserMemberCode] = useState('');
  const [createUserSystemCode, setCreateUserSystemCode] = useState('');

  // Jobs management state
  const [jobs, setJobs] = useState([]);
  const [stagesList, setStagesList] = useState([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageCode, setNewStageCode] = useState('');
  const [newStageOrder, setNewStageOrder] = useState('');
  const [editingStageId, setEditingStageId] = useState(null);
  const [editStageName, setEditStageName] = useState('');
  const [editStageCode, setEditStageCode] = useState('');
  const [editStageOrder, setEditStageOrder] = useState('');
  const [selectedStageIdsForPromotion, setSelectedStageIdsForPromotion] = useState([]);
  const [menuExpandedServices, setMenuExpandedServices] = useState(false);
  const [menuExpandedMembers, setMenuExpandedMembers] = useState(false);
  const [menuExpandedAccounts, setMenuExpandedAccounts] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [newJobRefRole, setNewJobRefRole] = useState('servant');
  const [newJobPermissions, setNewJobPermissions] = useState({
    viewServiceTree: true,
    editServiceTree: false,
    manageServiceYears: false,
    selectServiceYears: true,
    createService: false,
    viewServicesStructure: true,
    viewVisitationLogs: true,
    deleteVisitationLogs: false,
    viewMessages: true,
    sendMessages: true,
    viewMembers: true,
    addMembers: true,
    editMembers: true,
    deleteMembers: true,
    manageStagesList: false,
    manageStagePromotion: false,
    manageServants: false,
    manageJobs: false,
    manageDeadlines: false,
    viewEvaluations: true,
    viewPreparations: true,
    managePreparations: true
  });
  const [editingJob, setEditingJob] = useState(null);
  const [editingJobName, setEditingJobName] = useState('');
  const [editingJobRefRole, setEditingJobRefRole] = useState('servant');
  const [editingJobPermissions, setEditingJobPermissions] = useState({});

  // Permissions Custom State
  const getDefaultPermissions = (roleKey) => {
    const isElevated = ['admin', 'priest', 'general_coordinator', 'super_admin'].includes(roleKey);
    const isCoordinating = ['admin', 'priest', 'general_coordinator', 'family_coordinator', 'assistant_family_coordinator', 'super_admin'].includes(roleKey);
    const isAdminRole = ['admin', 'super_admin', 'priest'].includes(roleKey);
    return {
      viewServiceTree: true,
      editServiceTree: isElevated,
      manageServiceYears: isElevated,
      selectServiceYears: isCoordinating,
      createService: isAdminRole,
      viewServicesStructure: true,
      viewVisitationLogs: true,
      deleteVisitationLogs: isElevated,
      viewEvaluations: true,
      viewMessages: true,
      sendMessages: true,
      manageDeadlines: isAdminRole,
      viewMembers: isCoordinating,
      addMembers: isCoordinating,
      editMembers: isCoordinating,
      deleteMembers: isCoordinating,
      manageStagesList: isAdminRole,
      manageStagePromotion: isAdminRole,
      manageServants: isAdminRole,
      manageJobs: isAdminRole,
      managePreparations: isCoordinating,
      viewPreparations: true
    };
  };

  const [permissions, setPermissions] = useState(getDefaultPermissions('servant'));
  const [showPermissionsGrid, setShowPermissionsGrid] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');

  const [editUsernameState, setEditUsernameState] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('servant');
  const [editOsra, setEditOsra] = useState('');
  const [editPermissions, setEditPermissions] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserError, setEditUserError] = useState('');
  const [editUserSuccess, setEditUserSuccess] = useState('');
  const [editingUserSubmitting, setEditingUserSubmitting] = useState(false);
  const [showEditPermissionsGrid, setShowEditPermissionsGrid] = useState(false);


  // Add Member form states
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberBirthDate, setMemberBirthDate] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [memberGender, setMemberGender] = useState('male');
  const [memberStage, setMemberStage] = useState('');
  const [memberSocialStatus, setMemberSocialStatus] = useState('أعزب');
  const [memberAddress, setMemberAddress] = useState('');
  const [memberArea, setMemberArea] = useState('');
  const [memberStreet, setMemberStreet] = useState('');
  const [memberBuilding, setMemberBuilding] = useState('');
  const [memberFloor, setMemberFloor] = useState('');
  const [memberApartment, setMemberApartment] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [memberNotes, setMemberNotes] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);

  // Members List Filter states
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterSocialStatus, setFilterSocialStatus] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [filterStreet, setFilterStreet] = useState('all');

  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedFilterStage, setAppliedFilterStage] = useState('all');
  const [appliedFilterGender, setAppliedFilterGender] = useState('all');
  const [appliedFilterSocialStatus, setAppliedFilterSocialStatus] = useState('all');
  const [appliedFilterArea, setAppliedFilterArea] = useState('all');
  const [appliedFilterStreet, setAppliedFilterStreet] = useState('all');

  // Edit Member Modal state
  const [editingMember, setEditingMember] = useState(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberBirthDate, setEditMemberBirthDate] = useState('');
  const [editMemberAge, setEditMemberAge] = useState('');
  const [editMemberGender, setEditMemberGender] = useState('male');
  const [editMemberStage, setEditMemberStage] = useState('');
  const [editMemberSocialStatus, setEditMemberSocialStatus] = useState('أعزب');
  const [editMemberAddress, setEditMemberAddress] = useState('');
  const [editMemberArea, setEditMemberArea] = useState('');
  const [editMemberStreet, setEditMemberStreet] = useState('');
  const [editMemberBuilding, setEditMemberBuilding] = useState('');
  const [editMemberFloor, setEditMemberFloor] = useState('');
  const [editMemberApartment, setEditMemberApartment] = useState('');
  const [editMemberCode, setEditMemberCode] = useState('');
  const [editMemberNotes, setEditMemberNotes] = useState('');
  const [editMemberError, setEditMemberError] = useState('');
  const [editMemberSuccess, setEditMemberSuccess] = useState('');
  const [editMemberSubmitting, setEditMemberSubmitting] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);

  // Search and Filter States for Registered Users
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

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

  // Create Service Form States
  const [selectedPriest, setSelectedPriest] = useState('');
  const [selectedOsraName, setSelectedOsraName] = useState('');
  const [customOsraName, setCustomOsraName] = useState('');
  const [osraDay, setOsraDay] = useState('Friday');
  const [selectedServiceCoordinator, setSelectedServiceCoordinator] = useState('');
  const [selectedAssistantServiceCoordinator, setSelectedAssistantServiceCoordinator] = useState('');
  const [selectedFamilyCoordinator, setSelectedFamilyCoordinator] = useState('');
  const [selectedAssistantFamilyCoordinator, setSelectedAssistantFamilyCoordinator] = useState('');
  const [selectedYearForFilter, setSelectedYearForFilter] = useState(() => {
    const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return localStorage.getItem('activeServiceYear_' + userObj.username) || new Date().getFullYear().toString();
  });
  const [serviceYear, setServiceYear] = useState(selectedYearForFilter);
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [serviceYearsList, setServiceYearsList] = useState([]);
  const [newServiceYearInput, setNewServiceYearInput] = useState('');
  const [editingYearKey, setEditingYearKey] = useState(null); // stores oldYear string when editing
  const [editingYearValue, setEditingYearValue] = useState('');

  // Selected Service for Tree Viewer
  const [selectedServiceForTree, setSelectedServiceForTree] = useState('');

  // Registered Services Structure Expanded/Edit Modal States
  const [expandedServices, setExpandedServices] = useState({});
  const [expandedStages, setExpandedStages] = useState({});
  const [editingOsra, setEditingOsra] = useState(null);


  const hasPermission = (key) => {
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
      return true;
    }
    if (currentUser.permissions && currentUser.permissions[key] !== undefined) {
      return currentUser.permissions[key] === true;
    }
    return currentUser.role === 'priest';
  };

  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    setServiceYear(selectedYearForFilter);
  }, [selectedYearForFilter]);

  useEffect(() => {
    setPermissions(getDefaultPermissions(role));
  }, [role]);

  useEffect(() => {
    if (window.io) {
      const socket = window.io();
      socketRef.current = socket;
      socket.on('data-changed', () => {
        fetchInitialData(true);
      });
      return () => {
        socket.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (stagesList) {
      setSelectedStageIdsForPromotion(stagesList.map(s => s.id || s._id));
    }
  }, [stagesList]);

  // Age calculation helper
  const calculateAge = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  };

  useEffect(() => {
    if (memberBirthDate) {
      setMemberAge(calculateAge(memberBirthDate));
    } else {
      setMemberAge('');
    }
  }, [memberBirthDate]);

  useEffect(() => {
    if (editMemberBirthDate) {
      setEditMemberAge(calculateAge(editMemberBirthDate));
    } else {
      setEditMemberAge('');
    }
  }, [editMemberBirthDate]);

  useEffect(() => {
    setSettingsName(currentUser.name || '');
    setSettingsUsername(currentUser.username || '');
    setSettingsEmail(currentUser.email || '');
    setSettingsChurch(currentUser.church || '');
    setSettingsPassword(currentUser.password || '');
  }, [currentUser]);


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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUsername: currentUser.username,
          name: settingsName.trim(),
          username: settingsUsername.trim().toLowerCase(),
          email: settingsEmail ? settingsEmail.trim() : '',
          church: settingsChurch.trim(),
          password: settingsPassword
        })
      });


      const result = await response.json();
      if (response.ok && result.success) {
        setSettingsSuccess('تم تحديث البيانات بنجاح! ✝');
        const updatedUser = { ...currentUser, ...result.user };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      } else {
        setSettingsError(result.message || 'فشل تحديث البيانات.');
      }
    } catch (err) {
      console.error(err);
      setSettingsError('حدث خطأ أثناء تحديث البيانات الشخصية.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const fetchInitialData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const usersRes = await fetch('/api/users', {
        headers: { 'x-admin-username': currentUser.username }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setUsers(Array.isArray(usersData) ? usersData : (usersData.users || []));
      }

      const servicesRes = await fetch('/api/services');
      const servicesData = await servicesRes.json();
      if (servicesRes.ok) {
        setServices(Array.isArray(servicesData) ? servicesData : (servicesData.services || servicesData.priestServices || []));
      }

      const makhdomeenRes = await fetch('/api/makhdomeen');
      const makhdomeenData = await makhdomeenRes.json();
      if (makhdomeenRes.ok) {
        setMakhdomeen(Array.isArray(makhdomeenData) ? makhdomeenData : (makhdomeenData.makhdomeen || []));
      }

      const jobsRes = await fetch('/api/jobs');
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) {
        setJobs(Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []));
      }

      const stagesRes = await fetch('/api/stages-list');
      const stagesData = await stagesRes.json();
      if (stagesRes.ok) {
        setStagesList(Array.isArray(stagesData) ? stagesData : (stagesData.stagesList || []));
      }

      const yearsRes = await fetch('/api/service-years');
      const yearsData = await yearsRes.json();
      if (yearsRes.ok) {
        setServiceYearsList(Array.isArray(yearsData) ? yearsData : (yearsData.serviceYears || []));
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل البيانات من السيرفر.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMakhdomeenState = (updated) => {
    if (!updated) {
      fetchInitialData(true);
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
      fetchInitialData(true);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJobName.trim()) {
      window.customAlert('الرجاء إدخال اسم الوظيفة!');
      return;
    }
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newJobName.trim(),
          referenceRole: newJobRefRole,
          permissions: newJobPermissions
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.customAlert('تم إضافة الوظيفة بنجاح! ✝');
        setNewJobName('');
        setNewJobRefRole('servant');
        setNewJobPermissions(getDefaultPermissions('servant'));
        fetchInitialData(true);
      } else {
        window.customAlert(result.message || 'فشل إضافة الوظيفة.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJobName.trim()) {
      window.customAlert('الرجاء إدخال اسم الوظيفة!');
      return;
    }
    try {
      const response = await fetch(`/api/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingJobName.trim(),
          referenceRole: editingJobRefRole,
          permissions: editingJobPermissions
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.customAlert('تم تعديل الوظيفة بنجاح! ✝');
        setEditingJob(null);
        fetchInitialData(true);
      } else {
        window.customAlert(result.message || 'فشل تعديل الوظيفة.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleDeleteJob = async (jobId) => {
    window.customConfirm('هل أنت متأكد من حذف هذه الوظيفة نهائياً؟', async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.customAlert('تم حذف الوظيفة بنجاح!');
          fetchInitialData(true);
        } else {
          window.customAlert(result.message || 'فشل حذف الوظيفة.');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
      }
    });
  };

  const handleVerifyMemberCode = () => {
    if (!createUserMemberCode.trim()) {
      setFormError('الرجاء إدخال كود العضو للتحقق!');
      return;
    }
    const found = makhdomeen.find(m => String(m.code || '').trim().toLowerCase() === createUserMemberCode.trim().toLowerCase());
    if (found) {
      setName(found.name);
      setCreateUserSystemCode(found.code);
      setFormSuccess(`تم العثور على العضو: ${found.name}`);
      setFormError('');
    } else {
      setFormError('لم يتم العثور على عضو بهذا الكود!');
      setFormSuccess('');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const finalChurch = role === 'admin' ? church.trim() : currentUser.church;

    if (!name.trim() || !username.trim() || !password || !finalChurch || !role) {
      setFormError('الرجاء إكمال جميع البيانات المطلوبة!');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-username': currentUser.username,
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          email: email ? email.trim() : '',
          church: finalChurch,
          role,
          osra: osra.trim(),
          permissions,
          systemCode: createUserSystemCode || undefined
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setFormSuccess('تم إنشاء الحساب بنجاح! ✝');
        setName('');
        setUsername('');
        setPassword('');
        setEmail('');
        setChurch('');
        setRole('servant');
        setOsra('');
        setPermissions(getDefaultPermissions('servant'));
        setCreateUserMemberCode('');
        setCreateUserSystemCode('');
        fetchInitialData(true);
      } else {
        setFormError(result.message || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      console.error(err);
      setFormError('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsernameState(user.username);
    setEditPassword(user.password);
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setEditOsra(user.osra || '');
    setEditPermissions(user.permissions || getDefaultPermissions(user.role));
    setShowEditModal(true);
    setEditUserError('');
    setEditUserSuccess('');
    setShowEditPermissionsGrid(false);
  };


  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserError('');
    setEditUserSuccess('');
    setEditingUserSubmitting(true);
    try {
      const response = await fetch('/api/users/admin-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-username': currentUser.username,
        },
        body: JSON.stringify({
          oldUsername: editingUser.username,
          name: editName.trim(),
          username: editUsernameState.trim().toLowerCase(),
          password: editPassword,
          email: editEmail ? editEmail.trim() : '',
          church: currentUser.church,
          role: editRole,
          osra: editOsra.trim(),
          permissions: editPermissions
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setEditUserSuccess('تم تحديث بيانات الحساب بنجاح! ✝');
        fetchInitialData(true);
        setTimeout(() => {
          setShowEditModal(false);
          setEditingUser(null);
        }, 1500);
      } else {
        setEditUserError(result.message || 'فشل تحديث الحساب');
      }
    } catch (err) {
      console.error(err);
      setEditUserError('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setEditingUserSubmitting(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setServiceError('');
    setServiceSuccess('');

    const finalOsraName = selectedOsraName.trim();
    if (!finalOsraName) {
      setServiceError('يرجى كتابة اسم الخدمة!');
      return;
    }

    try {
      setLoading(true);
      let serviceExists = false;
      services.forEach(s => {
        const sYear = s.serviceYear || new Date().getFullYear().toString();
        if (sYear === serviceYear && (s.osras || []).some(o => o.name === finalOsraName)) {
          serviceExists = true;
        }
      });
      if (serviceExists) {
        setServiceError('هذه الخدمة مسجلة بالفعل في هذه السنة!');
        setLoading(false);
        return;
      }

      const cleanServices = [...services];
      let unassignedRecord = cleanServices.find(s => 
        s.priestUser === 'unassigned' && 
        (s.serviceYear || new Date().getFullYear().toString()) === serviceYear
      );
      if (!unassignedRecord) {
        unassignedRecord = { priestUser: 'unassigned', serviceYear: serviceYear, osras: [] };
        cleanServices.push(unassignedRecord);
      }

      unassignedRecord.osras.push({
        name: finalOsraName,
        serviceDay: osraDay,
        classes: ['فصل عام'],
        years: {},
        stages: []
      });


      const syncResponse = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanServices)
      });

      if (syncResponse.ok) {
        setServiceSuccess('تم إضافة الخدمة بنجاح! ✝');
        setSelectedOsraName('');
        fetchInitialData();
      } else {
        setServiceError('فشل حفظ الخدمة على السيرفر.');
      }
    } catch (err) {
      console.error(err);
      setServiceError('حدث خطأ أثناء تعديل الخدمة.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStageDefinition = async (e) => {
    e.preventDefault();
    if (!newStageName.trim()) {
      window.customAlert('يرجى كتابة اسم المرحلة!');
      return;
    }
    try {
      const response = await fetch('/api/stages-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageName.trim(),
          code: newStageCode.trim() || '1',
          order: newStageOrder ? parseInt(newStageOrder, 10) : 1
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStagesList(data.stagesList);
        setNewStageName('');
        setNewStageCode('');
        setNewStageOrder('');
        window.customAlert('تم إضافة المرحلة بنجاح! ✝');
      } else {
        window.customAlert(data.message || 'فشل إضافة المرحلة.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleUpdateStageDefinition = async (id) => {
    if (!editStageName.trim()) {
      window.customAlert('يرجى كتابة اسم المرحلة!');
      return;
    }
    try {
      const stageObj = stagesList.find(s => s.id === id || s._id === id);
      const response = await fetch(`/api/stages-list/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editStageName.trim(),
          code: editStageCode.trim(),
          order: editStageOrder ? parseInt(editStageOrder, 10) : 1,
          promotionType: stageObj ? stageObj.promotionType : 'auto',
          allowedTargets: stageObj ? stageObj.allowedTargets : []
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStagesList(data.stagesList);
        setEditingStageId(null);
        window.customAlert('تم تعديل المرحلة بنجاح! ✝');
        fetchInitialData(true);
      } else {
        window.customAlert(data.message || 'فشل تعديل المرحلة.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleDeleteStageDefinition = async (id, name) => {
    window.customConfirm(`هل أنت متأكد من حذف تعريف المرحلة "${name}"؟ لن يؤدي هذا إلى حذف المخدومين ولكن سيتم مسح ارتباطهم بالمرحلة.`, async () => {
      try {
        const response = await fetch(`/api/stages-list/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setStagesList(data.stagesList);
          window.customAlert('تم حذف المرحلة بنجاح.');
        } else {
          window.customAlert(data.message || 'فشل حذف المرحلة.');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
      }
    });
  };

  const handleSavePromotionConfig = async (id, config) => {
    try {
      const stageObj = stagesList.find(s => s.id === id || s._id === id);
      if (!stageObj) return;
      const response = await fetch(`/api/stages-list/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stageObj,
          ...config
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setStagesList(data.stagesList);
      } else {
        window.customAlert(data.message || 'فشل حفظ الإعدادات.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
    }
  };

  const handleExecutePromotion = async () => {
    if (selectedStageIdsForPromotion.length === 0) {
      window.customAlert('الرجاء اختيار مرحلة واحدة على الأقل للتحديث!');
      return;
    }
    window.customConfirm('⚠️ تحذير هام جداً:\nهل أنت متأكد من بدء عملية تحديث وترقية المراحل المحددة للعام الجديد؟\nسيؤدي هذا إلى ترحيل المخدومين في المراحل المحددة إلى المراحل التالية تلقائياً، ونقل المخدومين في المراحل اليدوية إلى قائمة الانتظار للخدام الجدد. يرجى التأكد من عمل نسخة احتياطية أولاً!', async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stages-list/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageIds: selectedStageIdsForPromotion })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          window.customAlert(`تم تحديث المراحل وترقيتها بنجاح لعدد (${data.count}) مخدوم!`);
          fetchInitialData(true);
        } else {
          window.customAlert(data.message || 'فشل تحديث المراحل.');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.username === currentUser.username) {
      window.customAlert('لا يمكنك حذف حساب الأدمن الذي تستخدمه!');
      return;
    }
    
    window.customConfirm(`هل أنت متأكد من حذف الحساب "${userToDelete.name}"؟`, async () => {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(userToDelete.username)}`, {
          method: 'DELETE',
          headers: { 'x-admin-username': currentUser.username }
        });
        if (response.ok) {
          window.customAlert('تم حذف الحساب.');
          fetchInitialData();
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الحذف.');
      }
    });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddMemberError('');
    setAddMemberSuccess('');

    if (!memberName.trim() || !memberPhone.trim() || !memberStage) {
      setAddMemberError('الرجاء إدخال الاسم والتليفون والمرحلة!');
      return;
    }

    setAddMemberSubmitting(true);
    try {
      const parentOsra = services.find(s => s.stages && s.stages.some(st => st.name === memberStage))?.name || 
                         services.flatMap(s => s.osras || []).find(o => o.stages && o.stages.some(st => st.name === memberStage))?.name || '';

      const response = await fetch('/api/makhdomeen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: memberName.trim(),
          gender: memberGender,
          osra: parentOsra,
          stage: memberStage,
          fasl: '', 
          phone: memberPhone.trim(),
          area: memberArea.trim(),
          street: memberStreet.trim(),
          building: memberBuilding.trim(),
          floor: memberFloor.trim(),
          apartment: memberApartment.trim(),
          code: memberCode.trim(),
          notes: memberNotes.trim(),
          birthDate: memberBirthDate,
          socialStatus: memberSocialStatus,
          serviceYear: new Date().getFullYear().toString()
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAddMemberSuccess('تم إضافة العضو بنجاح! ✝');
        setMemberName('');
        setMemberPhone('');
        setMemberBirthDate('');
        setMemberAge('');
        setMemberGender('male');
        setMemberStage('');
        setMemberSocialStatus('أعزب');
        setMemberAddress('');
        setMemberArea('');
        setMemberStreet('');
        setMemberBuilding('');
        setMemberFloor('');
        setMemberApartment('');
        setMemberCode('');
        setMemberNotes('');
        fetchInitialData(true);
      } else {
        setAddMemberError(result.message || 'فشل إضافة العضو');
      }
    } catch (err) {
      console.error(err);
      setAddMemberError('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setAddMemberSubmitting(false);
    }
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setEditMemberName(member.name);
    setEditMemberPhone(member.phone || '');
    setEditMemberBirthDate(member.birthDate || '');
    setEditMemberAge(calculateAge(member.birthDate) || '');
    setEditMemberGender(member.gender || 'male');
    setEditMemberStage(member.stage || '');
    setEditMemberSocialStatus(member.socialStatus || 'أعزب');
    setEditMemberAddress(member.address || '');
    setEditMemberArea(member.area || '');
    setEditMemberStreet(member.street || '');
    setEditMemberBuilding(member.building || '');
    setEditMemberFloor(member.floor || '');
    setEditMemberApartment(member.apartment || '');
    setEditMemberCode(member.code || '');
    setEditMemberNotes(member.notes || '');
    setShowEditMemberModal(true);
    setEditMemberError('');
    setEditMemberSuccess('');
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    setEditMemberError('');
    setEditMemberSuccess('');
    setEditMemberSubmitting(true);
    try {
      const parentOsra = services.find(s => s.stages && s.stages.some(st => st.name === editMemberStage))?.name || 
                         services.flatMap(s => s.osras || []).find(o => o.stages && o.stages.some(st => st.name === editMemberStage))?.name || '';

      const response = await fetch(`/api/makhdomeen/${editingMember.id || editingMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editMemberName.trim(),
          gender: editMemberGender,
          osra: parentOsra,
          stage: editMemberStage,
          phone: editMemberPhone.trim(),
          area: editMemberArea.trim(),
          street: editMemberStreet.trim(),
          building: editMemberBuilding.trim(),
          floor: editMemberFloor.trim(),
          apartment: editMemberApartment.trim(),
          code: editMemberCode.trim(),
          notes: editMemberNotes.trim(),
          birthDate: editMemberBirthDate,
          socialStatus: editMemberSocialStatus,
          fasl: (editMemberStage !== editingMember.stage) ? "" : (editingMember.fasl || "")
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setEditMemberSuccess('تم تحديث بيانات العضو بنجاح! ✝');
        fetchInitialData(true);
        setTimeout(() => {
          setShowEditMemberModal(false);
          setEditingMember(null);
        }, 1500);
      } else {
        setEditMemberError(result.message || 'فشل تحديث العضو');
      }
    } catch (err) {
      console.error(err);
      setEditMemberError('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setEditMemberSubmitting(false);
    }
  };

  const handleDeleteMember = (member) => {
    window.customConfirm(`هل أنت متأكد من حذف العضو (${member.name}) نهائياً؟`, async () => {
      try {
        const response = await fetch(`/api/makhdomeen/${member.id || member._id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.customAlert('تم حذف العضو بنجاح! ✝');
          fetchInitialData(true);
        } else {
          window.customAlert(result.message || 'فشل حذف العضو');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const getRoleArabicName = (roleKey) => {
    switch (roleKey) {
      case 'admin': return 'أدمن الكنيسة';
      case 'priest': return 'كاهن';
      case 'general_coordinator': return 'أمين عام الخدمة';
      case 'family_coordinator': return 'أمين الأسرة';
      case 'assistant_family_coordinator': return 'مساعد أمين الأسرة';
      case 'servant': return 'خادم';
      default: return roleKey;
    }
  };

  const getUserAssignedService = (username) => {
    const priestServ = services.find(s => s.priestUser === username);
    if (priestServ) {
      const names = (priestServ.osras || []).map(o => o.name);
      return names.length > 0 ? `كاهن: ${names.join(', ')}` : 'كاهن غير موزع';
    }
    const foundServices = [];
    services.forEach(s => {
      (s.osras || []).forEach(o => {
        const isFamilyCoord = o.familyCoordinatorUser === username || o.assistantFamilyCoordinatorUser === username;
        
        let isServantInYears = false;
        if (o.years) {
          Object.values(o.years).forEach(y => {
            if (y.servants && y.servants[username]) {
              isServantInYears = true;
            }
          });
        }
        
        let isServantInStages = false;
        if (o.stages) {
          o.stages.forEach(stg => {
            if ((stg.priestUsers && stg.priestUsers.includes(username)) ||
                (stg.generalCoordinatorUsers && stg.generalCoordinatorUsers.includes(username)) ||
                (stg.familyCoordinatorUsers && stg.familyCoordinatorUsers.includes(username)) ||
                (stg.assistantFamilyCoordinatorUsers && stg.assistantFamilyCoordinatorUsers.includes(username))) {
              isServantInStages = true;
            }
            if (stg.classes) {
              stg.classes.forEach(c => {
                if (c.servants && c.servants.includes(username)) {
                  isServantInStages = true;
                }
              });
            }
          });
        }
        
        if (isFamilyCoord || isServantInYears || isServantInStages) {
          if (!foundServices.includes(o.name)) {
            foundServices.push(o.name);
          }
        }
      });
    });
    return foundServices.length > 0 ? foundServices.join(', ') : 'غير موزع';
  };

  const filteredUsers = users.filter(u => {
    if (u.role === 'super_admin') return false;
    if (u.church !== currentUser.church) return false;
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchUser = (u.username || '').toLowerCase().includes(q);
      return matchName || matchUser;
    }
    return true;
  });

  const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
    const aIsMainAdmin = (a.username || '').toLowerCase() === 'admin';
    const bIsMainAdmin = (b.username || '').toLowerCase() === 'admin';
    if (aIsMainAdmin && !bIsMainAdmin) return -1;
    if (!aIsMainAdmin && bIsMainAdmin) return 1;

    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return 0;
  });

  // Dynamically extract all stages across stagesList (Admin-defined global stages),
  // falling back to service tree stages and standard Coptic church stages.
  const allStages = [];
  if (stagesList && stagesList.length > 0) {
    stagesList.forEach(st => {
      if (!allStages.includes(st.name)) {
        allStages.push(st.name);
      }
    });
  } else {
    services.forEach(s => {
      (s.osras || []).forEach(o => {
        if (o.stages) {
          o.stages.forEach(st => {
            if (!allStages.includes(st.name)) {
              allStages.push(st.name);
            }
          });
        }
      });
    });
  }

  if (allStages.length === 0) {
    allStages.push(
      "ابتدائي",
      "إعدادي",
      "ثانوي",
      "جامعيين",
      "خريجين",
      "حرفيين",
      "شباب",
      "حضانات"
    );
  }


  if (currentUser.username !== 'admin' && dashboardMode === 'service') {
    const isAssistant = currentUser.serviceRole === 'assistant_family_coordinator';
    const isGeneral = currentUser.serviceRole === 'general_coordinator';
    const isCoordinator = ['general_coordinator', 'family_coordinator', 'assistant_family_coordinator'].includes(currentUser.serviceRole);
    
    if (isCoordinator) {
      return (
        <CoordinatorDashboard 
          isAssistant={isAssistant} 
          isGeneral={isGeneral} 
          onSwitchToAdmin={() => switchDashboardMode('admin')} 
        />
      );
    } else {
      return (
        <ServantDashboard 
          onSwitchToAdmin={() => switchDashboardMode('admin')} 
        />
      );
    }
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
          
          <ul className="list-unstyled components" style={{ padding: '15px 0 80px 0', flexGrow: 1 }}>

            {/* Group 1: Service Management */}
            <li>
              <div 
                className="sidebar-group-header cursor-pointer py-2 px-3 d-flex justify-content-between align-items-center"
                onClick={() => { setSidebarCollapsed(false); setMenuExpandedServices(!menuExpandedServices); }}
                title="إدارة الخدمات والهيكل"
              >
                <span><i className="fas fa-cubes me-2"></i> إدارة الخدمات والهيكل</span>
                <i className={`fas fa-chevron-${menuExpandedServices ? 'down' : 'left'} small`}></i>
              </div>
              {menuExpandedServices && (
                <ul className="list-unstyled ps-3">
                  <li className={activeTab === 'trees' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('trees'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-sitemap me-2"></i> شجرة الخدمة
                    </a>
                  </li>
                  {hasPermission('createService') && (
                    <li className={activeTab === 'createService' ? 'active' : ''}>
                      <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('createService'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                        <i className="fas fa-plus-circle me-2"></i> إنشاء خدمة
                      </a>
                    </li>
                  )}
                  <li className={activeTab === 'servicesStructure' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('servicesStructure'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-building me-2"></i> هيكل الخدمات
                    </a>
                  </li>
                  <li className={activeTab === 'serviceYearsTab' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('serviceYearsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-calendar-alt me-2"></i> سنين الخدمة
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* Group 2: Members & Stages Management */}
            <li>
              <div 
                className="sidebar-group-header cursor-pointer py-2 px-3 d-flex justify-content-between align-items-center"
                onClick={() => { setSidebarCollapsed(false); setMenuExpandedMembers(!menuExpandedMembers); }}
                title="إدارة الأعضاء والمراحل"
              >
                <span><i className="fas fa-users me-2"></i> إدارة الأعضاء والمراحل</span>
                <i className={`fas fa-chevron-${menuExpandedMembers ? 'down' : 'left'} small`}></i>
              </div>
              {menuExpandedMembers && (
                <ul className="list-unstyled ps-3">
                  <li className={(activeTab === 'membersList' || activeTab === 'makhdomeen') ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('membersList'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-address-book me-2"></i> سجل الأعضاء
                    </a>
                  </li>
                  <li className={activeTab === 'addMember' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('addMember'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-user-graduate me-2"></i> إضافة أعضاء
                    </a>
                  </li>
                  <li className={activeTab === 'stagesTab' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('stagesTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-layer-group me-2"></i> المراحل الدراسية
                    </a>
                  </li>
                  <li className={activeTab === 'manageStagePromotion' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('manageStagePromotion'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-angle-double-up me-2"></i> تحديث المراحل
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* Group 3: Accounts & Permissions Management */}
            <li>
              <div 
                className="sidebar-group-header cursor-pointer py-2 px-3 d-flex justify-content-between align-items-center"
                onClick={() => { setSidebarCollapsed(false); setMenuExpandedAccounts(!menuExpandedAccounts); }}
                title="إدارة الحسابات والصلاحيات"
              >
                <span><i className="fas fa-user-shield me-2"></i> إدارة الحسابات والصلاحيات</span>
                <i className={`fas fa-chevron-${menuExpandedAccounts ? 'down' : 'left'} small`}></i>
              </div>
              {menuExpandedAccounts && (
                <ul className="list-unstyled ps-3">
                  <li className={activeTab === 'createUser' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('createUser'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-user-plus me-2"></i> إنشاء حساب
                    </a>
                  </li>
                  <li className={activeTab === 'registeredUsers' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('registeredUsers'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-users-cog me-2"></i> الحسابات المسجلة
                    </a>
                  </li>
                  <li className={activeTab === 'jobsTab' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('jobsTab'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}>
                      <i className="fas fa-briefcase me-2"></i> الوظائف والصلاحيات
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* Group 4: System Settings */}
            <li>
              <div 
                className="sidebar-group-header cursor-pointer py-2 px-3 d-flex justify-content-between align-items-center"
                onClick={() => { setActiveTab('settings'); if(window.innerWidth < 992) setSidebarShowMobile(false); }}
                title="الإعدادات"
              >
                <span><i className="fas fa-cog me-2"></i> الإعدادات</span>
              </div>
            </li>



          </ul>

          <div className="sidebar-footer p-3 w-100 mt-auto" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <button 
              className="btn btn-danger btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-bold" 
              onClick={handleLogout} 
              title="تسجيل الخروج"
              style={{ borderRadius: '12px' }}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="logout-text">تسجيل الخروج</span>
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
                      setSidebarShowMobile(prev => !prev);
                    } else {
                      setSidebarCollapsed(prev => !prev);
                      setSidebarShowMobile(false);
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
                  <NotificationsBell user={currentUser} onNavigateTab={(tab) => {
                    if (tab === 'registeredUsersTab') setActiveTab('registeredUsers');
                    else if (tab === 'settingsTab') setActiveTab('settings');
                    else setActiveTab(tab);
                  }} />
                </div>
                
                {/* 4. Old Logo / Profile Pic (Circle, Leftmost) */}
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo-removebg-preview.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = '/coptic_cross_final.png' }} />
                </div>
              </div>

            </div>
          </nav>

          {/* Main Content */}
          <div className="container-fluid p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
                <p className="mt-3 text-warning">جاري تحميل بيانات السيرفر والمزامنة...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger text-center">{error}</div>
            ) : (
              <div className="fade-in">

                {/* TAB 1: CREATE USER ACCOUNT */}
                {activeTab === 'createUser' && (
                  <div className="row justify-content-center">
                    <div className="col-lg-10 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-user-plus me-2"></i> إنشاء حساب جديد</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleCreateUser}>
                            <div className="row align-items-end">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">كود العضو</label>
                                <div className="input-group">
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={createUserMemberCode}
                                    onChange={(e) => setCreateUserMemberCode(e.target.value)}
                                    placeholder="مثال: M-1001"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-warning fw-bold"
                                    onClick={handleVerifyMemberCode}
                                  >
                                    تأكيد
                                  </button>
                                </div>
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">الاسم بالكامل</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  required
                                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">اسم المستخدم</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  required
                                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label">كلمة المرور</label>
                                <div className="input-group">
                                  <input
                                    type={showCreatePassword ? "text" : "password"}
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-outline-warning"
                                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                                    style={{ border: '1px solid var(--border-color)', borderRight: 'none', backgroundColor: 'var(--bg-input)' }}
                                  >
                                    <i className={`fas ${showCreatePassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                  </button>
                                </div>
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="form-label">البريد الإلكتروني (اختياري)</label>
                                <input
                                  type="email"
                                  className="form-control"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Role and permissions selectors removed as per user request */}


                            <button type="submit" className="btn btn-warning w-100 py-2 fw-bold" disabled={submitting}>حفظ الحساب ✝</button>
                            {formError && <div className="alert alert-danger mt-3 text-center py-2">{formError}</div>}
                            {formSuccess && <div className="alert alert-success mt-3 text-center py-2">{formSuccess}</div>}
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: REGISTERED ACCOUNTS */}
                {activeTab === 'registeredUsers' && (
                  <div className="row justify-content-center">
                    <div className="col-12 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-users me-2"></i> الحسابات المسجلة</h5>
                          <div className="d-flex flex-wrap gap-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="بحث بالاسم أو اسم المستخدم..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              style={{ width: '250px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                            />
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive" style={{ maxHeight: '600px' }}>
                            <table className="table align-middle">
                              <thead>
                                <tr style={{ color: '#c9a84c' }}>
                                  <th>الاسم</th>
                                  <th>اسم المستخدم</th>
                                  <th>كلمة السر</th>
                                  <th>الخدمة الموزع بها</th>
                                  <th>كود العضوية</th>
                                  <th className="text-center">إجراءات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedFilteredUsers.map((u) => (
                                  <tr key={u.username}>
                                    <td className="fw-bold">{u.name}</td>
                                    <td><code>{u.username}</code></td>
                                    <td><code className="text-warning">{u.password}</code></td>
                                    <td className="text-muted" style={{ fontSize: '0.9rem' }}>{getUserAssignedService(u.username)}</td>
                                    <td>
                                      {isRealMemberCode(u.systemCode) ? (
                                        <code className="text-info fw-bold">{u.systemCode}</code>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                    <td className="text-center">
                                      <div className="d-flex justify-content-center gap-2">
                                         <button
                                           type="button"
                                           className="btn btn-sm btn-outline-primary px-3 py-1 fw-bold"
                                           style={{ borderRadius: '10px' }}
                                           onClick={() => openEditUser(u)}
                                           title="تعديل الحساب"
                                         >
                                           <i className="fas fa-edit me-1"></i> تعديل
                                         </button>
                                         <button
                                           type="button"
                                           className="btn btn-sm btn-outline-danger px-3 py-1 fw-bold"
                                           style={{ borderRadius: '10px' }}
                                           onClick={() => handleDeleteUser(u)}
                                           disabled={u.username === currentUser.username || u.username.toLowerCase() === 'admin'}
                                           title="حذف الحساب"
                                         >
                                           <i className="fas fa-trash-alt me-1"></i> حذف
                                         </button>
                                       </div>
                                    </td>
                                  </tr>
                                ))}
                                {sortedFilteredUsers.length === 0 && (
                                  <tr>
                                    <td colSpan="6" className="text-center py-4 text-muted">لا يوجد حسابات مسجلة تطابق البحث.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: ADD MEMBER */}
                {activeTab === 'addMember' && (
                  <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-7 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-user-plus me-2"></i> إضافة عضو جديد (مخدوم)</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleAddMember}>
                            {addMemberError && <div className="alert alert-danger text-center py-2">{addMemberError}</div>}
                            {addMemberSuccess && <div className="alert alert-success text-center py-2">{addMemberSuccess}</div>}

                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label">الاسم رباعي <span className="text-danger">*</span></label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberName}
                                  onChange={(e) => setMemberName(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="form-label">رقم التليفون <span className="text-danger">*</span></label>
                                <input
                                  type="tel"
                                  className="form-control"
                                  value={memberPhone}
                                  onChange={(e) => setMemberPhone(e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label">تاريخ الميلاد (اختياري)</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={memberBirthDate}
                                  onChange={(e) => setMemberBirthDate(e.target.value)}
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="form-label">العمر (يُحسب تلقائياً)</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberAge}
                                  disabled
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">النوع <span className="text-danger">*</span></label>
                                <select
                                  className="form-select"
                                  value={memberGender}
                                  onChange={(e) => setMemberGender(e.target.value)}
                                  required
                                >
                                  <option value="male">ذكر</option>
                                  <option value="female">أنثى</option>
                                </select>
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">المرحلة <span className="text-danger">*</span></label>
                                <select
                                  className="form-select"
                                  value={memberStage}
                                  onChange={(e) => setMemberStage(e.target.value)}
                                  required
                                >
                                  <option value="">-- اختر المرحلة --</option>
                                  {allStages.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">الحالة الاجتماعية <span className="text-danger">*</span></label>
                                <select
                                  className="form-select"
                                  value={memberSocialStatus}
                                  onChange={(e) => setMemberSocialStatus(e.target.value)}
                                  required
                                >
                                  <option value="أعزب">أعزب</option>
                                  <option value="متزوج">متزوج</option>
                                  <option value="أرمل">أرمل</option>
                                </select>
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-6 mb-3">
                                <label className="form-label">المنطقة</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberArea}
                                  onChange={(e) => setMemberArea(e.target.value)}
                                />
                              </div>
                              <div className="col-md-6 mb-3">
                                <label className="form-label">الشارع</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberStreet}
                                  onChange={(e) => setMemberStreet(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <label className="form-label">رقم العمارة</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberBuilding}
                                  onChange={(e) => setMemberBuilding(e.target.value)}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">الدور</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberFloor}
                                  onChange={(e) => setMemberFloor(e.target.value)}
                                />
                              </div>
                              <div className="col-md-4 mb-3">
                                <label className="form-label">رقم الشقة</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={memberApartment}
                                  onChange={(e) => setMemberApartment(e.target.value)}
                                />
                              </div>
                            </div>



                            <div className="mb-4">
                              <label className="form-label">ملاحظات (اختياري)</label>
                              <textarea
                                className="form-control"
                                rows="3"
                                value={memberNotes}
                                onChange={(e) => setMemberNotes(e.target.value)}
                              ></textarea>
                            </div>


                            <button type="submit" className="btn btn-warning w-100 py-2 fw-bold" disabled={addMemberSubmitting}>
                              {addMemberSubmitting ? 'جاري الإضافة...' : 'إضافة العضو الجديد ✝'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: MEMBERS LIST */}
                {activeTab === 'membersList' && (() => {
                  const distinctAreas = [...new Set(makhdomeen.map(m => m.region).filter(Boolean))].sort();
                  const distinctStreets = [...new Set(makhdomeen.map(m => m.street).filter(Boolean))].sort();

                  const filteredMembers = makhdomeen.filter(m => {
                    const matchName = !appliedSearchQuery || 
                                      m.name.toLowerCase().includes(appliedSearchQuery.toLowerCase()) || 
                                      (m.phone || '').includes(appliedSearchQuery) ||
                                      (m.code || '').toLowerCase().includes(appliedSearchQuery.toLowerCase());
                    const matchStage = appliedFilterStage === 'all' || !appliedFilterStage || m.stage === appliedFilterStage;
                    const matchGender = appliedFilterGender === 'all' || !appliedFilterGender || m.gender === appliedFilterGender;
                    const matchSocial = appliedFilterSocialStatus === 'all' || !appliedFilterSocialStatus || m.socialStatus === appliedFilterSocialStatus;
                    const matchArea = appliedFilterArea === 'all' || !appliedFilterArea || (m.region || '').toLowerCase().includes(appliedFilterArea.toLowerCase());
                    const matchStreet = appliedFilterStreet === 'all' || !appliedFilterStreet || (m.street || '').toLowerCase().includes(appliedFilterStreet.toLowerCase());
                    return matchName && matchStage && matchGender && matchSocial && matchArea && matchStreet;
                  });

                  return (
                    <div className="row justify-content-center">
                      <div className="col-12 mb-4">
                        <div className="card shadow">
                          <div className="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-users-cog me-2"></i> إدارة الأعضاء (المخدومين)</h5>
                            <div className="text-muted small">
                              إجمالي المعروض: <strong className="text-warning">{filteredMembers.length}</strong> من أصل <strong className="text-white-50">{makhdomeen.length}</strong> مخدوم
                            </div>
                          </div>
                          <div className="card-body">
                            {/* Filter Panel */}
                            <div className="card border-warning mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(201, 168, 76, 0.15)', borderRadius: '12px' }}>
                              <div className="card-body p-3">
                                <h6 className="text-warning fw-bold mb-3"><i className="fas fa-search me-2"></i> فلاتر البحث المتقدمة عن الأعضاء</h6>
                                <div className="row g-2">
                                  {/* Row 1 */}
                                  <div className="col-md-3">
                                    <label className="form-label text-white-50 small mb-1">الاسم / الكود / التليفون</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={memberSearchQuery}
                                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                                      placeholder="ابحث بالاسم، الكود، أو التليفون..."
                                    />
                                  </div>
                                  <div className="col-md-3">
                                    <label className="form-label text-white-50 small mb-1">المرحلة</label>
                                    <SearchableSelect
                                      value={filterStage}
                                      onChange={(v) => { setFilterStage(v); setAppliedFilterStage(v); }}
                                      options={allStages}
                                      placeholder="المرحلة (الكل)..."
                                      allLabel="كل المراحل ⛪"
                                    />
                                  </div>
                                  <div className="col-md-3">
                                    <label className="form-label text-white-50 small mb-1">المنطقة</label>
                                    <SearchableSelect
                                      value={filterArea}
                                      onChange={(v) => { setFilterArea(v); setAppliedFilterArea(v); }}
                                      options={distinctAreas}
                                      placeholder="المنطقة (الكل)..."
                                      allLabel="كل المناطق 🗺️"
                                    />
                                  </div>
                                  <div className="col-md-3">
                                    <label className="form-label text-white-50 small mb-1">الشارع</label>
                                    <SearchableSelect
                                      value={filterStreet}
                                      onChange={(v) => { setFilterStreet(v); setAppliedFilterStreet(v); }}
                                      options={distinctStreets}
                                      placeholder="الشارع (الكل)..."
                                      allLabel="كل الشوارع 🛣️"
                                    />
                                  </div>

                                  {/* Row 2 */}
                                  <div className="col-md-4">
                                    <label className="form-label text-white-50 small mb-1">النوع</label>
                                    <select
                                      className="form-select form-select-sm"
                                      value={filterGender}
                                      onChange={(e) => { const v = e.target.value; setFilterGender(v); setAppliedFilterGender(v); }}
                                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                    >
                                      <option value="all">النوع (الكل)</option>
                                      <option value="male">ذكر</option>
                                      <option value="female">أنثى</option>
                                    </select>
                                  </div>
                                  <div className="col-md-4">
                                    <label className="form-label text-white-50 small mb-1">الحالة الاجتماعية</label>
                                    <select
                                      className="form-select form-select-sm"
                                      value={filterSocialStatus}
                                      onChange={(e) => { const v = e.target.value; setFilterSocialStatus(v); setAppliedFilterSocialStatus(v); }}
                                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                                    >
                                      <option value="all">الحالة الاجتماعية (الكل)</option>
                                      <option value="أعزب">أعزب</option>
                                      <option value="متزوج">متزوج</option>
                                      <option value="أرمل">أرمل</option>
                                    </select>
                                  </div>

                                  <div className="col-md-4 d-flex gap-2 align-items-end" style={{ paddingTop: '28px' }}>
                                     <button
                                       type="button"
                                       className="btn btn-danger btn-sm fw-bold flex-grow-1 py-2"
                                       style={{ backgroundColor: '#8f1d2c', borderColor: '#8f1d2c', color: '#ffffff', borderRadius: '20px' }}
                                       onClick={() => {
                                         setAppliedSearchQuery(memberSearchQuery);
                                         setAppliedFilterStage(filterStage);
                                         setAppliedFilterGender(filterGender);
                                         setAppliedFilterSocialStatus(filterSocialStatus);
                                         setAppliedFilterArea(filterArea);
                                         setAppliedFilterStreet(filterStreet);
                                       }}
                                     >
                                       <i className="fas fa-search me-1"></i> بحث
                                     </button>
                                     <button
                                       type="button"
                                       className="btn btn-outline-secondary btn-sm fw-bold px-4 py-2"
                                       style={{ borderRadius: '20px' }}
                                       onClick={() => {
                                         setMemberSearchQuery('');
                                         setFilterStage('all');
                                         setFilterGender('all');
                                         setFilterSocialStatus('all');
                                         setFilterArea('all');
                                         setFilterStreet('all');
                                         
                                         setAppliedSearchQuery('');
                                         setAppliedFilterStage('all');
                                         setAppliedFilterGender('all');
                                         setAppliedFilterSocialStatus('all');
                                         setAppliedFilterArea('all');
                                         setAppliedFilterStreet('all');
                                       }}
                                     >
                                       <i className="fas fa-undo me-1"></i> تفريغ
                                     </button>
                                   </div>
                                </div>
                              </div>
                            </div>
                            <div className="table-responsive" style={{ maxHeight: '600px' }}>
                              <table className="table align-middle">
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th>الاسم رباعي</th>
                                    <th>الكود</th>
                                    <th>رقم التليفون</th>
                                    <th>السن</th>
                                    <th>النوع</th>
                                    <th>المرحلة</th>
                                    <th>الحالة الاجتماعية</th>
                                    <th>المنطقة</th>
                                    <th>الشارع</th>
                                    <th>العمارة</th>
                                    <th>الدور</th>
                                    <th>الشقة</th>
                                    <th>ملاحظات</th>
                                    <th className="text-center">الاجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredMembers.map((m) => (
                                    <tr key={m.id || m._id}>
                                      <td className="fw-bold">{m.name}</td>
                                      <td><span className="badge bg-secondary">{m.code || '-'}</span></td>
                                      <td><code>{m.phone || '-'}</code></td>
                                      <td>{calculateAge(m.birthDate) || '-'}</td>
                                      <td>{m.gender === 'male' ? 'بنين' : 'بنات'}</td>
                                      <td><span className="badge bg-dark border fw-bold px-3 py-2" style={{ color: "#ffd700" }}>{m.stage || "-"}</span></td>
                                      <td>{m.socialStatus || '-'}</td>
                                      <td>{m.area || '-'}</td>
                                      <td>{m.street || '-'}</td>
                                      <td>{m.building || '-'}</td>
                                      <td>{m.floor || '-'}</td>
                                      <td>{m.apartment || '-'}</td>
                                      <td style={{ fontSize: '0.85rem' }} className="text-muted">{m.notes || '-'}</td>
                                      <td className="text-center">
                                        <div className="btn-group gap-1">
                                          <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => openEditMember(m)}
                                          >
                                            <i className="fas fa-edit"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleDeleteMember(m)}
                                          >
                                            <i className="fas fa-trash-alt"></i>
                                          </button>
                                          {m.phone && (
                                            <a
                                              href={`https://wa.me/${m.phone.startsWith('01') ? '20' + m.phone.substring(1) : m.phone.replace(/[^0-9]/g, '')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="btn btn-outline-success btn-sm"
                                              title="مراسلة عبر واتساب"
                                            >
                                              <i className="fab fa-whatsapp"></i>
                                            </a>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {filteredMembers.length === 0 && (
                                    <tr>
                                      <td colSpan="9" className="text-center py-4 text-muted">لا يوجد أعضاء تطابق معايير البحث والفلترة.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB: CREATE SERVICE */}
                {activeTab === 'createService' && (
                  <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6 mb-4">
                      <div className="card shadow">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-plus-circle me-2"></i> إنشاء خدمة جديدة</h5>
                        </div>
                        <div className="card-body">
                          <form onSubmit={handleCreateService}>
                            <div className="mb-3">
                              <label className="form-label">اسم الخدمة</label>
                              <input
                                type="text"
                                className="form-control"
                                value={selectedOsraName}
                                onChange={(e) => setSelectedOsraName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">يوم الخدمة الأسبوعي</label>
                              <select
                                className="form-select"
                                value={osraDay}
                                onChange={(e) => setOsraDay(e.target.value)}
                              >
                                <option value="Sunday">الأحد</option>
                                <option value="Monday">الإثنين</option>
                                <option value="Tuesday">الثلاثاء</option>
                                <option value="Wednesday">الأربعاء</option>
                                <option value="Thursday">الخميس</option>
                                <option value="Friday">الجمعة</option>
                                <option value="Saturday">السبت</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label d-block">سنة الخدمة النشطة حالياً لجهازك</label>
                              <span className="badge bg-warning text-dark fw-bold fs-6 py-2 px-3">{serviceYear}</span>
                              <small className="text-muted d-block mt-1">يتم ربط الخدمة الجديدة تلقائياً بالسنة النشطة لحسابك.</small>
                            </div>
                            <button type="submit" className="btn btn-warning w-100 py-2 fw-bold">حفظ الخدمة ✝</button>
                            {serviceError && <div className="alert alert-danger mt-3 text-center py-2">{serviceError}</div>}
                            {serviceSuccess && <div className="alert alert-success mt-3 text-center py-2">{serviceSuccess}</div>}
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'servicesStructure' && (() => {
                  const yearServices = services.filter(s => (s.serviceYear || new Date().getFullYear().toString()) === selectedYearForFilter);
                  const allOsras = yearServices.flatMap(s => (s.osras || []).map(o => ({ ...o, priestUser: o.priestUser || s.priestUser })));

                  const toggleService = (name) => {
                    setExpandedServices(prev => ({
                      ...prev,
                      [name]: !prev[name]
                    }));
                  };

                  const toggleStage = (serviceName, stageName) => {
                    const key = `${serviceName}-${stageName}`;
                    setExpandedStages(prev => ({
                      ...prev,
                      [key]: !prev[key]
                    }));
                  };

                  return (
                    <div className="row">
                      <div className="col-12 mb-4">
                        <div className="card shadow">
                          <div className="card-header py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-church me-2"></i> هيكل الخدمات المسجلة لعام {selectedYearForFilter}</h5>
                            
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-warning text-dark fw-bold px-3 py-2">سنة الخدمة: {selectedYearForFilter}</span>
                            </div>
                          </div>
                          
                          <div className="card-body">
                            <div className="table-responsive">
                              <table className="table align-middle table-hover" style={{ borderColor: 'var(--border-color)' }}>
                                <thead>
                                  <tr style={{ color: '#c9a84c' }}>
                                    <th style={{ width: '40px' }}></th>
                                    <th>اسم الخدمة / الأسرة</th>
                                    <th>يوم الخدمة الأسبوعي</th>
                                    <th>عدد المراحل</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {allOsras.length === 0 ? (
                                    <tr>
                                      <td colSpan="4" className="text-center py-4 text-muted">
                                        لا توجد خدمات مسجلة في هذه السنة الخدمية بعد. يرجى الانتقال إلى تبويب "انشاء خدمة" لإضافتها أولاً.
                                      </td>
                                    </tr>
                                  ) : (
                                    allOsras.map(o => {
                                      const getFullName = (username) => {
                                        if (!username || username === 'unassigned') return 'غير معين';
                                        const u = users.find(usr => usr.username === username);
                                        return u ? u.name : username;
                                      };

                                      const getListNames = (usernames) => {
                                        if (!usernames || usernames.length === 0) return 'غير معين';
                                        return usernames.map(u => getFullName(u)).join(' ، ');
                                      };

                                      const isExpanded = !!expandedServices[o.name];
                                      const serviceDayText = o.serviceDay === 'Friday' ? 'الجمعة' : 
                                                            o.serviceDay === 'Saturday' ? 'السبت' : 
                                                            o.serviceDay === 'Sunday' ? 'الأحد' : 
                                                            o.serviceDay === 'Monday' ? 'الإثنين' : 
                                                            o.serviceDay === 'Tuesday' ? 'الثلاثاء' : 
                                                            o.serviceDay === 'Wednesday' ? 'الأربعاء' : 
                                                            o.serviceDay === 'Thursday' ? 'الخميس' : o.serviceDay || '-';

                                      return (
                                        <React.Fragment key={o.name}>
                                          <tr style={{ cursor: 'pointer', backgroundColor: isExpanded ? 'rgba(201, 168, 76, 0.05)' : 'transparent' }} onClick={() => toggleService(o.name)}>
                                            <td>
                                              <button className="btn btn-link btn-sm text-warning p-0" type="button">
                                                <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-left'}`}></i>
                                              </button>
                                            </td>
                                            <td className="fw-bold text-white"><i className="fas fa-church text-warning me-2"></i> {o.name}</td>
                                            <td><span className="badge bg-warning text-dark">يوم {serviceDayText}</span></td>
                                            <td className="text-white">{o.stages ? o.stages.length : 0}</td>
                                          </tr>
                                          
                                          {isExpanded && (
                                            <tr>
                                              <td colSpan="4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: '15px 30px' }}>
                                                <div className="p-3 rounded border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                                  <h6 className="fw-bold text-warning mb-3"><i className="fas fa-sitemap me-2"></i> المراحل والمسؤولين التابعين لخدمة ({o.name})</h6>
                                                  
                                                  {(!o.stages || o.stages.length === 0) ? (
                                                    <div className="text-muted small py-2">لا توجد مراحل مضافة في هذه الخدمة بعد. يرجى تهيئتها من تبويب شجرات الخدمات.</div>
                                                  ) : (
                                                    <div className="table-responsive">
                                                      <table className="table table-sm table-bordered align-middle text-white" style={{ borderColor: 'var(--border-color)', fontSize: '0.9rem' }}>
                                                        <thead>
                                                          <tr style={{ color: '#c9a84c', fontSize: '0.85rem' }}>
                                                            <th style={{ width: '40px' }}></th>
                                                            <th>المرحلة</th>
                                                            <th>الآب الكاهن</th>
                                                            <th>أمين الأسرة / المرحلة</th>
                                                            <th>مساعد أمين الأسرة</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {o.stages.map(stg => {
                                                            const stageKey = `${o.name}-${stg.name}`;
                                                            const isStageExpanded = !!expandedStages[stageKey];

                                                            return (
                                                              <React.Fragment key={stg.name}>
                                                                <tr style={{ cursor: 'pointer' }} onClick={() => toggleStage(o.name, stg.name)}>
                                                                  <td>
                                                                    <i className={`fas text-warning ${isStageExpanded ? 'fa-chevron-down' : 'fa-chevron-left'}`}></i>
                                                                  </td>
                                                                  <td className="fw-bold text-info"><i className="fas fa-folder-open me-2 text-warning"></i> {stg.name}</td>
                                                                  <td className="text-primary fw-bold">{getListNames(stg.priestUsers)}</td>
                                                                  <td className="text-warning">{getListNames(stg.familyCoordinatorUsers)}</td>
                                                                  <td className="text-white-50">{getListNames(stg.assistantFamilyCoordinatorUsers)}</td>
                                                                </tr>

                                                                {isStageExpanded && (
                                                                  <tr>
                                                                    <td colSpan="5" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '10px 20px' }}>
                                                                      <div className="ps-3 border-start border-warning">
                                                                        <h6 className="small fw-bold text-warning mb-2"><i className="fas fa-chalkboard-teacher me-1"></i> فصول المرحلة ({stg.name}):</h6>
                                                                        {(!stg.classes || stg.classes.length === 0) ? (
                                                                          <div className="text-muted small">لا توجد فصول في هذه المرحلة.</div>
                                                                        ) : (
                                                                          <table className="table table-sm table-bordered align-middle text-white-50 mb-0" style={{ borderColor: 'rgba(201, 168, 76, 0.2)', fontSize: '0.85rem', maxWidth: '600px' }}>
                                                                            <thead>
                                                                              <tr style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                                                                <th>اسم الفصل</th>
                                                                                <th>الخدام المعينين</th>
                                                                              </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                              {stg.classes.map(cls => (
                                                                                <tr key={cls.name}>
                                                                                  <td className="fw-bold text-white"><i className="fas fa-user-friends me-1 text-warning"></i> {cls.name}</td>
                                                                                  <td>
                                                                                    {cls.servants && cls.servants.length > 0 ? (
                                                                                      cls.servants.map(s => getFullName(s)).join(' ، ')
                                                                                    ) : (
                                                                                      <span className="text-muted italic">لا يوجد خدام معينين</span>
                                                                                    )}
                                                                                  </td>
                                                                                </tr>
                                                                              ))}
                                                                            </tbody>
                                                                          </table>
                                                                        )}
                                                                      </div>
                                                                    </td>
                                                                  </tr>
                                                                )}
                                                              </React.Fragment>
                                                            );
                                                          })}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB: JOBS */}
                {activeTab === 'jobsTab' && (
                  <div className="fade-in">
                    <div className="row g-4">
                      {/* List of Jobs */}
                      <div className="col-lg-7">
                        <div className="card h-100 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <div className="card-body p-4">
                            <h5 className="fw-bold text-warning mb-4"><i className="fas fa-briefcase me-2"></i> الوظائف والصلاحيات المعرفة</h5>
                            {jobs.length === 0 ? (
                              <p className="text-muted text-center py-5">لا توجد وظائف مضافة بعد.</p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                  <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                      <th className="py-3 px-3 fw-bold" style={{ color: 'var(--color-text)' }}>اسم الوظيفة</th>
                                      <th className="py-3 px-3 text-center fw-bold" style={{ color: 'var(--color-text)' }}>الإجراءات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {jobs.map(job => (
                                      <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td className="px-3 py-3 fw-bold" style={{ color: 'var(--color-text)', fontSize: '1rem' }}>{job.name}</td>
                                        <td className="text-center py-3">
                                          <div className="d-flex justify-content-center gap-2">
                                            <button 
                                              type="button"
                                              className="btn btn-sm btn-outline-primary px-3 py-1 fw-bold" 
                                              style={{ borderRadius: '10px' }}
                                              onClick={() => {
                                                setEditingJob(job);
                                                setEditingJobName(job.name);
                                                setEditingJobPermissions(job.permissions || {});
                                              }}
                                              title="تعديل"
                                            >
                                              <i className="fas fa-edit me-1"></i> تعديل
                                            </button>
                                            <button 
                                              type="button"
                                              className="btn btn-sm btn-outline-danger px-3 py-1 fw-bold" 
                                              style={{ borderRadius: '10px' }}
                                              onClick={() => handleDeleteJob(job.id)}
                                              title="حذف"
                                            >
                                              <i className="fas fa-trash me-1"></i> حذف
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

                      {/* Add/Edit Job Form */}
                      <div className="col-lg-5">
                        <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <div className="card-body p-4">
                            {editingJob ? (
                              <form onSubmit={handleUpdateJob}>
                                <h5 className="fw-bold text-warning mb-4"><i className="fas fa-edit me-2"></i> تعديل وظيفة: {editingJob.name}</h5>
                                <div className="mb-3">
                                  <label className="form-label">اسم الوظيفة</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={editingJobName}
                                    onChange={(e) => setEditingJobName(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label d-block text-warning border-bottom pb-1 mb-2">تحديد صلاحيات هذه الوظيفة</label>
                                  <PermissionsSelector
                                    permissionsState={editingJobPermissions}
                                    onChangePermission={(key) => {
                                      setEditingJobPermissions(prev => ({
                                        ...prev,
                                        [key]: !prev[key]
                                      }));
                                    }}
                                  />
                                </div>
                                <div className="d-flex gap-2">
                                  <button type="submit" className="btn btn-warning w-100 py-2 fw-bold">حفظ التعديلات ✝</button>
                                  <button type="button" className="btn btn-secondary w-50 py-2" onClick={() => setEditingJob(null)}>إلغاء</button>
                                </div>
                              </form>
                            ) : (
                              <form onSubmit={handleCreateJob}>
                                <h5 className="fw-bold text-warning mb-4"><i className="fas fa-plus me-2"></i> إضافة وظيفة جديدة</h5>
                                <div className="mb-3">
                                  <label className="form-label">اسم الوظيفة الجديدة</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={newJobName}
                                    onChange={(e) => setNewJobName(e.target.value)}
                                    required
                                  />
                                </div>

                                <div className="mb-3">
                                  <label className="form-label d-block text-warning border-bottom pb-1 mb-2">تحديد صلاحيات هذه الوظيفة</label>
                                  <PermissionsSelector
                                    permissionsState={newJobPermissions}
                                    onChangePermission={(key) => {
                                      setNewJobPermissions(prev => ({
                                        ...prev,
                                        [key]: !prev[key]
                                      }));
                                    }}
                                  />
                                </div>
                                <button type="submit" className="btn btn-warning w-100 py-2 fw-bold">إضافة الوظيفة ✝</button>
                              </form>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: TREES */}
                {activeTab === 'trees' && (
                  <div className="fade-in">
                    {!selectedServiceForTree ? (
                      <div className="row justify-content-center">
                        <div className="col-12 d-flex justify-content-center mb-4">
                          <span className="badge fw-bold px-3 py-2" style={{ backgroundColor: 'var(--gold-accent)', color: 'var(--sidebar-bg)' }}>سنة الخدمة: {selectedYearForFilter}</span>
                        </div>

                        <h5 className="text-center fw-bold mb-4 service-selection-heading" style={{ fontSize: '1.25rem' }}><i className="fas fa-sitemap me-2"></i> اختر الخدمة:</h5>
                        {services.filter(s => (s.serviceYear || new Date().getFullYear().toString()) === selectedYearForFilter).flatMap(s => s.osras || []).length > 0 ? (
                          <div className="row col-lg-9 g-4 justify-content-center">
                            {services.filter(s => (s.serviceYear || new Date().getFullYear().toString()) === selectedYearForFilter).flatMap(s => s.osras || []).map(o => (
                              <div className="col-md-6 col-lg-4" key={o.name}>
                                <div 
                                  className="card h-100 text-center service-select-card cursor-pointer"
                                  onClick={() => setSelectedServiceForTree(o.name)}
                                >
                                  <div className="card-body p-4 d-flex flex-column align-items-center">
                                    <div className="service-icon-circle mb-3 mt-2">
                                      <i className="fas fa-church fa-2x"></i>
                                    </div>
                                    <h4 className="fw-bold mb-2 w-100" style={{ color: 'var(--gold-accent)' }}>{o.name}</h4>
                                    <span className="badge mb-2" style={{ backgroundColor: 'var(--gold-accent)', color: 'var(--sidebar-bg)' }}>يوم {o.serviceDay === 'Friday' ? 'الجمعة' : o.serviceDay}</span>
                                    <p className="text-muted small mb-4 mt-2">
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
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted py-5">لا توجد خدمات مسجلة في شجرة الخدمة بعد.</p>
                        )}
                      </div>
                    ) : (
                      <div className="fade-in">
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
                          allUsers={users}
                          servants={users.filter(u => u.church === currentUser.church && !['super_admin', 'admin', 'priest'].includes(u.role))}
                          makhdomeen={makhdomeen}
                          priestServices={services}
                          onUpdateServices={() => fetchInitialData(true)}
                          onUpdateMakhdomeen={handleUpdateMakhdomeenState}

                          readOnly={false}
                          allowServiceSettings={true}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SERVICE YEARS */}
                {activeTab === 'serviceYearsTab' && (
                  <div className="fade-in">
                    <div className="row g-4 justify-content-center">
                      <div className="col-lg-6">
                        <div className="card shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <div className="card-body p-4">
                            <h5 className="fw-bold text-warning mb-4"><i className="fas fa-calendar-alt me-2"></i> سنين الخدمة المسجلة</h5>
                            
                            {/* Add New Service Year Form */}
                            {hasPermission('manageServiceYears') && (
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              if (!newServiceYearInput || !/^\d{4}$/.test(newServiceYearInput.trim())) {
                                window.customAlert('يرجى كتابة سنة صحيحة مكونة من 4 أرقام!');
                                return;
                              }
                              try {
                                const response = await fetch('/api/service-years', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ year: newServiceYearInput })
                                });
                                const data = await response.json();
                                if (data.success) {
                                  setServiceYearsList(data.serviceYears);
                                  setNewServiceYearInput('');
                                  window.customAlert('تم إضافة سنة الخدمة بنجاح! ✝');
                                } else {
                                  window.customAlert(data.message || 'فشل إضافة سنة الخدمة.');
                                }
                              } catch (err) {
                                console.error(err);
                                window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
                              }
                            }} className="d-flex gap-2 mb-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="إضافة سنة جديدة (مثال: 2027)"
                                value={newServiceYearInput}
                                onChange={(e) => setNewServiceYearInput(e.target.value)}
                              />
                              <button type="submit" className="btn btn-warning fw-bold px-4 text-nowrap">إضافة سنة ✝</button>
                            </form>
                            )}

                            {/* Service Years Checkbox List */}
                            <div className="list-group">
                              {(serviceYearsList || []).map((yrItem, idx) => {
                                const yr = typeof yrItem === 'object' ? (yrItem.year || yrItem.name || String(yrItem)) : yrItem;
                                const isActive = selectedYearForFilter === yr;
                                const isEditing = editingYearKey === yr;

                                return (
                                  <div key={yr} className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary py-3 text-white">
                                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                                      <input
                                        type="checkbox"
                                        className="form-check-input cursor-pointer"
                                        style={{ width: '1.4rem', height: '1.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                        checked={isActive}
                                        disabled={isEditing}
                                        onChange={() => {
                                          if (!isActive) {
                                            setSelectedYearForFilter(yr);
                                            localStorage.setItem('activeServiceYear_' + currentUser.username, yr);
                                            window.customAlert(`تم تعيين سنة الخدمة النشطة لحسابك إلى: ${yr} ✝`);
                                          }
                                        }}
                                      />
                                      {isEditing ? (
                                        <div className="d-flex gap-2 align-items-center flex-grow-1" style={{ maxWidth: '300px' }}>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={editingYearValue}
                                            onChange={(e) => setEditingYearValue(e.target.value)}
                                            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--color-text)', border: '1px solid var(--border-color)' }}
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-warning btn-sm fw-bold px-3"
                                            onClick={async () => {
                                              if (!editingYearValue || !/^\d{4}$/.test(editingYearValue.trim())) {
                                                window.customAlert('يرجى كتابة سنة صحيحة من 4 أرقام!');
                                                return;
                                              }
                                              try {
                                                const res = await fetch(`/api/service-years/${yr}`, {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ newYear: editingYearValue })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                  setServiceYearsList(data.serviceYears);
                                                  setEditingYearKey(null);
                                                  if (isActive) {
                                                    setSelectedYearForFilter(editingYearValue.trim());
                                                    localStorage.setItem('activeServiceYear_' + currentUser.username, editingYearValue.trim());
                                                  }
                                                  window.customAlert('تم تعديل سنة الخدمة بنجاح! ✝');
                                                } else {
                                                  window.customAlert(data.message || 'فشل التعديل.');
                                                }
                                              } catch (err) {
                                                console.error(err);
                                                window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
                                              }
                                            }}
                                          >
                                            حفظ
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setEditingYearKey(null)}
                                          >
                                            إلغاء
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="fw-bold" style={{ fontSize: '1.1rem' }}>سنة الخدمة {yr}</span>
                                      )}
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      {isActive && !isEditing && (
                                        <span className="badge bg-warning text-dark fw-bold px-3 py-2 me-2">السنة النشطة حالياً لجهازك</span>
                                      )}
                                      {!isEditing && hasPermission('manageServiceYears') && (
                                        <>
                                          <button
                                            type="button"
                                            className="btn btn-outline-warning btn-sm px-2 py-1"
                                            onClick={() => {
                                              setEditingYearKey(yr);
                                              setEditingYearValue(yr);
                                            }}
                                            title="تعديل السنة"
                                          >
                                            <i className="fas fa-edit"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm px-2 py-1"
                                            onClick={async () => {
                                              window.customConfirm(`هل أنت متأكد من حذف سنة الخدمة ${yr}؟`, async () => {
                                                try {
                                                  const res = await fetch(`/api/service-years/${yr}`, {
                                                    method: 'DELETE'
                                                  });
                                                  const data = await res.json();
                                                  if (data.success) {
                                                    setServiceYearsList(data.serviceYears);
                                                    if (isActive) {
                                                      const nextActive = data.serviceYears[0] || '';
                                                      setSelectedYearForFilter(nextActive);
                                                      localStorage.setItem('activeServiceYear_' + currentUser.username, nextActive);
                                                    }
                                                    window.customAlert('تم حذف سنة الخدمة بنجاح! ✝');
                                                  } else {
                                                    window.customAlert(data.message || 'فشل الحذف.');
                                                  }
                                                } catch (err) {
                                                  console.error(err);
                                                  window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
                                                }
                                              });
                                            }}
                                            title="حذف السنة"
                                          >
                                            <i className="fas fa-trash-alt"></i>
                                          </button>
                                        </>
                                      )}
                                    </div>
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

                {/* TAB 4: SETTINGS */}
                {activeTab === 'settings' && (
                  <div className="row justify-content-center">
                    <div className="col-md-7">
                      <div className="card shadow mb-4">
                        <div className="card-header py-3">
                          <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-cog me-2"></i> الإعدادات العامة للمستخدم</h5>
                        </div>
                        <div className="card-body">
                          <div className="text-center mb-4">
                            <label className="form-label d-block text-warning fw-bold mb-2">صورة الحساب الشخصي</label>
                            <ProfilePicEditor user={currentUser} onUpdated={(usr) => setCurrentUser(usr)} readOnly={false} />
                            <small className="text-muted d-block mt-2">اضغط على الدائرة لتغيير الصورة الشخصية أو اضغط على أيقونة السلة لحذفها</small>
                          </div>

                          <hr className="my-4" style={{ borderColor: 'var(--border-color)' }} />

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
                                  className="btn btn-outline-warning"
                                  onClick={() => setShowSettingsPassword(!showSettingsPassword)}
                                  style={{ border: '1px solid var(--border-color)', borderRight: 'none', backgroundColor: 'var(--bg-input)' }}
                                >
                                  <i className={`fas ${showSettingsPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                              </div>
                            </div>



                            <button type="submit" className="btn btn-warning w-100 py-2 fw-bold" disabled={updatingSettings}>
                              {updatingSettings ? 'جاري الحفظ...' : 'حفظ التعديلات الشخصية ✝'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: STAGES LIST */}
                {activeTab === 'stagesTab' && (
                  <div className="fade-in">
                    <div className="row g-4">
                      {/* Left: Add Stage Form */}
                      <div className="col-md-4">
                        <div className="card shadow mb-4">
                          <div className="card-header py-3">
                            <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-layer-group me-2"></i> تعريف مرحلة جديدة</h5>
                          </div>
                          <div className="card-body">
                            <form onSubmit={handleCreateStageDefinition}>
                              <div className="mb-4">
                                <label className="form-label fw-bold">اسم المرحلة</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="مثال: أولى إعدادي، ثانوي عام..."
                                  value={newStageName}
                                  onChange={(e) => setNewStageName(e.target.value)}
                                  required
                                />
                                <small className="text-muted d-block mt-2">سيقوم النظام بتوليد الكود وترتيب المرحلة تلقائياً.</small>
                              </div>
                              <button type="submit" className="btn btn-warning w-100 fw-bold py-2">إضافة المرحلة ✝</button>
                            </form>
                          </div>
                        </div>
                      </div>

                      {/* Right: Stages List Table */}
                      <div className="col-md-8">
                        <div className="card shadow mb-4">
                          <div className="card-header py-3">
                            <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-list me-2"></i> المراحل المعرفة بالنظام ({stagesList.length})</h5>
                          </div>
                          <div className="card-body">
                            <div className="table-responsive">
                              <table className="table table-hover align-middle">
                                <thead>
                                  <tr className="text-warning">
                                    <th>الترتيب</th>
                                    <th>كود المرحلة</th>
                                    <th>اسم المرحلة</th>
                                    <th>الإجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stagesList.length === 0 ? (
                                    <tr>
                                      <td colSpan="4" className="text-center py-4 text-muted">لا يوجد مراحل معرفة بعد. يرجى إضافتها من النموذج الجانبي.</td>
                                    </tr>
                                  ) : (
                                    stagesList.map(s => {
                                      const currentId = s.id || s._id;
                                      const isEditing = editingStageId === currentId;
                                      return (
                                        <tr key={currentId}>
                                          <td>
                                            <span className="badge bg-secondary">{s.order || 1}</span>
                                          </td>
                                          <td>
                                            <code>{s.code || '-'}</code>
                                          </td>
                                          <td className="fw-bold">
                                            {isEditing ? (
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={editStageName}
                                                onChange={(e) => setEditStageName(e.target.value)}
                                              />
                                            ) : (
                                              s.name
                                            )}
                                          </td>
                                          <td>
                                            {isEditing ? (
                                              <div className="d-flex gap-1">
                                                <button
                                                  className="btn btn-warning btn-sm fw-bold"
                                                  onClick={() => handleUpdateStageDefinition(currentId)}
                                                >
                                                  حفظ
                                                </button>
                                                <button
                                                  className="btn btn-danger btn-sm fw-bold px-3 py-2" style={{ backgroundColor: "#8f1d2c", borderColor: "#8f1d2c", color: "#ffffff", borderRadius: "10px" }}
                                                  onClick={() => setEditingStageId(null)}
                                                >
                                                  إلغاء
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="d-flex gap-1">
                                                <button
                                                  className="btn btn-outline-warning btn-sm"
                                                  onClick={() => {
                                                    setEditingStageId(currentId);
                                                    setEditStageName(s.name || '');
                                                    setEditStageCode(s.code || '');
                                                    setEditStageOrder(s.order || '');
                                                  }}
                                                >
                                                  <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                  className="btn btn-outline-danger btn-sm"
                                                  onClick={() => handleDeleteStageDefinition(currentId, s.name)}
                                                >
                                                  <i className="fas fa-trash-alt"></i>
                                                </button>
                                              </div>
                                            )}
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
                    </div>
                  </div>
                )}

                {/* TAB: STAGE PROMOTION CONFIG */}
                {activeTab === 'manageStagePromotion' && (
                  <div className="fade-in">
                    <div className="card shadow mb-4">
                      <div className="card-header py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 fw-bold text-warning"><i className="fas fa-random me-2"></i> إعدادات وتحديث المراحل للعام الجديد</h5>
                        <button
                          type="button"
                          className="btn btn-danger fw-bold"
                          onClick={handleExecutePromotion}
                          disabled={selectedStageIdsForPromotion.length === 0}
                        >
                          <i className="fas fa-play me-2"></i> بدء تحديث وترقية المراحل المحددة ({selectedStageIdsForPromotion.length}) للعام الجديد ✝
                        </button>
                      </div>
                      <div className="card-body">
                        <div className="alert alert-warning mb-4">
                          <h6 className="fw-bold"><i className="fas fa-exclamation-triangle me-2"></i> شرح نظام الترقية:</h6>
                          <ul className="mb-0 text-white-50" style={{ paddingRight: '20px' }}>
                            <li><strong>ترقية تلقائية:</strong> يتم ترحيل المخدوم تلقائياً للمرحلة التي تلي مرحلته الحالية بناءً على ترتيب المراحل.</li>
                            <li><strong>تحديد يدوي:</strong> يتم تصفير مرحلة المخدوم ووضعه في قائمة الانتظار، لتظهر أسماؤهم عند خدام المراحل التالية ليتم تسكينهم يدوياً (مثال: من ثالثة إعدادي لثانوي عام أو تجاري أو صناعي).</li>
                          </ul>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead>
                              <tr className="text-warning">
                                <th style={{ width: '130px' }}>
                                  <div className="form-check d-flex align-items-center gap-2 m-0">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={selectedStageIdsForPromotion.length === stagesList.length && stagesList.length > 0}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStageIdsForPromotion(stagesList.map(x => x.id || x._id));
                                        } else {
                                          setSelectedStageIdsForPromotion([]);
                                        }
                                      }}
                                      id="selectAllPromotionStages"
                                      style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label text-warning fw-bold cursor-pointer" htmlFor="selectAllPromotionStages" style={{ fontSize: '0.85rem' }}>
                                      تحديد الكل
                                    </label>
                                  </div>
                                </th>
                                <th>المرحلة الحالية</th>
                                <th>طريقة الترقية</th>
                                <th>الوجهات المتاحة للترقية اليدوية</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stagesList.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="text-center py-4 text-muted">لا يوجد مراحل معرفة بالنظام لتهيئتها.</td>
                                </tr>
                              ) : (
                                stagesList.map((s, index) => {
                                  const currentId = s.id || s._id;
                                  const nextStage = stagesList[index + 1];
                                  const isSelected = selectedStageIdsForPromotion.includes(currentId);
                                  return (
                                    <tr key={currentId} className={isSelected ? "" : "opacity-50"}>
                                      <td>
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedStageIdsForPromotion(prev => [...prev, currentId]);
                                              } else {
                                                setSelectedStageIdsForPromotion(prev => prev.filter(id => id !== currentId));
                                              }
                                            }}
                                            style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                                          />
                                        </div>
                                      </td>
                                      <td className="fw-bold text-info">{s.name}</td>
                                      <td>
                                        <div className="d-flex gap-3">
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              name={`promoType-${currentId}`}
                                              id={`promoType-auto-${currentId}`}
                                              checked={s.promotionType !== 'manual'}
                                              onChange={() => handleSavePromotionConfig(currentId, { promotionType: 'auto' })}
                                            />
                                            <label className="form-check-label text-white-50" htmlFor={`promoType-auto-${currentId}`}>
                                              تلقائي {nextStage ? `(إلى ${nextStage.name})` : '(يبقى في نفس المرحلة)'}
                                            </label>
                                          </div>
                                          <div className="form-check">
                                            <input
                                              className="form-check-input"
                                              type="radio"
                                              name={`promoType-${currentId}`}
                                              id={`promoType-manual-${currentId}`}
                                              checked={s.promotionType === 'manual'}
                                              onChange={() => handleSavePromotionConfig(currentId, { promotionType: 'manual' })}
                                            />
                                            <label className="form-check-label text-white-50" htmlFor={`promoType-manual-${currentId}`}>
                                              تحديد يدوي
                                            </label>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        {s.promotionType === 'manual' ? (
                                          <div className="d-flex flex-wrap gap-2 align-items-center">
                                            {stagesList.filter(x => (x.id || x._id) !== currentId).map(x => {
                                              const xId = x.id || x._id;
                                              const isAllowed = (s.allowedTargets || []).includes(x.name);
                                              return (
                                                <button
                                                  key={xId}
                                                  type="button"
                                                  className={`btn btn-xs ${isAllowed ? 'btn-warning' : 'btn-outline-secondary'}`}
                                                  onClick={() => {
                                                    const updatedList = isAllowed
                                                      ? (s.allowedTargets || []).filter(name => name !== x.name)
                                                      : [...(s.allowedTargets || []), x.name];
                                                    handleSavePromotionConfig(currentId, { allowedTargets: updatedList });
                                                  }}
                                                  style={{ fontSize: '0.8rem' }}
                                                >
                                                  {isAllowed && <i className="fas fa-check me-1"></i>}
                                                  {x.name}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <span className="text-muted small italic">غير نشط (ترقية تلقائية)</span>
                                        )}
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
                )}

              </div>
            )}
          </div>
          <Footer />
        </div>

        {/* MODAL: EDIT USER ACCOUNT */}
        {showEditModal && editingUser && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg" style={{ backgroundColor: 'var(--bg-card-solid, #fdf8ee)', border: '2px solid #8f1d2c', color: 'var(--color-text)', borderRadius: '20px' }}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title fw-bold text-warning"><i className="fas fa-edit me-2"></i> تعديل بيانات الحساب: {editingUser.name}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditModal(false); setEditingUser(null); }}></button>
                </div>
                <form onSubmit={handleEditUserSubmit}>
                  <div className="modal-body overflow-auto" style={{ maxHeight: '75vh' }}>
                    {editUserError && <div className="alert alert-danger text-center">{editUserError}</div>}
                    {editUserSuccess && <div className="alert alert-success text-center">{editUserSuccess}</div>}
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">الاسم بالكامل</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">اسم المستخدم</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editUsernameState}
                          onChange={(e) => setEditUsernameState(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">كلمة السر</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">البريد الإلكتروني (اختياري)</label>
                        <input
                          type="email"
                          className="form-control"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                      </div>
                    </div>

                                                            {/* Secretariat Promotion Option */}
                    <div className="p-3 mb-3 border border-warning rounded mt-4" style={{ backgroundColor: 'rgba(201, 168, 76, 0.04)', borderRadius: '12px' }}>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ direction: 'rtl' }}>
                        <div className="text-start">
                          <h6 className="fw-bold text-warning mb-1">
                            <i className="fas fa-crown me-1 text-warning"></i> كامل صلاحيات النظام
                          </h6>
                          <p className="text-muted small mb-0">
                            منح هذا الحساب كامل صلاحيات وإعدادات النظام ليتصرف مثل حساب الأمانة العامة.
                          </p>
                        </div>
                        <div>
                          {editRole === 'admin' ? (
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-success p-2 text-dark fw-bold" style={{ borderRadius: '8px' }}>
                                <i className="fas fa-user-shield me-1"></i> صلاحيات كاملة مفعلة 👑
                              </span>
                              {editingUser?.username?.toLowerCase() !== 'admin' && (
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm fw-bold"
                                  onClick={() => {
                                    window.customConfirm('هل أنت متأكد من إلغاء الصلاحيات الكاملة لهذا الحساب؟', () => {
                                      setEditRole('servant');
                                      setEditPermissions(getDefaultPermissions('servant'));
                                    });
                                  }}
                                >
                                  إلغاء كامل الصلاحيات ❌
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-warning btn-sm fw-bold"
                              onClick={() => {
                                window.customConfirm('هل أنت متأكد من ترقية هذا الحساب إلى صلاحيات الأمانة العامة بالكامل؟', () => {
                                  setEditRole('admin');
                                  // Give all system permissions
                                  setEditPermissions({
                                    viewServiceTree: true,
                                    editServiceTree: true,
                                    viewMakhdomeen: true,
                                    editMakhdomeen: true,
                                    viewEvaluations: true,
                                    editEvaluations: true,
                                    viewPreparations: true,
                                    editPreparations: true,
                                    viewMessages: true,
                                    editMessages: true,
                                    manageStagesList: true,
                                    manageStagePromotion: true,
                                    manageServants: true,
                                    manageJobs: true,
                                    createService: true,
                                    viewServicesStructure: true,
                                    manageServiceYears: true,
                                    selectServiceYears: true,
                                    addMembers: true,
                                    viewMembers: true
                                  });
                                });
                              }}
                            >
                              منح كامل الصلاحيات 👑
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role and permissions selectors removed as per user request */}


                  </div>
                  <div className="modal-footer border-secondary">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>إلغاء</button>
                    <button type="submit" className="btn btn-warning btn-sm fw-bold" disabled={editingUserSubmitting}>
                      {editingUserSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات ✝'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT MEMBER DETAILS */}
        {showEditMemberModal && editingMember && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content" style={{ backgroundColor: 'var(--bg-card-solid)', border: '1px solid var(--border-color)', color: 'var(--color-text)' }}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title fw-bold text-warning"><i className="fas fa-user-edit me-2"></i> تعديل بيانات العضو: {editingMember.name}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setShowEditMemberModal(false); setEditingMember(null); }}></button>
                </div>
                <form onSubmit={handleEditMemberSubmit}>
                  <div className="modal-body overflow-auto" style={{ maxHeight: '75vh' }}>
                    {editMemberError && <div className="alert alert-danger text-center">{editMemberError}</div>}
                    {editMemberSuccess && <div className="alert alert-success text-center">{editMemberSuccess}</div>}

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">الاسم رباعي <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">رقم التليفون <span className="text-danger">*</span></label>
                        <input
                          type="tel"
                          className="form-control"
                          value={editMemberPhone}
                          onChange={(e) => setEditMemberPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">تاريخ الميلاد</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editMemberBirthDate}
                          onChange={(e) => setEditMemberBirthDate(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">العمر (يُحسب تلقائياً)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberAge}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">النوع <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={editMemberGender}
                          onChange={(e) => setEditMemberGender(e.target.value)}
                          required
                        >
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">المرحلة <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={editMemberStage}
                          onChange={(e) => setEditMemberStage(e.target.value)}
                          required
                        >
                          <option value="">-- اختر المرحلة --</option>
                          {allStages.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">الحالة الاجتماعية <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={editMemberSocialStatus}
                          onChange={(e) => setEditMemberSocialStatus(e.target.value)}
                          required
                        >
                          <option value="أعزب">أعزب</option>
                          <option value="متزوج">متزوج</option>
                          <option value="أرمل">أرمل</option>
                        </select>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">المنطقة</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberArea}
                          onChange={(e) => setEditMemberArea(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">الشارع</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberStreet}
                          onChange={(e) => setEditMemberStreet(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">رقم العمارة</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberBuilding}
                          onChange={(e) => setEditMemberBuilding(e.target.value)}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">الدور</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberFloor}
                          onChange={(e) => setEditMemberFloor(e.target.value)}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">رقم الشقة</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMemberApartment}
                          onChange={(e) => setEditMemberApartment(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">كود العضو</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editMemberCode}
                        onChange={(e) => setEditMemberCode(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">ملاحظات</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={editMemberNotes}
                        onChange={(e) => setEditMemberNotes(e.target.value)}
                      ></textarea>
                    </div>

                  </div>
                  <div className="modal-footer border-secondary">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowEditMemberModal(false); setEditingMember(null); }}>إلغاء</button>
                    <button type="submit" className="btn btn-warning btn-sm fw-bold" disabled={editMemberSubmitting}>
                      {editMemberSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات ✝'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Custom Edit Service Modal */}
        {editingServiceModal && createPortal(
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }} tabIndex="-1">
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
          </div>,
          document.body
        )}

        {/* Custom In-App Delete Service Confirmation Modal */}
        {deletingServiceModal && createPortal(
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999 }} tabIndex="-1">
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
          </div>,
          document.body
        )}

      </div>
    </div>
  );
}
