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
} from '../services/sheetsApi';
import type { ConnectionMode } from '../types/pos';

interface SettingsModalProps {
  isOpen: boolean;
  webAppUrl: string;
  connectionMode: ConnectionMode;
  lastSync: string | null;
  isSyncing: boolean;
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-[460px] max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div>
            <h2
              id="settings-modal-title"
              className="text-base font-bold text-slate-900"
            >
              Google Sheets Sync & Settings
            </h2>
            <p className="text-xs text-slate-500">
              Connect your stall spreadsheet or run offline
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div
            className={`rounded-2xl p-3.5 border flex items-center justify-between gap-3 ${
              connectionMode === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {connectionMode === 'connected' ? (
                <Cloud className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : (
                <HardDrive className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
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
                className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-mono-num text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
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
                className="flex-1 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
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
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold whitespace-nowrap"
                >
                  Use Local Mode
                </button>
              )}
            </div>
          </form>

          <details className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <summary className="text-xs font-bold text-slate-800 cursor-pointer select-none">
              Apps Script Endpoint Guide & Code Template
            </summary>
            <div className="mt-3 space-y-2.5 text-xs text-slate-600">
              <p>
                Deploy a Google Apps Script Web App with tabs{' '}
                <strong className="text-slate-800">Inventory</strong>,{' '}
                <strong className="text-slate-800">Orders</strong>, and{' '}
                <strong className="text-slate-800">Expenses</strong>. Access:{' '}
                <em>Anyone</em>.
              </p>
              <button
                type="button"
                onClick={handleCopyScript}
                className="min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold inline-flex items-center gap-1.5 hover:bg-slate-100"
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 pb-safe">
            <span className="text-xs text-slate-500">
              Demo & Local Storage
            </span>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
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
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
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
