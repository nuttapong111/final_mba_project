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
import uploadRoutes from './routes/upload';
import examRoutes from './routes/exams';
import quizRoutes from './routes/quiz';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Serve static files (uploads)
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
app.get('/uploads/*', async (c) => {
  const filePath = c.req.path.replace('/uploads/', '');
  const fullPath = join(UPLOAD_DIR, filePath);
  
  try {
    if (!existsSync(fullPath)) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }
    
    const file = readFileSync(fullPath);
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';
    
    return c.body(file, 200, {
      'Content-Type': contentType,
    });
  } catch (error) {
    return c.json({ success: false, error: 'File not found' }, 404);
  }
});

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
app.route('/api/upload', uploadRoutes);
app.route('/api/exams', examRoutes);
app.route('/api/quiz', quizRoutes);

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

