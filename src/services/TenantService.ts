import { BaseHttpService } from './BaseHttpService';

export interface TenantEntity {
  id: string;
  code: string;
  name: string;
  tin: string;
  rdo: string;
  address: string;
}

export class TenantService extends BaseHttpService {
  public static readonly DEFAULT_TENANTS: TenantEntity[] = [
    {
      id: '8100',
      code: '8100',
      name: 'JCS Chemical Industries, Inc.',
      tin: '000-123-456-000',
      rdo: '043',
      address: 'Valenzuela City, Metro Manila',
    },
    {
      id: '8200',
      code: '8200',
      name: 'APF Corporation',
      tin: '000-456-789-000',
      rdo: '043',
      address: 'Quezon City, Metro Manila',
    },
    {
      id: '8300',
      code: '8300',
      name: 'Chemag Trading Corporation',
      tin: '000-789-101-000',
      rdo: '043',
      address: 'Mandaluyong City, Metro Manila',
    },
  ];

  public async getTenants(): Promise<TenantEntity[]> {
    try {
      return await this.get<TenantEntity[]>('/api/auth/tenants');
    } catch {
      return TenantService.DEFAULT_TENANTS;
    }
  }
}
