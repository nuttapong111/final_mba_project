// TypeScript Types

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export type CourseStatus = 'draft' | 'published' | 'archived';

export type ExamType = 'quiz' | 'midterm' | 'final';

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export type CourseType = 'video' | 'live';

export type LivePlatform = 'zoom' | 'google_meet';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

