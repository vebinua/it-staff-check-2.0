export interface PasswordEntry {
  id: string;
  title: string;
  website: string;
  username: string;
  email: string;
  password: string;
  notes: string;
  category: PasswordCategory;
  isFavorite: boolean;
  isCompromised: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  customFields: CustomField[];
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'password' | 'url' | 'email';
  isHidden: boolean;
}

export interface PasswordCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SecureNote {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  crackTime: string;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  length: number;
}

export interface PasswordGeneratorSettings {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
}

export interface VaultStats {
  totalPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  compromisedPasswords: number;
  secureNotes: number;
  lastBackup?: string;
  vaultHealth: number; // 0-100
}

export const DEFAULT_CATEGORIES: PasswordCategory[] = [
  { id: 'work', name: 'Work', icon: 'Briefcase', color: 'bg-blue-500' },
  { id: 'personal', name: 'Personal', icon: 'User', color: 'bg-green-500' },
  { id: 'social', name: 'Social Media', icon: 'Share2', color: 'bg-purple-500' },
  { id: 'finance', name: 'Finance', icon: 'CreditCard', color: 'bg-orange-500' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingCart', color: 'bg-pink-500' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Play', color: 'bg-red-500' },
  { id: 'other', name: 'Other', icon: 'Folder', color: 'bg-gray-500' }
];

export const COMMON_TAGS = [
  'important',
  'shared',
  'temporary',
  'archived',
  'needs-update',
  'two-factor',
  'backup-codes',
  'recovery'
];