export const getUserAssignments = (user, servicesList = [], jobsList = []) => {
  if (!user || !user.username) return [];

  const usernameLower = user.username.trim().toLowerCase();
  const assignments = [];
  const assignmentKeys = new Set();

  const addAssignment = (item) => {
    const key = `${item.targetPath}_${item.serviceName}_${item.stageName}_${item.className || ''}_${item.title}`;
    if (!assignmentKeys.has(key)) {
      assignmentKeys.add(key);
      assignments.push(item);
    }
  };

  // 1. Super Admin Assignment
  if (user.role === 'super_admin') {
    addAssignment({
      id: 'super_admin_portal',
      title: 'السوبر أدمن الرئيسي',
      subtitle: 'التحكم الشامل في الكنائس والأنظمة',
      role: 'super_admin',
      serviceName: 'الرئاسة العامة',
      stageName: 'كافة القطاعات',
      className: '',
      targetPath: '/super-admin',
      icon: 'fas fa-shield-alt',
      color: '#c9a84c',
      priority: 100,
    });
  }

  // 2. Admin / General Secretariat Assignment
  if (user.role === 'admin' || user.role === 'super_admin') {
    addAssignment({
      id: 'admin_portal',
      title: 'الأمانة العامة / الإدارة',
      subtitle: 'لوحة التحكم في المستخدمين والخدمات والهيكل',
      role: 'admin',
      serviceName: user.church || 'الكنيسة',
      stageName: 'كافة الخدمات والمراحل',
      className: '',
      targetPath: '/admin',
      icon: 'fas fa-cogs',
      color: '#0d6efd',
      priority: 90,
    });
  }

  // 2b. Priest Portal Assignment
  if (user.role === 'priest') {
    addAssignment({
      id: 'priest_portal',
      title: 'الرعاية الكهنوتية / الإدارة العامة',
      subtitle: 'متابعة المخدومين والتقارير الرعوية الشاملة',
      role: 'priest',
      serviceName: user.church || 'الكنيسة',
      stageName: 'كافة المراحل والخدمات',
      className: '',
      targetPath: '/priest',
      icon: 'fas fa-cross',
      color: '#ffc107',
      priority: 85,
    });
  }

  // 3. Service Tree Scanning (Osras, Stages, Classes, Jobs)
  (servicesList || []).forEach((srv) => {
    // Priest of entire service
    if ((srv.priestUser || '').toLowerCase() === usernameLower) {
      addAssignment({
        id: `priest_${srv.name}`,
        title: 'كاهن الخدمة',
        subtitle: srv.name,
        role: 'priest',
        serviceName: srv.name,
        stageName: 'كافة المراحل',
        className: '',
        targetPath: '/priest',
        icon: 'fas fa-cross',
        color: '#ffc107',
        priority: 80,
      });
    }

    (srv.osras || []).forEach((osra) => {
      const isOsraCoord = (osra.coordinatorUser || '').toLowerCase() === usernameLower;
      const isOsraAsst = (osra.assistantCoordinatorUser || '').toLowerCase() === usernameLower;
      const isFamilyCoord = (osra.familyCoordinatorUser || '').toLowerCase() === usernameLower;
      const isFamilyAsst = (osra.assistantFamilyCoordinatorUser || '').toLowerCase() === usernameLower;

      if (isOsraCoord || isOsraAsst) {
        addAssignment({
          id: `coord_osra_${osra.name}`,
          title: isOsraCoord ? 'أمين الخدمة' : 'مساعد أمين الخدمة',
          subtitle: `خدمة ${osra.name}`,
          role: 'general_coordinator',
          serviceName: osra.name,
          stageName: 'كل المراحل',
          className: '',
          targetPath: '/general-coordinator',
          icon: 'fas fa-user-tie',
          color: '#198754',
          priority: 70,
        });
      }

      if (isFamilyCoord || isFamilyAsst) {
        addAssignment({
          id: `fam_coord_osra_${osra.name}`,
          title: isFamilyCoord ? 'أمين الأسرة' : 'مساعد أمين الأسرة',
          subtitle: `خدمة ${osra.name}`,
          role: 'family_coordinator',
          serviceName: osra.name,
          stageName: 'كل المراحل',
          className: '',
          targetPath: '/family-coordinator',
          icon: 'fas fa-users-cog',
          color: '#0dcaf0',
          priority: 65,
        });
      }

      (osra.stages || []).forEach((stage) => {
        // Stage Priests
        if ((stage.priestUsers || []).some((p) => (p || '').toLowerCase() === usernameLower)) {
          addAssignment({
            id: `priest_stg_${osra.name}_${stage.name}`,
            title: 'كاهن المرحلة',
            subtitle: `${osra.name} - ${stage.name}`,
            role: 'priest',
            serviceName: osra.name,
            stageName: stage.name,
            className: '',
            targetPath: '/priest',
            icon: 'fas fa-cross',
            color: '#ffc107',
            priority: 60,
          });
        }

        // Stage Coordinators
        if ((stage.generalCoordinatorUsers || []).some((c) => (c || '').toLowerCase() === usernameLower)) {
          addAssignment({
            id: `gen_coord_stg_${osra.name}_${stage.name}`,
            title: 'أمين الخدمة للمرحلة',
            subtitle: `${osra.name} - ${stage.name}`,
            role: 'general_coordinator',
            serviceName: osra.name,
            stageName: stage.name,
            className: '',
            targetPath: '/general-coordinator',
            icon: 'fas fa-user-tie',
            color: '#198754',
            priority: 55,
          });
        }

        if ((stage.familyCoordinatorUsers || []).some((c) => (c || '').toLowerCase() === usernameLower)) {
          addAssignment({
            id: `fam_coord_stg_${osra.name}_${stage.name}`,
            title: 'أمين الأسرة للمرحلة',
            subtitle: `${osra.name} - ${stage.name}`,
            role: 'family_coordinator',
            serviceName: osra.name,
            stageName: stage.name,
            className: '',
            targetPath: '/family-coordinator',
            icon: 'fas fa-users-cog',
            color: '#0dcaf0',
            priority: 50,
          });
        }

        if ((stage.assistantFamilyCoordinatorUsers || []).some((c) => (c || '').toLowerCase() === usernameLower)) {
          addAssignment({
            id: `asst_fam_coord_stg_${osra.name}_${stage.name}`,
            title: 'مساعد أمين الأسرة للمرحلة',
            subtitle: `${osra.name} - ${stage.name}`,
            role: 'assistant_family_coordinator',
            serviceName: osra.name,
            stageName: stage.name,
            className: '',
            targetPath: '/assistant-family-coordinator',
            icon: 'fas fa-users-cog',
            color: '#0dcaf0',
            priority: 45,
          });
        }

        // Custom Job Assignments in Stage
        (stage.assignments || []).forEach((asgn) => {
          if ((asgn.username || '').toLowerCase() === usernameLower) {
            const matchedJob = (jobsList || []).find((j) => j.id === asgn.jobId);
            const jobTitle = matchedJob ? matchedJob.title : asgn.jobTitle || 'خادم';
            const refRole = matchedJob?.referenceRole || 'servant';
            const targetPath =
              refRole === 'admin'
                ? '/admin'
                : refRole === 'priest'
                ? '/priest'
                : refRole === 'general_coordinator'
                ? '/general-coordinator'
                : refRole === 'family_coordinator'
                ? '/family-coordinator'
                : '/servant';

            addAssignment({
              id: `job_asgn_${osra.name}_${stage.name}_${asgn.className || ''}`,
              title: jobTitle,
              subtitle: `${osra.name} - ${stage.name}${asgn.className ? ` (${asgn.className})` : ''}`,
              role: refRole,
              serviceName: osra.name,
              stageName: stage.name,
              className: asgn.className || '',
              targetPath,
              icon: refRole === 'servant' ? 'fas fa-user' : 'fas fa-user-tag',
              color: '#fd7e14',
              permissions: matchedJob?.permissions,
              priority: 40,
            });
          }
        });

        // Direct Class Servants
        (stage.classes || []).forEach((cls) => {
          if ((cls.servants || []).some((s) => (s || '').toLowerCase() === usernameLower)) {
            addAssignment({
              id: `servant_cls_${osra.name}_${stage.name}_${cls.name}`,
              title: `خادم فصل ${cls.name}`,
              subtitle: `${osra.name} - ${stage.name}`,
              role: 'servant',
              serviceName: osra.name,
              stageName: stage.name,
              className: cls.name,
              targetPath: '/servant',
              icon: 'fas fa-user-graduate',
              color: '#20c997',
              priority: 30,
            });
          }
        });
      });
    });
  });

  // 4. If no specific service assignment found, fallback to their default role
  if (assignments.length === 0) {
    const defaultRole = user.role || 'servant';
    const targetPath =
      defaultRole === 'super_admin'
        ? '/super-admin'
        : defaultRole === 'admin'
        ? '/admin'
        : defaultRole === 'priest'
        ? '/priest'
        : defaultRole === 'family_coordinator'
        ? '/family-coordinator'
        : defaultRole === 'assistant_family_coordinator'
        ? '/assistant-family-coordinator'
        : defaultRole === 'general_coordinator'
        ? '/general-coordinator'
        : '/servant';

    addAssignment({
      id: `default_${defaultRole}`,
      title: user.name || user.username,
      subtitle: 'الخدمة العامة',
      role: defaultRole,
      serviceName: user.osra || 'عام',
      stageName: user.assignedStage || 'عام',
      className: user.assignedClass || '',
      targetPath,
      icon: 'fas fa-user-check',
      color: '#c9a84c',
      priority: 10,
    });
  }

  return assignments;
};

// Group assignments hierarchically by Service for Step-by-Step selection and deduplicate by stageName
export const getUserGroupedServices = (user, servicesList = [], jobsList = []) => {
  const allAssignments = getUserAssignments(user, servicesList, jobsList);

  // 1. Separate System/General Secretariat Portals
  const systemPortals = allAssignments.filter((a) =>
    ['admin_portal', 'super_admin_portal', 'priest_portal'].includes(a.id)
  );

  // 2. Group the remaining assignments by serviceName
  const serviceMap = new Map();

  allAssignments.forEach((a) => {
    if (['admin_portal', 'super_admin_portal', 'priest_portal'].includes(a.id)) return;

    const sName = a.serviceName || 'عام';
    if (!serviceMap.has(sName)) {
      serviceMap.set(sName, {
        id: `service_group_${sName}`,
        name: sName,
        title: `خدمة ${sName}`,
        subtitle: '',
        icon: 'fas fa-church',
        color: '#c9a84c',
        rawStages: [],
      });
    }
    serviceMap.get(sName).rawStages.push(a);
  });

  const services = Array.from(serviceMap.values()).map((srv) => {
    // Deduplicate stages within this service so each stage appears only once with its highest priority title!
    const stageMap = new Map();

    srv.rawStages.forEach((asgn) => {
      const stgKey = asgn.stageName || 'عام';
      const existing = stageMap.get(stgKey);

      if (!existing || (asgn.priority || 0) > (existing.priority || 0)) {
        stageMap.set(stgKey, asgn);
      }
    });

    const deduplicatedStages = Array.from(stageMap.values());
    srv.stages = deduplicatedStages;

    const stageNames = Array.from(new Set(deduplicatedStages.map((s) => s.stageName).filter(Boolean)));
    srv.subtitle = stageNames.length === 1 ? `المرحلة: ${stageNames[0]}` : `${stageNames.length} مراحل مسجلة`;
    return srv;
  });

  return {
    systemPortals,
    services,
    allAssignments,
  };
};
