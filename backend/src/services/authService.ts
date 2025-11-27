import prisma from '../config/database';
import { comparePassword, hashPassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });

  if (!user) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId || undefined,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  schoolId?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role as any,
      schoolId: data.schoolId,
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  return userWithoutPassword;
};


