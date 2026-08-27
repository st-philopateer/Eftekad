const fs = require('fs');

// 1. Update back/server.js
const serverPath = 'D:/eftekad/back/server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

const oldServerDelete = `  try {
    const { id } = req.params;
    const db = readDb();
    if (!db.stagesList) db.stagesList = [];

    const idx = db.stagesList.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "المرحلة غير موجودة!" });
    }

    db.stagesList.splice(idx, 1);
    db.stagesList.sort((a, b) => (a.order || 0) - (b.order || 0));
    db.stagesList.forEach((s, idx) => {
      s.order = idx + 1;
      s.code = String(idx + 1);
    });
    await writeDb(db, 'stagesList');
    res.json({ success: true, stagesList: db.stagesList });
  } catch (err) {
    console.error("Error deleting stage definition:", err);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف المرحلة." });
  }
});`;

const newServerDelete = `  try {
    const { id } = req.params;
    const db = readDb();
    if (!db.stagesList) db.stagesList = [];

    const idx = db.stagesList.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "المرحلة غير موجودة!" });
    }

    const deletedStage = db.stagesList[idx];
    const stageName = deletedStage.name;

    // Remove from stagesList
    db.stagesList.splice(idx, 1);
    db.stagesList.sort((a, b) => (a.order || 0) - (b.order || 0));
    db.stagesList.forEach((s, idx) => {
      s.order = idx + 1;
      s.code = String(idx + 1);
    });
    await writeDb(db, 'stagesList');

    // Cascade delete from priestServices (Service Trees)
    if (db.priestServices) {
      db.priestServices = db.priestServices.map(ps => {
        if (ps.osras) {
          ps.osras = ps.osras.map(osra => {
            if (osra.stages) {
              osra.stages = osra.stages.filter(stg => stg.name !== stageName);
            }
            return osra;
          });
        }
        return ps;
      });
      await writeDb(db, 'priestServices');
    }

    // Cascade update members (makhdomeen) - set stage and class to empty
    if (db.makhdomeen) {
      db.makhdomeen = db.makhdomeen.map(m => {
        if (m.stage === stageName) {
          return {
            ...m,
            stage: '',
            fasl: ''
          };
        }
        return m;
      });
      await writeDb(db, 'makhdomeen');
    }

    res.json({ success: true, stagesList: db.stagesList });
  } catch (err) {
    console.error("Error deleting stage definition:", err);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء حذف المرحلة." });
  }
});`;

const normServer = serverContent.replace(/\r\n/g, '\n');
const normOldServer = oldServerDelete.replace(/\r\n/g, '\n');
const normNewServer = newServerDelete.replace(/\r\n/g, '\n');

if (normServer.includes(normOldServer)) {
  fs.writeFileSync(serverPath, normServer.replace(normOldServer, normNewServer), 'utf8');
  console.log("SUCCESS: Updated back/server.js delete stage endpoint.");
} else {
  console.log("ERROR: Could not find delete stage endpoint in back/server.js.");
}

// 2. Update front/src/components/ServiceTree.jsx
const serviceTreePath = 'D:/eftekad/front/src/components/ServiceTree.jsx';
let treeContent = fs.readFileSync(serviceTreePath, 'utf8');

const oldTreeDelete = `  const handleDeleteStage = async (stageName) => {
    window.customConfirm(\`هل أنت متأكد من حذف مرحلة "\${stageName}" وكل الفصول والخدام المرتبطين بها؟\`, async () => {
      currentService.stages = currentService.stages.filter(s => s.name !== stageName);
      await saveServiceConfig();
      setSelectedStageName(null);
    });
  };`;

const newTreeDelete = `  const handleDeleteStage = async (stageName) => {
    window.customConfirm(\`هل أنت متأكد من حذف مرحلة "\${stageName}" وكل الفصول والخدام المرتبطين بها؟\`, async () => {
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
  };`;

const normTree = treeContent.replace(/\r\n/g, '\n');
const normOldTree = oldTreeDelete.replace(/\r\n/g, '\n');
const normNewTree = newTreeDelete.replace(/\r\n/g, '\n');

if (normTree.includes(normOldTree)) {
  fs.writeFileSync(serviceTreePath, normTree.replace(normOldTree, normNewTree), 'utf8');
  console.log("SUCCESS: Updated ServiceTree.jsx stage deletion handler.");
} else {
  console.log("ERROR: Could not find handleDeleteStage in ServiceTree.jsx.");
}

// 3. Update front/src/components/AdminDashboard.jsx
const adminPath = 'D:/eftekad/front/src/components/AdminDashboard.jsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

const oldAdminSubmit = `          notes: editMemberNotes.trim(),
          birthDate: editMemberBirthDate,
          socialStatus: editMemberSocialStatus
        })
      });`;

const newAdminSubmit = `          notes: editMemberNotes.trim(),
          birthDate: editMemberBirthDate,
          socialStatus: editMemberSocialStatus,
          fasl: (editMemberStage !== editingMember.stage) ? "" : (editingMember.fasl || "")
        })
      });`;

const normAdmin = adminContent.replace(/\r\n/g, '\n');
const normOldAdmin = oldAdminSubmit.replace(/\r\n/g, '\n');
const normNewAdmin = newAdminSubmit.replace(/\r\n/g, '\n');

if (normAdmin.includes(normOldAdmin)) {
  fs.writeFileSync(adminPath, normAdmin.replace(normOldAdmin, normNewAdmin), 'utf8');
  console.log("SUCCESS: Updated AdminDashboard.jsx member edit submit handler.");
} else {
  console.log("ERROR: Could not find edit submit handler in AdminDashboard.jsx.");
}
