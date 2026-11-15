import { Cloud, HardDrive, RefreshCw, Settings } from 'lucide-react';
import type { ConnectionMode } from '../types/pos';

interface HeaderProps {
  connectionMode: ConnectionMode;
  isSyncing: boolean;
  hasWebAppUrl: boolean;
  onManualSync: () => void;
  onOpenSettings: () => void;
}

export function Header({
  connectionMode,
  isSyncing,
  hasWebAppUrl,
  onManualSync,
  onOpenSettings,
}: HeaderProps) {
  const isConnected = connectionMode === 'connected';

  return (
    <header className="sticky top-0 z-30 h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Kanto Siomai
        </span>
        <span
          data-testid="connection-status-pill"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {isConnected ? (
            <Cloud className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{isConnected ? 'Connected to Sheets' : 'Local Mode'}</span>
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onManualSync}
          disabled={isSyncing}
          aria-label={hasWebAppUrl ? 'Sync with Google Sheets' : 'Sync data'}
          title={hasWebAppUrl ? 'Sync with Google Sheets' : 'Configure Google Sheets sync'}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-5 h-5 ${isSyncing ? 'animate-spin text-orange-600' : ''}`}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings and Sync"
          title="Google Sheets Settings & Sync"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
