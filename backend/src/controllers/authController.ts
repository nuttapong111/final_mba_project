import { Context } from 'hono';
import { login, register } from '../services/authService';
import prisma from '../config/database';

export const loginController = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, 400);
    }

    const result = await login(email, password);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const registerController = async (c: Context) => {
  try {
    const data = await c.req.json();
    const user = await register(data);
    return c.json({ success: true, data: user });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const meController = async (c: Context) => {
  try {
    const authUser = c.get('user'); // From JWT token (id, email, role, schoolId)
    
    // Get full user data from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: user });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};

