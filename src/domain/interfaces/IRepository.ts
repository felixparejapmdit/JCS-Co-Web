import { AggregateRoot } from '../common/AggregateRoot';

/**
 * Generic repository abstraction decoupling business aggregates from data persistence.
 */
export interface IRepository<T extends AggregateRoot<TId>, TId = string> {
  getById(id: TId, tenantId: string): Promise<T | null>;
  list(tenantId: string, filter?: Record<string, unknown>): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: TId, tenantId: string): Promise<void>;
}
