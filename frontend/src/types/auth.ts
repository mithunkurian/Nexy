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

export interface AllowedUser {
  email: string;
  role: Exclude<Role, "pending">;
  invitedAt: number;
  invitedBy?: string;
  claimedByUid?: string;
}
