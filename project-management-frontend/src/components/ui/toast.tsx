import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { X } from "lucide-react"

type Toast = {
  id: number
  title: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = Date.now()
    setToasts((current) => [...current, { ...input, id }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 5000)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
              item.variant === "destructive"
                ? "border-red-400/25 bg-[#29131a]/95 text-red-100"
                : "border-white/10 bg-[#151b2a]/95 text-slate-100"
            }`}
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && <p className="mt-1 text-sm text-slate-400">{item.description}</p>}
              </div>
              <button
                className="rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                onClick={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))}
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}
