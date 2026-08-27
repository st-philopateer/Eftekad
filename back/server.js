import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './src/config/database.js';
import { errorHandler } from './src/middlewares/errorMiddleware.js';
import { runAutoWaznatRotation, runAutoArchiving, seedInitialData } from './src/utils/cronTasks.js';

// Route imports
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import makhdomeenRoutes from './src/routes/makhdomeenRoutes.js';
import serviceTreeRoutes from './src/routes/serviceTreeRoutes.js';
import attendanceRoutes from './src/routes/attendanceRoutes.js';
import visitationRoutes from './src/routes/visitationRoutes.js';
import evaluationRoutes from './src/routes/evaluationRoutes.js';
import preparationRoutes from './src/routes/preparationRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import stageListRoutes from './src/routes/stageListRoutes.js';
import jobRoutes from './src/routes/jobRoutes.js';
import serviceYearRoutes from './src/routes/serviceYearRoutes.js';
import syncRoutes from './src/routes/syncRoutes.js';
import philopateerRoutes from './src/routes/philopateerRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB Atlas via Mongoose asynchronously
connectDB().then(() => {
  seedInitialData();
  runAutoWaznatRotation();
  runAutoArchiving();
}).catch(err => console.error('Database initialization error:', err));

const app = express();
const PORT = process.env.PORT || 3000;

// Base Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files & Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../front/dist')));

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/makhdomeen', makhdomeenRoutes);
app.use('/api/services', serviceTreeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/servant-visitations', visitationRoutes);
app.use('/api/preparations', preparationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stages-list', stageListRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/service-years', serviceYearRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', syncRoutes);
app.use('/api/philopateer', philopateerRoutes);

// Global Error Handler
app.use(errorHandler);

// Frontend SPA Fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../front/dist/index.html');
  res.sendFile(indexPath);
});

// Start Server
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 Modular MVC Server successfully running on port ${PORT}!`);
  console.log(`🔗 Link: http://localhost:${PORT}/`);
  console.log('==================================================');
});

export default app;
