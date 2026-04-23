import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import {
  authenticateUser as authUser,
  getCurrentUser,
  logoutUser,
  generateVerificationCode,
  verifyCode,
  clearVerificationCode,
} from '@/services/storage';

interface AuthContextType {
  user: User | null;
  loginStep: 'credentials' | 'verification' | 'done';
  pendingEmail: string;
  verificationCode: string;
  login: (email: string, password: string) => boolean;
  verify: (code: string) => boolean;
  resendCode: () => string;
  logout: () => void;
  hasAccess: (roles: UserRole[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loginStep: 'credentials',
  pendingEmail: '',
  verificationCode: '',
  login: () => false,
  verify: () => false,
  resendCode: () => '',
  logout: () => {},
  hasAccess: () => false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [loginStep, setLoginStep] = useState<'credentials' | 'verification' | 'done'>(
    user ? 'done' : 'credentials'
  );
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((email: string, password: string): boolean => {
    setIsLoading(true);
    const authenticated = authUser(email, password);
    setIsLoading(false);

    if (!authenticated) return false;

    // Setter doesn't need verification
    if (authenticated.role === 'setter') {
      setUser(authenticated);
      setLoginStep('done');
      return true;
    }

    // Check if first login requires verification
    if (authenticated.firstLogin) {
      setPendingEmail(email);
      const code = generateVerificationCode(email);
      setVerificationCode(code);
      setLoginStep('verification');
      return true; // credentials correct, now needs verification
    }

    // Not first login, proceed directly
    setUser(authenticated);
    setLoginStep('done');
    return true;
  }, []);

  const verify = useCallback((code: string): boolean => {
    if (!pendingEmail) return false;
    const valid = verifyCode(pendingEmail, code);
    if (valid) {
      // Mark first login as done
      const users = JSON.parse(localStorage.getItem('vantage_users') || '[]');
      const userIdx = users.findIndex((u: User) => u.email.toLowerCase() === pendingEmail.toLowerCase());
      if (userIdx !== -1) {
        users[userIdx].firstLogin = false;
        localStorage.setItem('vantage_users', JSON.stringify(users));
      }
      clearVerificationCode(pendingEmail);

      // Set user as logged in
      const { password: _, ...safeUser } = users[userIdx];
      localStorage.setItem('vantage_current_user', JSON.stringify(safeUser));
      setUser(safeUser as User);
      setLoginStep('done');
      setPendingEmail('');
      setVerificationCode('');
      return true;
    }
    return false;
  }, [pendingEmail]);

  const resendCode = useCallback((): string => {
    if (!pendingEmail) return '';
    const code = generateVerificationCode(pendingEmail);
    setVerificationCode(code);
    return code;
  }, [pendingEmail]);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    setLoginStep('credentials');
    setPendingEmail('');
    setVerificationCode('');
  }, []);

  const hasAccess = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loginStep, pendingEmail, verificationCode, login, verify, resendCode, logout, hasAccess, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
