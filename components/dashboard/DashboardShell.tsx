"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ViewUserBanner } from "./ViewUserBanner";
import { NetworkBanner } from "@/components/web3/NetworkBanner";
import {
  useDashboardViewUserId,
  useIsDashboardViewMode,
} from "@/lib/lae-club/dashboard-view-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const viewUserId = useDashboardViewUserId();
  const isViewMode = useIsDashboardViewMode();

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#D4AF37]/10 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-[#D4AF37]/15 lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-[264px] min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} />
        <main className="relative min-w-0 overflow-x-hidden px-3 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-6 md:px-6 lg:px-8">
          {/* Gold/silver ambient glow spots + fine grid texture */}
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-grid-lines bg-[size:48px_48px] opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
            <div className="absolute left-1/4 top-0 h-72 w-[500px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.05] blur-[140px]" />
            <div className="absolute right-[10%] top-32 h-56 w-56 rounded-full bg-[#C0C0C0]/[0.03] blur-[120px]" />
            <div className="absolute bottom-20 left-[60%] h-48 w-[400px] rounded-full bg-[#D4AF37]/[0.03] blur-[160px]" />
          </div>
          <div className="mx-auto max-w-7xl animate-fade-in">
            <NetworkBanner />
            {isViewMode && viewUserId != null ? <ViewUserBanner userId={viewUserId} /> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
