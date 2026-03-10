export type Role = "admin" | "family" | "pending";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: Role;
  disabled: boolean;
  createdAt: number; // Unix ms
}
