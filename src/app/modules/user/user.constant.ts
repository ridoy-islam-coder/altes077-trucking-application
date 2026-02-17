export const USER_ROLE = {
  agencies: 'agencies',
  admin: 'admin',
  influencer: 'influencer',
  
} as const;
export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];






export const UserStatus = ['pending', 'active', 'blocked'];
