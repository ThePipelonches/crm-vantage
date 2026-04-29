import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import type { User, UserRole } from '../types';

import {
  authenticateUser,
  getCurrentUser,
  logoutUser,
} from '../services/storage';

//////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasAccess: (roles: UserRole[]) => boolean;
  refreshUser: () => void; // 🔥 NUEVO
}

//////////////////////////////////////////////////
// CONTEXT
//////////////////////////////////////////////////

const AuthContext = createContext<AuthContextType | null>(null);

//////////////////////////////////////////////////
// PROVIDER
//////////////////////////////////////////////////

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  //////////////////////////////////////////////////
  // INIT USER
  //////////////////////////////////////////////////

  useEffect(() => {
    const current = getCurrentUser();
    if (current) setUser(current);
  }, []);

  //////////////////////////////////////////////////
  // LOGIN
  //////////////////////////////////////////////////

  function login(email: string, password: string): boolean {
    const loggedUser = authenticateUser(email, password);

    if (!loggedUser) return false;

    setUser(loggedUser);
    return true;
  }

  //////////////////////////////////////////////////
  // LOGOUT
  //////////////////////////////////////////////////

  function logout() {
    logoutUser();
    setUser(null);
  }

  //////////////////////////////////////////////////
  // ACCESS
  //////////////////////////////////////////////////

  function hasAccess(roles: UserRole[]) {
    if (!user) return false;
    return roles.includes(user.role);
  }

  //////////////////////////////////////////////////
  // 🔥 REFRESH USER (CLAVE)
  //////////////////////////////////////////////////

  function refreshUser() {
    const current = getCurrentUser();
    setUser(current);
  }

  //////////////////////////////////////////////////
  // VALUE
  //////////////////////////////////////////////////

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasAccess,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

//////////////////////////////////////////////////
// HOOK
//////////////////////////////////////////////////

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}