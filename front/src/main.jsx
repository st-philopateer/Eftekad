import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global error catcher to show alerts for debugging runtime errors
window.onerror = function (message, source, lineno, colno, error) {
  const errDesc = `🚨 خطأ في النظام (Runtime Error):\n\n${message}\n\nفي الملف: ${source ? source.split('/').pop() : 'غير معروف'}\nسطر: ${lineno || 0}:${colno || 0}`;
  window.customAlert(errDesc);
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  const errDesc = `🚨 خطأ غير معالج (Promise Rejection):\n\n${event.reason?.message || event.reason || 'خطأ غير معروف'}`;
  window.customAlert(errDesc);
});


// Unregister any old active service worker to prevent cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister().then(() => {
        console.log("Old Service Worker successfully unregistered.");
      });
    }
  });
}

// Global fetch interceptor to encode non-ASCII headers (like Arabic usernames in HTTP headers)
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (options && options.headers && typeof options.headers === 'object') {
    if (options.headers['x-admin-username']) {
      options.headers['x-admin-username'] = encodeURIComponent(options.headers['x-admin-username']);
    }
  }
  return originalFetch.apply(this, arguments);
};

// Global Custom Dialog Overrides (Replaces native browser alert and confirm dialogs)
window.customAlert = (message, onClose) => {
  const existing = document.getElementById('custom-alert-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'custom-alert-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(6, 14, 34, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.2s ease-out;
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--card-bg, #1a0808);
      border: 2px solid #8f1d2c;
      border-radius: 20px;
      padding: 30px;
      width: 90%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    ">
      <div style="font-size: 2.5rem; color: #8f1d2c; margin-bottom: 15px;">✝</div>
      <p style="color: var(--color-text, #ffffff); font-size: 1.05rem; line-height: 1.6; margin-bottom: 25px; font-family: Cairo, sans-serif; text-align: center; direction: rtl;">${message}</p>
      <button id="custom-alert-close-btn" class="btn px-5 py-2 fw-bold" style="background-color: #8f1d2c; color: #ffffff; border-radius: 25px; font-family: Cairo, sans-serif; font-size: 0.95rem; border: none; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">موافق ✝</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('custom-alert-close-btn');
  if (closeBtn) {
    closeBtn.focus();
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      if (onClose) onClose();
    });
  }
};

window.customConfirm = (message, onConfirm, onCancel) => {
  const existing = document.getElementById('custom-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'custom-confirm-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(6, 14, 34, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.2s ease-out;
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--card-bg, #1a0808);
      border: 2px solid #8f1d2c;
      border-radius: 20px;
      padding: 30px;
      width: 90%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    ">
      <div style="font-size: 2.5rem; color: #8f1d2c; margin-bottom: 15px;">✝</div>
      <p style="color: var(--color-text, #ffffff); font-size: 1.05rem; line-height: 1.6; margin-bottom: 25px; font-family: Cairo, sans-serif; text-align: center; direction: rtl;">${message}</p>
      <div style="display: flex; gap: 15px; justify-content: center; direction: rtl;">
        <button id="custom-confirm-yes-btn" class="btn px-4 py-2 fw-bold" style="background-color: #8f1d2c; color: #ffffff; border-radius: 25px; font-family: Cairo, sans-serif; font-size: 0.95rem; flex: 1; border: none;">نعم</button>
        <button id="custom-confirm-no-btn" class="btn btn-outline-secondary px-4 py-2 fw-bold" style="border-radius: 25px; font-family: Cairo, sans-serif; font-size: 0.95rem; flex: 1; border: 1px solid var(--border-color); color: var(--color-text);">إلغاء</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const yesBtn = document.getElementById('custom-confirm-yes-btn');
  const noBtn = document.getElementById('custom-confirm-no-btn');

  if (yesBtn) yesBtn.focus();

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', () => {
      overlay.remove();
      if (onCancel) onCancel();
    });
  }
};

// Re-route standard window.alert to our custom alert modal
window.alert = (message) => {
  window.customAlert(message);
};

window.customPrompt = (message, defaultValue, onSubmit, onCancel) => {
  const existing = document.getElementById('custom-prompt-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'custom-prompt-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(6, 14, 34, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fadeIn 0.2s ease-out;
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--bg-card-solid, #101c3d);
      border: 2px solid var(--border-color, #c9a84c);
      border-radius: 16px;
      padding: 30px;
      width: 90%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    ">
      <div style="font-size: 2.5rem; color: #c9a84c; margin-bottom: 15px;">✝</div>
      <p style="color: var(--color-text, #f7f2e8); font-size: 1.05rem; line-height: 1.6; margin-bottom: 20px; font-family: Cairo, sans-serif; text-align: center; direction: rtl;">${message}</p>
      <input type="text" id="custom-prompt-input" class="form-control mb-4" value="${defaultValue || ''}" style="text-align: center; font-family: Cairo, sans-serif; direction: rtl; background-color: var(--bg-input); border-color: var(--border-color); color: var(--color-text);" />
      <div style="display: flex; gap: 15px; justify-content: center; direction: rtl;">
        <button id="custom-prompt-yes-btn" class="btn btn-warning px-4 py-2 fw-bold" style="border-radius: 12px; font-family: Cairo, sans-serif; font-size: 0.9rem; flex: 1;">تعديل</button>
        <button id="custom-prompt-no-btn" class="btn btn-outline-secondary px-4 py-2 fw-bold" style="border-radius: 12px; font-family: Cairo, sans-serif; font-size: 0.9rem; flex: 1; border: 1px solid var(--border-color); color: var(--color-text);">إلغاء</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = document.getElementById('custom-prompt-input');
  const yesBtn = document.getElementById('custom-prompt-yes-btn');
  const noBtn = document.getElementById('custom-prompt-no-btn');

  if (input) {
    input.focus();
    input.select();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        overlay.remove();
        if (onSubmit) onSubmit(input.value);
      } else if (e.key === 'Escape') {
        overlay.remove();
        if (onCancel) onCancel();
      }
    });
  }

  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      overlay.remove();
      if (onSubmit) onSubmit(input.value);
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', () => {
      overlay.remove();
      if (onCancel) onCancel();
    });
  }
};

window.prompt = (message, defaultValue) => {
  console.warn("Native window.prompt is disabled. Use window.customPrompt instead.");
  return null;
};


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
