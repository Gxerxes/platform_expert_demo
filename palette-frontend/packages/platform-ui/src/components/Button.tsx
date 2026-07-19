import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: '#1a73e8', color: '#fff', border: 'none' },
  secondary: { backgroundColor: '#fff', color: '#333', border: '1px solid #ccc' },
  danger: { backgroundColor: '#e74c3c', color: '#fff', border: 'none' },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 12 },
  md: { padding: '8px 20px', fontSize: 14 },
  lg: { padding: '12px 28px', fontSize: 16 },
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, style, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        borderRadius: 6,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        opacity: disabled ? 0.6 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...rest}
    >
      {loading && <span>⟳</span>}
      {children}
    </button>
  );
}
