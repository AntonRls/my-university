import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type CSSProperties,
} from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import { KEYBOARD_KEYS } from '@shared/constants/keyboard';
import { ArrowLeftIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';

import styles from './BottomSheet.module.scss';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const ANIMATION_DURATION_MS = 280;
const CLOSE_THRESHOLD_PX = 120;
const BOTTOM_SHEET_PORTAL_ROOT_ATTRIBUTE = 'data-mu-bottom-sheet-root';

export type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title?: string;
  description?: string;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
  container?: HTMLElement | null;
};

export function BottomSheet({
  isOpen,
  onClose,
  onBack,
  title,
  description,
  backLabel = 'Назад',
  children,
  footer,
  className,
  contentClassName,
  footerClassName,
  container,
}: BottomSheetProps) {
  const [isPortalReady, setIsPortalReady] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  const headingId = useId();
  const descriptionId = description ? `${headingId}-description` : undefined;

  const dragStartYRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }

    const hostContainer = document.body;
    const sharedRoot = hostContainer.querySelector<HTMLDivElement>(
      `[${BOTTOM_SHEET_PORTAL_ROOT_ATTRIBUTE}]`,
    );
    const portalRoot = sharedRoot ?? document.createElement('div');

    if (!sharedRoot) {
      portalRoot.setAttribute(BOTTOM_SHEET_PORTAL_ROOT_ATTRIBUTE, 'true');
      portalRoot.classList.add(styles.portalHost);
      hostContainer.appendChild(portalRoot);
    } else if (!portalRoot.classList.contains(styles.portalHost)) {
      portalRoot.classList.add(styles.portalHost);
    }

    const element = document.createElement('div');
    element.className = styles.portalRoot;
    portalRoot.appendChild(element);

    /* eslint-disable react-hooks/set-state-in-effect */
    setPortalElement(element);
    setIsPortalReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    return () => {
      portalRoot.removeChild(element);

      if (!portalRoot.hasChildNodes()) {
        portalRoot.classList.remove(styles.portalHost);
      }

      setPortalElement(null);
      setIsPortalReady(false);
    };
  }, [container]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRendered(true);
      return undefined;
    }

    if (typeof window === 'undefined') {
      setIsRendered(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRendered(false);
    }, ANIMATION_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsAnimating(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }

    const { body, documentElement } = document;
    const { innerWidth, scrollY } = window;
    const scrollbarWidth = innerWidth - documentElement.clientWidth;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousBodyTouchAction = body.style.touchAction;
    const previousDocumentPaddingRight = documentElement.style.paddingRight;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
      documentElement.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      body.style.paddingRight = previousBodyPaddingRight;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.paddingRight = previousDocumentPaddingRight;

      if (scrollY > 0) {
        window.requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_KEYS.ESCAPE) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const frameId = window.requestAnimationFrame(() => {
      sheetRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      previouslyFocusedElement?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      dragOffsetRef.current = 0;
      /* eslint-disable react-hooks/set-state-in-effect */
      setDragOffset(0);
      setIsDragging(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen]);

  const updateDragOffset = useCallback((value: number) => {
    const clampedValue = Math.max(value, 0);
    dragOffsetRef.current = clampedValue;
    setDragOffset(clampedValue);
  }, []);

  const handleBackClick = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    onClose();
  }, [onBack, onClose]);

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isOpen) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      dragStartYRef.current = event.clientY;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [isOpen]
  );

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    const startY = dragStartYRef.current;

    if (startY === null) {
      return;
    }

    const delta = event.clientY - startY;

    if (delta <= 0) {
      updateDragOffset(0);
      return;
    }

    updateDragOffset(delta);
  }, [isDragging, updateDragOffset]);

  const endDragging = useCallback(() => {
    dragStartYRef.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
    updateDragOffset(0);
  }, [updateDragOffset]);

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerId !== activePointerIdRef.current) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const shouldClose = dragOffsetRef.current > CLOSE_THRESHOLD_PX;

      endDragging();

      if (shouldClose) {
        onClose();
      }
    },
    [endDragging, onClose]
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerId !== activePointerIdRef.current) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      endDragging();
    },
    [endDragging]
  );

  const shouldRender = isRendered || isOpen;

  const sheetTransform = useMemo<CSSProperties['transform']>(() => {
    if (!isAnimating) {
      return 'translateY(100%)';
    }
    return dragOffset > 0 ? `translateY(${dragOffset}px)` : 'translateY(0)';
  }, [dragOffset, isAnimating]);

  if (!isPortalReady || !portalElement || !shouldRender) {
    return null;
  }

  return createPortal(
    <div
      className={cn(styles.portalRootContent, isOpen && styles.portalRootActive)}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(styles.overlay, isOpen && styles.overlayVisible)}
        onClick={handleOverlayClick}
        role="presentation"
      />
      <div
        ref={sheetRef}
        className={cn(
          styles.sheet,
          isOpen && styles.sheetOpen,
          isDragging && styles.sheetDragging,
          className
        )}
        style={{ transform: sheetTransform }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headingId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          className={styles.handle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerCancel}
          role="presentation"
        >
          <span className={styles.handleBar} />
        </div>

        <header className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackClick}
            aria-label={backLabel}
          >
            <ArrowLeftIcon className={styles.backIcon} />
            <span className={styles.backLabel}>{backLabel}</span>
          </button>

          {title ? (
            <div className={styles.heading}>
              <span id={headingId} className={styles.title}>
                {title}
              </span>
              {description ? (
                <span id={descriptionId} className={styles.description}>
                  {description}
                </span>
              ) : null}
            </div>
          ) : null}
        </header>

        <div className={cn(styles.content, contentClassName)}>{children}</div>

        {footer ? <div className={cn(styles.footer, footerClassName)}>{footer}</div> : null}
      </div>
    </div>,
    portalElement,
  );
}

