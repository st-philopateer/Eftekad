import React from 'react';
import { renderToString } from 'react-dom/server';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import ServiceTree from './src/models/ServiceTree.js';
import Job from './src/models/Job.js';

// We need a minimal environment to simulate localStorage
global.window = {
  innerWidth: 1024,
  location: { href: '' }
};
global.localStorage = {
  getItem: (key) => {
    if (key === 'currentUser') {
      return JSON.stringify({
        username: 'صموئيل صفوت',
        name: 'صموئيل صفوت',
        role: 'servant',
        church: 'السيدة العذراء مريم والشهيد ابو سيفين',
        activeRole: 'servant',
        activeService: 'سان فيلوباتير',
        activeStage: 'سان فيلوباتير',
        permissions: {
          viewServiceTree: true,
          viewMembers: true,
          viewPreparations: true,
          viewEvaluations: true,
          viewMessages: true,
          managePhilopateerServices: true
        }
      });
    }
    if (key.startsWith('activeService_')) return 'سان فيلوباتير';
    if (key.startsWith('activeStage_')) return 'سان فيلوباتير';
    return null;
  },
  setItem: () => {}
};

// Mock components that we don't need to test
const mockComponent = (name) => () => React.createElement('div', null, name);
jest.mock('../components/ProfilePicEditor', () => mockComponent('ProfilePicEditor'), { virtual: true });
jest.mock('../components/ThemeToggle', () => mockComponent('ThemeToggle'), { virtual: true });
jest.mock('../components/NotificationsBell', () => mockComponent('NotificationsBell'), { virtual: true });

import ServantDashboard from '../front/src/components/ServantDashboard.jsx';

const run = async () => {
  await connectDB();
  const users = await User.find({}).lean();
  const services = await ServiceTree.find({}).lean();
  const jobs = await Job.find({}).lean();

  console.log('Simulating ServantDashboard render...');
  try {
    // We render the component inside a mock router
    const element = React.createElement(ServantDashboard, {});
    const html = renderToString(element);
    console.log('Render successful!');
  } catch (err) {
    console.error('RENDER CRASHED WITH ERROR:', err);
  }
  process.exit(0);
};

run();
