export type UserRole = "ADMIN" | "PLAYER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;

  username: string;

  fullName: string | null;

  phone: string;

  email: string | null;

  role: UserRole;

  status: UserStatus;

  balance: number;

  isVerified: boolean;

  createdAt: string;
}
