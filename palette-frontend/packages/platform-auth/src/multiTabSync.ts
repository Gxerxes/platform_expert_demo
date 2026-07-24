/**
 * @palette/auth — Multi-Tab Synchronization
 *
 * Synchronizes authentication state across browser tabs/windows
 * using BroadcastChannel API.
 *
 * Features:
 * - Login/logout broadcast across tabs
 * - Session refresh coordination
 * - Idle state synchronization
 * - Fallback to localStorage for older browsers
 * - Configurable channel name
 * - Automatic cleanup
 *
 * Usage:
 *   // In AuthProvider (automatic)
 *   const sync = createMultiTabSync({
 *     onLogin: (user) => refreshSession(),
 *     onLogout: () => clearSession(),
 *     onSessionExpired: () => redirectToLogin(),
 *   });
 *
 *   // Manual usage
 *   import { authSync } from '@palette/auth';
 *   authSync.broadcastLogin(user);
 *   authSync.broadcastLogout();
 */

// ─── Types ────────────────────────────────────────────────

/**
 * Message types for cross-tab communication.
 */
export type SyncMessageType =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:session-expired'
  | 'auth:session-refresh'
  | 'auth:idle-detected'
  | 'auth:activity-resumed';

/**
 * Message payload for cross-tab sync.
 */
export interface SyncMessage {
  type: SyncMessageType;
  timestamp: number;
  tabId: string;
  payload?: unknown;
}

/**
 * Configuration for multi-tab sync.
 */
export interface MultiTabSyncConfig {
  /** Channel name (default: 'palette-auth-sync') */
  channelName?: string;
  /** Callback when login is detected in another tab */
  onLogin?: (payload: { user?: unknown; expiresAt?: string }) => void;
  /** Callback when logout is detected in another tab */
  onLogout?: () => void;
  /** Callback when session expires in another tab */
  onSessionExpired?: () => void;
  /** Callback when session refresh is needed */
  onSessionRefresh?: () => void;
  /** Callback when idle is detected in another tab */
  onIdleDetected?: () => void;
  /** Callback when activity resumes in another tab */
  onActivityResumed?: () => void;
  /** Whether to use localStorage fallback (default: true) */
  useLocalStorageFallback?: boolean;
}

/**
 * Multi-tab sync controller interface.
 */
export interface MultiTabSync {
  /** Broadcast login event to other tabs */
  broadcastLogin: (payload?: { user?: unknown; expiresAt?: string }) => void;
  /** Broadcast logout event to other tabs */
  broadcastLogout: () => void;
  /** Broadcast session expired event */
  broadcastSessionExpired: () => void;
  /** Broadcast session refresh needed */
  broadcastSessionRefresh: () => void;
  /** Broadcast idle detected */
  broadcastIdle: () => void;
  /** Broadcast activity resumed */
  broadcastActivityResumed: () => void;
  /** Stop listening and cleanup */
  destroy: () => void;
  /** Check if BroadcastChannel is supported */
  isSupported: boolean;
}

// ─── Tab ID Generator ─────────────────────────────────────

function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── BroadcastChannel Implementation ──────────────────────

class BroadcastChannelSync implements MultiTabSync {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private config: Required<MultiTabSyncConfig>;

  constructor(config: MultiTabSyncConfig) {
    this.tabId = generateTabId();
    this.config = {
      channelName: config.channelName ?? 'palette-auth-sync',
      onLogin: config.onLogin ?? (() => {}),
      onLogout: config.onLogout ?? (() => {}),
      onSessionExpired: config.onSessionExpired ?? (() => {}),
      onSessionRefresh: config.onSessionRefresh ?? (() => {}),
      onIdleDetected: config.onIdleDetected ?? (() => {}),
      onActivityResumed: config.onActivityResumed ?? (() => {}),
      useLocalStorageFallback: config.useLocalStorageFallback ?? true,
    };

    try {
      this.channel = new BroadcastChannel(this.config.channelName);
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.handleMessage(event.data);
      };
    } catch {
      // BroadcastChannel not supported, will use localStorage fallback
      if (this.config.useLocalStorageFallback) {
        this.setupLocalStorageFallback();
      }
    }
  }

  get isSupported(): boolean {
    return this.channel !== null || this.config.useLocalStorageFallback;
  }

  private send(message: SyncMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    } else if (this.config.useLocalStorageFallback) {
      localStorage.setItem(this.config.channelName, JSON.stringify(message));
      // Clean up immediately to avoid storage bloat
      setTimeout(() => localStorage.removeItem(this.config.channelName), 100);
    }
  }

  private handleMessage(message: SyncMessage): void {
    // Ignore messages from same tab
    if (message.tabId === this.tabId) return;

    switch (message.type) {
      case 'auth:login':
        this.config.onLogin(message.payload as { user?: unknown; expiresAt?: string });
        break;
      case 'auth:logout':
        this.config.onLogout();
        break;
      case 'auth:session-expired':
        this.config.onSessionExpired();
        break;
      case 'auth:session-refresh':
        this.config.onSessionRefresh();
        break;
      case 'auth:idle-detected':
        this.config.onIdleDetected();
        break;
      case 'auth:activity-resumed':
        this.config.onActivityResumed();
        break;
    }
  }

  private createMessage(type: SyncMessageType, payload?: unknown): SyncMessage {
    return {
      type,
      timestamp: Date.now(),
      tabId: this.tabId,
      payload,
    };
  }

  // ─── Public Methods ───────────────────────────────────

  broadcastLogin(payload?: { user?: unknown; expiresAt?: string }): void {
    this.send(this.createMessage('auth:login', payload));
  }

  broadcastLogout(): void {
    this.send(this.createMessage('auth:logout'));
  }

  broadcastSessionExpired(): void {
    this.send(this.createMessage('auth:session-expired'));
  }

  broadcastSessionRefresh(): void {
    this.send(this.createMessage('auth:session-refresh'));
  }

  broadcastIdle(): void {
    this.send(this.createMessage('auth:idle-detected'));
  }

  broadcastActivityResumed(): void {
    this.send(this.createMessage('auth:activity-resumed'));
  }

  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.config.useLocalStorageFallback) {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
  }

  // ─── localStorage Fallback ────────────────────────────

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== this.config.channelName) return;
    if (!event.newValue) return;

    try {
      const message = JSON.parse(event.newValue) as SyncMessage;
      this.handleMessage(message);
    } catch {
      // Invalid message, ignore
    }
  };

  private setupLocalStorageFallback(): void {
    window.addEventListener('storage', this.handleStorageEvent);
  }
}

// ─── Factory Function ─────────────────────────────────────

/**
 * Create a multi-tab sync controller.
 *
 * @example
 *   const sync = createMultiTabSync({
 *     onLogin: () => refreshSession(),
 *     onLogout: () => clearSessionAndRedirect(),
 *     onSessionExpired: () => showExpiredDialog(),
 *   });
 *
 *   // Later, broadcast events
 *   sync.broadcastLogin({ user, expiresAt });
 */
export function createMultiTabSync(config: MultiTabSyncConfig = {}): MultiTabSync {
  return new BroadcastChannelSync(config);
}

/**
 * Default singleton instance for platform use.
 */
export let authSync: MultiTabSync | null = null;

/**
 * Initialize the default auth sync instance.
 * Called by AuthProvider during setup.
 */
export function initAuthSync(config: MultiTabSyncConfig): MultiTabSync {
  if (authSync) {
    authSync.destroy();
  }
  authSync = createMultiTabSync(config);
  return authSync;
}

/**
 * Destroy the default auth sync instance.
 * Called by AuthProvider on unmount.
 */
export function destroyAuthSync(): void {
  if (authSync) {
    authSync.destroy();
    authSync = null;
  }
}
