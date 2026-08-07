export interface User {
  id: number;

  username: string;

  fullName: string;

  phone: string;

  email?: string;

  role: "ADMIN" | "PLAYER";

  status: "ACTIVE" | "INACTIVE";

  balance: number;

  createdAt: string;
}
