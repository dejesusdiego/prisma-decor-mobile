import { User, Session, AuthError } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'org_admin' | 'org_user' | 'supplier' | null

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  role: UserRole
  organizationId: string | null
  supplierId: string | null
  isApprovedSupplier: boolean
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshRole: () => Promise<void>
}
