import { useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ResolvedMenuItem, MenuIcon } from '@palette/router';

// ─── Sidebar Props ───────────────────────────────────────

interface SidebarProps {
  /** Dynamic menu items (from useMenuRoutes hook) */
  items?: ResolvedMenuItem[];
  /** Fallback children when no items provided */
  children?: ReactNode;
}

/**
 * Enterprise application sidebar.
 * Renders dynamic menu items from route configuration,
 * with support for collapsible groups, badges, and active state.
 */
export function Sidebar({ items, children }: SidebarProps) {
  if (!items || items.length === 0) {
    return (
      <nav
        style={{
          width: 240,
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
          overflow: 'auto',
          padding: '16px 0',
        }}
      >
        {children ?? (
          <div style={{ padding: '16px 24px', color: '#999', fontSize: 13 }}>
            No navigation configured
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav
      style={{
        width: 240,
        backgroundColor: '#fff',
        borderRight: '1px solid #e0e0e0',
        overflow: 'auto',
        padding: '8px 0',
      }}
    >
      {items.map((item) => (
        <MenuItemComponent key={item.key} item={item} depth={0} />
      ))}
    </nav>
  );
}

// ─── Menu Item Component ─────────────────────────────────

function MenuItemComponent({ item, depth }: { item: ResolvedMenuItem; depth: number }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(item.defaultCollapsed);

  // External link
  if (item.externalUrl) {
    return (
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={menuItemStyle(depth, false)}
      >
        <MenuIconRender icon={item.icon} />
        <span style={{ flex: 1 }}>{item.title}</span>
        {item.badge && <Badge text={item.badge} color={item.badgeColor} />}
        <span style={{ fontSize: 10, color: '#999' }}>↗</span>
      </a>
    );
  }

  // Collapsible group
  if (item.hasChildren && item.collapsible) {
    return (
      <div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            ...menuItemStyle(depth, false),
            width: '100%',
            textAlign: 'left',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <MenuIconRender icon={item.icon} />
          <span style={{ flex: 1 }}>{item.title}</span>
          {item.badge && <Badge text={item.badge} color={item.badgeColor} />}
          <span
            style={{
              fontSize: 10,
              color: '#999',
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            ▼
          </span>
        </button>
        {!collapsed && (
          <div>
            {item.children.map((child) => (
              <MenuItemComponent key={child.key} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular menu item
  const handleClick = () => {
    navigate(item.path);
  };

  return (
    <div>
      <button onClick={handleClick} style={menuItemStyle(depth, item.active ?? false)}>
        <MenuIconRender icon={item.icon} />
        <span style={{ flex: 1 }}>{item.title}</span>
        {item.badge && <Badge text={item.badge} color={item.badgeColor} />}
      </button>
      {item.hasChildren && !collapsed && (
        <div>
          {item.children.map((child) => (
            <MenuItemComponent key={child.key} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Icon Renderer ───────────────────────────────────────

function MenuIconRender({ icon }: { icon?: MenuIcon }) {
  if (!icon) return null;

  if (icon.emoji) {
    return <span style={{ marginRight: 8, fontSize: 16 }}>{icon.emoji}</span>;
  }

  if (icon.className) {
    return <i className={icon.className} style={{ marginRight: 8, fontSize: 16 }} />;
  }

  return null;
}

// ─── Badge Component ─────────────────────────────────────

function Badge({ text, color }: { text: string; color?: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 10,
        backgroundColor: color ?? '#1a73e8',
        color: '#fff',
        marginRight: 6,
      }}
    >
      {text}
    </span>
  );
}

// ─── Styles ──────────────────────────────────────────────

function menuItemStyle(depth: number, active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    paddingLeft: 16 + depth * 16,
    fontSize: 14,
    color: active ? '#1a73e8' : '#333',
    backgroundColor: active ? '#e8f0fe' : 'transparent',
    fontWeight: active ? 600 : 400,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  };
}
