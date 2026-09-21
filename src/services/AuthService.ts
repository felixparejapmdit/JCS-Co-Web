import { BaseHttpService } from './BaseHttpService';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    tenantId: string;
    tenantName: string;
  };
  strikesRemaining?: number;
  isLocked?: boolean;
}

export class AuthService extends BaseHttpService {
  public async login(
    username: string,
    password: string,
    tenantId: string
  ): Promise<LoginResponse> {
    const result = await this.post<LoginResponse>('/api/auth/login', {
      username,
      password,
      tenantId,
    });

    if (result && result.token && typeof window !== 'undefined') {
      localStorage.setItem('aos100_token', result.token);
      localStorage.setItem('aos100_tenant', tenantId);
      localStorage.setItem('aos100_user', JSON.stringify(result.user));
    }

    return result;
  }

  public logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aos100_token');
      localStorage.removeItem('aos100_tenant');
      localStorage.removeItem('aos100_user');
    }
  }

  public getCurrentUser(): { id: string; username: string; fullName: string; role: string; tenantId: string } | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('aos100_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  public isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('aos100_token');
  }
}
