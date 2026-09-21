import { BaseEntity } from './BaseEntity';
import { DomainEvent } from './DomainEvent';

/**
 * Abstract AggregateRoot class managing domain events and boundary invariants.
 */
export abstract class AggregateRoot<TId = string> extends BaseEntity<TId> {
  private _domainEvents: DomainEvent[] = [];

  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
