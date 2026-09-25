import { createContext } from 'react';

import type { AccountInfo } from '@azure/msal-browser';

import type { GraphUser } from '../microsoftGraph/dto/user.ts';
import type { UserFacingError } from './errors.ts';

export type AuthStatus = 'initializing' | 'unauthenticated' | 'authenticated' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  account: AccountInfo | null;
  currentUser: GraphUser | null;
  error: UserFacingError | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
