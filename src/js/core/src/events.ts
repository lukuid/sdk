// SPDX-License-Identifier: Apache-2.0
import { Unsubscribe } from './types.js';

type Listener<T> = (payload: T) => void;

export class TinyEventEmitter<TEvents extends Record<string, unknown>> {
  private listeners = new Map<keyof TEvents, Set<Listener<unknown>>>();

  on<TEvent extends keyof TEvents>(event: TEvent, handler: Listener<TEvents[TEvent]>): Unsubscribe {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(event, bucket);
    }

    const wrapped: Listener<unknown> = handler as Listener<unknown>;
    bucket.add(wrapped);

    return () => {
      const current = this.listeners.get(event);
      if (!current) {
        return;
      }

      current.delete(wrapped);
      if (current.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<TEvent extends keyof TEvents>(event: TEvent, payload: TEvents[TEvent]): void {
    const bucket = this.listeners.get(event);
    if (!bucket) {
      return;
    }

    for (const listener of bucket) {
      try {
        (listener as Listener<TEvents[TEvent]>)(payload);
      } catch (error) {
        // Intentionally swallowed to keep emitters stable.
        console.error('[lukuid:event-emitter]', error);
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
