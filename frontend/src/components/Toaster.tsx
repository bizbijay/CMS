import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
const DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURATION);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const STYLES: Record<ToastType, string> = {
  error: "bg-red-600 text-white",
  success: "bg-green-600 text-white",
  info: "bg-slate-800 text-white",
};

const ICONS: Record<ToastType, React.ReactNode> = {
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transition = `width ${DURATION}ms linear`;
    requestAnimationFrame(() => { bar.style.width = "0%"; });
  }, []);

  return (
    <div className={`relative flex items-start gap-2.5 rounded-lg shadow-lg px-4 py-3 text-sm overflow-hidden ${STYLES[toast.type]}`}>
      {ICONS[toast.type]}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
      <div ref={barRef} className="absolute bottom-0 left-0 h-0.5 bg-white/40 w-full" />
    </div>
  );
}
