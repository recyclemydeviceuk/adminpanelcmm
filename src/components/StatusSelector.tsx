import { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, Loader2 } from 'lucide-react';
import type { UtilityItem } from '../types';

interface StatusSelectorProps {
  value: string;
  statuses: UtilityItem[];
  fallbackColor?: string;
  onSelect: (newValue: string) => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
  align?: 'start' | 'end';
}

/**
 * Strip stray Python-enum prefixes (e.g. `OrderStatus.RECEIVED`) that may
 * have leaked into older order rows, AND normalize a handful of legacy
 * display names to the canonical workflow values our admin panel keys off.
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

export function statusLabel(value: string, statuses: UtilityItem[]): string {
  const clean = cleanStatusValue(value);
  const match = statuses.find(s => (s.value || s.name) === clean);
  if (match?.name) return match.name;
  if (!clean) return '—';
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

const PANEL_WIDTH = 288;        // matches w-72
const PANEL_MAX_HEIGHT = 384;   // matches max-h-96
const VIEWPORT_MARGIN = 12;

export default function StatusSelector({
  value,
  statuses,
  fallbackColor = 'bg-gray-100 text-gray-700',
  onSelect,
  disabled,
  size = 'md',
  align = 'start',
}: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [updating, setUpdating] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
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

  /** Re-compute fixed-position coords so the panel never clips the viewport. */
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const width = Math.min(PANEL_WIDTH, viewportW - 2 * VIEWPORT_MARGIN);

    // Horizontal: try to align with the trigger's `align` edge, but clamp
    // so the panel always stays inside the viewport.
    let left = align === 'end' ? rect.right - width : rect.left;
    if (left + width > viewportW - VIEWPORT_MARGIN) {
      left = viewportW - width - VIEWPORT_MARGIN;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    // Vertical: open below by default; if there's not enough room below,
    // open above the trigger.
    const spaceBelow = viewportH - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const desired = Math.min(PANEL_MAX_HEIGHT, viewportH - 2 * VIEWPORT_MARGIN);
    let top: number;
    let maxHeight: number;
    if (spaceBelow >= desired || spaceBelow >= spaceAbove) {
      top = rect.bottom + 8;
      maxHeight = Math.min(desired, spaceBelow);
    } else {
      maxHeight = Math.min(desired, spaceAbove);
      top = rect.top - maxHeight - 8;
    }

    setPanelStyle({
      position: 'fixed',
      top,
      left,
      width,
      maxHeight,
      visibility: 'visible',
    });
  }, [align]);

  // Initial position + recompute on resize / scroll
  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle({ visibility: 'hidden' });
      return;
    }
    reposition();
    const onResize = () => reposition();
    const onScroll = () => reposition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, reposition]);

  // Outside click / Escape to close + focus search on open
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
    const t = window.setTimeout(() => searchRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
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

  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
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
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
        )}
        <span className="truncate max-w-[10rem]">{triggerLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && portalTarget && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="z-[100] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          role="listbox"
        >
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
          <div className="overflow-y-auto py-1 flex-1 min-h-0">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-sm text-gray-500 text-center">
                No statuses match "{query}"
              </p>
            ) : (
              filtered.map(s => {
                const val = s.value || s.name;
                const isActive = val === cleanValue;
                return (
                  <button
                    key={s.id || val}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(val)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors text-left gap-2 ${
                      isActive ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${s.color || 'bg-gray-100 text-gray-700'}`}>
                        {(s.name || val).slice(0, 1).toUpperCase()}
                      </span>
                      <span className={`font-medium truncate ${isActive ? 'text-red-700' : 'text-gray-900'}`}>
                        {s.name}
                      </span>
                    </span>
                    {isActive && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        portalTarget,
      )}
    </>
  );
}
