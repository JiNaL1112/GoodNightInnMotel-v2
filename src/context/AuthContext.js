// context/AuthContext.js
import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../config/firebase';

export const AuthContext = createContext();

const ADMIN_EMAILS = ['jinalpatel11121999@gmail.com', 'manager@goodnightinn.ca' , 'aartiip07@gmail.com']; // your admin emails

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email);
        const assignedRole = isAdmin ? 'admin' : 'user';
        setRole(assignedRole);
        localStorage.setItem('role', assignedRole); // 💾 Save role
      } else {
        setUser(null);
        setRole('user');
        localStorage.setItem('role', 'user'); // 💾 Default to 'user'
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

 

  const login = async () => {
  const result = await signInWithPopup(auth, provider);
  const isAdmin = ADMIN_EMAILS.includes(result.user.email);
  if (isAdmin) {
    window.location.href = '/admin';
  }
};
  
   const logout = () => {
    signOut(auth);
    localStorage.removeItem('role'); // ❌ Clear role on logout
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
