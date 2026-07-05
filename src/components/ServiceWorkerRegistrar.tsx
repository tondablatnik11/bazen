"use client";

import { useEffect } from "react";

/**
 * Klientská komponenta, která po mountu zaregistruje service worker.
 * Service worker poskytuje offline cache pro statické assety (manifest, ikony, JS).
 *
 * POZOR: dynamické API routes (/api/ai) nikdy necachujeme – vždy vyžadují síť.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (e) {
        console.warn("Service worker registrace selhala:", e);
      }
    };
    // Odložíme registraci, aby neblokovala initial paint
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}