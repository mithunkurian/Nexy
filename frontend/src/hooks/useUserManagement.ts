"use client";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, Role } from "@/types/auth";

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => d.data() as UserProfile));
    });
    return unsub;
  }, []);

  function updateRole(uid: string, role: Role) {
    return updateDoc(doc(db, "users", uid), { role });
  }

  function toggleDisabled(uid: string, disabled: boolean) {
    return updateDoc(doc(db, "users", uid), { disabled });
  }

  function deleteUser(uid: string) {
    return deleteDoc(doc(db, "users", uid));
  }

  return { users, updateRole, toggleDisabled, deleteUser };
}
