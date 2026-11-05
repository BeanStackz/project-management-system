import { useEffect, useState } from "react"
import { CheckCircle2, Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { verifyPayment, type PricingPlan, type Subscription } from "@/lib/api"

export function PaymentResultPage({ token, onVerified, onHome, onPricing }: { token: string | null; onVerified: (subscription: Subscription) => void; onHome: () => void; onPricing: () => void }) {
  const [state, setState] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Confirming your payment...")

  useEffect(() => {
    let redirectTimer: number | undefined
    const redirect = (success: boolean) => {
      redirectTimer = window.setTimeout(() => {
        if (success) onHome()
        else onPricing()
      }, 1200)
    }
    const params = new URLSearchParams(window.location.search)
    const planType = params.get("planType") as PricingPlan["planType"] | null
    const paymentLinkId = params.get("razorpay_payment_link_id")
    const status = params.get("razorpay_payment_link_status")

    if (!token) {
      setState("failed")
      setMessage("Please sign in again to verify this payment.")
      redirect(false)
      return () => window.clearTimeout(redirectTimer)
    }
    if (status !== "paid" || !paymentLinkId || !planType || !["MONTHLY", "ANNUALLY"].includes(planType)) {
      setState("failed")
      setMessage("The payment was cancelled or could not be completed. Your plan was not changed.")
      redirect(false)
      return () => window.clearTimeout(redirectTimer)
    }

    verifyPayment(token, paymentLinkId, planType)
      .then((nextSubscription) => {
        onVerified(nextSubscription)
        setState("success")
        setMessage("Payment confirmed. Your plan is now active.")
        redirect(true)
      })
      .catch((error: Error) => {
        setState("failed")
        setMessage(error.message)
        redirect(false)
      })
    return () => {
      if (redirectTimer !== undefined) window.clearTimeout(redirectTimer)
    }
  }, [onHome, onPricing, onVerified, token])

  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col items-center justify-center px-5 text-center">
      <div className={`flex size-16 items-center justify-center rounded-2xl ${state === "success" ? "bg-emerald-400/15 text-emerald-300" : state === "failed" ? "bg-red-400/15 text-red-300" : "bg-violet-400/15 text-violet-300"}`}>
        {state === "success" ? <CheckCircle2 className="size-8" /> : <Clock3 className="size-8" />}
      </div>
      <h1 className="mt-6 text-3xl font-semibold text-white">{state === "success" ? "Plan upgraded" : state === "failed" ? "Payment unsuccessful" : "Confirming payment"}</h1>
      <p className="mt-3 text-slate-400">{message}</p>
      <Button className="mt-7 bg-violet-500 hover:bg-violet-400" onClick={onPricing}>Back to pricing</Button>
    </main>
  )
}

