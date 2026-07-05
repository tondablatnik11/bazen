import { Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <ServiceWorkerRegistrar />
      {/* HEADER */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-pool-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pool-500 to-pool-700 flex items-center justify-center text-white shadow-md shadow-pool-500/30 flex-shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg gradient-text leading-tight truncate">
                Chytrý Bazénář
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight truncate">
                Péče o bazénovou vodu s přesným dávkováním
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-pool-100 text-pool-800 dark:bg-pool-900/50 dark:text-pool-200 border border-pool-200 dark:border-pool-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-2 text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text leading-tight">
          Čistá voda bez chemických chyb
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto sm:mx-0 leading-relaxed">
          Zadejte objem, pH a chlór. Okamžitě dostanete přesné dávky
          přípravků a postup krok za krokem.
        </p>
      </section>

      {/* HLAVNÍ APLIKACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AppShell />
      </main>

      {/* PATIČKA */}
      <footer className="hidden sm:block border-t border-pool-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300">
            Chytrý Bazénář
          </p>
          <p className="mt-1 leading-relaxed">
            Doporučené dávky jsou orientační a vycházejí z běžných
            koncentrací bazénové chemie. Vždy dodržujte pokyny výrobce
            přípravku na obalu.
          </p>
          <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">
            Funguje offline po první návštěvě · Přidat na plochu pro plný
            zážitek z aplikace.
          </p>
        </div>
      </footer>
    </div>
  );
}