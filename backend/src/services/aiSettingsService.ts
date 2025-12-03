import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export type AIProvider = 'GEMINI' | 'ML' | 'BOTH';

export interface AISettingsData {
  provider: AIProvider;
  mlApiUrl?: string;
  geminiApiKey?: string;
  enabled: boolean;
}

/**
 * Get AI settings for a school (or global if schoolId is null)
 */
export const getAISettings = async (schoolId: string | null, user: AuthUser) => {
  // Check permission
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์เข้าถึงการตั้งค่า AI');
  }

  // Super admin can access global settings (schoolId = null)
  // School admin can only access their school settings
  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  let settings = await prisma.aISettings.findUnique({
    where: { schoolId: targetSchoolId || undefined },
  });

  // If no settings exist, create default
  if (!settings) {
    settings = await prisma.aISettings.create({
      data: {
        schoolId: targetSchoolId || null,
        provider: 'GEMINI',
        enabled: true,
      },
    });
  }

  // Don't return API key in response
  return {
    id: settings.id,
    schoolId: settings.schoolId,
    provider: settings.provider as AIProvider,
    mlApiUrl: settings.mlApiUrl,
    enabled: settings.enabled,
    hasGeminiKey: !!settings.geminiApiKey,
  };
};

/**
 * Update AI settings
 */
export const updateAISettings = async (
  schoolId: string | null,
  data: AISettingsData,
  user: AuthUser
) => {
  // Check permission
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์แก้ไขการตั้งค่า AI');
  }

  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  // Check if school exists (if schoolId is provided)
  if (targetSchoolId) {
    const school = await prisma.school.findUnique({
      where: { id: targetSchoolId },
    });
    if (!school) {
      throw new Error('ไม่พบโรงเรียน');
    }
  }

  // Get existing settings to preserve API key if not updating
  const existing = await prisma.aISettings.findUnique({
    where: { schoolId: targetSchoolId || undefined },
  });

  const settings = await prisma.aISettings.upsert({
    where: { schoolId: targetSchoolId || undefined },
    create: {
      schoolId: targetSchoolId || null,
      provider: data.provider,
      mlApiUrl: data.mlApiUrl,
      geminiApiKey: data.geminiApiKey || undefined,
      enabled: data.enabled,
    },
    update: {
      provider: data.provider,
      mlApiUrl: data.mlApiUrl,
      geminiApiKey: data.geminiApiKey !== undefined ? data.geminiApiKey : existing?.geminiApiKey,
      enabled: data.enabled,
    },
  });

  return {
    id: settings.id,
    schoolId: settings.schoolId,
    provider: settings.provider as AIProvider,
    mlApiUrl: settings.mlApiUrl,
    enabled: settings.enabled,
    hasGeminiKey: !!settings.geminiApiKey,
  };
};

/**
 * Get active AI provider for a school
 */
export const getActiveAIProvider = async (schoolId: string | null): Promise<AIProvider> => {
  const settings = await prisma.aISettings.findUnique({
    where: { schoolId: schoolId || undefined },
  });

  if (!settings || !settings.enabled) {
    // Default to GEMINI if no settings
    return 'GEMINI';
  }

  return settings.provider as AIProvider;
};

/**
 * Get ML API URL for a school
 */
export const getMLApiUrl = async (schoolId: string | null): Promise<string | null> => {
  const settings = await prisma.aISettings.findUnique({
    where: { schoolId: schoolId || undefined },
  });

  return settings?.mlApiUrl || process.env.ML_API_URL || null;
};

