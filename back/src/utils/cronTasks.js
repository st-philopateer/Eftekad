import Makhdoom from '../models/Makhdoom.js';
import ServiceTree from '../models/ServiceTree.js';
import SystemMeta from '../models/SystemMeta.js';
import ServiceYear from '../models/ServiceYear.js';

export const runAutoWaznatRotation = async () => {
  try {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let lastRotation = await SystemMeta.findOne({ key: 'last_waznat_rotation_month' });
    if (lastRotation && lastRotation.value === currentMonthKey) {
      return; // Already executed for this month
    }

    console.log(`[Waznat Rotation] Starting automated monthly rotation for key ${currentMonthKey}...`);

    const services = await ServiceTree.find({});
    for (const s of services) {
      for (const o of s.osras || []) {
        for (const stg of o.stages || []) {
          for (const c of stg.classes || []) {
            const servants = (c.servants || []).filter(Boolean);
            if (servants.length > 1) {
              const classMakhdomeen = await Makhdoom.find({
                osra: o.name,
                stage: stg.name,
                fasl: c.name,
                status: 'active',
              });

              if (classMakhdomeen.length > 0) {
                // Distribute round-robin
                for (let i = 0; i < classMakhdomeen.length; i++) {
                  const assigned = servants[i % servants.length];
                  await Makhdoom.updateOne({ _id: classMakhdomeen[i]._id }, { assignedServant: assigned });
                }
              }
            }
          }
        }
      }
    }

    await SystemMeta.findOneAndUpdate(
      { key: 'last_waznat_rotation_month' },
      { value: currentMonthKey },
      { upsert: true }
    );
    console.log(`[Waznat Rotation] Completed successfully for ${currentMonthKey}!`);
  } catch (err) {
    console.error('Error running automated waznat rotation:', err);
  }
};

export const runAutoArchiving = async () => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const existingActive = await ServiceYear.findOne({ year: currentYear });
    if (!existingActive) {
      await ServiceYear.create({ year: currentYear, isActive: true });
    }
  } catch (err) {
    console.error('Error running auto archiving check:', err);
  }
};

export const seedInitialData = async () => {
  try {
    const StageList = (await import('../models/StageList.js')).default;
    const ServiceTree = (await import('../models/ServiceTree.js')).default;

    const standardStages = [
      { id: 'stage_1', name: 'اولي ابتدائي', code: '1', order: 1, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_2', name: 'تانية ابتدائي', code: '2', order: 2, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_3', name: 'تالتة ابتدائي', code: '3', order: 3, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_4', name: 'رابعة ابتدائي', code: '4', order: 4, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_5', name: 'خامسة ابتدائي', code: '5', order: 5, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_6', name: 'سادسة ابتدائي', code: '6', order: 6, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_7', name: 'أولى إعدادي', code: '7', order: 7, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_8', name: 'تانية إعدادي', code: '8', order: 8, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_9', name: 'تالتة إعدادي', code: '9', order: 9, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_10', name: 'أولى ثانوي', code: '10', order: 10, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_11', name: 'تانية ثانوي', code: '11', order: 11, promotionType: 'auto', allowedTargets: [] },
      { id: 'stage_12', name: 'تالتة ثانوي', code: '12', order: 12, promotionType: 'auto', allowedTargets: [] }
    ];

    for (const stg of standardStages) {
      await StageList.findOneAndUpdate({ name: stg.name }, { $set: stg }, { upsert: true });
    }

    console.log('✅ Initial database stages auto-seeded successfully!');
  } catch (err) {
    console.warn('Initial data seeding warning:', err.message);
  }
};
