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
    <header className="sticky top-0 z-30 h-14 px-4 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-[#DDD1BE] flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-lg font-extrabold tracking-tight text-[#261812] whitespace-nowrap shrink-0">
          Kanto Siomai
        </span>
        <span
          data-testid="connection-status-pill"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border ${
            isConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-[#EFE7D8] text-[#261812] border-[#DDD1BE]'
          }`}
        >
          {isConnected ? (
            <Cloud className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 shrink-0 text-[#665347]" aria-hidden="true" />
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
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] active:bg-[#E5DAC5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] disabled:opacity-50"
        >
          <RefreshCw
            className={`w-5 h-5 ${isSyncing ? 'animate-spin text-[#1D4ED8]' : ''}`}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings and Sync"
          title="Google Sheets Settings & Sync"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] active:bg-[#E5DAC5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
