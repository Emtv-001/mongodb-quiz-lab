import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ProgressiveButtonVariant = 'emerald' | 'amber' | 'purple' | 'blue' | 'slate' | 'red';

export interface ProgressiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  borderVariant?: ProgressiveButtonVariant;
  spinnerPosition?: 'left' | 'right' | 'replace' | 'none';
  preventMultipleClicks?: boolean;
  clickLockMs?: number;
  showBorderAnimation?: boolean;
  showBottomProgress?: boolean;
  onAsyncClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<any> | void;
}

export const ProgressiveButton: React.FC<ProgressiveButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  borderVariant = 'emerald',
  spinnerPosition = 'left',
  preventMultipleClicks = true,
  clickLockMs = 600,
  showBorderAnimation = true,
  showBottomProgress = true,
  onAsyncClick,
  onClick,
  disabled,
  className = '',
  type = 'button',
  ...rest
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLockedRef = useRef(false);

  const effectiveLoading = isLoading || internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || effectiveLoading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (preventMultipleClicks && isLockedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (preventMultipleClicks) {
      isLockedRef.current = true;
    }

    try {
      if (onAsyncClick) {
        setInternalLoading(true);
        await onAsyncClick(e);
      } else if (onClick) {
        const result = (onClick as any)(e);
        if (result && typeof result.then === 'function') {
          setInternalLoading(true);
          await result;
        }
      }
    } finally {
      setInternalLoading(false);
      if (preventMultipleClicks) {
        setTimeout(() => {
          isLockedRef.current = false;
        }, clickLockMs);
      }
    }
  };

  const variantGlowMap: Record<ProgressiveButtonVariant, { border: string; glow: string; text: string }> = {
    emerald: {
      border: 'border-emerald-400',
      glow: 'rgba(52, 211, 153, 0.8)',
      text: 'text-emerald-400'
    },
    amber: {
      border: 'border-amber-400',
      glow: 'rgba(251, 191, 36, 0.8)',
      text: 'text-amber-400'
    },
    purple: {
      border: 'border-purple-400',
      glow: 'rgba(192, 132, 252, 0.8)',
      text: 'text-purple-400'
    },
    blue: {
      border: 'border-blue-400',
      glow: 'rgba(96, 165, 250, 0.8)',
      text: 'text-blue-400'
    },
    slate: {
      border: 'border-slate-400',
      glow: 'rgba(148, 163, 184, 0.7)',
      text: 'text-slate-300'
    },
    red: {
      border: 'border-red-400',
      glow: 'rgba(248, 113, 113, 0.8)',
      text: 'text-red-400'
    }
  };

  const currentTheme = variantGlowMap[borderVariant] || variantGlowMap.emerald;

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || effectiveLoading}
      onClick={handleClick}
      aria-busy={effectiveLoading ? 'true' : undefined}
      className={`relative overflow-hidden transition-all duration-200 select-none ${
        effectiveLoading
          ? `cursor-wait opacity-95 pointer-events-none shadow-lg ${currentTheme.border}`
          : ''
      } ${className}`}
      style={{
        ...(effectiveLoading && showBorderAnimation
          ? {
              boxShadow: `0 0 16px ${currentTheme.glow}, inset 0 0 8px ${currentTheme.glow}`
            }
          : {}),
        ...rest.style
      }}
    >
      {/* Load animations within button border */}
      {effectiveLoading && showBorderAnimation && (
        <>
          {/* Top border beam */}
          <span className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none overflow-hidden z-20">
            <span
              className="block w-full h-full animate-pb-shimmer"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${currentTheme.glow} 50%, transparent 100%)`
              }}
            />
          </span>

          {/* Bottom border beam */}
          <span className="absolute bottom-0 left-0 right-0 h-[2px] pointer-events-none overflow-hidden z-20">
            <span
              className="block w-full h-full animate-pb-shimmer"
              style={{
                animationDelay: '0.75s',
                background: `linear-gradient(90deg, transparent 0%, ${currentTheme.glow} 50%, transparent 100%)`
              }}
            />
          </span>

          {/* Left border beam */}
          <span className="absolute top-0 bottom-0 left-0 w-[2px] pointer-events-none overflow-hidden z-20">
            <span
              className="block w-full h-full animate-pulse"
              style={{
                background: `linear-gradient(180deg, transparent 0%, ${currentTheme.glow} 50%, transparent 100%)`
              }}
            />
          </span>

          {/* Right border beam */}
          <span className="absolute top-0 bottom-0 right-0 w-[2px] pointer-events-none overflow-hidden z-20">
            <span
              className="block w-full h-full animate-pulse"
              style={{
                animationDelay: '0.5s',
                background: `linear-gradient(180deg, transparent 0%, ${currentTheme.glow} 50%, transparent 100%)`
              }}
            />
          </span>

          {/* Inner perimeter rotating laser aura */}
          <span
            className="absolute inset-[-200%] animate-pb-spin pointer-events-none opacity-40 z-0"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${currentTheme.glow} 340deg, #ffffff 360deg)`
            }}
          />

          {/* Bottom progress track within border */}
          {showBottomProgress && (
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black/40 overflow-hidden pointer-events-none z-30">
              <span
                className="block h-full animate-pb-shimmer w-full"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${currentTheme.glow} 50%, transparent 100%)`
                }}
              />
            </span>
          )}
        </>
      )}

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center space-x-2 w-full">
        {effectiveLoading ? (
          <>
            {spinnerPosition === 'left' && (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
            )}
            <span>{loadingText || children}</span>
            {spinnerPosition === 'right' && (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
            )}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
};
