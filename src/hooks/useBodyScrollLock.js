import { useEffect } from 'react';

// Counter to track nested active modals
let activeModalCount = 0;

export function lockBodyScroll() {
  activeModalCount++;
  if (activeModalCount === 1) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }
}

export function unlockBodyScroll() {
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}

/**
 * Custom hook to lock body scrolling when a modal is open
 * @param {boolean} isOpen 
 */
export function useBodyScrollLock(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);
}

export default useBodyScrollLock;
