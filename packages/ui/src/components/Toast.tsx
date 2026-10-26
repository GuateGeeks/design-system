import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast as RadixToast } from 'radix-ui';
import { X } from 'lucide-react';
import { cx } from '../cx.ts';

export type ToastTone = 'neutral' | 'ok' | 'bad';
export interface ToastInput { title: string; description?: string; tone?: ToastTone }
interface ToastItem extends ToastInput { id: number }

const ToastContext = createContext<{ show(toast: ToastInput): void } | null>(null);

const tones: Record<ToastTone, string> = {
  neutral: 'border-line',
  ok: 'border-ok',
  bad: 'border-bad',
};

export function ToastProvider({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((toast: ToastInput) => setToasts((all) => [...all, { ...toast, id: Date.now() + all.length }]), []);
  const remove = (id: number) => setToasts((all) => all.filter((t) => t.id !== id));
  const api = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider swipeDirection="down" label="Notificaciones">
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            data-gg="toast"
            data-tone={t.tone ?? 'neutral'}
            type={t.tone === 'bad' ? 'foreground' : 'background'}
            onOpenChange={(open) => { if (!open) remove(t.id); }}
            className={cx('flex items-start gap-3 rounded-card border-l-4 border bg-surface p-4 text-ink shadow-float', tones[t.tone ?? 'neutral'])}
          >
            <div className="flex flex-1 flex-col gap-1">
              <RadixToast.Title className="text-sm font-medium">{t.title}</RadixToast.Title>
              {t.description && <RadixToast.Description className="text-sm text-ink-muted">{t.description}</RadixToast.Description>}
            </div>
            <RadixToast.Close aria-label="Cerrar" className="rounded-control p-1 text-ink-muted hover:text-ink [&_svg]:size-4"><X aria-hidden /></RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport label="Notificaciones ({hotkey})" className="fixed bottom-0 right-0 z-(--gg-z-toast) flex w-full max-w-sm flex-col gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): { show(toast: ToastInput): void } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
