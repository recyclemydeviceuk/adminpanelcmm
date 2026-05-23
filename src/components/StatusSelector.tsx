import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, Loader2 } from 'lucide-react';
import type { UtilityItem } from '../types';

interface StatusSelectorProps {
  value: string;
  statuses: UtilityItem[];
  fallbackColor?: string;
  onSelect: (newValue: string) => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Strip stray Python-enum prefixes (e.g. `OrderStatus.RECEIVED`) that may
 * have leaked into older order rows, AND normalize a handful of legacy
 * display names to the canonical workflow values our admin panel keys off.
 * Defensive — used everywhere we show or compare a status string so a single
 * bad row in MongoDB never leaks a `OrderStatus.XYZ` into the UI again.
 */
export function cleanStatusValue(raw: string | undefined | null): string {
  if (!raw) return '';
  let s = String(raw).trim();
  const enumPrefixes = [
    'OrderStatus.', 'PaymentStatus.', 'PostageMethod.',
    'PaymentMethod.', 'OrderSource.', 'DeviceGrade.',
    'CounterOfferStatus.',
  ];
  for (const p of enumPrefixes) {
    if (s.startsWith(p)) { s = s.slice(p.length); break; }
  }
  const legacy: Record<string, string> = {
    pending: 'RECEIVED',
    new: 'RECEIVED',
    collected: 'DEVICE_RECEIVED',
    confirmed: 'INSPECTION_PASSED',
    'under review': 'INSPECTION_PASSED',
    under_review: 'INSPECTION_PASSED',
    completed: 'PAID',
    complete: 'PAID',
    counter_offered: 'PRICE_REVISED',
    'counter offered': 'PRICE_REVISED',
  };
  const upper = s.toUpperCase();
  const known = new Set([
    'RECEIVED', 'PACK_SENT', 'DEVICE_RECEIVED', 'INSPECTION_PASSED',
    'INSPECTION_FAILED', 'PRICE_REVISED', 'PAYOUT_READY', 'PAID',
    'CLOSED', 'CANCELLED', 'PENDING',
  ]);
  if (known.has(upper)) return upper;
  return legacy[s.toLowerCase()] || s;
}

/**
 * Look up the friendly display label for a status value. Falls back to a
 * title-cased version of the raw value so we never render `OrderStatus.XYZ`
 * or `PACK_SENT` to the admin user.
 */
export function statusLabel(value: string, statuses: UtilityItem[]): string {
  const clean = cleanStatusValue(value);
  const match = statuses.find(s => (s.value || s.name) === clean);
  if (match?.name) return match.name;
  if (!clean) return '—';
  // Title-case fallback: PACK_SENT -> Pack Sent
  return clean
    .toLowerCase()
    .split(/[\s_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function statusColor(value: string, statuses: UtilityItem[], fallback = 'bg-gray-100 text-gray-700'): string {
  const clean = cleanStatusValue(value);
  const match = statuses.find(s => (s.value || s.name) === clean);
  return match?.color || fallback;
}

export default function StatusSelector({
  value,
  statuses,
  fallbackColor = 'bg-gray-100 text-gray-700',
  onSelect,
  disabled,
  size = 'md',
}: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [updating, setUpdating] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const cleanValue = cleanStatusValue(value);
  const activeStatuses = useMemo(
    () => statuses
      .filter(s => s.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [statuses],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return activeStatuses;
    const q = query.trim().toLowerCase();
    return activeStatuses.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.value || '').toLowerCase().includes(q)
    );
  }, [activeStatuses, query]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    // Focus search on open
    setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = async (statusValue: string) => {
    if (statusValue === cleanValue) { setOpen(false); return; }
    try {
      setUpdating(true);
      await onSelect(statusValue);
      setOpen(false);
      setQuery('');
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdating(false);
    }
  };

  const triggerColor = statusColor(cleanValue, statuses, fallbackColor);
  const triggerLabel = statusLabel(cleanValue, statuses);

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1 text-xs gap-1.5'
    : 'px-3 py-1.5 text-sm gap-2';

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || updating}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap transition-all ${sizeClasses} ${triggerColor} ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:ring-2 hover:ring-current/30 cursor-pointer'
        }`}
      >
        {updating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        )}
        <span>{triggerLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 z-50 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search status..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-sm text-gray-500 text-center">No statuses match "{query}"</p>
            ) : (
              filtered.map(s => {
                const val = s.value || s.name;
                const isActive = val === cleanValue;
                return (
                  <button
                    key={s.id || val}
                    type="button"
                    onClick={() => handleSelect(val)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors text-left ${
                      isActive ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.color || 'bg-gray-100 text-gray-700'}`}>
                        {(s.name || val).slice(0, 1).toUpperCase()}
                      </span>
                      <span className={`font-medium ${isActive ? 'text-red-700' : 'text-gray-900'}`}>
                        {s.name}
                      </span>
                    </span>
                    {isActive && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
