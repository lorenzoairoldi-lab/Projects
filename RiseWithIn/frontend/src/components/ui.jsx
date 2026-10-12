import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const Button = ({ variant = 'primary', className = '', ...props }) => <button
  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${variant === 'primary' ? 'bg-fire text-white hover:bg-red-600' : variant === 'ghost' ? 'bg-transparent text-ink hover:bg-white/5' : 'border border-white/15 bg-white/5 text-ink hover:border-fire'} ${className}`}
  {...props}
/>;

export const Input = ({ label, error, ...props }) => <label className="grid gap-2 text-sm font-semibold">
  <span>{label}</span>
  <input className="min-h-12 rounded-2xl border border-white/12 bg-white/[.04] px-4 font-normal text-white transition placeholder:text-white/30 focus:border-fire/70" {...props} />
  {error && <span className="text-xs text-fire">{error}</span>}
</label>;

export const Card = ({ className = '', ...props }) => <section
  className={`rounded-[24px] border border-white/10 bg-[#111113] p-5 text-white shadow-sm transition duration-300 hover:border-white/20 ${className}`}
  {...props}
/>;

export const Badge = ({ children, tone = 'neutral' }) => <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone === 'coral' ? 'bg-fire/15 text-[#ff6559]' : 'bg-white/8 text-white/70'}`}>{children}</span>;

export const Notice = ({ children, tone = 'error', className = '' }) => <div
  role={tone === 'error' ? 'alert' : 'status'}
  className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${tone === 'error' ? 'border-fire/30 bg-fire/10 text-[#ff8c83]' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'} ${className}`}
>
  {tone === 'error' ? <AlertCircle className="mt-0.5 shrink-0" size={17} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={17} />}
  <span>{children}</span>
</div>;

export const Modal = ({ open, onClose, title, children }) => {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-3 backdrop-blur-sm sm:place-items-center" onMouseDown={onClose}>
    <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-[24px] border border-white/10 bg-[#0d0d0f] p-6 text-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="display text-3xl">{title}</h2>
        <button ref={closeRef} type="button" aria-label="Chiudi" onClick={onClose} className="rounded-full p-2 hover:bg-white/10"><X /></button>
      </div>
      {children}
    </div>
  </div>;
};

export const Empty = ({ title, copy, action }) => <div className="grid min-h-52 place-items-center rounded-[24px] border border-dashed border-white/15 p-8 text-center">
  <div>
    <h3 className="display text-2xl">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-white/55">{copy}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
</div>;
