import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// ─── Service Worker Cleanup (dev only) ──────────────────────────────────────
// Unregister any old/stale service workers left from previous manual registration.
// In production, vite-plugin-pwa auto-registers the correct Workbox SW.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      // In development, unregister all SWs so they never interfere
      if (import.meta.env.DEV) {
        reg.unregister();
        console.log('[SW] Unregistered stale service worker in dev mode:', reg.scope);
      }
    }
  });
}
// vite-plugin-pwa auto-injects production SW registration — no manual code needed here.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="240748277924-20e7omtf99j2qmh2tpe889rdf62gdtd3.apps.googleusercontent.com">
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
