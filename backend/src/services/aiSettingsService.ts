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

  // Use findUnique when schoolId is provided, otherwise use findFirst for null
  let settings = targetSchoolId
    ? await prisma.aISettings.findUnique({
        where: { schoolId: targetSchoolId },
      })
    : await prisma.aISettings.findFirst({
        where: { schoolId: null },
  });

  // If no settings exist, create default with Gemini
  if (!settings) {
    settings = await prisma.aISettings.create({
      data: {
        schoolId: targetSchoolId || null,
        provider: 'GEMINI', // Default to Gemini
        enabled: true,
        geminiApiKey: process.env.GEMINI_API_KEY || null, // Use env variable if available
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
  const existing = targetSchoolId
    ? await prisma.aISettings.findUnique({
        where: { schoolId: targetSchoolId },
      })
    : await prisma.aISettings.findFirst({
        where: { schoolId: null },
  });

  // Use upsert when schoolId is provided, otherwise use findFirst + create/update
  let settings;
  if (targetSchoolId) {
    settings = await prisma.aISettings.upsert({
      where: { schoolId: targetSchoolId },
    create: {
        schoolId: targetSchoolId,
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
  } else {
    // For null schoolId (global settings), use findFirst + create/update
    if (existing) {
      settings = await prisma.aISettings.update({
        where: { id: existing.id },
        data: {
          provider: data.provider,
          mlApiUrl: data.mlApiUrl,
          geminiApiKey: data.geminiApiKey !== undefined ? data.geminiApiKey : existing.geminiApiKey,
          enabled: data.enabled,
        },
      });
    } else {
      settings = await prisma.aISettings.create({
        data: {
          schoolId: null,
          provider: data.provider,
          mlApiUrl: data.mlApiUrl,
          geminiApiKey: data.geminiApiKey,
          enabled: data.enabled,
        },
      });
    }
  }

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
 * Defaults to GEMINI if no settings found
 */
export const getActiveAIProvider = async (schoolId: string | null): Promise<AIProvider> => {
  // Use findUnique when schoolId is provided, otherwise use findFirst for null
  const settings = schoolId
    ? await prisma.aISettings.findUnique({
        where: { schoolId },
      })
    : await prisma.aISettings.findFirst({
        where: { schoolId: null },
  });

  if (!settings || !settings.enabled) {
    // Default to GEMINI if no settings
    return 'GEMINI';
  }

  // If provider is ML or BOTH but ML API URL is not set, fallback to GEMINI
  if ((settings.provider === 'ML' || settings.provider === 'BOTH') && !settings.mlApiUrl) {
    return 'GEMINI';
  }

  return settings.provider as AIProvider;
};

/**
 * Get ML API URL for a school
 */
export const getMLApiUrl = async (schoolId: string | null): Promise<string | null> => {
  // Use findUnique when schoolId is provided, otherwise use findFirst for null
  const settings = schoolId
    ? await prisma.aISettings.findUnique({
        where: { schoolId },
      })
    : await prisma.aISettings.findFirst({
        where: { schoolId: null },
  });

  return settings?.mlApiUrl || process.env.ML_API_URL || null;
};

/**
 * Get Gemini API Key for a school
 */
export const getGeminiApiKey = async (schoolId: string | null): Promise<string | null> => {
  // Use findUnique when schoolId is provided, otherwise use findFirst for null
  const settings = schoolId
    ? await prisma.aISettings.findUnique({
        where: { schoolId },
      })
    : await prisma.aISettings.findFirst({
        where: { schoolId: null },
  });

  return settings?.geminiApiKey || process.env.GEMINI_API_KEY || null;
};

