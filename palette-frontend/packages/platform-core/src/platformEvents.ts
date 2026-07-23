/**
 * @palette/core — Platform Event Bus
 *
 * A lightweight, typed event emitter for platform lifecycle events.
 * Enables cross-module communication without tight coupling.
 *
 * Architecture:
 *   - Singleton instance shared across all platform modules
 *   - Type-safe event payloads via PlatformEventType union
 *   - Event history for debugging and diagnostics
 *   - Memory-safe with max listener and history limits
 *
 * Usage:
 *   import { platformEvents } from '@palette/core';
 *
 *   const unsubscribe = platformEvents.on('platform:ready', (event) => {
 *     console.log('Platform ready:', event.payload);
 *   });
 *
 *   // Cleanup
 *   unsubscribe();
 */

import type {
  PlatformEvent,
  PlatformEventType,
  PlatformEventListener,
  PlatformEventBus,
} from './types';

// ─── Constants ────────────────────────────────────────────

const MAX_LISTENERS_PER_EVENT = 50;
const MAX_HISTORY_SIZE = 100;
const MAX_TOTAL_LISTENERS = 200;

// ─── Event Bus Implementation ────────────────────────────

class PlatformEventBusImpl implements PlatformEventBus {
  private listeners: Map<PlatformEventType, Set<PlatformEventListener>> = new Map();
  private history: PlatformEvent[] = [];
  private totalListenerCount = 0;

  /**
   * Subscribe to a platform event.
   * Returns an unsubscribe function for cleanup.
   */
  on(eventType: PlatformEventType, listener: PlatformEventListener): () => void {
    // Check total listener limit
    if (this.totalListenerCount >= MAX_TOTAL_LISTENERS) {
      console.warn(
        `[Palette Core] Maximum total listener limit (${MAX_TOTAL_LISTENERS}) reached. ` +
        `Event "${eventType}" listener not registered. Check for memory leaks.`
      );
      return () => {};
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const eventListeners = this.listeners.get(eventType)!;

    // Check per-event listener limit
    if (eventListeners.size >= MAX_LISTENERS_PER_EVENT) {
      console.warn(
        `[Palette Core] Maximum listener limit (${MAX_LISTENERS_PER_EVENT}) for event "${eventType}". ` +
        `Listener not registered. Check for memory leaks.`
      );
      return () => {};
    }

    eventListeners.add(listener);
    this.totalListenerCount++;

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(eventType);
      if (set && set.delete(listener)) {
        this.totalListenerCount--;
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to a platform event, but only fire once.
   */
  once(eventType: PlatformEventType, listener: PlatformEventListener): () => void {
    const wrappedListener: PlatformEventListener = (event) => {
      listener(event);
      unsubscribe();
    };
    const unsubscribe = this.on(eventType, wrappedListener);
    return unsubscribe;
  }

  /**
   * Emit a platform event to all registered listeners.
   */
  emit(eventType: PlatformEventType, payload?: unknown): void {
    const event: PlatformEvent = {
      type: eventType,
      timestamp: Date.now(),
      payload,
    };

    // Store in history
    this.history.push(event);
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `[Palette Core] Error in event listener for "${eventType}":`,
            error
          );
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event type,
   * or all events if no type specified.
   */
  off(eventType?: PlatformEventType): void {
    if (eventType) {
      const set = this.listeners.get(eventType);
      if (set) {
        this.totalListenerCount -= set.size;
        this.listeners.delete(eventType);
      }
    } else {
      this.listeners.clear();
      this.totalListenerCount = 0;
    }
  }

  /**
   * Get the count of active listeners for a specific event type.
   */
  listenerCount(eventType: PlatformEventType): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Get total listener count across all event types.
   */
  totalListeners(): number {
    return this.totalListenerCount;
  }

  /**
   * Get recent event history.
   */
  getHistory(): ReadonlyArray<PlatformEvent> {
    return [...this.history];
  }

  /**
   * Get event history filtered by type.
   */
  getHistoryByType(eventType: PlatformEventType): ReadonlyArray<PlatformEvent> {
    return this.history.filter((e) => e.type === eventType);
  }

  /**
   * Clear event history.
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get a summary of the event bus state (for diagnostics).
   */
  getSummary(): {
    totalListeners: number;
    eventTypes: number;
    historySize: number;
    listenersByType: Record<string, number>;
  } {
    const listenersByType: Record<string, number> = {};
    this.listeners.forEach((set, type) => {
      listenersByType[type] = set.size;
    });

    return {
      totalListeners: this.totalListenerCount,
      eventTypes: this.listeners.size,
      historySize: this.history.length,
      listenersByType,
    };
  }
}

/**
 * Singleton platform event bus instance.
 */
export const platformEvents = new PlatformEventBusImpl();
