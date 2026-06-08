"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Wallet as WalletIcon,
  Check,
} from "lucide-react";
import { PageHeading, Panel, Pill } from "@/components/dashboard/ui";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { user, wallet } from "@/lib/dashboard-data";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-brand-500" : "bg-white/10"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [notif, setNotif] = useState({ income: true, team: true, ranks: true, news: false });
  const [twofa, setTwofa] = useState(true);

  return (
    <div>
      <PageHeading
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your profile, security, wallet and notification preferences."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile" desc="Your account details">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-accent-600 text-xl font-bold text-white">
              {user.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="font-display text-lg font-bold text-white">@{user.username}</p>
              <p className="text-xs text-slate-500">{user.id} · joined {user.joined}</p>
            </div>
            <Pill tone="gold" className="ml-auto">{user.rank}</Pill>
          </div>
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Username</span>
              <input defaultValue={user.username} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Email</span>
              <input defaultValue="you@email.com" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500/50" />
            </label>
            <button className="btn-primary mt-1 w-fit"><Check className="h-4 w-4" /> Save changes</button>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Security">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-white">Two-factor authentication</p>
                  <p className="text-xs text-slate-500">Extra layer of account security</p>
                </div>
              </div>
              <Toggle on={twofa} onClick={() => setTwofa((v) => !v)} />
            </div>
            <button className="btn-ghost mt-3 w-full justify-center !py-2.5">Change password</button>
          </Panel>

          <Panel title="Connected wallet">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
              <WalletIcon className="h-5 w-5 text-brand-300" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300">{wallet.btcAddress}</span>
            </div>
            <div className="mt-3">
              <ConnectWallet full />
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="mt-4" title="Notifications">
        <div className="flex flex-col divide-y divide-white/5">
          {([
            ["income", "Income & payouts", "When you earn from slots, recycles or pool"],
            ["team", "Team activity", "New joins and member upgrades"],
            ["ranks", "Rank & rewards", "Rank progress and reward distributions"],
            ["news", "Network news", "Announcements and product updates"],
          ] as const).map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
              <Toggle on={notif[key]} onClick={() => setNotif((n) => ({ ...n, [key]: !n[key] }))} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
