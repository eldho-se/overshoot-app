import React, { useState, useEffect, useMemo, useRef } from 'react';

type Props = {
  years?: number[];
  value?: number;
  onChange?: (year: number) => void;
  className?: string;
  label?: string;
};

const YearSelector: React.FC<Props> = ({
  years,
  value,
  onChange,
  className = '',
  label,
}) => {
  const defaultYears = useMemo(() => {
    const start = 1990;
    const end = 2024;
    const arr: number[] = [];
    for (let y = end; y >= start; y--) arr.push(y);
    return arr;
  }, []);

  const list = years && years.length ? years : defaultYears;
  const isControlled = typeof value === 'number';
  const [internal, setInternal] = useState<number>(value ?? 2024);

  useEffect(() => {
    if (isControlled) return;
    onChange?.(internal);
  }, []);

  const current = isControlled ? (value as number) : internal;

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = list.findIndex((y) => y === current);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  return (
    <div className={`w-full max-w-[8rem] ${className}`} ref={dropdownRef}>
      <label className="block text-slate-300 mb-2 font-medium tracking-wide">{label ?? ''}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          className={`w-full flex items-center justify-between bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-4 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition hover:border-blue-400 hover:bg-slate-800 ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{current}</span>
          <span className="pointer-events-none absolute top-1/2 right-3 transform -translate-y-1/2 text-slate-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        {open && (
          <ul
            tabIndex={-1}
            role="listbox"
            className="absolute z-20 mt-1 w-full max-h-64 overflow-auto  bg-slate-800 border border-slate-700 shadow-lg animate-fade-in"
            style={{ top: '100%' }}
          >
            {list.map((y, i) => (
              <li
                key={y}
                role="option"
                aria-selected={y === current}
                className={`px-4 py-2 text-base cursor-pointer select-none transition-colors ${y === current ? 'bg-blue-600 text-white' : 'text-slate-100 hover:bg-blue-500 hover:text-white'} ${i === selectedIndex ? 'font-semibold' : ''}`}
                onClick={() => {
                  if (!isControlled) setInternal(y);
                  onChange?.(y);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                {y}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default YearSelector;
