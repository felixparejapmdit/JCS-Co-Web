/**
 * Abstract OOP BaseHttpService handling token injection, tenant header propagation,
 * and unified error parsing across all HTTP API calls.
 */
export abstract class BaseHttpService {
  protected readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  protected async get<T>(endpoint: string, tenantId?: string): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, tenantId);
  }

  protected async post<T, B = unknown>(endpoint: string, body?: B, tenantId?: string): Promise<T> {
    return this.request<T>('POST', endpoint, body, tenantId);
  }

  protected async put<T, B = unknown>(endpoint: string, body?: B, tenantId?: string): Promise<T> {
    return this.request<T>('PUT', endpoint, body, tenantId);
  }

  protected async delete<T>(endpoint: string, tenantId?: string): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, tenantId);
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    tenantId?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Client-side token retrieval
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('aos100_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const activeTenant = tenantId || localStorage.getItem('aos100_tenant') || '8100';
      headers['X-Tenant-Id'] = activeTenant;
    } else if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data as T;
  }
}
