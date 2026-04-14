
import { UserRole, User } from './types';

export const INITIAL_USERS: User[] = [
  { 
    id: 'a1', 
    name: 'Admin Pusat', 
    phone: '0811111111', 
    role: UserRole.ADMIN_CENTRAL,
    isMember: false 
  },
  { 
    id: 'c1', 
    name: 'Budi Santoso', 
    phone: '0899999999', 
    role: UserRole.CUSTOMER, 
    isMember: true,
    memberSince: '2024-01-01T00:00:00Z'
  },
];
