/* Feature 9: Quick Trader Note — auto-save with debounce */

import { svg, debounce } from './utils.js';

export function initNotes(store) {
  const topbarBtn = document.getElementById('note-topbar-btn');
  const iconEl = document.getElementById('note-topbar-icon');
  const dotEl = document.getElementById('note-dot');
  const drawer = document.getElementById('note-drawer');
  const closeBtn = document.getElementById('note-drawer-close');
  const textarea = document.getElementById('note-textarea');
  const saveTimeEl = document.getElementById('note-save-time');
  const clearBtn = document.getElementById('note-clear-btn');

  if (iconEl) iconEl.innerHTML = svg('note');

  function updateDot() {
    const s = store.get();
    if (dotEl) dotEl.hidden = !s.quickNote;
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.hidden = false;
    const s = store.get();
    if (textarea) textarea.value = s.quickNote || '';
    updateSaveTime();
  }

  function closeDrawer() {
    if (drawer) drawer.hidden = true;
  }

  function updateSaveTime() {
    if (!saveTimeEl) return;
    const s = store.get();
    if (s.quickNote) {
      saveTimeEl.textContent = 'ذخیره شد';
    } else {
      saveTimeEl.textContent = '';
    }
  }

  const autoSave = debounce(() => {
    if (!textarea) return;
    const val = textarea.value;
    store.set({ quickNote: val });
    updateDot();
    if (saveTimeEl) {
      const now = new Date();
      saveTimeEl.textContent = 'آخرین ذخیره: ' + now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
    }
  }, 1000);

  if (topbarBtn) topbarBtn.addEventListener('click', () => {
    if (!drawer) return;
    if (drawer.hidden) openDrawer();
    else closeDrawer();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  if (textarea) textarea.addEventListener('input', autoSave);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('یادداشت پاک شود؟')) return;
      if (textarea) textarea.value = '';
      store.set({ quickNote: '' });
      updateDot();
      if (saveTimeEl) saveTimeEl.textContent = '';
    });
  }

  updateDot();
}
