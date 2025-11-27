import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import userRoutes from './routes/users';
import courseTeacherRoutes from './routes/courseTeachers';
import courseStudentRoutes from './routes/courseStudents';
import liveSessionRoutes from './routes/liveSessions';
import webboardRoutes from './routes/webboard';
import gradingRoutes from './routes/grading';
import dashboardRoutes from './routes/dashboard';
import courseCategoryRoutes from './routes/courseCategories';
import pollRoutes from './routes/polls';
import questionBankRoutes from './routes/questionBanks';

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ success: true, message: 'API is running' });
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/courses', courseRoutes);
app.route('/api/courses', courseTeacherRoutes);
app.route('/api/courses', courseStudentRoutes);
app.route('/api/users', userRoutes);
app.route('/api/live-sessions', liveSessionRoutes);
app.route('/api/webboard', webboardRoutes);
app.route('/api/grading', gradingRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/course-categories', courseCategoryRoutes);
app.route('/api/polls', pollRoutes);
app.route('/api/question-banks', questionBankRoutes);

// 404
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Railway uses PORT environment variable, fallback to env.PORT
const port = parseInt(process.env.PORT || env.PORT);

console.log(`🚀 Server is running on port ${port}`);
console.log(`📊 Environment: ${env.NODE_ENV}`);

serve({
  fetch: app.fetch,
  port,
});

