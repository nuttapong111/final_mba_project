import { Context } from 'hono';
import { getUsers, bulkImportUsers, createUser } from '../services/userService';

export const getUsersController = async (c: Context) => {
  try {
    const user = c.get('user');
    const users = await getUsers(user);
    return c.json({ success: true, data: users });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};

export const createUserController = async (c: Context) => {
  try {
    const currentUser = c.get('user');
    const userData = await c.req.json();

    const user = await createUser(userData, currentUser);
    return c.json({ success: true, data: user });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const bulkImportUsersController = async (c: Context) => {
  try {
    const user = c.get('user');
    const { users } = await c.req.json();

    if (!Array.isArray(users)) {
      return c.json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' }, 400);
    }

    const result = await bulkImportUsers(users, user.schoolId);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};

