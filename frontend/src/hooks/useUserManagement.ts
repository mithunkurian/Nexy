"use client";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AllowedUser, UserProfile, Role } from "@/types/auth";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function useUserManagement(enabled: boolean) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);

  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setAllowedUsers([]);
      return;
    }
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => d.data() as UserProfile));
    });
    const unsubAllowed = onSnapshot(collection(db, "allowedUsers"), (snap) => {
      setAllowedUsers(snap.docs.map((d) => d.data() as AllowedUser));
    });
    return () => {
      unsubUsers();
      unsubAllowed();
    };
  }, [enabled]);

  function addAllowedUser(email: string, role: Exclude<Role, "pending">, invitedBy?: string) {
    const normalizedEmail = normalizeEmail(email);
    return setDoc(doc(db, "allowedUsers", normalizedEmail), {
      email: normalizedEmail,
      role,
      invitedAt: Date.now(),
      invitedBy: invitedBy ?? null,
    });
  }

  function removeAllowedUser(email: string) {
    return deleteDoc(doc(db, "allowedUsers", normalizeEmail(email)));
  }

  function updateRole(uid: string, role: Role) {
    return updateDoc(doc(db, "users", uid), { role });
  }

  function toggleDisabled(uid: string, disabled: boolean) {
    return updateDoc(doc(db, "users", uid), { disabled });
  }

  function deleteUser(uid: string) {
    return deleteDoc(doc(db, "users", uid));
  }

  return {
    users,
    allowedUsers,
    addAllowedUser,
    removeAllowedUser,
    updateRole,
    toggleDisabled,
    deleteUser,
  };
}
