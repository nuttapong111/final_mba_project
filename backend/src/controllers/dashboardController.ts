import { Context } from 'hono';
import {
  getSchoolDashboardStats,
  getAdminDashboardStats,
  getTeacherDashboardStats,
  getStudentDashboardStats,
} from '../services/dashboardService';

export const getSchoolDashboardController = async (c: Context) => {
  try {
    const user = c.get('user');
    const stats = await getSchoolDashboardStats(user);
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const getAdminDashboardController = async (c: Context) => {
  try {
    const stats = await getAdminDashboardStats();
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const getTeacherDashboardController = async (c: Context) => {
  try {
    const user = c.get('user');
    const stats = await getTeacherDashboardStats(user);
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const getStudentDashboardController = async (c: Context) => {
  try {
    const user = c.get('user');
    const stats = await getStudentDashboardStats(user);
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};


