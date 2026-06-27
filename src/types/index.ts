// ─── Auth Types ───────────────────────────────────────

export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  twoFactorRequired: boolean;
  email?: string;
  user?: AuthUser;
  accessToken?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}

// ─── Profile Types ────────────────────────────────────

export interface Education {
  school: string;
  degree: string;
  field: string;
  from: string;
  to?: string;
  gpa?: string;
}

export interface Experience {
  company: string;
  role: string;
  from: string;
  to?: string;
  current?: boolean;
  desc?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year?: string;
  url?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedIn?: string;
  github?: string;
  skills: string[];
  languages: string[];
  education: Education[];
  experience: Experience[];
  certifications?: Certification[];
  resumeCount: number;
  apiCallCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithProfile extends AuthUser {
  profile?: UserProfile;
  limits?: UserLimit;
  completionPercentage?: number;
}

// ─── Device Types ─────────────────────────────────────

export interface LoginDevice {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastSeenAt: string;
  isTrusted: boolean;
  isCurrentDevice: boolean;
}

// ─── Limits Types ─────────────────────────────────────

export interface UserLimit {
  id: string;
  userId: string;
  resumeLimit: number;
  apiLimit: number;
  resumeUsed: number;
  apiUsed: number;
  resetAt: string;
  overrideByAdmin: boolean;
}

// ─── Template Types ───────────────────────────────────

export type TemplateCategory = 'MODERN' | 'CLASSIC' | 'CREATIVE' | 'ATS';

export interface ResumeTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl: string;
  htmlLayout: string;
  cssStyles: string;
  category: TemplateCategory;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { resumes: number };
}

// ─── Resume Types ─────────────────────────────────────

export type ResumeType = 'RESUME' | 'CV';
export type ResumeStatus = 'DRAFT' | 'GENERATED' | 'EXPORTED';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  website?: string;
  linkedIn?: string;
  github?: string;
}

export interface ResumeContentData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: (Experience & { bullets?: string[] })[];
  education: Education[];
  skills: string[];
  languages: string[];
  certifications?: Certification[];
}

export interface AiSuggestions {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Array<{
    section: string;
    issue: string;
    suggestion: string;
  }>;
}

export interface Resume {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  type: ResumeType;
  status: ResumeStatus;
  targetJobTitle?: string;
  jobDescription?: string;
  atsScore?: number;
  contentData: ResumeContentData;
  aiSuggestions?: AiSuggestions;
  pdfUrl?: string;
  version: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  template?: ResumeTemplate;
}

export interface ResumeHistory {
  id: string;
  resumeId: string;
  version: number;
  snapshot: ResumeContentData;
  changedBy: string;
  createdAt: string;
}

// ─── Admin Types ──────────────────────────────────────

export interface PlatformConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  todayResumes: number;
  totalApiCallsThisMonth: number;
}
