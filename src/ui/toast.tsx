"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

const ToastContext = createContext<(msg: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    clearTimeout(timer.current);
    setMsg(m);
    timer.current = setTimeout(() => setMsg(""), 2600);
  }, []);
  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-24 left-1/2 z-[95] flex -translate-x-1/2 shell:bottom-8"
      >
        {msg && (
          <span className="whitespace-nowrap bg-ink px-4 py-[11px] text-[13px] text-paper">
            {msg}
          </span>
        )}
      </div>
    </ToastContext>
  );
}
