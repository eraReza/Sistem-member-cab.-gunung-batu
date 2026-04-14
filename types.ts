
export enum UserRole {
  ADMIN_CENTRAL = 'ADMIN_CENTRAL',
  CUSTOMER = 'CUSTOMER'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isMember: boolean;
  memberSince?: string;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  claimLimit: number; // Limit per user
  totalQuota?: number; // Total available across all users
  isActive: boolean;
  isFlashSale: boolean;
  endTime?: string;
  createdAt: string;
}

export interface PromoClaim {
  id: string;
  promoId: string;
  userId: string;
  claimedAt: string;
  status: 'claimed' | 'used';
  usedAt?: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author?: string;
  createdAt: string;
  isPublished: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  orderIndex: number;
}
