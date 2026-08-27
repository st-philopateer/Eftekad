import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const isRealMemberCode = (code) => {
  if (!code) return false;
  const autoGenRegex = /^(fr|hs|ahs|gc|sv|ad|usr)\d+$/i;
  return !autoGenRegex.test(code.trim());
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

export default function ServiceTree({
  serviceName,
  serviceYear,
  allUsers = [],
  servants = [],
  makhdomeen = [],
  priestServices = [],
  onUpdateServices,
  onUpdateMakhdomeen,
  readOnly = false,
  allowServiceSettings = false
}) {
  // Find the service config record
  const findServiceRecord = () => {
    const year = serviceYear || new Date().getFullYear().toString();
    for (const record of priestServices) {
      const rYear = record.serviceYear || new Date().getFullYear().toString();
      if (rYear === year) {
        const osra = (record.osras || []).find(o => o.name === serviceName);
        if (osra) return { record, osra };
      }
    }
    return { record: null, osra: null };
  };


  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const { record: serviceRecord, osra: currentService } = findServiceRecord();
  const [selectedStageName, setSelectedStageName] = useState(null);
  const [newStageName, setNewStageName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [showAddStageForm, setShowAddStageForm] = useState(false);
  const [filterByGender, setFilterByGender] = useState('all');
  const [editingStageSettings, setEditingStageSettings] = useState(null); // Stage object being edited
  const [editStageNameVal, setEditStageNameVal] = useState('');
  const [editImportRegionVal, setEditImportRegionVal] = useState('');
  const [editImportStreetVal, setEditImportStreetVal] = useState('');
  const [editImportSocialStatusVal, setEditImportSocialStatusVal] = useState('');
  const [editImportGendersVal, setEditImportGendersVal] = useState(['male', 'female']);
  const [editImportAgeMinVal, setEditImportAgeMinVal] = useState('');
  const [editImportAgeMaxVal, setEditImportAgeMaxVal] = useState('');
  const [editImportStagesVal, setEditImportStagesVal] = useState([]);

  const [showAddClassForm, setShowAddClassForm] = useState(null); // stores stageName
  const [selectedClass, setSelectedClass] = useState(null); // stores { stageName, className }
  
  // Modals/Forms States
  const [showStageSettings, setShowStageSettings] = useState(null); // stores stageName
  const [showAssignServants, setShowAssignServants] = useState(null); // stores { stageName, className }
  const [servantsSearchQuery, setServantsSearchQuery] = useState('');
  const [showAddMakhdoom, setShowAddMakhdoom] = useState(null); // stores { stageName, className }
  const [showTransferMakhdomeen, setShowTransferMakhdomeen] = useState(null); // stores { stageName, className, gender }
  const [showAssignedServantsModal, setShowAssignedServantsModal] = useState(false);
  const [jobsList, setJobsList] = useState([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedUserToAssign, setSelectedUserToAssign] = useState(null);
  const [selectedJobToAssign, setSelectedJobToAssign] = useState('');
  const [selectedClassToAssign, setSelectedClassToAssign] = useState('');
  const [editingAssignIdx, setEditingAssignIdx] = useState(null);
  const [showAddMakhdomeenModal, setShowAddMakhdomeenModal] = useState(false);
  const [localMakhdoomClasses, setLocalMakhdoomClasses] = useState({});
  const [localAssignedServants, setLocalAssignedServants] = useState({});
  const [openServantSelectId, setOpenServantSelectId] = useState(null);
  const [addMakhdoomSearchQuery, setAddMakhdoomSearchQuery] = useState('');
  const [addMakhdoomStageFilter, setAddMakhdoomStageFilter] = useState('all');
  const [addMakhdoomGenderFilter, setAddMakhdoomGenderFilter] = useState('all');
  const [addMakhdoomSocialStatusFilter, setAddMakhdoomSocialStatusFilter] = useState('all');
  const [addMakhdoomAreaFilter, setAddMakhdoomAreaFilter] = useState('all');
  const [addMakhdoomStreetFilter, setAddMakhdoomStreetFilter] = useState('all');
  const [selectedMakhdoomIdsToAssign, setSelectedMakhdoomIdsToAssign] = useState([]);
  const [showViewMakhdomeenModal, setShowViewMakhdomeenModal] = useState(false);
  const [showDistributeMakhdomeenModal, setShowDistributeMakhdomeenModal] = useState(false);
  const [selectedMakhdoomIdsToClass, setSelectedMakhdoomIdsToClass] = useState([]);

  // Auto-import stages filters
  const [globalStagesList, setGlobalStagesList] = useState([]);
  const [importRegion, setImportRegion] = useState('');
  const [importStreet, setImportStreet] = useState('');
  const [importSocialStatus, setImportSocialStatus] = useState('');
  const [importGenders, setImportGenders] = useState([]);
  const [importAgeMin, setImportAgeMin] = useState('');
  const [importAgeMax, setImportAgeMax] = useState('');
  const [importStages, setImportStages] = useState([]);

  useEffect(() => {
    fetch('/api/stages-list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGlobalStagesList(data.stagesList || []);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJobsList(data.jobs || []);
        }
      })
      .catch(err => console.error(err));
  }, [showAssignedServantsModal]);

  const [showTransferStageModal, setShowTransferStageModal] = useState(false);
  const [transferTargetService, setTransferTargetService] = useState('');
  const [transferTargetStage, setTransferTargetStage] = useState('');
  
  const [renameModalData, setRenameModalData] = useState(null); // stores { type: 'stage'|'class', stageName, className, oldName }
  const [renameNewName, setRenameNewName] = useState('');

  // Local temporary states for Stage Responsibles to prevent instant refreshes on click
  const [tempPriests, setTempPriests] = useState([]);
  const [tempFamilyCoords, setTempFamilyCoords] = useState([]);
  const [tempAssistantFamilyCoords, setTempAssistantFamilyCoords] = useState([]);
  const [tempGeneralCoords, setTempGeneralCoords] = useState([]);

  // Add Makhdoom form states
  const [newMakhdoomName, setNewMakhdoomName] = useState('');
  
  // State for viewing makhdoom details modal
  const [viewingMakhdoomDetails, setViewingMakhdoomDetails] = useState(null);

  // States for editing makhdoom details
  const [editMakhdoomName, setEditMakhdoomName] = useState('');
  const [editMakhdoomGender, setEditMakhdoomGender] = useState('male');
  const [editMakhdoomPhone, setEditMakhdoomPhone] = useState('');
  const [editMakhdoomAddress, setEditMakhdoomAddress] = useState('');
  const [editMakhdoomNotes, setEditMakhdoomNotes] = useState('');

  const [editMakhdoomArea, setEditMakhdoomArea] = useState('');
  const [editMakhdoomStreet, setEditMakhdoomStreet] = useState('');
  const [editMakhdoomBuilding, setEditMakhdoomBuilding] = useState('');
  const [editMakhdoomFloor, setEditMakhdoomFloor] = useState('');
  const [editMakhdoomApartment, setEditMakhdoomApartment] = useState('');
  
  // Servant assignment checklist state for instant toggle feedback
  const [assignedServants, setAssignedServants] = useState([]);
  const [newMakhdoomGender, setNewMakhdoomGender] = useState('male');
  const [newMakhdoomPhone, setNewMakhdoomPhone] = useState('');
  const [newMakhdoomAddress, setNewMakhdoomAddress] = useState('');
  const [newMakhdoomNotes, setNewMakhdoomNotes] = useState('');

  const [newMakhdoomArea, setNewMakhdoomArea] = useState('');
  const [newMakhdoomStreet, setNewMakhdoomStreet] = useState('');
  const [newMakhdoomBuilding, setNewMakhdoomBuilding] = useState('');
  const [newMakhdoomFloor, setNewMakhdoomFloor] = useState('');
  const [newMakhdoomApartment, setNewMakhdoomApartment] = useState('');

  // Transfer Makhdomeen form states
  const [targetStageName, setTargetStageName] = useState('');
  const [targetClassName, setTargetClassName] = useState('');

  // Reset stage selection when changing service name
  useEffect(() => {
    setSelectedStageName(null);
    setSelectedClass(null);
    setShowStageSettings(null);
  }, [serviceName]);

  // Synchronize edit states when details modal opens
  useEffect(() => {
    if (viewingMakhdoomDetails) {
      setEditMakhdoomName(viewingMakhdoomDetails.name || '');
      setEditMakhdoomGender(viewingMakhdoomDetails.gender || 'male');
      setEditMakhdoomPhone(viewingMakhdoomDetails.phone || '');
      setEditMakhdoomAddress(viewingMakhdoomDetails.address || '');
      setEditMakhdoomNotes(viewingMakhdoomDetails.notes || '');
      setEditMakhdoomArea(viewingMakhdoomDetails.area || '');
      setEditMakhdoomStreet(viewingMakhdoomDetails.street || '');
      setEditMakhdoomBuilding(viewingMakhdoomDetails.building || '');
      setEditMakhdoomFloor(viewingMakhdoomDetails.floor || '');
      setEditMakhdoomApartment(viewingMakhdoomDetails.apartment || '');
    } else {
      setEditMakhdoomName('');
      setEditMakhdoomGender('male');
      setEditMakhdoomPhone('');
      setEditMakhdoomAddress('');
      setEditMakhdoomNotes('');
      setEditMakhdoomArea('');
      setEditMakhdoomStreet('');
      setEditMakhdoomBuilding('');
      setEditMakhdoomFloor('');
      setEditMakhdoomApartment('');
    }
  }, [viewingMakhdoomDetails]);

  // Synchronize assignedServants list when modal opens
  useEffect(() => {
    if (showAssignServants) {
      const { stageName, className } = showAssignServants;
      const stage = currentService?.stages?.find(s => s.name === stageName);
      const cls = stage ? stage.classes.find(c => c.name === className) : null;
      setAssignedServants(cls ? cls.servants || [] : []);
    } else {
      setAssignedServants([]);
    }
  }, [showAssignServants, currentService]);



  // Initialize stages if not exists
  if (currentService && !currentService.stages) {
    currentService.stages = [];
  }

  const saveServiceConfig = async () => {
    const { record: dynamicRecord } = findServiceRecord();
    if (!dynamicRecord) {
      window.customAlert('فشل العثور على سجل الخدمة الحالي.');
      return;
    }
    try {
      const payload = {
        ...dynamicRecord,
        serviceYear: dynamicRecord.serviceYear || serviceYear || new Date().getFullYear().toString()
      };
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-username': JSON.parse(localStorage.getItem('currentUser') || '{}').username
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onUpdateServices();
      } else {
        const errRes = await response.json().catch(() => ({}));
        window.customAlert(errRes.message || 'فشل حفظ التعديلات على السيرفر.');
      }
    } catch (err) {
      console.error('Error saving service configuration:', err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر لحفظ التعديلات.');
    }
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

  const hasUserPermission = (permKey) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (['super_admin', 'admin', 'priest'].includes(currentUser.role)) {
      return true;
    }
    const userInDb = allUsers && allUsers.find(u => u.username === currentUser.username);
    if (!userInDb) return true;
    const mergedPerms = getMergedUserPermissions(userInDb, priestServices, jobsList);
    return mergedPerms[permKey] !== false;
  };

  // Check if coordinator has write permission for a specific stage
  const hasStageWritePermission = (stage) => {
    if (!stage) return false;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const usernameLower = (currentUser.username || '').toLowerCase();
    
    // Check global permission
    if (!hasUserPermission('editServiceTree')) {
      return false;
    }

    // Super admins, admins, and priests have full permission
    if (['super_admin', 'admin', 'priest'].includes(currentUser.role)) {
      return true;
    }

    // Osra level coordinator has full permission over all stages in the service
    const isOsraLevel = currentService && (
      (currentService.coordinatorUser || '').toLowerCase() === usernameLower ||
      (currentService.assistantCoordinatorUser || '').toLowerCase() === usernameLower ||
      (currentService.familyCoordinatorUser || '').toLowerCase() === usernameLower ||
      (currentService.assistantFamilyCoordinatorUser || '').toLowerCase() === usernameLower
    );
    if (isOsraLevel) {
      return true;
    }

    // Stage coordinators have permission over their assigned stage
    const generalCoords = (stage.generalCoordinatorUsers || []).map(x => x.toLowerCase());
    const familyCoords = (stage.familyCoordinatorUsers || []).map(x => x.toLowerCase());
    const assistantFamilyCoords = (stage.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase());
    
    return generalCoords.includes(usernameLower) || 
           familyCoords.includes(usernameLower) || 
           assistantFamilyCoords.includes(usernameLower);
  };


    const handleSaveMakhdoomEdit = async (e, makhdoom) => {
    e.preventDefault();
    if (!editMakhdoomName.trim()) {
      window.customAlert('الرجاء كتابة اسم المخدوم!');
      return;
    }
    
    const currentStage = currentService?.stages?.find(s => s.name === makhdoom.stage);
    if (!hasUserPermission('editMembers') || !hasStageWritePermission(currentStage)) {
      window.customAlert('ليس لديك صلاحية تعديل بيانات المخدومين!');
      return;
    }

    try {
      const response = await fetch(`/api/makhdomeen/${makhdoom.id || makhdoom._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...makhdoom,
          name: editMakhdoomName.trim(),
          gender: editMakhdoomGender,
          phone: editMakhdoomPhone.trim(),
          area: editMakhdoomArea.trim(),
          street: editMakhdoomStreet.trim(),
          building: editMakhdoomBuilding.trim(),
          floor: editMakhdoomFloor.trim(),
          apartment: editMakhdoomApartment.trim(),
          notes: editMakhdoomNotes.trim()
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.customAlert('تم تعديل بيانات المخدوم بنجاح! ✝');
        onUpdateMakhdomeen();
        setViewingMakhdoomDetails(null);
      } else {
        window.customAlert(result.message || 'فشل تعديل بيانات المخدوم.');
      }
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر لتعديل البيانات.');
    }
  };

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleAddStage = async (e) => {
    e.preventDefault();
    if (!newStageName.trim() || !currentService) return;
    
    if (currentService.stages.some(s => s.name === newStageName.trim())) {
      window.customAlert('هذه المرحلة مضافة بالفعل!');
      return;
    }

    try {
      const matchedMakhdomeen = (makhdomeen || []).filter(m => {
        if (importRegion && (!m.region || !m.region.toLowerCase().includes(importRegion.trim().toLowerCase()))) {
          return false;
        }
        if (importStreet && (!m.street || !m.street.toLowerCase().includes(importStreet.trim().toLowerCase()))) {
          return false;
        }
        if (importSocialStatus && m.socialStatus !== importSocialStatus) {
          return false;
        }
        if (importGenders.length > 0) {
          const mGender = (m.gender || '').trim();
          const isMale = mGender === 'ذكر' || mGender === 'ولد';
          const isFemale = mGender === 'أنثى' || mGender === 'بنت';
          let matchesSelected = false;
          if (importGenders.includes('male') && isMale) matchesSelected = true;
          if (importGenders.includes('female') && isFemale) matchesSelected = true;
          if (!matchesSelected) return false;
        }
        if (importAgeMin || importAgeMax) {
          const age = calculateAge(m.birthDate);
          if (age === null) return false;
          if (importAgeMin && age < parseInt(importAgeMin, 10)) return false;
          if (importAgeMax && age > parseInt(importAgeMax, 10)) return false;
        }
        if (importStages.length > 0) {
          if (!importStages.includes(m.stage)) return false;
        }
        return true;
      });

      currentService.stages.push({
        name: newStageName.trim(),
        priestUsers: [],
        familyCoordinatorUsers: [],
        assistantFamilyCoordinatorUsers: [],
        classes: []
      });

      saveServiceConfig().catch(err => console.error('Background save error:', err));

      if (matchedMakhdomeen.length > 0) {
        const matchedIds = matchedMakhdomeen.map(m => String(m.id || m._id));
        const batchResponse = await fetch('/api/makhdomeen/batch-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: matchedIds,
            updateData: {
              osra: serviceName,
              stage: newStageName.trim(),
              fasl: ''
            }
          })
        });
        const batchData = await batchResponse.json();
        if (batchResponse.ok && batchData.success) {
          window.customAlert(`تم إضافة المرحلة بنجاح واستيراد عدد (${batchData.count}) مخدوم مطابِق للفلاتر! ✝`);
          onUpdateMakhdomeen();
        } else {
          window.customAlert('حدث خطأ أثناء استيراد المخدومين للمرحلة الجديدة.');
        }
      } else {
        window.customAlert('تم إضافة المرحلة بنجاح! لم يتطابق أي مخدومين للاستيراد التلقائي.');
      }

      setNewStageName('');
      setImportRegion('');
      setImportStreet('');
      setImportSocialStatus('');
      setImportGenders([]);
      setImportAgeMin('');
      setImportAgeMax('');
      setImportStages([]);
      setShowAddStageForm(false);
    } catch (err) {
      console.error(err);
      window.customAlert('حدث خطأ أثناء إضافة المرحلة واستيراد المخدومين.');
    }
  };

  const handleDeleteStage = async (stageName) => {
    window.customConfirm(`هل أنت متأكد من حذف مرحلة "${stageName}" وكل الفصول والخدام المرتبطين بها؟`, async () => {
      currentService.stages = currentService.stages.filter(s => s.name !== stageName);
      await saveServiceConfig();
      
      // Clear stage and class for all members of this stage in this service
      if (makhdomeen && makhdomeen.length > 0) {
        const membersToClear = makhdomeen.filter(m => m.osra === currentService.name && m.stage === stageName);
        if (membersToClear.length > 0) {
          const matchedIds = membersToClear.map(m => String(m.id || m._id));
          await fetch('/api/makhdomeen/batch-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ids: matchedIds,
              updates: { stage: '', fasl: '' }
            })
          });
        }
      }
      
      setSelectedStageName(null);
    });
  };

  const handleAddClass = async (e, stageName) => {
    e.preventDefault();
    if (!newClassName.trim() || !currentService) return;

    const stage = currentService.stages.find(s => s.name === stageName);
    if (!stage) return;

    stage.classes = stage.classes || [];
    if (stage.classes.some(c => c.name === newClassName.trim())) {
      window.customAlert('هذا الفصل موجود بالفعل في هذه المرحلة!');
      return;
    }

    stage.classes.push({
      name: newClassName.trim(),
      servants: []
    });

    await saveServiceConfig();
    setNewClassName('');
    setShowAddClassForm(null);
  };

  const handleDeleteClass = async (stageName, className) => {
    window.customConfirm(`هل أنت متأكد من حذف فصل "${className}"؟ سيتم إلغاء تعيين خدامه ومخدوميه.`, async () => {
      try {
        const { osra: dynamicService } = findServiceRecord();
        if (!dynamicService) {
          window.customAlert('فشل العثور على سجل الخدمة الحالي.');
          return;
        }
        const stage = dynamicService.stages.find(s => s.name === stageName);
        if (!stage) {
          window.customAlert('المرحلة المحددة غير موجودة.');
          return;
        }
        stage.classes = (stage.classes || []).filter(c => c.name !== className);
        
        // Update makhdomeen class in DB
        const affected = makhdomeen.filter(m => m.osra === serviceName && m.stage === stageName && m.fasl === className);
        for (const m of affected) {
          await fetch(`/api/makhdomeen/${m.id || m._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...m, fasl: '' })
          });
        }

        await saveServiceConfig();
        setSelectedClass(null);
      } catch (err) {
        console.error('Error deleting class:', err);
        window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر لحذف الفصل.');
      }
    });
  };

  // Local toggle helper for checkboxes
  const handleToggleStageUserLocal = (roleKey, username) => {
    if (roleKey === 'priest') {
      setTempPriests(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
    } else if (roleKey === 'family_coordinator') {
      setTempFamilyCoords(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
    } else if (roleKey === 'general_coordinator') {
      setTempGeneralCoords(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
    } else {
      setTempAssistantFamilyCoords(prev => prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]);
    }
  };

  const handleOpenStageSettings = (stage) => {
    setEditingStageSettings(stage);
    setEditStageNameVal(stage.name || '');
    const filters = stage.importFilters || stage;
    setEditImportRegionVal(filters.region || stage.region || '');
    setEditImportStreetVal(filters.street || stage.street || '');
    setEditImportSocialStatusVal(filters.socialStatus || stage.socialStatus || '');
    setEditImportGendersVal(filters.genders || stage.genders || ['male', 'female']);
    setEditImportAgeMinVal(filters.ageMin || stage.ageMin || '');
    setEditImportAgeMaxVal(filters.ageMax || stage.ageMax || '');
    setEditImportStagesVal(filters.stages || stage.stages || []);
  };

  const handleSaveStageFullSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingStageSettings) return;

    try {
      const oldName = editingStageSettings.name;
      const newName = editStageNameVal.trim();
      if (!newName) {
        window.customAlert('اسم المرحلة مطلوب.');
        return;
      }

      const { record: dynamicRecord, osra: dynamicService } = findServiceRecord();
      if (!dynamicService || !dynamicRecord) {
        window.customAlert('فشل العثور على سجل الخدمة الحالي.');
        return;
      }

      const stageObj = (dynamicService.stages || []).find(s => s.name === oldName);
      if (!stageObj) {
        window.customAlert('المرحلة المحددة غير موجودة.');
        return;
      }

      // Check for duplicate stage name if renamed
      if (newName !== oldName && (dynamicService.stages || []).some(s => s.name === newName)) {
        window.customAlert('يوجد مرحلة أخرى بنفس هذا الاسم في هذه الخدمة بالفعل.');
        return;
      }

      // Update stage name and import filters
      stageObj.name = newName;
      const filtersObj = {
        region: editImportRegionVal,
        street: editImportStreetVal,
        socialStatus: editImportSocialStatusVal,
        genders: editImportGendersVal,
        ageMin: editImportAgeMinVal,
        ageMax: editImportAgeMaxVal,
        stages: editImportStagesVal
      };
      stageObj.importFilters = filtersObj;
      stageObj.region = editImportRegionVal;
      stageObj.street = editImportStreetVal;
      stageObj.socialStatus = editImportSocialStatusVal;
      stageObj.genders = editImportGendersVal;
      stageObj.ageMin = editImportAgeMinVal;
      stageObj.ageMax = editImportAgeMaxVal;
      stageObj.stages = editImportStagesVal;

      // If stage name changed, update all associated makhdomeen in DB
      if (newName !== oldName) {
        const affectedMakhdomeen = makhdomeen.filter(m => m.osra === serviceName && m.stage === oldName);
        for (const m of affectedMakhdomeen) {
          const targetId = m._id || m.id;
          await fetch(`/api/makhdomeen/${targetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...m, stage: newName })
          });
        }
        if (selectedStageName === oldName) {
          setSelectedStageName(newName);
        }
      }

      // Save via POST /api/services
      await saveServiceConfig();
      setEditingStageSettings(null);
      window.customAlert('تم حفظ وتحديث إعدادات المرحلة بنجاح! ✝');
    } catch (err) {
      console.error('Error saving stage settings:', err);
      window.customAlert('حدث خطأ أثناء حفظ إعدادات المرحلة.');
    }
  };

  const handleSaveStageSettings = handleSaveStageFullSettings;

  const handleRenameStage = (stageName) => {
    setRenameModalData({ type: 'stage', stageName, oldName: stageName });
    setRenameNewName(stageName);
  };

  const handleRenameClass = (stageName, className) => {
    setRenameModalData({ type: 'class', stageName, className, oldName: className });
    setRenameNewName(className);
  };

  const handleToggleServantClass = async (stageName, className, username) => {
    try {
      if (!currentService || !currentService.stages) return;
      const stage = currentService.stages.find(s => s.name === stageName);
      if (!stage || !stage.classes) return;
      const cls = stage.classes.find(c => c.name === className);
      if (!cls) return;

      if (!cls.servants) cls.servants = [];
      const isAssigned = assignedServants.includes(username);
      let updated;
      if (isAssigned) {
        updated = assignedServants.filter(u => u !== username);
      } else {
        updated = [...assignedServants, username];
      }
      setAssignedServants(updated);
      cls.servants = updated;

      await saveServiceConfig();
    } catch (err) {
      console.error('Error toggling servant class:', err);
    }
  };

  const handleDistributeWaznat = async (stageName, className) => {
    window.customConfirm('هل أنت متأكد من إعادة توزيع المخدومين عشوائياً كوزنات على خدام هذا الفصل؟', async () => {
      try {
        const response = await fetch('/api/services/distribute-waznat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            osraName: serviceName,
            className: className
          })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.customAlert(result.message || 'تم توزيع الوزنات عشوائياً بنجاح! ✝');
          onUpdateMakhdomeen();
        } else {
          window.customAlert(result.message || 'فشل توزيع الوزنات.');
        }
      } catch (err) {
        console.error(err);
        window.customAlert('حدث خطأ أثناء توزيع الوزنات.');
      }
    });
  };

  const handleAddMakhdoom = async (e, stageName, className) => {
    e.preventDefault();
    if (!newMakhdoomName.trim()) return;

    const currentStage = currentService?.stages?.find(s => s.name === stageName);
    if (!hasUserPermission('addMembers') || !hasStageWritePermission(currentStage)) {
      window.customAlert('ليس لديك صلاحية إضافة مخدومين!');
      return;
    }

    try {
      const response = await fetch('/api/makhdomeen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMakhdoomName.trim(),
          gender: newMakhdoomGender,
          osra: serviceName,
          stage: stageName,
          fasl: className,
          phone: newMakhdoomPhone.trim(),
          area: newMakhdoomArea.trim(),
          street: newMakhdoomStreet.trim(),
          building: newMakhdoomBuilding.trim(),
          floor: newMakhdoomFloor.trim(),
          apartment: newMakhdoomApartment.trim(),
          notes: newMakhdoomNotes.trim(),
          serviceYear: new Date().getFullYear().toString()
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        onUpdateMakhdomeen();
        setNewMakhdoomName('');
        setNewMakhdoomPhone('');
        setNewMakhdoomNotes('');
        setNewMakhdoomArea('');
        setNewMakhdoomStreet('');
        setNewMakhdoomBuilding('');
        setNewMakhdoomFloor('');
        setNewMakhdoomApartment('');
        setShowAddMakhdoom(null);
      } else {
        window.customAlert(result.message || 'فشل إضافة المخدوم.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMakhdoom = async (makhdoomId) => {
    const m = makhdomeen.find(x => x.id === makhdoomId);
    const currentStage = m ? currentService?.stages?.find(s => s.name === m.stage) : null;
    if (!hasUserPermission('deleteMembers') || !hasStageWritePermission(currentStage)) {
      window.customAlert('ليس لديك صلاحية حذف مخدومين!');
      return;
    }

    window.customConfirm('هل أنت متأكد من حذف حساب هذا المخدوم نهائياً؟', async () => {
      try {
        const response = await fetch(`/api/makhdomeen/${makhdoomId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          onUpdateMakhdomeen();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleTransferMakhdomeen = async (e, sourceStage, sourceClass, gender) => {
    e.preventDefault();
    if (!targetStageName || !targetClassName) {
      window.customAlert('الرجاء اختيار المرحلة والفصل المستهدفين!');
      return;
    }

    const makhdomeenToTransfer = makhdomeen.filter(m => 
      m.osra === serviceName && 
      m.fasl === sourceClass && 
      m.gender === gender
    );

    if (makhdomeenToTransfer.length === 0) {
      window.customAlert('لا يوجد مخدومين لنقلهم في هذا الفصل!');
      return;
    }

    window.customConfirm(`هل أنت متأكد من نقل عدد (${makhdomeenToTransfer.length}) مخدوم إلى المرحلة: ${targetStageName} - فصل: ${targetClassName}؟`, async () => {
      try {
        for (const m of makhdomeenToTransfer) {
          await fetch(`/api/makhdomeen/${m.id || m._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...m,
              stage: targetStageName,
              fasl: targetClassName
            })
          });
        }
        onUpdateMakhdomeen();
        setShowTransferMakhdomeen(null);
        setTargetStageName('');
        setTargetClassName('');
        window.customAlert('تم نقل المخدومين بنجاح! ✝');
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Render variables
  const isOsraLevelCoordinator = currentService && (
    (currentService.coordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
    (currentService.assistantCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
    (currentService.familyCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase() ||
    (currentService.assistantFamilyCoordinatorUser || '').toLowerCase() === (currentUser.username || '').toLowerCase()
  );
  const isAdminOrPriest = ['super_admin', 'admin', 'priest'].includes(currentUser.activeRole || currentUser.role) && (!currentUser.activeStage || currentUser.activeStage === 'كل المراحل' || currentUser.activeStage === 'كافة المراحل والخدمات' || currentUser.activeStage === 'كافة الخدمات والمراحل');

  const isUserAssignedToStage = (stage) => {
    if (!stage) return false;
    const usernameLower = (currentUser.username || '').toLowerCase();
    const isCoord = (stage.generalCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower) ||
                    (stage.familyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower) ||
                    (stage.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase()).includes(usernameLower);
    const isServant = (stage.assignments || []).some(a => (a.username || '').toLowerCase() === usernameLower) ||
                      (stage.classes || []).some(cls => (cls.servants || []).some(s => s.toLowerCase() === usernameLower));
    return isCoord || isServant;
  };

  const rawStagesList = currentService 
    ? ((isAdminOrPriest || isOsraLevelCoordinator) 
        ? (currentService.stages || []) 
        : (currentService.stages || []).filter(isUserAssignedToStage))
    : [];

  const storedActiveStage = localStorage.getItem('activeStage_' + (currentUser.username || '')) || currentUser.activeStage;
  const activeStageClean = storedActiveStage ? storedActiveStage.replace(/⛪/g, '').trim() : '';

  const stagesList = rawStagesList.filter(s => {
    if (isAdminOrPriest || allowServiceSettings || !activeStageClean || activeStageClean.startsWith('كل المراحل') || activeStageClean.startsWith('كافة المراحل')) return true;
    return s.name === activeStageClean;
  });
  const selectedStage = stagesList.find(s => s.name === selectedStageName);

  
        return (
    <div className="card shadow mb-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', direction: 'rtl' }}>
{/* MODAL: FULL STAGE SETTINGS */}
      {editingStageSettings && createPortal(
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1090 }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content text-light shadow-lg" style={{ backgroundColor: 'var(--card-bg, #1a0505)', border: '2px solid var(--gold-accent, #c9a84c)', borderRadius: '16px' }}>
              <div className="modal-header border-bottom border-secondary pb-3">
                <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2">
                  <i className="fas fa-cog me-1"></i> إعدادات وتعديل المرحلة ({editingStageSettings.name})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingStageSettings(null)}></button>
              </div>
              <form onSubmit={handleSaveStageFullSettings}>
                <div className="modal-body py-4 text-start" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  
                  {/* Stage Name */}
                  <div className="mb-4">
                    <label className="form-label text-warning fw-bold small mb-1">اسم المرحلة</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editStageNameVal}
                      onChange={(e) => setEditStageNameVal(e.target.value)}
                      placeholder="اسم المرحلة..."
                      required
                      style={{ backgroundColor: 'var(--bg-input, #ffffff)', borderColor: '#8f1d2c', color: 'var(--color-text, #000000)' }}
                    />
                  </div>

                  {/* Stage Import Criteria */}
                  <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(201, 168, 76, 0.3)', borderRadius: '12px' }}>
                    <h6 className="text-warning fw-bold mb-3 small d-flex align-items-center gap-2">
                      <i className="fas fa-sliders-h"></i> فلاتر واشتراطات المرحلة
                    </h6>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-1">المنطقة</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editImportRegionVal}
                          onChange={(e) => setEditImportRegionVal(e.target.value)}
                          placeholder="مثال: شبرا"
                          style={{ backgroundColor: 'var(--bg-input, #ffffff)', color: 'var(--color-text, #000000)' }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-1">الشارع</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editImportStreetVal}
                          onChange={(e) => setEditImportStreetVal(e.target.value)}
                          placeholder="اسم الشارع"
                          style={{ backgroundColor: 'var(--bg-input, #ffffff)', color: 'var(--color-text, #000000)' }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-1">الحالة الاجتماعية</label>
                        <select
                          className="form-select form-select-sm"
                          value={editImportSocialStatusVal}
                          onChange={(e) => setEditImportSocialStatusVal(e.target.value)}
                          style={{ backgroundColor: 'var(--bg-input, #ffffff)', color: 'var(--color-text, #000000)' }}
                        >
                          <option value="">الكل</option>
                          <option value="أعزب">أعزب</option>
                          <option value="متزوج">متزوج</option>
                          <option value="أرمل">أرمل</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label text-white-50 small d-block mb-1">النوع</label>
                        <div className="d-flex gap-3 p-2 rounded align-items-center" style={{ backgroundColor: 'var(--bg-input, #ffffff)', border: '1px solid var(--border-color)', height: '31px' }}>
                          <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-1">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id="editImportGenderMaleClean"
                              checked={editImportGendersVal.includes('male')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditImportGendersVal([...editImportGendersVal, 'male']);
                                } else {
                                  setEditImportGendersVal(editImportGendersVal.filter(g => g !== 'male'));
                                }
                              }}
                            />
                            <label className="form-check-label text-dark cursor-pointer small mb-0" htmlFor="editImportGenderMaleClean">
                              ذكر
                            </label>
                          </div>
                          <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-1">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id="editImportGenderFemaleClean"
                              checked={editImportGendersVal.includes('female')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditImportGendersVal([...editImportGendersVal, 'female']);
                                } else {
                                  setEditImportGendersVal(editImportGendersVal.filter(g => g !== 'female'));
                                }
                              }}
                            />
                            <label className="form-check-label text-dark cursor-pointer small mb-0" htmlFor="editImportGenderFemaleClean">
                              أنثى
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-1">السن من</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editImportAgeMinVal}
                          onChange={(e) => setEditImportAgeMinVal(e.target.value)}
                          placeholder="الحد الأدنى"
                          style={{ backgroundColor: 'var(--bg-input, #ffffff)', color: 'var(--color-text, #000000)' }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-1">السن إلى</label>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editImportAgeMaxVal}
                          onChange={(e) => setEditImportAgeMaxVal(e.target.value)}
                          placeholder="الحد الأقصى"
                          style={{ backgroundColor: 'var(--bg-input, #ffffff)', color: 'var(--color-text, #000000)' }}
                        />
                      </div>
                    </div>

                    <div className="row mt-3">
                      <div className="col-12">
                        <label className="form-label text-white-50 small d-block mb-2">المرحلة الخدمية الحالية للمخدوم</label>
                        <div className="d-flex flex-wrap gap-3 p-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                          {globalStagesList.map(s => {
                            const isChecked = editImportStagesVal.includes(s.name);
                            return (
                              <div key={s.id} className="form-check form-check-inline mb-0 d-flex align-items-center gap-2">
                                <input
                                  className="form-check-input cursor-pointer"
                                  type="checkbox"
                                  id={`editImportStageCheckClean_${s.id}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditImportStagesVal([...editImportStagesVal, s.name]);
                                    } else {
                                      setEditImportStagesVal(editImportStagesVal.filter(name => name !== s.name));
                                    }
                                  }}
                                />
                                <label className="form-check-label text-white cursor-pointer small mb-0" htmlFor={`editImportStageCheckClean_${s.id}`}>
                                  {s.name}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm px-4" onClick={() => setEditingStageSettings(null)}>إلغاء</button>
                  <button type="submit" className="btn btn-warning btn-sm px-4 fw-bold">حفظ إعدادات المرحلة ✝</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    <div className="card shadow mb-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', direction: 'rtl' }}>
      
      {/* CARD HEADER */}
      <div className="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>
        <div className="d-flex align-items-center gap-2">
          {selectedStageName && (
            <button 
              className="btn btn-outline-warning btn-sm py-1 px-2 me-2" 
              onClick={() => setSelectedStageName(null)}
              title="العودة لقائمة المراحل"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          )}
          <h5 className="mb-0 fw-bold text-warning">
            <i className="fas fa-sitemap me-2"></i> 
            {selectedStageName ? `المرحلة: ${selectedStageName} (خدمة ${serviceName})` : `مراحل خدمة: ${serviceName}`}
          </h5>
        </div>
        
        {!selectedStageName && !readOnly && (
          <button className="btn btn-outline-warning btn-sm" onClick={() => setShowAddStageForm(!showAddStageForm)}>
            <i className="fas fa-plus me-1"></i> إضافة مرحلة جديدة
          </button>
        )}
      </div>

      <div className="card-body">
        {/* ADD STAGE FORM */}
        {!selectedStageName && showAddStageForm && (() => {
          const availableStages = globalStagesList.filter(gs => !(currentService.stages || []).some(s => s.name === gs.name));
          return (
            <form onSubmit={handleAddStage} className="p-4 mb-4 border shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1.5px solid rgba(201, 168, 76, 0.25) !important', borderRadius: '16px' }}>
              <h6 className="text-warning fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: '1.05rem' }}>
                <i className="fas fa-layer-group"></i> إضافة مرحلة جديدة للخدمة
              </h6>
              
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-white-50 small mb-1 fw-bold">اسم المرحلة الجديدة</label>
                  <input
                    type="text"
                    list="addStageDatalist"
                    className="form-control form-control-sm"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="اكتب اسم المرحلة..."
                    required
                  />
                  <datalist id="addStageDatalist">
                    {availableStages.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="p-3 rounded mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px dashed rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                <h6 className="text-warning fw-bold mb-3 small d-flex align-items-center gap-2"><i className="fas fa-filter"></i> فلاتر استيراد الأعضاء تلقائياً لهذه المرحلة (اختياري)</h6>
                
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label text-white-50 small mb-1">المنطقة</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={importRegion}
                      onChange={(e) => setImportRegion(e.target.value)}
                      placeholder="مثال: شبرا"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white-50 small mb-1">الشارع</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={importStreet}
                      onChange={(e) => setImportStreet(e.target.value)}
                      placeholder="اسم الشارع"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white-50 small mb-1">الحالة الاجتماعية</label>
                    <select
                      className="form-select form-select-sm"
                      value={importSocialStatus}
                      onChange={(e) => setImportSocialStatus(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                    >
                      <option value="">الكل</option>
                      <option value="أعزب">أعزب</option>
                      <option value="متزوج">متزوج</option>
                      <option value="أرمل">أرمل</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label text-white-50 small d-block mb-1">النوع</label>
                    <div className="d-flex gap-3 p-2 rounded align-items-center" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', height: '31px' }}>
                      <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-1">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          id="importGenderMale"
                          checked={importGenders.includes('male')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setImportGenders([...importGenders, 'male']);
                            } else {
                              setImportGenders(importGenders.filter(g => g !== 'male'));
                            }
                          }}
                          style={{ width: '15px', height: '15px', borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'var(--bg-input)' }}
                        />
                        <label className="form-check-label text-white cursor-pointer small mb-0" htmlFor="importGenderMale">
                          ذكر
                        </label>
                      </div>
                      <div className="form-check form-check-inline mb-0 d-flex align-items-center gap-1">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          id="importGenderFemale"
                          checked={importGenders.includes('female')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setImportGenders([...importGenders, 'female']);
                            } else {
                              setImportGenders(importGenders.filter(g => g !== 'female'));
                            }
                          }}
                          style={{ width: '15px', height: '15px', borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'var(--bg-input)' }}
                        />
                        <label className="form-check-label text-white cursor-pointer small mb-0" htmlFor="importGenderFemale">
                          أنثى
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white-50 small mb-1">السن من</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={importAgeMin}
                      onChange={(e) => setImportAgeMin(e.target.value)}
                      placeholder="الحد الأدنى"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-white-50 small mb-1">السن إلى</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={importAgeMax}
                      onChange={(e) => setImportAgeMax(e.target.value)}
                      placeholder="الحد الأقصى"
                    />
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">
                    <label className="form-label text-white-50 small d-block mb-2">المرحلة الخدمية الحالية للمخدوم</label>
                    <div className="d-flex flex-wrap gap-3 p-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                      {globalStagesList.map(s => {
                        const isChecked = importStages.includes(s.name);
                        return (
                          <div key={s.id} className="form-check form-check-inline mb-0 d-flex align-items-center gap-2">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id={`importStageCheck_${s.id}`}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setImportStages([...importStages, s.name]);
                                } else {
                                  setImportStages(importStages.filter(name => name !== s.name));
                                }
                              }}
                              style={{ width: '16px', height: '16px', borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'var(--bg-input)' }}
                            />
                            <label className="form-check-label text-white cursor-pointer small mb-0" htmlFor={`importStageCheck_${s.id}`}>
                              {s.name}
                            </label>
                          </div>
                        );
                      })}
                      {globalStagesList.length === 0 && (
                        <span className="text-muted small">لا يوجد مراحل متاحة بالنظام (قم بتعريف المراحل في لوحة الأدمن أولاً)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setShowAddStageForm(false);
                    setNewStageName('');
                  }}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-warning btn-sm fw-bold">إضافة المرحلة واستيراد الأعضاء ✝</button>
              </div>
            </form>
          );
        })()}

        {/* SCREEN 1: LIST OF STAGES (IF NO STAGE SELECTED) */}
        {!selectedStageName && (
          <div>
            {stagesList.length > 0 ? (
              <div className="row justify-content-center g-4">
                {stagesList.map((stage) => {
                  const classCount = stage.classes ? stage.classes.length : 0;
                  const assignedPriestsNames = (stage.priestUsers || []).map(u => allUsers.find(x => x.username === u)?.name).filter(Boolean).join(', ') || 'غير معين';
                  const assignedFamilyCoordsNames = (stage.familyCoordinatorUsers || []).map(u => allUsers.find(x => x.username === u)?.name).filter(Boolean).join(', ') || 'غير معين';

                  return (
                    <div key={stage.name} className="col-md-6 col-lg-4">
                      <div 
                        className="card h-100 hover-card text-center p-4 cursor-pointer" 
                        onClick={() => setSelectedStageName(stage.name)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1.5px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '16px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ fontSize: '2.5rem', color: 'var(--gold-accent)', marginBottom: '15px' }}>
                          📚
                        </div>
                        <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                          <h5 className="fw-bold mb-0">{stage.name}</h5>
                          {!readOnly && hasStageWritePermission(stage) && (
                            <div className="d-flex align-items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary p-1 py-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenStageSettings(stage);
                                }}
                                title="إعدادات وتعديل المرحلة"
                                style={{ border: 'none', background: 'transparent', padding: '0 2px', lineHeight: 1 }}
                              >
                                <i className="fas fa-cog text-warning" style={{ fontSize: '0.9rem' }}></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary p-1 py-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStage(stage.name);
                                }}
                                title="حذف المرحلة"
                                style={{ border: 'none', background: 'transparent', padding: '0 2px' }}
                              >
                                <i className="fas fa-trash-alt text-danger" style={{ fontSize: '0.9rem' }}></i>
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="badge bg-warning text-dark mx-auto mb-3" style={{ width: 'fit-content' }}>
                          {classCount} فصول
                        </span>
                        
                        <div className="text-muted small mb-4" style={{ fontSize: '0.8rem' }}>
                          <span className="d-block mb-1">⛪ الآباء: {assignedPriestsNames}</span>
                          <span className="d-block">🛡️ الأمناء: {assignedFamilyCoordsNames}</span>
                        </div>

                        <button className="btn btn-outline-warning btn-sm w-100 fw-bold" style={{ borderRadius: '12px' }}>
                          دخول المرحلة ✝
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5 text-muted">لا يوجد مراحل مضافة في هذه الخدمة بعد. يرجى إضافة مرحلة للبدء.</div>
            )}
          </div>
        )}

        {/* SCREEN 2: DETAILS OF SELECTED STAGE */}
        {selectedStageName && selectedStage && (() => {
          const priestsList = allUsers.filter(u => u.role === 'priest');
          const generalCoords = allUsers.filter(u => u.role === 'general_coordinator');
          const familyCoords = allUsers.filter(u => u.role === 'family_coordinator');
          const assistantFamilyCoords = allUsers.filter(u => u.role === 'assistant_family_coordinator');

          const assignedPriestsNames = (selectedStage.priestUsers || []).map(u => allUsers.find(x => x.username === u)?.name).filter(Boolean).join(', ') || 'غير معين';
          const assignedGeneralCoordsNames = (selectedStage.generalCoordinatorUsers || []).map(u => allUsers.find(x => x.username === u)?.name).filter(Boolean).join(', ') || 'غير معين';
          const assignedFamilyCoordsNames = (selectedStage.familyCoordinatorUsers || []).map(u => allUsers.find(x => x.username === u)?.name).filter(Boolean).join(', ') || 'غير معين';
          
          const stageMakhdomeen = makhdomeen.filter(m => m.osra === serviceName && m.stage === selectedStage.name);
          const unassignedCount = stageMakhdomeen.filter(m => !m.fasl).length;

          return (
            <div className="fade-in">
              {/* Back to stages selector */}
              <div className="d-flex align-items-center mb-4">
                <button 
                  type="button"
                  className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2"
                  onClick={() => setSelectedStageName(null)}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="fas fa-arrow-right"></i> العودة لقائمة المراحل
                </button>
              </div>

              <div className="card mb-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid rgba(201, 168, 76, 0.15)', borderRadius: '12px' }}>
                <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ backgroundColor: 'rgba(201,168,76,0.06)' }}>
                  <div>
                    <h6 className="mb-1 text-warning fw-bold" style={{ fontSize: '1.1rem' }}>
                      <i className="fas fa-layer-group me-2"></i> مرحلة: {selectedStage.name}
                    </h6>
                    <small className="text-muted d-block mt-1">
                      <strong>الأب الكاهن:</strong> {assignedPriestsNames} | <strong>أمين الأسرة:</strong> {assignedGeneralCoordsNames} | <strong>مساعد أمين الأسرة:</strong> {assignedFamilyCoordsNames}
                    </small>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-info btn-sm py-1" onClick={() => setShowAssignedServantsModal(true)}>
                      <i className="fas fa-users me-1"></i> الخدام الموزعين
                    </button>
                    {!readOnly && hasStageWritePermission(selectedStage) && (
                      <button className="btn btn-outline-success btn-sm py-1" onClick={() => setShowAddMakhdomeenModal(true)}>
                        <i className="fas fa-user-plus me-1"></i> إضافة مخدومين
                      </button>
                    )}
                    {!readOnly && hasStageWritePermission(selectedStage) && (
                      <button className="btn btn-outline-warning btn-sm py-1 d-flex align-items-center gap-1" onClick={() => setShowViewMakhdomeenModal(true)}>
                        <i className="fas fa-list me-1"></i> عرض المخدومين
                        {unassignedCount > 0 && (
                          <span className="badge bg-danger text-white rounded-pill fw-bold" style={{ fontSize: '0.8rem' }}>
                            {unassignedCount}
                          </span>
                        )}
                      </button>
                    )}
                    {!readOnly && hasStageWritePermission(selectedStage) && (
                      <>
                        <button className="btn btn-outline-warning btn-sm py-1" onClick={() => setShowAddClassForm(selectedStage.name)}>
                          <i className="fas fa-plus me-1"></i> إضافة فصل
                        </button>
                        <button className="btn btn-outline-danger btn-sm py-1" onClick={() => handleDeleteStage(selectedStage.name)}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* STAGE SETTINGS MODAL / CHECKBOXES GRID (WITH MANUAL SAVE BUTTON) */}
                {showStageSettings === selectedStage.name && (
                  <div className="p-4 border-bottom border-secondary" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--color-text)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-warning mb-0">تحديد المسؤولين عن مرحلة: {selectedStage.name}</h6>
                      <button className="btn-close btn-close-white" onClick={() => setShowStageSettings(null)}></button>
                    </div>
                    <div className="row g-4 mb-4">
                      <div className="col-md-4">
                        <label className="form-label text-warning small border-bottom pb-1 w-100">الأب الكاهن</label>
                        <div className="overflow-auto border p-2" style={{ maxHeight: '150px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                          {priestsList.map(p => (
                            <div key={p.username} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`p-${selectedStage.name}-${p.username}`}
                                checked={tempPriests.includes(p.username)}
                                onChange={() => handleToggleStageUserLocal('priest', p.username)}
                              />
                              <label className="form-check-label small" htmlFor={`p-${selectedStage.name}-${p.username}`}>{p.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label text-warning small border-bottom pb-1 w-100">أمين الأسرة</label>
                        <div className="overflow-auto border p-2" style={{ maxHeight: '150px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                          {generalCoords.map(gc => (
                            <div key={gc.username} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`gc-${selectedStage.name}-${gc.username}`}
                                checked={tempGeneralCoords.includes(gc.username)}
                                onChange={() => handleToggleStageUserLocal('general_coordinator', gc.username)}
                              />
                              <label className="form-check-label small" htmlFor={`gc-${selectedStage.name}-${gc.username}`}>{gc.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label text-warning small border-bottom pb-1 w-100">مساعد أمين الأسرة</label>
                        <div className="overflow-auto border p-2" style={{ maxHeight: '150px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                          {familyCoords.map(fc => (
                            <div key={fc.username} className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`fc-${selectedStage.name}-${fc.username}`}
                                checked={tempFamilyCoords.includes(fc.username)}
                                onChange={() => handleToggleStageUserLocal('family_coordinator', fc.username)}
                              />
                              <label className="form-check-label small" htmlFor={`fc-${selectedStage.name}-${fc.username}`}>{fc.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button 
                        type="button" 
                        className="btn btn-warning btn-sm px-4 fw-bold"
                        onClick={() => handleSaveStageSettings(selectedStage.name)}
                      >
                        حفظ المسؤولين ✝
                      </button>
                    </div>
                  </div>
                )}

                {/* ADD CLASS FORM */}
                {showAddClassForm === selectedStage.name && (
                  <form onSubmit={(e) => handleAddClass(e, selectedStage.name)} className="p-3 border-bottom border-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div className="row g-3 align-items-center">
                      <div className="col-md-9">
                        <div className="input-group input-group-sm">
                          <input
                            type="text"
                            className="form-control"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => { setShowAddClassForm(null); setNewClassName(''); }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <button type="submit" className="btn btn-warning btn-sm w-100">إضافة الفصل ✝</button>
                      </div>
                    </div>
                  </form>
                )}

                {/* CLASSES LIST IN STAGE */}
                <div className="card-body p-3">
                  {selectedStage.classes && selectedStage.classes.length > 0 ? (
                    <div className="row g-3">
                      {selectedStage.classes.map((cls) => {
                        const classMakhdomeen = makhdomeen.filter(m => m.osra === serviceName && m.stage === selectedStage.name && m.fasl === cls.name);
                        const classServants = (cls.servants || []).map(username => servants.find(s => s.username === username)).filter(Boolean);

                        return (
                          <div key={cls.name} className="col-md-6 col-lg-4">
                            <div className="p-3 border rounded border-secondary h-100" style={{ backgroundColor: 'var(--bg-input)' }}>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <strong style={{ fontSize: '0.95rem' }}>🏡 {cls.name}</strong>
                                  {!readOnly && hasStageWritePermission(selectedStage) && (
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-secondary p-0 border-0"
                                      onClick={() => handleRenameClass(selectedStage.name, cls.name)}
                                      title="تعديل اسم الفصل"
                                      style={{ background: 'transparent' }}
                                    >
                                      <i className="fas fa-edit text-warning" style={{ fontSize: '0.8rem' }}></i>
                                    </button>
                                  )}
                                </div>
                                <span className="badge bg-warning text-dark">{classMakhdomeen.length} مخدوم</span>
                              </div>

                              <div className="mb-2">
                                <span className="text-muted small d-block mb-1">الخدام المعينين:</span>
                                {classServants.length === 0 ? (
                                  <span className="text-muted small">غير معين</span>
                                ) : (
                                  <div className="d-flex flex-wrap gap-1">
                                    {classServants.map(s => (
                                      <span key={s.username} className="badge bg-secondary p-1" style={{ fontSize: '0.75rem' }}>{s.name}</span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="d-flex gap-1 mt-3">
                                <button 
                                  className="btn btn-outline-warning btn-sm flex-grow-1" 
                                  onClick={() => setSelectedClass({ stageName: selectedStage.name, className: cls.name })}
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  عرض التفاصيل
                                </button>
                                {!readOnly && hasStageWritePermission(selectedStage) && (
                                  <>
                                    <button 
                                      className="btn btn-outline-warning btn-sm flex-grow-1" 
                                      onClick={() => setShowAssignServants({ stageName: selectedStage.name, className: cls.name })}
                                      style={{ fontSize: '0.8rem' }}
                                    >
                                      <i className="fas fa-user-plus me-1"></i> توزيع الخدام
                                    </button>
                                    <button 
                                      className="btn btn-outline-danger btn-sm" 
                                      onClick={() => handleDeleteClass(selectedStage.name, cls.name)}
                                      title="حذف الفصل"
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted py-3 mb-0 small">لا يوجد فصول مضافة في هذه المرحلة بعد.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Selected Class Details panel */}
        {selectedClass && (() => {
          const { stageName, className } = selectedClass;
          const currentStage = currentService.stages.find(s => s.name === stageName);
          if (!currentStage) return null;
          const currentCls = currentStage.classes.find(c => c.name === className);
          if (!currentCls) return null;

          const classServants = (currentCls.servants || []).map(u => servants.find(s => s.username === u)).filter(Boolean);
          const classMakhdomeen = makhdomeen.filter(m => m.osra === serviceName && m.stage === stageName && m.fasl === className);
          const boys = classMakhdomeen.filter(m => m.gender === 'male');
          const girls = classMakhdomeen.filter(m => m.gender === 'female');

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1050, overflowY: 'auto' }}>
              <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <div className="modal-header border-bottom border-secondary d-flex justify-content-between align-items-center">
                    <h5 className="modal-title fw-bold text-warning"><i className="fas fa-users me-2"></i> تفاصيل: {className} ({stageName})</h5>
                    <div className="d-flex align-items-center gap-2">
                      {!readOnly && hasStageWritePermission(currentStage) && (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm fw-bold me-2"
                          onClick={() => {
                            setShowDistributeMakhdomeenModal(true);
                            setSelectedMakhdoomIdsToClass([]);
                          }}
                        >
                          <i className="fas fa-random me-1"></i> توزيع المخدومين
                        </button>
                      )}
                      <button type="button" className="btn-close" onClick={() => setSelectedClass(null)}></button>
                    </div>
                  </div>
                  <div className="modal-body overflow-auto" style={{ maxHeight: '70vh' }}>
                    
                    {/* Servants list in details */}
                    <div className="mb-4">
                      <h6 className="text-warning border-bottom pb-1 mb-2"><i className="fas fa-user-shield me-2"></i> الخدام المعينين بالفصل:</h6>
                      {classServants.length === 0 ? (
                        <p className="text-muted small">لا يوجد خدام معينين في هذا الفصل بعد.</p>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {classServants.map(s => (
                            <span key={s.username} className="badge bg-secondary p-2">
                              {s.name} {isRealMemberCode(s.systemCode) && `(${s.systemCode})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Makhdomeen lists */}
                    <div className="row g-3">
                      {/* Boys list */}
                      <div className="col-md-6 border-start border-secondary">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                          <strong className="text-primary"><i className="fas fa-mars me-1"></i> البنين ({boys.length})</strong>
                        </div>
                        {boys.length === 0 ? (
                          <p className="text-muted small py-2 text-center">لا يوجد بنين مسجلين.</p>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                                                        {boys.map(m => (
                              <div key={m.id} className="py-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: 'var(--gold-accent)', width: '32px', height: '32px', borderRadius: '50%', fontSize: '0.85rem' }}>
                                    {m.name.trim().charAt(0)}
                                  </div>
                                  <div className="d-flex flex-column align-items-start">
                                    <span className="fw-bold small" style={{ color: "var(--color-text, #8f1d2c)", fontSize: "0.95rem" }}>{m.name}</span>
                                    {m.phone && <small className="text-muted" style={{ fontSize: '0.72rem' }}><i className="fas fa-phone-alt me-1 text-secondary" style={{ transform: 'scaleX(-1)' }}></i> {m.phone}</small>}
                                  </div>
                                </div>
                                {classServants.length > 0 ? (
                                  <div className="d-flex align-items-center gap-2 mx-3">
                                    <span className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}><i className="fas fa-user-check me-1 text-warning"></i> الخادم:</span>
                                    <div className="position-relative" style={{ display: 'inline-block' }}>
                                      <button
                                        type="button"
                                        className="btn btn-sm text-white d-flex align-items-center justify-content-between gap-2"
                                        style={{
                                          fontSize: '0.82rem',
                                          width: '160px',
                                          borderRadius: '16px',
                                          height: '32px',
                                          backgroundColor: '#1e293b',
                                          border: '1px solid rgba(255,255,255,0.2)',
                                          padding: '0 12px',
                                          cursor: readOnly || !hasStageWritePermission(currentStage) ? 'default' : 'pointer'
                                        }}
                                        disabled={readOnly || !hasStageWritePermission(currentStage)}
                                        onClick={() => setOpenServantSelectId(openServantSelectId === (m._id || m.id) ? null : (m._id || m.id))}
                                      >
                                        <span className="text-truncate text-center w-100">
                                          {classServants.find(s => s.username === (localAssignedServants[m._id || m.id] !== undefined ? localAssignedServants[m._id || m.id] : m.assignedServant))?.name || 'غير موزع ✝'}
                                        </span>
                                        <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', opacity: 0.7 }}></i>
                                      </button>
                                      {openServantSelectId === (m._id || m.id) && (
                                        <>
                                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} onClick={() => setOpenServantSelectId(null)} />
                                          <div className="shadow-lg rounded-3 py-1 text-end" style={{
                                            position: 'absolute',
                                            top: '36px',
                                            right: 0,
                                            backgroundColor: '#1e293b',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: '8px',
                                            zIndex: 1001,
                                            width: '160px',
                                            maxHeight: 'none',
                                            overflowY: 'visible'
                                          }}>
                                            <button
                                              type="button"
                                              className="dropdown-item text-white text-center py-2 px-3 border-0 bg-transparent w-100 hover-gold"
                                              style={{ fontSize: '0.82rem', transition: 'all 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                              onClick={async () => {
                                                setOpenServantSelectId(null);
                                                const newServant = '';
                                                const targetId = m._id || m.id;
                                                setLocalAssignedServants(prev => ({ ...prev, [targetId]: newServant }));
                                                m.assignedServant = newServant;
                                                try {
                                                  const res = await fetch(`/api/makhdomeen/${targetId}`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ assignedServant: newServant })
                                                  });
                                                  if (res.ok && onUpdateMakhdomeen) {
                                                    const result = await res.json();
                                                    onUpdateMakhdomeen(result.makhdoom || result);
                                                  }
                                                } catch (err) {
                                                  console.error('Error saving assigned servant:', err);
                                                }
                                              }}
                                            >
                                              غير موزع ✝
                                            </button>
                                            {classServants.map(s => (
                                              <button
                                                key={s.username}
                                                type="button"
                                                className="dropdown-item text-white text-center py-2 px-3 border-0 bg-transparent w-100 hover-gold"
                                                style={{ fontSize: '0.82rem', transition: 'all 0.2s' }}
                                                onClick={async () => {
                                                  setOpenServantSelectId(null);
                                                  const newServant = s.username;
                                                  const targetId = m._id || m.id;
                                                  setLocalAssignedServants(prev => ({ ...prev, [targetId]: newServant }));
                                                  m.assignedServant = newServant;
                                                  try {
                                                    const res = await fetch(`/api/makhdomeen/${targetId}`, {
                                                      method: 'PUT',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ assignedServant: newServant })
                                                    });
                                                    if (res.ok && onUpdateMakhdomeen) {
                                                      const result = await res.json();
                                                      onUpdateMakhdomeen(result.makhdoom || result);
                                                    }
                                                  } catch (err) {
                                                    console.error('Error saving assigned servant:', err);
                                                  }
                                                }}
                                              >
                                                {s.name}
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted small mx-3">⚠️ أضف خداماً للفصل أولاً</span>
                                )}
                                <div className="d-flex align-items-center gap-2">
                                  <button type="button" className="btn btn-outline-warning btn-sm" onClick={() => setViewingMakhdoomDetails(m)} style={{ fontSize: '0.75rem', borderRadius: '8px', padding: '4px 10px' }}>
                                    التفاصيل
                                  </button>
                                  {!readOnly && hasStageWritePermission(currentStage) && (
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteMakhdoom(m._id || m.id)} style={{ borderRadius: '8px', padding: '4px 8px' }} title="حذف من الفصل">
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Girls list */}
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                          <strong className="text-danger"><i className="fas fa-venus me-1"></i> البنات ({girls.length})</strong>
                        </div>
                        {girls.length === 0 ? (
                          <p className="text-muted small py-2 text-center">لا يوجد بنات مسجلات.</p>
                        ) : (
                          <div className="d-flex flex-column gap-2">
                                                        {girls.map(m => (
                              <div key={m.id} className="py-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: 'var(--gold-accent)', width: '32px', height: '32px', borderRadius: '50%', fontSize: '0.85rem' }}>
                                    {m.name.trim().charAt(0)}
                                  </div>
                                  <div className="d-flex flex-column align-items-start">
                                    <span className="fw-bold small" style={{ color: "var(--color-text, #8f1d2c)", fontSize: "0.95rem" }}>{m.name}</span>
                                    {m.phone && <small className="text-muted" style={{ fontSize: '0.72rem' }}><i className="fas fa-phone-alt me-1 text-secondary" style={{ transform: 'scaleX(-1)' }}></i> {m.phone}</small>}
                                  </div>
                                </div>
                                {classServants.length > 0 ? (
                                  <div className="d-flex align-items-center gap-2 mx-3">
                                    <span className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}><i className="fas fa-user-check me-1 text-warning"></i> الخادم:</span>
                                    <div className="position-relative" style={{ display: 'inline-block' }}>
                                      <button
                                        type="button"
                                        className="btn btn-sm text-white d-flex align-items-center justify-content-between gap-2"
                                        style={{
                                          fontSize: '0.82rem',
                                          width: '160px',
                                          borderRadius: '16px',
                                          height: '32px',
                                          backgroundColor: '#1e293b',
                                          border: '1px solid rgba(255,255,255,0.2)',
                                          padding: '0 12px',
                                          cursor: readOnly || !hasStageWritePermission(currentStage) ? 'default' : 'pointer'
                                        }}
                                        disabled={readOnly || !hasStageWritePermission(currentStage)}
                                        onClick={() => setOpenServantSelectId(openServantSelectId === (m._id || m.id) ? null : (m._id || m.id))}
                                      >
                                        <span className="text-truncate text-center w-100">
                                          {classServants.find(s => s.username === (localAssignedServants[m._id || m.id] !== undefined ? localAssignedServants[m._id || m.id] : m.assignedServant))?.name || 'غير موزع ✝'}
                                        </span>
                                        <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', opacity: 0.7 }}></i>
                                      </button>
                                      {openServantSelectId === (m._id || m.id) && (
                                        <>
                                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} onClick={() => setOpenServantSelectId(null)} />
                                          <div className="shadow-lg rounded-3 py-1 text-end" style={{
                                            position: 'absolute',
                                            top: '36px',
                                            right: 0,
                                            backgroundColor: '#1e293b',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            borderRadius: '8px',
                                            zIndex: 1001,
                                            width: '160px',
                                            maxHeight: 'none',
                                            overflowY: 'visible'
                                          }}>
                                            <button
                                              type="button"
                                              className="dropdown-item text-white text-center py-2 px-3 border-0 bg-transparent w-100 hover-gold"
                                              style={{ fontSize: '0.82rem', transition: 'all 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                              onClick={async () => {
                                                setOpenServantSelectId(null);
                                                const newServant = '';
                                                const targetId = m._id || m.id;
                                                setLocalAssignedServants(prev => ({ ...prev, [targetId]: newServant }));
                                                m.assignedServant = newServant;
                                                try {
                                                  const res = await fetch(`/api/makhdomeen/${targetId}`, {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ assignedServant: newServant })
                                                  });
                                                  if (res.ok && onUpdateMakhdomeen) {
                                                    const result = await res.json();
                                                    onUpdateMakhdomeen(result.makhdoom || result);
                                                  }
                                                } catch (err) {
                                                  console.error('Error saving assigned servant:', err);
                                                }
                                              }}
                                            >
                                              غير موزع ✝
                                            </button>
                                            {classServants.map(s => (
                                              <button
                                                key={s.username}
                                                type="button"
                                                className="dropdown-item text-white text-center py-2 px-3 border-0 bg-transparent w-100 hover-gold"
                                                style={{ fontSize: '0.82rem', transition: 'all 0.2s' }}
                                                onClick={async () => {
                                                  setOpenServantSelectId(null);
                                                  const newServant = s.username;
                                                  const targetId = m._id || m.id;
                                                  setLocalAssignedServants(prev => ({ ...prev, [targetId]: newServant }));
                                                  m.assignedServant = newServant;
                                                  try {
                                                    const res = await fetch(`/api/makhdomeen/${targetId}`, {
                                                      method: 'PUT',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ assignedServant: newServant })
                                                    });
                                                    if (res.ok && onUpdateMakhdomeen) {
                                                      const result = await res.json();
                                                      onUpdateMakhdomeen(result.makhdoom || result);
                                                    }
                                                  } catch (err) {
                                                    console.error('Error saving assigned servant:', err);
                                                  }
                                                }}
                                              >
                                                {s.name}
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted small mx-3">⚠️ أضف خداماً للفصل أولاً</span>
                                )}
                                <div className="d-flex align-items-center gap-2">
                                  <button type="button" className="btn btn-outline-warning btn-sm" onClick={() => setViewingMakhdoomDetails(m)} style={{ fontSize: '0.75rem', borderRadius: '8px', padding: '4px 10px' }}>
                                    التفاصيل
                                  </button>
                                  {!readOnly && hasStageWritePermission(currentStage) && (
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteMakhdoom(m._id || m.id)} style={{ borderRadius: '8px', padding: '4px 8px' }} title="حذف من الفصل">
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ height: '120px' }}></div>
                  </div>
                  <div className="modal-footer border-top border-secondary">
                    <button className="btn btn-secondary btn-sm px-4" onClick={() => setSelectedClass(null)}>إغلاق</button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Modal: Add Makhdomeen from Members List */}
        {showAddMakhdomeenModal && (() => {
          const currentServiceRecord = findServiceRecord();
          const osraStages = currentServiceRecord && currentServiceRecord.osra
            ? (currentServiceRecord.osra.stages || [])
            : [];

          const distinctAreas = [...new Set(makhdomeen.map(m => m.region || m.area).filter(Boolean))].sort();
          const distinctStreets = [...new Set(makhdomeen.map(m => m.street).filter(Boolean))].sort();

          const filteredMakhdomeen = makhdomeen.filter(m => {
            // Exclude members already assigned to this stage
            if (m.stage === selectedStage.name) return false;

            const q = addMakhdoomSearchQuery.toLowerCase().trim();
            if (q) {
              const nameMatch = (m.name || '').toLowerCase().includes(q);
              const codeMatch = (m.code || '').toLowerCase().includes(q);
              const phoneMatch = (m.phone || '').includes(q);
              if (!nameMatch && !codeMatch && !phoneMatch) return false;
            }

            if (addMakhdoomGenderFilter !== 'all') {
              if (m.gender !== addMakhdoomGenderFilter) return false;
            }

            if (addMakhdoomStageFilter === 'unassigned') {
              if (m.stage) return false;
            } else if (addMakhdoomStageFilter !== 'all') {
              if (m.stage !== addMakhdoomStageFilter) return false;
            }

            if (addMakhdoomSocialStatusFilter !== 'all') {
              if (m.socialStatus !== addMakhdoomSocialStatusFilter) return false;
            }

            if (addMakhdoomAreaFilter !== 'all') {
              const mArea = m.region || m.area || '';
              if (!mArea.toLowerCase().includes(addMakhdoomAreaFilter.toLowerCase())) return false;
            }

            if (addMakhdoomStreetFilter !== 'all') {
              const mStreet = m.street || '';
              if (!mStreet.toLowerCase().includes(addMakhdoomStreetFilter.toLowerCase())) return false;
            }

            return true;
          });

          const handleBulkAddMakhdomeen = async () => {
            try {
              const updatedList = [];
              for (const makhdoomId of selectedMakhdoomIdsToAssign) {
                const targetM = makhdomeen.find(x => x.id === makhdoomId || x._id === makhdoomId);
                if (targetM) {
                  const updatedFields = {
                    ...targetM,
                    osra: serviceName,
                    stage: selectedStage.name,
                    fasl: ''
                  };
                  const res = await fetch(`/api/makhdomeen/${makhdoomId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedFields)
                  });
                  if (res.ok) {
                    const r = await res.json();
                    updatedList.push(r.makhdoom || r || updatedFields);
                  }
                }
              }
              window.customAlert('تم إضافة المخدومين المحددين للمرحلة بنجاح! ✝');
              setSelectedMakhdoomIdsToAssign([]);
              setShowAddMakhdomeenModal(false);
              onUpdateMakhdomeen(updatedList);
            } catch (err) {
              console.error(err);
              window.customAlert('حدث خطأ أثناء إضافة المخدومين.');
            }
          };

          const allFilteredIds = filteredMakhdomeen.map(m => m.id || m._id);
          const isAllChecked = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedMakhdoomIdsToAssign.includes(id));

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <div className="modal-header border-bottom border-secondary">
                    <h5 className="modal-title text-warning fw-bold"><i className="fas fa-user-plus me-2"></i> إضافة مخدومين لمرحلة: {selectedStage.name}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => { setShowAddMakhdomeenModal(false); setSelectedMakhdoomIdsToAssign([]); }}></button>
                  </div>
                  <div className="modal-body">
                    <div className="p-3 rounded mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                      {/* Row 1 */}
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <label className="form-label small text-muted">بحث بالاسم أو الكود أو رقم الهاتف</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={addMakhdoomSearchQuery}
                            placeholder="اكتب الاسم، الكود، أو رقم الهاتف للبحث..."
                            onChange={(e) => setAddMakhdoomSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small text-muted">تصفية حسب المرحلة</label>
                          <select
                            className="form-select form-select-sm"
                            value={addMakhdoomStageFilter}
                            onChange={(e) => setAddMakhdoomStageFilter(e.target.value)}
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                          >
                            <option value="all">كل المراحل</option>
                            <option value="unassigned">غير محدد (بدون مرحلة)</option>
                            {globalStagesList.map(st => (
                              <option key={st.id || st.name} value={st.name}>{st.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small text-muted">النوع</label>
                          <select
                            className="form-select form-select-sm"
                            value={addMakhdoomGenderFilter}
                            onChange={(e) => setAddMakhdoomGenderFilter(e.target.value)}
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                          >
                            <option value="all">الكل</option>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Row 2 */}
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label small text-muted">الحالة الاجتماعية</label>
                          <select
                            className="form-select form-select-sm"
                            value={addMakhdoomSocialStatusFilter}
                            onChange={(e) => setAddMakhdoomSocialStatusFilter(e.target.value)}
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }}
                          >
                            <option value="all">الكل</option>
                            <option value="أعزب">أعزب</option>
                            <option value="متزوج">متزوج</option>
                            <option value="أرمل">أرمل</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small text-muted">المنطقة</label>
                          <SearchableSelect
                            value={addMakhdoomAreaFilter}
                            onChange={(v) => setAddMakhdoomAreaFilter(v)}
                            options={distinctAreas}
                            placeholder="المنطقة (الكل)..."
                            allLabel="كل المناطق 🗺️"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small text-muted">الشارع</label>
                          <SearchableSelect
                            value={addMakhdoomStreetFilter}
                            onChange={(v) => setAddMakhdoomStreetFilter(v)}
                            options={distinctStreets}
                            placeholder="الشارع (الكل)..."
                            allLabel="كل الشوارع 🛣️"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-dark table-hover align-middle mb-0">
                        <thead>
                          <tr className="text-warning small text-nowrap">
                            <th style={{ width: '40px' }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isAllChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMakhdoomIdsToAssign(prev => {
                                      const newSelection = [...prev];
                                      allFilteredIds.forEach(id => {
                                        if (!newSelection.includes(id)) newSelection.push(id);
                                      });
                                      return newSelection;
                                    });
                                  } else {
                                    setSelectedMakhdoomIdsToAssign(prev => prev.filter(id => !allFilteredIds.includes(id)));
                                  }
                                }}
                              />
                            </th>
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
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMakhdomeen.length === 0 ? (
                            <tr>
                              <td colSpan="14" className="text-center text-muted py-4">لا يوجد مخدومين يطابقون خيارات البحث.</td>
                            </tr>
                          ) : (
                            filteredMakhdomeen.map(m => {
                              const uniqueId = m.id || m._id;
                              return (
                                <tr key={uniqueId}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={selectedMakhdoomIdsToAssign.includes(uniqueId)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMakhdoomIdsToAssign(prev => [...prev, uniqueId]);
                                        } else {
                                          setSelectedMakhdoomIdsToAssign(prev => prev.filter(id => id !== uniqueId));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="fw-bold text-white text-nowrap">{m.name}</td>
                                  <td><span className="badge bg-secondary">{m.code || m.systemCode || '-'}</span></td>
                                  <td><code>{m.phone || m.phoneNumber || '-'}</code></td>
                                  <td>{m.age || m.ageNum || calculateAge(m.birthDate) || '-'}</td>
                                  <td>{m.gender === 'male' ? 'بنين' : 'بنات'}</td>
                                  <td><span className="badge bg-dark border border-warning text-warning">{m.stage || 'غير موزع'}</span></td>
                                  <td>{m.socialStatus || '-'}</td>
                                  <td>{m.area || '-'}</td>
                                  <td>{m.street || '-'}</td>
                                  <td>{m.building || '-'}</td>
                                  <td>{m.floor || '-'}</td>
                                  <td>{m.apartment || '-'}</td>
                                  <td style={{ fontSize: '0.85rem' }} className="text-muted">{m.notes || '-'}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="modal-footer border-top border-secondary d-flex justify-content-between">
                    <div className="text-muted small">عدد المحددين: {selectedMakhdoomIdsToAssign.length}</div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-secondary btn-sm px-4" onClick={() => { setShowAddMakhdomeenModal(false); setSelectedMakhdoomIdsToAssign([]); }}>إغلاق</button>
                      <button type="button" className="btn btn-warning btn-sm px-4 fw-bold" onClick={handleBulkAddMakhdomeen} disabled={selectedMakhdoomIdsToAssign.length === 0}>إضافة ✝</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Modal: View Stage Makhdomeen ("عرض المخدومين") */}
        {showViewMakhdomeenModal && (() => {
          const stageMakhdomeenList = makhdomeen.filter(m => m.osra === serviceName && m.stage === selectedStage.name);
          const hasWritePermission = !readOnly && hasStageWritePermission(selectedStage);

          const handleAssignMakhdoomToClass = async (makhdoom, newClass) => {
            const makhdoomId = makhdoom.id || makhdoom._id;
            // Optimistically update select value and background color instantly on screen
            setLocalMakhdoomClasses(prev => ({ ...prev, [makhdoomId]: newClass }));
            try {
              const response = await fetch(`/api/makhdomeen/${makhdoomId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...makhdoom,
                  fasl: newClass
                })
              });
              const result = await response.json();
              if (response.ok && (result.success || result._id || result.id)) {
                onUpdateMakhdomeen(result.makhdoom || result);
              } else {
                window.customAlert(result.message || result.error || 'فشل توزيع المخدوم.');
                // Revert state on failure
                setLocalMakhdoomClasses(prev => {
                  const next = { ...prev };
                  delete next[makhdoomId];
                  return next;
                });
              }
            } catch (err) {
              console.error(err);
              window.customAlert('حدث خطأ أثناء توزيع المخدوم.');
              // Revert state on failure
              setLocalMakhdoomClasses(prev => {
                const next = { ...prev };
                delete next[makhdoomId];
                return next;
              });
}
          };

          const handleUnassignMakhdoomFromStage = async (makhdoomId) => {
            window.customConfirm('هل أنت متأكد من حذف المخدوم من هذه المرحلة؟ سيتم إلغاء تسكينه من الفصل أيضاً.', async () => {
              try {
                const targetM = makhdomeen.find(x => x.id === makhdoomId || x._id === makhdoomId);
                if (!targetM) return;
                
                const updatedFields = {
                  ...targetM,
                  osra: '',
                  stage: '',
                  fasl: ''
                };

                const response = await fetch(`/api/makhdomeen/${makhdoomId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedFields)
                });

                const result = await response.json();
                if (response.ok && result.success) {
                  window.customAlert('تم حذف المخدوم من المرحلة بنجاح! ✝');
                  onUpdateMakhdomeen(result.makhdoom || result);
                } else {
                  window.customAlert(result.message || 'فشل حذف المخدوم.');
                }
              } catch (err) {
                console.error(err);
                window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
              }
            });
          };

          const calculateAge = (bdate) => {
            if (!bdate) return '-';
            const birth = new Date(bdate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
              age--;
            }
            return age;
          };

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '95%' }}>
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <div className="modal-header border-bottom border-secondary">
                    <h5 className="modal-title text-warning fw-bold"><i className="fas fa-list me-2"></i> مخدومين المرحلة الحاليين: {selectedStage.name}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewMakhdomeenModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="table-responsive">
                      <table className="table table-dark table-hover align-middle mb-0 text-center" style={{ fontSize: '0.9rem' }}>
                        <thead>
                          <tr className="text-warning">
                            <th>الاسم رباعي</th>
                            <th>الكود</th>
                            <th>رقم التليفون</th>
                            <th>السن</th>
                            <th>النوع</th>
                            <th>الحالة الاجتماعية</th>
                            <th>المنطقة</th>
                            <th>الشارع</th>
                            <th>العمارة</th>
                            <th>الدور</th>
                            <th>الشقة</th>
                            <th>الفصل</th>
                            <th>ملاحظات</th>
                            <th>الاجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stageMakhdomeenList.length === 0 ? (
                            <tr>
                              <td colSpan="14" className="text-center text-muted py-4">لا يوجد مخدومين مضافين لهذه المرحلة بعد.</td>
                            </tr>
                          ) : (
                            stageMakhdomeenList.map(m => {
                              const uniqueId = m.id || m._id;
                              return (
                                <tr key={uniqueId}>
                                  <td className="fw-bold">{m.name}</td>
                                  <td><span className="badge bg-secondary">{m.code || '-'}</span></td>
                                  <td><code>{m.phone || '-'}</code></td>
                                  <td>{calculateAge(m.birthDate)}</td>
                                  <td>{m.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                                  <td>{m.socialStatus || '-'}</td>
                                  <td>{m.area || '-'}</td>
                                  <td>{m.street || '-'}</td>
                                  <td>{m.building || '-'}</td>
                                  <td>{m.floor || '-'}</td>
                                  <td>{m.apartment || '-'}</td>
                                  <td>
                                    {(() => {
                                      const currentFasl = localMakhdoomClasses[uniqueId] !== undefined ? localMakhdoomClasses[uniqueId] : (m.fasl || '');
                                      return (
                                        <select
                                          className={`fasl-select-cylinder ${!currentFasl ? 'fasl-unassigned pulse-red-glow' : 'fasl-assigned'}`}
                                          value={currentFasl}
                                          onChange={(e) => handleAssignMakhdoomToClass(m, e.target.value)}
                                          disabled={!hasWritePermission}
                                          style={{
                                            minWidth: '175px',
                                            backgroundColor: currentFasl ? 'rgba(25, 135, 84, 0.9)' : 'rgba(220, 53, 69, 0.9)',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                                            cursor: hasWritePermission ? 'pointer' : 'default',
                                            paddingRight: '10px',
                                            paddingLeft: '28px',
                                            fontSize: '0.82rem',
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          <option value="" style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                                            ⚠️ غير موزع في فصل
                                          </option>
                                          {(selectedStage.classes || []).map(c => (
                                            <option key={c.name} value={c.name} style={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
                                              ⛪ {c.name}
                                            </option>
                                          ))}
                                        </select>
                                      );
                                    })()}
                                  </td>
                                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.notes}>{m.notes || '-'}</td>
                                  <td>
                                    <div className="d-flex align-items-center gap-1 justify-content-center">
                                       <button
                                         type="button"
                                         className="btn btn-outline-danger btn-sm"
                                         onClick={() => {
                                           setViewingMakhdoomDetails(m);
                                           setEditMakhdoomName(m.name || '');
                                           setEditMakhdoomGender(m.gender || 'male');
                                           setEditMakhdoomPhone(m.phone || '');
                                           setEditMakhdoomAddress(m.address || '');
                                           setEditMakhdoomNotes(m.notes || '');
                                         }}
                                         title="تعديل المخدوم"
                                       >
                                         <i className="fas fa-edit"></i>
                                       </button>
                                       <button
                                         type="button"
                                         className="btn btn-outline-danger btn-sm"
                                         onClick={() => handleUnassignMakhdoomFromStage(uniqueId)}
                                         title="حذف من المرحلة"
                                       >
                                         <i className="fas fa-trash-alt"></i>
                                       </button>
                                     </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="modal-footer border-top border-secondary">
                    <button type="button" className="btn btn-secondary btn-sm px-4" onClick={() => setShowViewMakhdomeenModal(false)}>إغلاق</button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Modal: Distribute Makhdomeen to Class ("توزيع المخدومين") */}
        {showDistributeMakhdomeenModal && selectedClass && (() => {
          const { stageName, className } = selectedClass;
          const stageMakhdomeenList = makhdomeen.filter(m => m.osra === serviceName && m.stage === stageName && m.fasl !== className);

          const handleBulkDistributeToClass = async () => {
            try {
              for (const makhdoomId of selectedMakhdoomIdsToClass) {
                const targetM = makhdomeen.find(x => x.id === makhdoomId || x._id === makhdoomId);
                if (targetM) {
                  const updatedFields = {
                    ...targetM,
                    fasl: className
                  };
                  await fetch(`/api/makhdomeen/${makhdoomId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedFields)
                  });
                }
              }
              window.customAlert('تم توزيع المخدومين بنجاح! ✝');
              setSelectedMakhdoomIdsToClass([]);
              setShowDistributeMakhdomeenModal(false);
              onUpdateMakhdomeen();
            } catch (err) {
              console.error(err);
              window.customAlert('حدث خطأ أثناء توزيع المخدومين.');
            }
          };

          const allFilteredIds = stageMakhdomeenList.map(m => m.id || m._id);
          const isAllChecked = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedMakhdoomIdsToClass.includes(id));

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <div className="modal-header border-bottom border-secondary">
                    <h5 className="modal-title text-warning fw-bold"><i className="fas fa-random me-2"></i> توزيع مخدومين إلى فصل: {className}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => { setShowDistributeMakhdomeenModal(false); setSelectedMakhdoomIdsToClass([]); }}></button>
                  </div>
                  <div className="modal-body">
                    <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      <table className="table table-dark table-hover align-middle mb-0 text-center">
                        <thead>
                          <tr className="text-warning">
                            <th style={{ width: '50px' }}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isAllChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMakhdoomIdsToClass(prev => {
                                      const newSelection = [...prev];
                                      allFilteredIds.forEach(id => {
                                        if (!newSelection.includes(id)) newSelection.push(id);
                                      });
                                      return newSelection;
                                    });
                                  } else {
                                    setSelectedMakhdoomIdsToClass(prev => prev.filter(id => !allFilteredIds.includes(id)));
                                  }
                                }}
                              />
                            </th>
                            <th>الاسم</th>
                            <th>الكود</th>
                            <th>النوع</th>
                            <th>الفصل الحالي</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stageMakhdomeenList.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">لا يوجد مخدومين غير موزعين في هذا الفصل في هذه المرحلة.</td>
                            </tr>
                          ) : (
                            stageMakhdomeenList.map(m => {
                              const uniqueId = m.id || m._id;
                              return (
                                <tr key={uniqueId}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={selectedMakhdoomIdsToClass.includes(uniqueId)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMakhdoomIdsToClass(prev => [...prev, uniqueId]);
                                        } else {
                                          setSelectedMakhdoomIdsToClass(prev => prev.filter(id => id !== uniqueId));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="fw-bold">{m.name}</td>
                                  <td><span className="badge bg-secondary">{m.code || '-'}</span></td>
                                  <td>{m.gender === 'male' ? 'ذكر' : 'أنثى'}</td>
                                  <td>{m.fasl || <span className="text-danger small">غير موزع</span>}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="modal-footer border-top border-secondary d-flex justify-content-between">
                    <div className="text-muted small">عدد المحددين: {selectedMakhdoomIdsToClass.length}</div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-secondary btn-sm px-4" onClick={() => { setShowDistributeMakhdomeenModal(false); setSelectedMakhdoomIdsToClass([]); }}>إغلاق</button>
                      <button type="button" className="btn btn-warning btn-sm px-4 fw-bold" onClick={handleBulkDistributeToClass} disabled={selectedMakhdoomIdsToClass.length === 0}>توزيع ✝</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Modal: Add Makhdoom Form */}
        {showAddMakhdoom && (() => {
          const { stageName, className } = showAddMakhdoom;
          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <form onSubmit={(e) => handleAddMakhdoom(e, stageName, className)}>
                    <div className="modal-header border-bottom border-secondary">
                      <h5 className="modal-title text-warning fw-bold">إضافة مخدوم جديد لفصل: {className}</h5>
                      <button type="button" className="btn-close" onClick={() => {
                        setShowAddMakhdoom(null);
                      }}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">الاسم</label>
                        <input type="text" className="form-control" value={newMakhdoomName} onChange={(e) => setNewMakhdoomName(e.target.value)} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">النوع</label>
                        <select className="form-select" value={newMakhdoomGender} onChange={(e) => setNewMakhdoomGender(e.target.value)}>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">رقم الهاتف</label>
                        <input type="text" className="form-control" value={newMakhdoomPhone} onChange={(e) => setNewMakhdoomPhone(e.target.value)} />
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-warning small fw-bold">المنطقة</label>
                          <input type="text" className="form-control" value={newMakhdoomArea} onChange={(e) => setNewMakhdoomArea(e.target.value)} style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-warning small fw-bold">الشارع</label>
                          <input type="text" className="form-control" value={newMakhdoomStreet} onChange={(e) => setNewMakhdoomStreet(e.target.value)} style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-warning small fw-bold">عمارة</label>
                          <input type="text" className="form-control" value={newMakhdoomBuilding} onChange={(e) => setNewMakhdoomBuilding(e.target.value)} style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-warning small fw-bold">دور</label>
                          <input type="text" className="form-control" value={newMakhdoomFloor} onChange={(e) => setNewMakhdoomFloor(e.target.value)} style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label text-warning small fw-bold">شقة</label>
                          <input type="text" className="form-control" value={newMakhdoomApartment} onChange={(e) => setNewMakhdoomApartment(e.target.value)} style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--color-text)' }} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">ملاحظات</label>
                        <textarea className="form-control" value={newMakhdoomNotes} onChange={(e) => setNewMakhdoomNotes(e.target.value)} rows="3"></textarea>
                      </div>
                    </div>
                    <div className="modal-footer border-top border-secondary">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                        setShowAddMakhdoom(null);
                      }}>إلغاء</button>
                      <button type="submit" className="btn btn-warning btn-sm">حفظ المخدوم ✝</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          , document.body);
        })()}

                {/* Modal: Transfer Makhdomeen */}
        {showTransferMakhdomeen && (() => {
          const { stageName, className, gender } = showTransferMakhdomeen;
          const otherStages = stagesList.filter(s => s.name !== stageName);
          const targetStageObj = stagesList.find(s => s.name === targetStageName);
          const targetClassesList = targetStageObj ? targetStageObj.classes || [] : [];

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <form onSubmit={(e) => handleTransferMakhdomeen(e, stageName, className, gender)}>
                    <div className="modal-header border-bottom border-secondary">
                      <h5 className="modal-title text-warning fw-bold">نقل مخدومي ({gender === 'male' ? 'البنين' : 'البنات'}) للفصل التالي</h5>
                      <button type="button" className="btn-close" onClick={() => {
                        setShowTransferMakhdomeen(null);
                      }}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">اختر المرحلة المستهدفة</label>
                        <select className="form-select" value={targetStageName} onChange={(e) => {
                          setTargetStageName(e.target.value);
                          setTargetClassName('');
                        }} required>
                          <option value="">-- اختر المرحلة --</option>
                          {otherStages.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">اختر الفصل المستهدف</label>
                        <select className="form-select" value={targetClassName} onChange={(e) => setTargetClassName(e.target.value)} required>
                          <option value="">-- اختر الفصل --</option>
                          {targetClassesList.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer border-top border-secondary">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                        setShowTransferMakhdomeen(null);
                      }}>إلغاء</button>
                      <button type="submit" className="btn btn-warning btn-sm">تأكيد ونقل المخدومين ✝</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          , document.body);
        })()}

        {/* Modal: Distribute Servants with Code Search */}
        {showAssignServants && (() => {
          const { stageName, className } = showAssignServants;
          const stage = stagesList.find(s => s.name === stageName);
          const cls = stage ? stage.classes.find(c => c.name === className) : null;
          const clsServants = cls ? cls.servants || [] : [];

          const stageAssignedUsernames = (stage ? stage.assignments || [] : []).map(a => (a.username || '').toLowerCase());

          const filteredServantsList = servants.filter(srv => {
            if (!stageAssignedUsernames.includes((srv.username || '').toLowerCase())) return false;
            if (['super_admin', 'admin', 'priest'].includes(srv.role)) return false;
            const query = servantsSearchQuery.trim().toLowerCase();
            if (!query) return true;
            return srv.name.toLowerCase().includes(query) || (srv.systemCode && srv.systemCode.toLowerCase().includes(query));
          });

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered modal-md">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <div className="modal-header border-bottom border-secondary">
                    <h5 className="modal-title text-warning fw-bold">توزيع الخدام على فصل: {className}</h5>
                    <button type="button" className="btn-close" onClick={() => { setShowAssignServants(null); setServantsSearchQuery(''); }}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3 input-group input-group-sm">
                      <span className="input-group-text bg-secondary border-secondary text-white"><i className="fas fa-search"></i></span>
                      <input
                        type="text"
                        className="form-control"
                        value={servantsSearchQuery}
                        onChange={(e) => setServantsSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="overflow-auto border p-2" style={{ maxHeight: '300px', backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
                      {filteredServantsList.length === 0 ? (
                        <p className="text-center text-muted py-4 mb-0 small">لا يوجد خدام يطابقون البحث.</p>
                      ) : (
                        filteredServantsList.map(srv => {
                          const isAssigned = assignedServants.includes(srv.username);
                          return (
                            <div 
                              key={srv.username} 
                              className="p-3 border-bottom border-secondary d-flex align-items-center justify-content-between cursor-pointer"
                              onClick={() => handleToggleServantClass(stageName, className, srv.username)}
                              style={{ cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s', backgroundColor: isAssigned ? 'rgba(143, 29, 44, 0.08)' : 'transparent' }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div 
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: isAssigned ? '2px solid #8f1d2c' : '2px solid #a0a0a0',
                                    backgroundColor: isAssigned ? '#8f1d2c' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  {isAssigned && <i className="fas fa-check"></i>}
                                </div>
                                <span className="fw-bold" style={{ fontSize: '0.95rem' }}>{srv.name}</span>
                              </div>
                              {isRealMemberCode(srv.systemCode) && (
                                <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.8rem' }}>{srv.systemCode}</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-top border-secondary">
                    <button type="button" className="btn btn-secondary btn-sm px-4" onClick={() => { setShowAssignServants(null); setServantsSearchQuery(''); }}>إغلاق</button>
                  </div>
                </div>
              </div>
            </div>
          , document.body);
        })()}

        {/* Modal: Show Stage Assigned Servants */}
        {showAssignedServantsModal && selectedStage && (() => {
          const assignments = selectedStage.assignments || [];

          const syncStageLegacyArrays = (stg) => {
            const assigns = stg.assignments || [];
            stg.priestUsers = [];
            stg.familyCoordinatorUsers = [];
            stg.assistantFamilyCoordinatorUsers = [];
            stg.generalCoordinatorUsers = [];
            if (stg.classes) {
              stg.classes.forEach(c => {
                c.servants = [];
              });
            }
            assigns.forEach(a => {
              const job = jobsList.find(j => j.id === a.jobId);
              if (!job) return;
              const usr = a.username;
              const perms = job.permissions || {};
              
              if (job.name && job.name.includes('كاهن')) {
                if (!stg.priestUsers.includes(usr)) stg.priestUsers.push(usr);
              } else if (perms.manageServants === true || perms.editServiceTree === true) {
                if (!stg.generalCoordinatorUsers.includes(usr)) stg.generalCoordinatorUsers.push(usr);
              } else if (perms.managePreparations === true || perms.manageDeadlines === true) {
                if (!stg.familyCoordinatorUsers.includes(usr)) stg.familyCoordinatorUsers.push(usr);
              } else if (perms.viewMembers === true) {
                if (!stg.assistantFamilyCoordinatorUsers.includes(usr)) stg.assistantFamilyCoordinatorUsers.push(usr);
              }

              if (a.className && stg.classes) {
                const targetCls = stg.classes.find(c => c.name === a.className);
                if (targetCls) {
                  targetCls.servants = targetCls.servants || [];
                  if (!targetCls.servants.includes(usr)) {
                    targetCls.servants.push(usr);
                  }
                }
              }
            });
          };

          const handleAddAssignment = async (e) => {
            e.preventDefault();
            if (!selectedUserToAssign || !selectedJobToAssign) {
              window.customAlert('الرجاء اختيار الخادم والوظيفة!');
              return;
            }
            if (!selectedStage.assignments) selectedStage.assignments = [];
            
            if (editingAssignIdx !== null) {
              selectedStage.assignments[editingAssignIdx] = {
                username: selectedUserToAssign.username,
                jobId: selectedJobToAssign,
                className: selectedClassToAssign || null
              };
              setEditingAssignIdx(null);
              window.customAlert('تم تعديل التوزيع بنجاح! ✝');
            } else {
              // Avoid duplicate assignments
              const exists = selectedStage.assignments.some(a => a.username === selectedUserToAssign.username && a.jobId === selectedJobToAssign && a.className === selectedClassToAssign);
              if (exists) {
                window.customAlert('هذا التوزيع موجود بالفعل!');
                return;
              }

              selectedStage.assignments.push({
                username: selectedUserToAssign.username,
                jobId: selectedJobToAssign,
                className: selectedClassToAssign || null
              });
              window.customAlert('تم إضافة وتوزيع الخادم بنجاح! ✝');
            }

            syncStageLegacyArrays(selectedStage);
            await saveServiceConfig();
            
            setSelectedUserToAssign(null);
            setAssignSearchQuery('');
            setSelectedJobToAssign('');
            setSelectedClassToAssign('');
          };

          const handleRemoveAssignment = async (index) => {
            window.customConfirm('هل أنت متأكد من إلغاء توزيع هذا الخادم؟', async () => {
              selectedStage.assignments.splice(index, 1);
              syncStageLegacyArrays(selectedStage);
              await saveServiceConfig();
              window.customAlert('تم إلغاء التوزيع بنجاح.');
              setSelectedUserToAssign(null);
              if (editingAssignIdx === index) {
                setEditingAssignIdx(null);
                setAssignSearchQuery('');
                setSelectedJobToAssign('');
                setSelectedClassToAssign('');
              }
            });
          };

          // Filter users for search (do not show admin or super_admin)
          const searchedUsers = assignSearchQuery.trim().length > 0
            ? allUsers.filter(u => {
                if (u.username === 'admin' || u.role === 'super_admin') return false;
                const q = assignSearchQuery.toLowerCase();
                return (u.name || '').toLowerCase().includes(q) ||
                       (u.username || '').toLowerCase().includes(q) ||
                       (u.systemCode || '').toLowerCase().includes(q) ||
                       (u.phone || '').includes(q);
              }).slice(0, 5)
            : [];

          return createPortal(
             <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <div className="modal-header border-bottom border-secondary">
                    <h5 className="modal-title text-warning fw-bold"><i className="fas fa-users-cog me-2"></i> توزيع خدام ومسؤولي مرحلة: {selectedStage.name}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowAssignedServantsModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-4">
                      {/* Current Assignments List */}
                      <div className="col-md-6 border-end border-secondary">
                        <h6 className="fw-bold text-warning mb-3"><i className="fas fa-list me-1"></i> التوزيعات الحالية في هذه المرحلة</h6>
                        {assignments.length === 0 ? (
                          <p className="text-muted text-center py-4 small">لا يوجد خدام أو مسؤولين موزعين بعد.</p>
                        ) : (
                          <div className="list-group list-group-flush" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {assignments.map((assign, idx) => {
                              const userObj = allUsers.find(u => u.username === assign.username);
                              const jobObj = jobsList.find(j => j.id === assign.jobId);
                              return (
                                <div key={idx} className="list-group-item bg-transparent d-flex justify-content-between align-items-center border-bottom border-secondary py-2 px-1 text-white-50">
                                  <div>
                                    <strong className="d-block text-white small">{userObj ? userObj.name : assign.username}</strong>
                                    <small className="text-warning" style={{ fontSize: '0.75rem' }}>
                                      {jobObj ? jobObj.name : 'وظيفة غير معروفة'}
                                      {assign.className && ` | فصل: ${assign.className}`}
                                    </small>
                                  </div>
                                  <div className="btn-group gap-1">
                                    <button className="btn btn-outline-warning btn-xs p-1" onClick={() => {
                                      const u = allUsers.find(x => x.username === assign.username);
                                      if (u) {
                                        setSelectedUserToAssign(u);
                                        setSelectedJobToAssign(assign.jobId);
                                        setSelectedClassToAssign(assign.className || '');
                                        setEditingAssignIdx(idx);
                                      } else {
                                        window.customAlert('لم يتم العثور على حساب هذا الخادم.');
                                      }
                                    }} title="تعديل">
                                      <i className="fas fa-edit" style={{ fontSize: '0.75rem' }}></i>
                                    </button>
                                    <button className="btn btn-outline-danger btn-xs p-1" onClick={() => handleRemoveAssignment(idx)} title="حذف">
                                      <i className="fas fa-trash-alt" style={{ fontSize: '0.75rem' }}></i>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Add New Assignment Form */}
                      <div className="col-md-6">
                        <h6 className="fw-bold text-warning mb-3">
                          <i className="fas fa-plus me-1"></i> {editingAssignIdx !== null ? 'تعديل التوزيع الحالي' : 'توزيع خادم/مسؤول جديد'}
                        </h6>
                        <form onSubmit={handleAddAssignment}>
                          {/* Search box */}
                          {editingAssignIdx === null && (
                            <div className="mb-3 position-relative">
                              <label className="form-label small">بحث عن حساب الخادم (بالاسم، الكود، أو الهاتف)</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={assignSearchQuery}
                                onChange={(e) => setAssignSearchQuery(e.target.value)}
                              />
                              {searchedUsers.length > 0 && (
                                <div className="list-group position-absolute w-100 shadow" style={{ zIndex: 10, maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                                  {searchedUsers.map(u => (
                                    <button
                                      key={u.username}
                                      type="button"
                                      className="list-group-item list-group-item-action bg-dark text-white text-start py-2 small"
                                      style={{ border: 'none', borderBottom: '1px solid var(--border-color)' }}
                                      onClick={() => {
                                        setSelectedUserToAssign(u);
                                        setAssignSearchQuery('');
                                      }}
                                    >
                                      <strong>{u.name}</strong> {isRealMemberCode(u.systemCode) && <span className="text-muted">({u.systemCode})</span>}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Selected User Display */}
                          {selectedUserToAssign && (
                            <div className="p-3 rounded mb-3 d-flex justify-content-between align-items-start" style={{ backgroundColor: 'rgba(201, 168, 76, 0.05)', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                              <div>
                                <small className="text-muted d-block">الحساب المختار للتوزيع:</small>
                                <strong className="text-warning d-block">{selectedUserToAssign.name}</strong>
                                {isRealMemberCode(selectedUserToAssign.systemCode) && <small className="text-white-50">{selectedUserToAssign.systemCode}</small>}
                              </div>
                              {editingAssignIdx !== null && (
                                <button type="button" className="btn-close btn-close-white" onClick={() => {
                                  setSelectedUserToAssign(null);
                                  setSelectedJobToAssign('');
                                  setEditingAssignIdx(null);
                                  setAssignSearchQuery('');
                                }} title="إلغاء التعديل والرجوع للبحث"></button>
                              )}
                            </div>
                          )}

                          {/* Job Dropdown */}
                          <div className="mb-3">
                            <label className="form-label small">اختر الوظيفة الصلاحية</label>
                            <select
                              className="form-select form-select-sm"
                              value={selectedJobToAssign}
                              onChange={(e) => setSelectedJobToAssign(e.target.value)}
                              required
                            >
                              <option value="">-- اختر الوظيفة --</option>
                              {jobsList.map(job => (
                                <option key={job.id} value={job.id}>{job.name}</option>
                              ))}
                            </select>
                          </div>



                          <button type="submit" className="btn btn-warning btn-sm w-100 fw-bold py-2 mt-2">
                            <i className="fas fa-save me-1"></i> حفظ وتثبيت التوزيع ✝
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top border-secondary">
                    <button type="button" className="btn btn-secondary btn-sm px-4" onClick={() => setShowAssignedServantsModal(false)}>إغلاق</button>
                  </div>
                </div>
              </div>
            </div>
          , document.body);
        })()}

        {/* Modal: Transfer Stage Request */}
        {showTransferStageModal && selectedStage && (() => {
          const allServiceOptions = [];
          (priestServices || []).forEach(record => {
            (record.osras || []).forEach(osra => {
              allServiceOptions.push(osra);
            });
          });

          const selectedServiceObj = allServiceOptions.find(o => o.name === transferTargetService);
          const targetStagesList = selectedServiceObj 
            ? ((isAdminOrPriest || isOsraLevelCoordinator) 
                ? (selectedServiceObj.stages || []) 
                : (selectedServiceObj.stages || []).filter(isUserAssignedToStage))
            : [];

          const handleSendTransferRequest = async (e) => {
            e.preventDefault();
            if (!transferTargetService || !transferTargetStage) {
              window.customAlert('الرجاء اختيار الخدمة والمرحلة المستهدفة.');
              return;
            }

            if (transferTargetService === serviceName && transferTargetStage === selectedStageName) {
              window.customAlert('لا يمكن نقل المرحلة لنفسها!');
              return;
            }

            try {
              const response = await fetch('/api/services/transfer-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sourceService: serviceName,
                  sourceStage: selectedStageName,
                  targetService: transferTargetService,
                  targetStage: transferTargetStage,
                  sender: JSON.parse(localStorage.getItem('currentUser') || '{}').username
                })
              });
              const result = await response.json();
              if (response.ok && result.success) {
                window.customAlert('تم إرسال طلب نقل وتوزيع المرحلة بنجاح بانتظار موافقة أمين المرحلة المستهدفة! ✝');
                setShowTransferStageModal(false);
                setTransferTargetService('');
                setTransferTargetStage('');
              } else {
                window.customAlert(result.message || 'فشل إرسال طلب النقل.');
              }
            } catch (err) {
              console.error(err);
              window.customAlert('حدث خطأ أثناء الاتصال بالسيرفر.');
            }
          };

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <form onSubmit={handleSendTransferRequest}>
                    <div className="modal-header border-bottom border-secondary">
                      <h5 className="modal-title text-warning fw-bold"><i className="fas fa-exchange-alt me-2"></i> نقل هيكل ومخدومي مرحلة {selectedStageName}</h5>
                      <button type="button" className="btn-close" onClick={() => setShowTransferStageModal(false)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="alert alert-info py-2 small border-0 mb-3" style={{ backgroundColor: 'rgba(23, 162, 184, 0.1)', color: '#17a2b8' }}>
                        💡 سيتم نقل كافة الفصول والمخدومين من هذه المرحلة لدمجهم مع المرحلة المستهدفة بنفس الهيكلية فور موافقة أمين تلك المرحلة.
                      </div>
                      <div className="mb-3">
                        <label className="form-label">الخدمة المستهدفة</label>
                        <select 
                          className="form-select" 
                          value={transferTargetService} 
                          onChange={(e) => {
                            setTransferTargetService(e.target.value);
                            setTransferTargetStage('');
                          }} 
                          required
                        >
                          <option value="">-- اختر الخدمة --</option>
                          {allServiceOptions.map(o => (
                            <option key={o.name} value={o.name}>{o.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">المرحلة المستهدفة</label>
                        <select 
                          className="form-select" 
                          value={transferTargetStage} 
                          onChange={(e) => setTransferTargetStage(e.target.value)} 
                          required
                          disabled={!transferTargetService}
                        >
                          <option value="">-- اختر المرحلة --</option>
                          {targetStagesList.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer border-top border-secondary">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTransferStageModal(false)}>إلغاء</button>
                      <button type="submit" className="btn btn-primary btn-sm px-4">إرسال طلب النقل ✝</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          , document.body);
        })()}

        {/* Modal: Rename Stage or Class */}
        {renameModalData && (() => {
          const { type, stageName, className, oldName } = renameModalData;
          const isStage = type === 'stage';

          const handleRenameSubmit = async (e) => {
            e.preventDefault();
            const trimmed = renameNewName.trim();
            if (!trimmed || trimmed === oldName) {
              setRenameModalData(null);
              return;
            }

            if (isStage) {
              if (currentService.stages.some(s => s.name === trimmed)) {
                window.customAlert('اسم المرحلة موجود بالفعل!');
                return;
              }
              const stage = currentService.stages.find(s => s.name === stageName);
              if (stage) {
                stage.name = trimmed;
                await saveServiceConfig();
                if (selectedStageName === stageName) {
                  setSelectedStageName(trimmed);
                }
                window.customAlert('تم تعديل اسم المرحلة بنجاح! ✝');
              }
            } else {
              const stage = currentService.stages.find(s => s.name === stageName);
              if (!stage) return;
              if (stage.classes.some(c => c.name === trimmed)) {
                window.customAlert('اسم الفصل موجود بالفعل في هذه المرحلة!');
                return;
              }
              const cls = stage.classes.find(c => c.name === className);
              if (cls) {
                try {
                  const response = await fetch('/api/makhdomeen/rename-class', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      osra: serviceName,
                      stage: stageName,
                      oldClassName: className,
                      newClassName: trimmed
                    })
                  });
                  if (!response.ok) {
                    window.customAlert('فشل تحديث أسماء الفصول للمخدومين في السيرفر.');
                    return;
                  }
                } catch (err) {
                  console.error(err);
                  window.customAlert('حدث خطأ أثناء تعديل اسم الفصل في السيرفر.');
                  return;
                }

                cls.name = trimmed;
                await saveServiceConfig();
                window.customAlert('تم تعديل اسم الفصل بنجاح! ✝');
              }
            }
            setRenameModalData(null);
          };

          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered modal-sm">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <form onSubmit={handleRenameSubmit}>
                    <div className="modal-header border-bottom border-secondary">
                      <h5 className="modal-title text-warning fw-bold">
                        <i className="fas fa-edit me-2"></i> {isStage ? 'تعديل اسم المرحلة' : 'تعديل اسم الفصل'}
                      </h5>
                      <button type="button" className="btn-close" onClick={() => setRenameModalData(null)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label small">الاسم الجديد</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={renameNewName} 
                          onChange={(e) => setRenameNewName(e.target.value)} 
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="modal-footer border-top border-secondary">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRenameModalData(null)}>إلغاء</button>
                      <button type="submit" className="btn btn-warning btn-sm px-3">حفظ</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          , document.body);
        })()}

        {/* Modal: View/Edit Makhdoom Details */}
        {viewingMakhdoomDetails && (() => {
          const m = viewingMakhdoomDetails;
          const currentStage = currentService?.stages?.find(s => s.name === m.stage);
          const hasWritePermission = !readOnly && hasStageWritePermission(currentStage);
          return createPortal(
            <div className="modal d-block fade show" tabIndex="-1" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1080, overflowY: 'auto' }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--color-text)', border: '2px solid var(--gold-accent)', borderRadius: '16px' }}>
                  <form onSubmit={(e) => handleSaveMakhdoomEdit(e, m)}>
                    <div className="modal-header border-bottom border-secondary">
                      <h5 className="modal-title text-warning fw-bold"><i className="fas fa-user-edit me-2"></i> تعديل بيانات المخدوم: {m.name}</h5>
                      <button type="button" className="btn-close" onClick={() => setViewingMakhdoomDetails(null)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3 text-start">
                        <label className="form-label text-warning small fw-bold">الاسم</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMakhdoomName}
                          onChange={(e) => setEditMakhdoomName(e.target.value)}
                          disabled={!hasWritePermission}
                          required
                        />
                      </div>
                      <div className="mb-3 text-start">
                        <label className="form-label text-warning small fw-bold">النوع</label>
                        <select
                          className="form-select"
                          value={editMakhdoomGender}
                          onChange={(e) => setEditMakhdoomGender(e.target.value)}
                          disabled={!hasWritePermission}
                        >
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </div>
                      <div className="mb-3 text-start">
                        <label className="form-label text-warning small fw-bold">رقم الهاتف</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editMakhdoomPhone}
                          onChange={(e) => setEditMakhdoomPhone(e.target.value)}
                          disabled={!hasWritePermission}
                        />
                      </div>
                      {/* Address Fields */}
                      <div className="row">
                        <div className="col-md-6 mb-3 text-start">
                          <label className="form-label text-warning small fw-bold">المنطقة</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editMakhdoomArea}
                            onChange={(e) => setEditMakhdoomArea(e.target.value)}
                            disabled={!hasWritePermission}
                          />
                        </div>
                        <div className="col-md-6 mb-3 text-start">
                          <label className="form-label text-warning small fw-bold">الشارع</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editMakhdoomStreet}
                            onChange={(e) => setEditMakhdoomStreet(e.target.value)}
                            disabled={!hasWritePermission}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4 mb-3 text-start">
                          <label className="form-label text-warning small fw-bold">عمارة</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editMakhdoomBuilding}
                            onChange={(e) => setEditMakhdoomBuilding(e.target.value)}
                            disabled={!hasWritePermission}
                          />
                        </div>
                        <div className="col-md-4 mb-3 text-start">
                          <label className="form-label text-warning small fw-bold">دور</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editMakhdoomFloor}
                            onChange={(e) => setEditMakhdoomFloor(e.target.value)}
                            disabled={!hasWritePermission}
                          />
                        </div>
                        <div className="col-md-4 mb-3 text-start">
                          <label className="form-label text-warning small fw-bold">شقة</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editMakhdoomApartment}
                            onChange={(e) => setEditMakhdoomApartment(e.target.value)}
                            disabled={!hasWritePermission}
                          />
                        </div>
                      </div>
                      <div className="mb-3 text-start">
                        <label className="form-label text-warning small fw-bold">ملاحظات</label>
                        <textarea
                          className="form-control"
                          value={editMakhdoomNotes}
                          onChange={(e) => setEditMakhdoomNotes(e.target.value)}
                          disabled={!hasWritePermission}
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                    <div className="modal-footer border-top border-secondary">
                      <button type="button" className="btn btn-secondary btn-sm px-4" onClick={() => setViewingMakhdoomDetails(null)}>إلغاء</button>
                      {hasWritePermission && (
                        <button type="submit" className="btn btn-warning btn-sm px-4">حفظ التعديلات ✝</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

      </div>
    </div>
    </div>
  );
}
