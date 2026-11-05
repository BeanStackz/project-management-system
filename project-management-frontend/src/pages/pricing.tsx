import { useEffect, useState } from "react"
import { Check, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cancelSubscription, createPaymentLink, getPricing, type PricingPlan, type Subscription } from "@/lib/api"

export function PricingPage({ token, subscription, onSubscriptionChange, onSignIn }: { token: string | null; subscription: Subscription | null; onSubscriptionChange: (subscription: Subscription | null) => void; onSignIn: () => void }) {
  const { toast } = useToast()
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [busyPlan, setBusyPlan] = useState<PricingPlan["planType"] | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    getPricing()
      .then((nextPlans) => {
        if (!active) return
        setPlans(nextPlans)
      })
      .catch((err: Error) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const choosePlan = async (plan: PricingPlan) => {
    if (!token) {
      onSignIn()
      return
    }

    if (plan.planType === "FREE" || plan.planType === subscription?.planType) return

    setBusyPlan(plan.planType)
    try {
      const payment = await createPaymentLink(token, plan.planType)
      window.location.assign(payment.paymentLinkUrl)
    } catch (err) {
      toast({ title: "Plan could not be updated", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" })
    } finally {
      setBusyPlan(null)
    }

  }

  const cancelCurrentPlan = async () => {
    if (!token || !subscription || subscription.planType === "FREE" || subscription.cancelAtPeriodEnd) return
    setCancelling(true)
    try {
      const nextSubscription = await cancelSubscription(token)
      onSubscriptionChange(nextSubscription)
      toast({ title: "Cancellation scheduled", description: `Your ${subscription.planType.toLowerCase()} plan remains active until ${new Date(subscription.subscriptionEndDate).toLocaleDateString()}.` })
    } catch (err) {
      toast({ title: "Subscription could not be cancelled", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <main className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.2),transparent_38%)]" />
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-violet-300">Simple, transparent pricing</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Choose the pace that fits your team.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">Start free, then upgrade when your projects and team need more room to move.</p>
          {subscription && <p className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${subscription.cancelAtPeriodEnd ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}><CheckCircle2 className="size-3.5" /> {subscription.cancelAtPeriodEnd ? `Cancels on ${new Date(subscription.subscriptionEndDate).toLocaleDateString()}` : `Current plan: ${subscription.planType}`}</p>}
        </div>

        {loading ? (
          <p className="mx-auto mt-16 max-w-2xl text-center text-sm text-slate-500">Loading plans...</p>
        ) : error ? (
          <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-center text-sm text-red-200">{error}</div>
        ) : (
          <div className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = Boolean(subscription && plan.planType === subscription.planType)
              const planRank = plan.planType === "FREE" ? 0 : plan.planType === "MONTHLY" ? 1 : 2
              const currentRank = subscription?.planType === "FREE" ? 0 : subscription?.planType === "MONTHLY" ? 1 : subscription ? 2 : -1
              const canUpgrade = token ? !isCurrent && planRank > currentRank : true
              const isAnnual = plan.planType === "ANNUALLY"
              return (
                <article key={plan.planType} className={`relative flex flex-col rounded-2xl border p-6 ${plan.planType === "MONTHLY" ? "border-violet-400/50 bg-violet-400/[0.08] shadow-2xl shadow-violet-950/30" : "border-white/[0.1] bg-white/[0.025]"}`}>
                  {plan.planType === "MONTHLY" && <span className="absolute -top-3 left-6 rounded-full bg-violet-500 px-3 py-1 text-[11px] font-semibold text-white">Most popular</span>}
                  <p className="text-sm font-medium text-slate-300">{plan.name}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold text-white">{plan.monthlyPrice === 0 ? "Free" : `₹${(isAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString("en-IN")}`}</span>
                    {plan.monthlyPrice > 0 && <span className="text-sm text-slate-500">{isAnnual ? "/ year" : "/ month"}</span>}
                  </div>
                  {isAnnual && <p className="mt-2 text-xs text-emerald-300">Save {plan.annualDiscountPercent}% with annual billing</p>}
                  <ul className="mt-7 flex-1 space-y-3 border-t border-white/[0.08] pt-6">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />{feature}</li>)}
                  </ul>
                  <Button disabled={busyPlan !== null || cancelling || (isCurrent && (plan.planType === "FREE" || subscription?.cancelAtPeriodEnd)) || (Boolean(token) && !isCurrent && !canUpgrade)} onClick={() => isCurrent && plan.planType !== "FREE" ? cancelCurrentPlan() : choosePlan(plan)} className={`mt-8 w-full ${isCurrent ? "bg-white/10 text-slate-400" : "bg-violet-500 text-white hover:bg-violet-400"}`}>
                    {isCurrent ? (subscription?.cancelAtPeriodEnd ? "Cancellation scheduled" : cancelling ? "Cancelling..." : "Applied") : !token ? "Sign in to choose" : canUpgrade ? (busyPlan === plan.planType ? "Opening payment..." : "Upgrade plan") : "Applied"}
                  </Button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
