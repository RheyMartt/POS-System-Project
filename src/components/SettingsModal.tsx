import { useEffect, useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  HardDrive,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  APPS_SCRIPT_TEMPLATE,
  isValidAppsScriptUrl,
  type SyncDiagnosticInfo,
} from '../services/sheetsApi';
import type { ConnectionMode } from '../types/pos';

interface SettingsModalProps {
  isOpen: boolean;
  webAppUrl: string;
  connectionMode: ConnectionMode;
  lastSync: string | null;
  isSyncing: boolean;
  syncDiagnostic?: SyncDiagnosticInfo | null;
  onClose: () => void;
  onSaveAndSync: (url: string) => Promise<void>;
  onDisconnect: () => void;
  onResetDemoData: () => void;
}

export function SettingsModal({
  isOpen,
  webAppUrl,
  connectionMode,
  lastSync,
  isSyncing,
  syncDiagnostic,
  onClose,
  onSaveAndSync,
  onDisconnect,
  onResetDemoData,
}: SettingsModalProps) {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [error, setError] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(webAppUrl);
      setError(null);
      setCopiedScript(false);
      setConfirmReset(false);
    }
  }, [isOpen, webAppUrl]);

  if (!isOpen) return null;

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onDisconnect();
      onClose();
      return;
    }
    if (!isValidAppsScriptUrl(trimmed)) {
      setError('Enter a valid https:// Google Apps Script Web App URL.');
      return;
    }
    setError(null);
    await onSaveAndSync(trimmed);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      setError('Unable to copy automatically. Select and copy manually.');
    }
  };

  const formattedSync = lastSync
    ? new Date(lastSync).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not synced yet';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#261812]/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-[460px] max-h-[90vh] bg-[#FFFDF8] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#DDD1BE] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDD1BE] flex items-center justify-between gap-2 shrink-0">
          <div>
            <h2
              id="settings-modal-title"
              className="text-base font-bold text-[#261812]"
            >
              Google Sheets Sync & Settings
            </h2>
            <p className="text-xs text-[#665347]">
              Connect your stall spreadsheet or run offline
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#665347] hover:text-[#261812] hover:bg-[#EFE7D8] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div
            className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 ${
              connectionMode === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-[#F7F2E8] border-[#DDD1BE] text-[#261812]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {connectionMode === 'connected' ? (
                <Cloud className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : (
                <HardDrive className="w-5 h-5 text-[#665347] shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {connectionMode === 'connected'
                    ? 'Connected to Google Sheets'
                    : 'Local Mode (Offline Storage)'}
                </p>
                <p className="text-xs opacity-80 truncate">
                  Last sync: {formattedSync}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="apps-script-url"
                className="block text-xs font-semibold text-[#261812] mb-1.5"
              >
                Google Apps Script Web App URL
              </label>
              <input
                id="apps-script-url"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError(null);
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full h-11 px-3 rounded-xl border border-[#CFC1AA] bg-[#FFFDF8] text-xs font-mono-num text-[#261812] placeholder:text-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
              />
              <p className="text-[11px] text-[#665347] mt-1">
                Saved in localStorage. Leave blank to stay in Local Mode.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2"
              >
                {error}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSyncing}
                className="flex-1 min-h-[44px] rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isSyncing ? 'Syncing...' : 'Save & Sync Now'}</span>
              </button>

              {webAppUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    onDisconnect();
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl border border-[#DDD1BE] text-[#261812] hover:bg-[#F7F2E8] text-xs font-semibold whitespace-nowrap"
                >
                  Use Local Mode
                </button>
              )}
            </div>
          </form>

          <details className="rounded-2xl border border-[#DDD1BE] bg-[#FFFDF8] p-3.5 space-y-2">
            <summary className="text-xs font-bold text-[#261812] cursor-pointer select-none flex items-center justify-between">
              <span>Debug / Last Sync Response</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  syncDiagnostic?.isError
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : syncDiagnostic
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {syncDiagnostic ? (syncDiagnostic.isError ? 'Error' : 'OK') : 'No Sync Yet'}
              </span>
            </summary>

            <div className="mt-3 space-y-2.5 text-xs">
              <div>
                <p className="text-[11px] font-semibold text-[#665347] mb-1">Status / Result:</p>
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold border font-mono-num ${
                    syncDiagnostic?.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : syncDiagnostic
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-[#F7F2E8] border-[#DDD1BE] text-[#665347]'
                  }`}
                >
                  {syncDiagnostic?.statusText ?? 'No sync executed in this session yet.'}
                </div>
              </div>

              {syncDiagnostic?.rawFirstInventoryItem && (
                <div>
                  <p className="text-[11px] font-semibold text-[#665347] mb-1">
                    First Raw Inventory Row (from Sheets):
                  </p>
                  <pre className="p-2.5 rounded-xl bg-[#2C1B14] text-emerald-400 text-[11px] overflow-x-auto max-h-40 leading-relaxed font-mono select-all">
                    {syncDiagnostic.rawFirstInventoryItem}
                  </pre>
                </div>
              )}

              {syncDiagnostic?.timestamp && (
                <p className="text-[10px] text-[#8C7A6B]">
                  Logged at: {new Date(syncDiagnostic.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </details>

          <details className="rounded-2xl border border-[#DDD1BE] bg-[#F7F2E8]/80 p-3.5">
            <summary className="text-xs font-bold text-[#261812] cursor-pointer select-none">
              Apps Script Endpoint Guide & Code Template
            </summary>
            <div className="mt-3 space-y-2.5 text-xs text-[#665347]">
              <p>
                Deploy a Google Apps Script Web App with tabs{' '}
                <strong className="text-[#261812]">Menu</strong>,{' '}
                <strong className="text-[#261812]">Inventory</strong>,{' '}
                <strong className="text-[#261812]">Orders</strong>, and{' '}
                <strong className="text-[#261812]">Expenses</strong>. Access:{' '}
                <em>Anyone</em>.
              </p>
              <button
                type="button"
                onClick={handleCopyScript}
                className="min-h-[40px] px-3 rounded-xl bg-[#FFFDF8] border border-[#DDD1BE] text-[#261812] font-semibold inline-flex items-center gap-1.5 hover:bg-[#EFE7D8]"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied Apps Script</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Apps Script Template</span>
                  </>
                )}
              </button>
            </div>
          </details>

          <div className="pt-2 border-t border-[#EAE0CE] flex items-center justify-between gap-2 pb-safe">
            <span className="text-xs text-[#665347]">
              Demo & Local Storage
            </span>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[40px] px-3 rounded-xl border border-[#DDD1BE] text-xs font-semibold text-[#665347]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetDemoData();
                    setConfirmReset(false);
                  }}
                  className="min-h-[40px] px-3 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Confirm Reset
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[40px] px-3 rounded-xl border border-[#DDD1BE] hover:bg-[#F7F2E8] text-[#261812] text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Demo Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
