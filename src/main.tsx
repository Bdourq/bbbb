import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { toEnglishNumbers } from './lib/utils';

// Global input interceptor to automatically convert Arabic/Persian digits to English digits
if (typeof window !== 'undefined') {
  const hasArabicDigits = /[٠-٩۰-۹٫،]/;

  const normalizeInputTarget = (target: HTMLInputElement | HTMLTextAreaElement) => {
    if (!target || !target.value || !hasArabicDigits.test(target.value)) return;

    const start = target.selectionStart;
    const end = target.selectionEnd;
    const originalLength = target.value.length;
    const converted = toEnglishNumbers(target.value);

    // Use prototype setter to seamlessly notify React controlled state
    if (target instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(target, converted);
      } else {
        target.value = converted;
      }
    } else if (target instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(target, converted);
      } else {
        target.value = converted;
      }
    } else {
      (target as any).value = converted;
    }

    // Restore caret position
    if (start !== null && end !== null) {
      const diff = target.value.length - originalLength;
      try {
        target.setSelectionRange(start + diff, end + diff);
      } catch (err) {
        // Some input types (like number) might not support setSelectionRange
      }
    }

    target.dispatchEvent(new Event('input', { bubbles: true }));
  };

  document.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      normalizeInputTarget(target);
    }
  }, true);

  document.addEventListener('paste', (e) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      setTimeout(() => normalizeInputTarget(target), 0);
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

