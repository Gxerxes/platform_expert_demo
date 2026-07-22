/**
 * @palette/auth — Authentication Event Bus
 *
 * A lightweight event emitter for authentication lifecycle events.
 * Enables cross-component communication for auth state changes
 * without prop drilling or tight coupling.
 *
 * Usage:
 *   import { authEvents } from '@palette/auth';
 *
 *   // Subscribe
 *   const unsubscribe = authEvents.on('auth:login', (event) => {
 *     console.log('User logged in:', event.payload);
 *   });
 *
 *   // Unsubscribe when done
 *   unsubscribe();
 */

import type { AuthEvent, AuthEventType, AuthEventListener } from './types';

/**
 * Internal event listener registry.
 */
class AuthEventBus {
  private listeners: Map<AuthEventType, Set<AuthEventListener>> = new Map();
  private history: AuthEvent[] = [];
  private maxHistorySize = 50;

  /**
   * Subscribe to an auth event.
   * Returns an unsubscribe function for cleanup.
   */
  on(eventType: AuthEventType, listener: AuthEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to an auth event, but only fire once.
   */
  once(eventType: AuthEventType, listener: AuthEventListener): () => void {
    const wrappedListener: AuthEventListener = (event) => {
      listener(event);
      unsubscribe();
    };
    const unsubscribe = this.on(eventType, wrappedListener);
    return unsubscribe;
  }

  /**
   * Emit an auth event to all registered listeners.
   */
  emit(eventType: AuthEventType, payload?: unknown): void {
    const event: AuthEvent = {
      type: eventType,
      timestamp: Date.now(),
      payload,
    };

    // Store in history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[Palette Auth] Error in event listener for "${eventType}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event type, or all events if no type specified.
   */
  off(eventType?: AuthEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the count of active listeners for a specific event type.
   */
  listenerCount(eventType: AuthEventType): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Get recent auth event history.
   */
  getHistory(): ReadonlyArray<AuthEvent> {
    return [...this.history];
  }

  /**
   * Clear event history.
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Singleton auth event bus instance.
 */
export const authEvents = new AuthEventBus();
