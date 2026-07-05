"use client";

import { useCallback, useEffect, useState } from "react";

export type TabId = "calculator" | "history" | "ai";

const VALID_TABS: TabId[] = ["calculator", "history", "ai"];

/**
 * Hook pro správu aktivní záložky s URL synchronizací.
 *
 * URL tvar: ?tab=calculator|history|ai
 *  - Výchozí: "calculator"
 *  - Neplatné hodnoty se tiše normalizují na "calculator"
 *  - Browser tlačítka Zpět/Vpřed fungují (pushState + popstate)
 *  - Pokud je URL sdílená s ?tab=X, otevře se přímo ta záložka
 */
export function useTab(): {
  tab: TabId;
  setTab: (t: TabId) => void;
} {
  const [tab, setTabState] = useState<TabId>("calculator");

  // Inicializace z URL při mountu
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tab");
    if (fromUrl && VALID_TABS.includes(fromUrl as TabId)) {
      setTabState(fromUrl as TabId);
    }
  }, []);

  // Poslouchej popstate (Zpět/Vpřed)
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t && VALID_TABS.includes(t as TabId)) {
        setTabState(t as TabId);
      } else {
        setTabState("calculator");
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const setTab = useCallback((next: TabId) => {
    setTabState(next);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (next === "calculator") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const search = params.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
    // Použijeme replaceState pro calculator (default), pushState pro ostatní,
    // aby Zpět vrátilo uživatele na kalkulačku, ne na stránku před aplikací.
    if (next === "calculator") {
      window.history.replaceState({}, "", newUrl);
    } else {
      window.history.pushState({}, "", newUrl);
    }
  }, []);

  return { tab, setTab };
}