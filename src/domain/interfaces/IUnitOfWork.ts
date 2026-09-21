/**
 * Coordinates atomic transactions across multiple aggregates.
 */
export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Tenant resolution context representing the active corporate entity (8100, 8200, 8300).
 */
export interface ITenantContext {
  readonly tenantId: string;
  readonly companyName: string;
  readonly rdoCode: string;
}
