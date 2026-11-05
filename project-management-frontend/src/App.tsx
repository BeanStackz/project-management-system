import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FolderKanban,
  LogOut,
  MessageCircle,
  Mail,
  Menu,
  Plus,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/context/auth-context"
import {
  createProject,
  assignIssue,
  createComment,
  createIssue,
  createMessage,
  getComments,
  getIssues,
  getMessages,
  getProject,
  getProjectChat,
  getProjects,
  deleteProject,
  acceptInvitation,
  inviteUser,
  type Comment,
  type CreateIssueInput,
  type Issue,
  type Message,
  type Project,
  type User,
  getPricing,
  getSubscription,
  createPaymentLink,
  cancelSubscription,
  verifyPayment,
  type PricingPlan,
  type Subscription,
} from "@/lib/api"

type Page = "home" | "projects" | "pricing" | "payment-result" | "details" | "accept-invitation"
type AuthMode = "login" | "register"

const categories = ["all", "full stack", "frontend", "backend", "mobile", "design"]
const availableTags = ["react", "nextjs", "spring boot", "angular", "mysql", "mongodb"]

function App() {
  const { token, user, status, signIn, signUp, signOut } = useAuth()
  const [page, setPage] = useState<Page>(() => getRoute().page)
  const [projectId, setProjectId] = useState<number | null>(() => getRoute().projectId)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  useEffect(() => {
    const onHashChange = () => {
      const route = getRoute()
      setPage(route.page)
      setProjectId(route.projectId)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    const closeAccountMenu = () => setAccountMenuOpen(false)
    if (!accountMenuOpen) return
    document.addEventListener("click", closeAccountMenu)
    return () => document.removeEventListener("click", closeAccountMenu)
  }, [accountMenuOpen])

  const navigate = (nextPage: Page) => {
    window.location.hash = nextPage === "projects" || nextPage === "pricing" ? nextPage : ""
    setPage(nextPage)
  }

  const handleAuth = async (email: string, password: string, fullName: string) => {
    if (authMode === "login") await signIn(email, password)
    else await signUp(fullName, email, password)
    setAuthOpen(false)
    if (getRoute().page !== "accept-invitation") navigate("projects")
  }

  return (
    <div className="min-h-svh bg-[#070a12] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#070a12]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => navigate("home")}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/25">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Orbit<span className="text-violet-300">.</span></span>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            <NavButton active={page === "home"} onClick={() => navigate("home")}>Overview</NavButton>
            <NavButton active={page === "projects"} onClick={() => navigate("projects")}>Projects</NavButton>
            <NavButton active={page === "pricing"} onClick={() => navigate("pricing")}>Pricing</NavButton>
            <NavButton onClick={() => setAuthOpen(true)}>New project</NavButton>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-400 sm:inline">{user.fullName}</span>
                <div className="relative">
                  <button
                    className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium text-violet-200 transition hover:border-violet-300/50 hover:bg-violet-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
                    title="Open account menu"
                    aria-label="Open account menu"
                    aria-expanded={accountMenuOpen}
                    onClick={(event) => {
                      event.stopPropagation()
                      setAccountMenuOpen((open) => !open)
                    }}
                  >
                    {user.fullName.slice(0, 1).toUpperCase()}
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-white/10 bg-[#111827] p-2 shadow-2xl shadow-black/40">
                      <div className="border-b border-white/[0.08] px-3 py-2">
                        <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <button
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 transition hover:bg-red-400/15 hover:text-red-200 focus-visible:bg-red-400/15 focus-visible:text-red-200 focus-visible:outline-none"
                        onClick={() => {
                          signOut()
                          setAccountMenuOpen(false)
                          navigate("home")
                        }}
                      >
                        <LogOut className="size-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10" onClick={() => setAuthOpen(true)}>
                Sign in
              </Button>
            )}
            <button className="rounded-lg p-2 text-slate-400 md:hidden" aria-label="Open menu"><Menu className="size-5" /></button>
          </div>
        </div>
      </header>

      {status === "loading" ? (
        <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center text-sm text-slate-500">Restoring your workspace...</main>
      ) : page === "accept-invitation" ? (
        <InvitationAcceptancePage token={token ?? ""} invitationToken={getRoute().invitationToken ?? ""} onSignIn={() => setAuthOpen(true)} onAccepted={() => navigate("projects")} />
      ) : page === "home" ? (
        <HomePage token={token ?? ""} onExplore={() => navigate("projects")} onSignIn={() => setAuthOpen(true)} />
      ) : page === "pricing" ? (
        <PricingPage token={token} onSignIn={() => setAuthOpen(true)} />
      ) : page === "payment-result" ? (
        <PaymentResultPage token={token} onPricing={() => navigate("pricing")} />
      ) : page === "details" && projectId ? (
        <ProjectDetails token={token ?? ""} projectId={projectId} onBack={() => navigate("projects")} />
      ) : (
        <ProjectsPage token={token ?? ""} user={user} onSignIn={() => setAuthOpen(true)} />
      )}

      {authOpen && <AuthDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthOpen(false)} onAuthenticated={handleAuth} />}
    </div>
  )
}

function getRoute(): { page: Page; projectId: number | null; invitationToken: string | null } {
  const hash = window.location.hash
  const match = hash.match(/^#project\/(\d+)$/)
  if (match) return { page: "details", projectId: Number(match[1]), invitationToken: null }
  const invitationMatch = hash.match(/^#accept-invitation\?token=([^&]+)$/)
  const pathInvitationToken = window.location.pathname === "/accept-invitation"
    ? new URLSearchParams(window.location.search).get("token")
    : null
  if (invitationMatch || pathInvitationToken) {
    return {
      page: "accept-invitation",
      projectId: null,
      invitationToken: decodeURIComponent(invitationMatch?.[1] ?? pathInvitationToken ?? ""),
    }
  }
  if (window.location.pathname === "/upgrade_plan/success") {
    return { page: "payment-result", projectId: null, invitationToken: null }
  }
  return {
    page: hash === "#projects" ? "projects" : hash === "#pricing" ? "pricing" : "home",
    projectId: null,
    invitationToken: null,
  }
}

function InvitationAcceptancePage({
  token,
  invitationToken,
  onSignIn,
  onAccepted,
}: {
  token: string
  invitationToken: string
  onSignIn: () => void
  onAccepted: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!token || !invitationToken || accepted) return
    setLoading(true)
    acceptInvitation(token, invitationToken)
      .then(() => {
        setAccepted(true)
        toast({ title: "Invitation accepted", description: "The project is now available in your workspace." })
      })
      .catch((error: Error) => {
        toast({ title: "Invitation could not be accepted", description: error.message, variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [accepted, invitationToken, toast, token])

  if (!token) {
    return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col items-center justify-center px-5 text-center"><h1 className="text-3xl font-semibold text-white">Sign in to accept your invitation</h1><p className="mt-3 text-slate-400">Use the registered email address that received this invitation.</p><Button className="mt-7 bg-violet-500 hover:bg-violet-400" onClick={onSignIn}>Sign in</Button></main>
  }

  if (!invitationToken) {
    return <InvitationState title="Invalid invitation link" description="This invitation link is missing its token. Ask the project owner to send a new invitation." />
  }

  if (loading) {
    return <InvitationState title="Joining your project..." description="We are updating your workspace. This will only take a moment." />
  }

  if (accepted) {
    return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col items-center justify-center px-5 text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Check className="size-8" /></div><h1 className="mt-6 text-3xl font-semibold text-white">You&apos;re on the team</h1><p className="mt-3 text-slate-400">Your projects have been updated and the invited project is ready to open.</p><Button className="mt-7 bg-violet-500 hover:bg-violet-400" onClick={onAccepted}>Open projects <ArrowRight /></Button></main>
  }

  return <InvitationState title="Invitation unavailable" description="This invitation may have expired, already been used, or belong to another account." />
}

function InvitationState({ title, description }: { title: string; description: string }) {
  return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col items-center justify-center px-5 text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-red-400/15 text-red-300"><Mail className="size-7" /></div><h1 className="mt-6 text-3xl font-semibold text-white">{title}</h1><p className="mt-3 text-slate-400">{description}</p></main>
}

function PricingPage({ token, onSignIn }: { token: string | null; onSignIn: () => void }) {
  const { toast } = useToast()
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyPlan, setBusyPlan] = useState<PricingPlan["planType"] | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([
      getPricing(),
      token ? getSubscription(token) : Promise.resolve(null),
    ])
      .then(([nextPlans, nextSubscription]) => {
        if (!active) return
        setPlans(nextPlans)
        setSubscription(nextSubscription)
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
      setSubscription(nextSubscription)
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
              const isCurrent = plan.planType === subscription?.planType
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
                  <Button disabled={busyPlan !== null || cancelling || (subscription?.planType !== "FREE" && !isCurrent) || (isCurrent && (plan.planType === "FREE" || subscription?.cancelAtPeriodEnd))} onClick={() => isCurrent && plan.planType !== "FREE" ? cancelCurrentPlan() : choosePlan(plan)} className={`mt-8 w-full ${isCurrent ? "bg-white/10 text-slate-400" : "bg-violet-500 text-white hover:bg-violet-400"}`}>
                    {isCurrent ? (subscription?.cancelAtPeriodEnd ? "Cancellation scheduled" : cancelling ? "Cancelling..." : "Cancel subscription") : subscription?.planType !== "FREE" ? "Not available" : busyPlan === plan.planType ? "Opening payment..." : token ? "Choose plan" : "Sign in to choose"}
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

function PaymentResultPage({ token, onPricing }: { token: string | null; onPricing: () => void }) {
  const [state, setState] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Confirming your payment...")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const planType = params.get("planType") as PricingPlan["planType"] | null
    const paymentLinkId = params.get("razorpay_payment_link_id")
    const status = params.get("razorpay_payment_link_status")

    if (!token) {
      setState("failed")
      setMessage("Please sign in again to verify this payment.")
      return
    }
    if (status !== "paid" || !paymentLinkId || !planType || !["MONTHLY", "ANNUALLY"].includes(planType)) {
      setState("failed")
      setMessage("The payment was cancelled or could not be completed. Your plan was not changed.")
      return
    }

    verifyPayment(token, paymentLinkId, planType)
      .then(() => {
        setState("success")
        setMessage("Payment confirmed. Your plan is now active.")
      })
      .catch((error: Error) => {
        setState("failed")
        setMessage(error.message)
      })
  }, [token])

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

function NavButton({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{children}</button>
}

function HomePage({ token, onExplore, onSignIn }: { token: string; onExplore: () => void; onSignIn: () => void }) {
  const { toast } = useToast()
  const [projectCount, setProjectCount] = useState<number | null>(null)
  useEffect(() => {
    if (token) getProjects(token).then((projects) => setProjectCount(projects.length)).catch(() => {
      setProjectCount(null)
      toast({ title: "Workspace unavailable", description: "We could not load your project count.", variant: "destructive" })
    })
  }, [token, toast])

  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_5%,rgba(124,58,237,0.22),transparent_35%),radial-gradient(circle_at_15%_25%,rgba(14,165,233,0.09),transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-32 lg:pt-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-xs font-medium text-violet-200"><span className="size-1.5 rounded-full bg-emerald-400" /> Your workspace, in orbit</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">Make progress<br /><span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-sky-200 bg-clip-text text-transparent">visible.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">A calm, focused home for your team&apos;s ideas, projects, and next big release. Plan clearly, collaborate effortlessly, and ship with confidence.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" className="h-11 bg-violet-500 px-5 text-white hover:bg-violet-400" onClick={token ? onExplore : onSignIn}>{token ? "Open your projects" : "Get started"} <ArrowRight /></Button>
              <Button size="lg" variant="outline" className="h-11 border-white/10 bg-white/[0.03] px-5 text-slate-200 hover:bg-white/10" onClick={onExplore}>Explore workspace</Button>
            </div>
            <div className="mt-12 flex items-center gap-8 text-sm text-slate-500">
              <span><strong className="mr-1 text-slate-200">{projectCount ?? "—"}</strong> projects connected</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Built for momentum</span>
            </div>
          </div>
          <WorkspacePreview />
        </div>
      </section>
      <section className="border-y border-white/[0.07] bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7 sm:grid-cols-3 lg:px-8">
          <Feature icon={<FolderKanban />} title="One clear view" text="Keep every project and priority close at hand." />
          <Feature icon={<Users />} title="Better together" text="Give your team context without the noise." />
          <Feature icon={<BarChart3 />} title="Momentum, measured" text="See what is moving and what needs attention." />
        </div>
      </section>
    </main>
  )
}

function WorkspacePreview() {
  return <div className="relative mx-auto w-full max-w-[500px]">
    <div className="absolute -inset-8 rounded-[3rem] bg-violet-500/10 blur-3xl" />
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c111d] shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex gap-1.5"><i className="size-2 rounded-full bg-red-400/70" /><i className="size-2 rounded-full bg-amber-400/70" /><i className="size-2 rounded-full bg-emerald-400/70" /></div><span className="text-[10px] text-slate-500">orbit / workspace</span></div>
      <div className="grid grid-cols-[125px_1fr]">
        <div className="space-y-2 border-r border-white/[0.07] p-4"><div className="mb-6 h-2 w-14 rounded bg-white/20" /><div className="rounded-md bg-violet-500/20 px-2 py-2 text-[10px] text-violet-200">Overview</div><div className="px-2 py-2 text-[10px] text-slate-500">Projects</div><div className="px-2 py-2 text-[10px] text-slate-500">Team</div></div>
        <div className="space-y-4 p-5"><div><div className="h-3 w-36 rounded bg-white/20" /><div className="mt-2 h-2 w-24 rounded bg-white/10" /></div><div className="grid grid-cols-2 gap-3"><MiniMetric label="Active projects" value="08" color="violet" /><MiniMetric label="Team members" value="24" color="sky" /></div><div className="rounded-xl border border-white/[0.07] p-3"><div className="mb-4 flex justify-between"><span className="text-[10px] text-slate-400">Weekly progress</span><span className="text-[10px] text-emerald-400">+18.4%</span></div><div className="flex h-20 items-end gap-2">{[35, 54, 42, 68, 57, 78, 92].map((height, index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-300 opacity-80" style={{ height: `${height}%` }} />)}</div></div></div>
      </div>
    </div>
  </div>
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: "violet" | "sky" }) {
  return <div className={`rounded-xl border border-white/[0.07] p-3 ${color === "violet" ? "bg-violet-500/[0.07]" : "bg-sky-500/[0.07]"}`}><div className="text-[10px] text-slate-500">{label}</div><div className="mt-1 text-xl font-semibold text-white">{value}</div></div>
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-4 rounded-2xl p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300 [&_svg]:size-5">{icon}</span><div><h3 className="text-sm font-medium text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>
}

function ProjectsPage({ token, user, onSignIn }: { token: string; user: User | null; onSignIn: () => void }) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [tag, setTag] = useState("all")
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  const loadProjects = (keyword = "") => {
    if (!token) return
    setLoading(true)
    setError("")
    getProjects(token, keyword).then(setProjects).catch((err: Error) => {
      setError(err.message)
      toast({ title: "Projects could not be loaded", description: err.message, variant: "destructive" })
    }).finally(() => setLoading(false))
  }
  useEffect(() => {
    if (!token) return
    let active = true
    getProjects(token)
      .then((nextProjects) => {
        if (active) setProjects(nextProjects)
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
  }, [token, toast])

  const filteredProjects = useMemo(() => projects.filter((project) => (category === "all" || project.category?.toLowerCase() === category) && (tag === "all" || project.tags?.some((projectTag) => projectTag.toLowerCase() === tag))), [projects, category, tag])

  if (!token) return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col items-center justify-center px-5 text-center"><div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><FolderKanban className="size-7" /></div><h1 className="text-3xl font-semibold text-white">Your projects are waiting</h1><p className="mt-3 text-slate-400">Sign in to connect to your workspace and see your team&apos;s work.</p><Button className="mt-7 bg-violet-500 hover:bg-violet-400" onClick={onSignIn}>Sign in to continue <ArrowRight /></Button></main>

  const removeProject = async (project: Project) => {
    if (!user?.id || project.owner?.id !== user.id) return
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    try {
      const response = await deleteProject(token, project.id)
      setProjects((current) => current.filter((item) => item.id !== project.id))
      toast({ title: "Project deleted", description: response.message || `${project.name} was deleted.` })
    } catch (err) {
      toast({ title: "Project could not be deleted", description: err instanceof Error ? err.message : "Only the project owner can delete it.", variant: "destructive" })
    }
  }

  return <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
    <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm text-violet-300">Workspace</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your projects</h1><p className="mt-2 text-slate-400">Everything your team is building, in one place.</p></div><Button className="bg-violet-500 hover:bg-violet-400" onClick={() => setCreateOpen(true)}><Plus /> New project</Button></div>
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Filters</h2><CircleHelp className="size-4 text-slate-500" /></div><FilterGroup label="Category">{categories.map((item) => <FilterOption key={item} label={item} selected={category === item} onClick={() => setCategory(item)} />)}</FilterGroup><FilterGroup label="Tags">{["all", ...availableTags].map((item) => <FilterOption key={item} label={item} selected={tag === item} onClick={() => setTag(item)} />)}</FilterGroup></aside>
      <section><div className="mb-5 flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadProjects(query)} placeholder="Search projects..." className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/60" /></div><Button variant="outline" size="icon" className="border-white/10 bg-white/[0.03] text-slate-400" onClick={() => { setQuery(""); loadProjects() }}><X className="size-4" /></Button></div>
        {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {loading ? <div className="rounded-2xl border border-white/[0.08] p-10 text-center text-sm text-slate-500">Loading your projects...</div> : filteredProjects.length === 0 ? <EmptyProjects onCreate={() => setCreateOpen(true)} /> : <div className="grid gap-4 xl:grid-cols-2">{filteredProjects.map((project) => <ProjectCard key={project.id} project={project} canDelete={project.owner?.id === user?.id} onDelete={() => removeProject(project)} />)}</div>}
      </section>
    </div>
    {createOpen && <CreateProjectDialog token={token} onClose={() => setCreateOpen(false)} onCreated={(project) => { setProjects((current) => [project, ...current]); setCreateOpen(false) }} />}
  </main>
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="mb-7"><p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><div className="space-y-1">{children}</div></div> }
function FilterOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm capitalize transition ${selected ? "bg-violet-500/15 text-violet-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><span className={`flex size-4 items-center justify-center rounded-full border ${selected ? "border-violet-300 bg-violet-400 text-[#0b0e18]" : "border-slate-600"}`}>{selected && <Check className="size-3" />}</span>{label}</button> }
function ProjectCard({ project, canDelete, onDelete }: { project: Project; canDelete: boolean; onDelete: () => void }) { return <article onClick={() => { window.location.hash = `project/${project.id}` }} className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.04]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-2 flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" /><span className="text-xs capitalize text-violet-300">{project.category || "General"}</span></div><h2 className="truncate text-lg font-semibold text-white">{project.name}</h2></div><div className="flex items-center gap-1"><ChevronDown className="size-4 rotate-[-90deg] text-slate-500 transition group-hover:text-violet-300" />{canDelete && <button type="button" aria-label={`Delete ${project.name}`} title="Delete project" className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-400/10 hover:text-red-300" onClick={(event) => { event.stopPropagation(); onDelete() }}><Trash2 className="size-4" /></button>}</div></div><p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{project.description || "No description added yet."}</p><div className="mt-5 flex flex-wrap gap-2">{(project.tags ?? []).map((projectTag) => <span key={projectTag} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-400"><Tag className="size-3" />{projectTag}</span>)}</div><div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-slate-500"><span>{project.issues?.length ?? 0} issues</span><span>{project.team?.length ?? 0} collaborators</span></div></article> }
function EmptyProjects({ onCreate }: { onCreate: () => void }) { return <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400"><FolderKanban className="size-5" /></div><h2 className="mt-4 font-medium text-white">No projects found</h2><p className="mt-1 text-sm text-slate-500">Try another filter or start something new.</p><Button size="sm" className="mt-5 bg-violet-500 hover:bg-violet-400" onClick={onCreate}><Plus /> Create project</Button></div> }

function ProjectDetails({ token, projectId, onBack }: { token: string; projectId: number; onBack: () => void }) {
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [chatName, setChatName] = useState("Project chat")
  const [activeTab, setActiveTab] = useState<"overview" | "issues" | "chat">("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const refreshErrorShown = useRef(false)

  const refreshProjectData = useCallback(async () => {
    const [nextProject, nextIssues, chat, nextMessages] = await Promise.all([
      getProject(token, projectId),
      getIssues(token, projectId),
      getProjectChat(token, projectId),
      getMessages(token, projectId),
    ])
    const commentEntries = await Promise.all(
      nextIssues.map(async (issue) => [issue.id, await getComments(token, issue.id)] as const),
    )
    setProject(nextProject)
    setIssues(nextIssues)
    setChatName(chat.name || "Project chat")
    setMessages(nextMessages)
    setComments(Object.fromEntries(commentEntries))
  }, [projectId, token])

  useEffect(() => {
    let active = true
    setLoading(true)
    refreshProjectData()
      .catch((err: Error) => {
        if (active) {
          setError(err.message)
          toast({ title: "Project details unavailable", description: err.message, variant: "destructive" })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [refreshProjectData, toast])

  useEffect(() => {
    let active = true
    const intervalId = window.setInterval(() => {
      refreshProjectData()
        .then(() => { refreshErrorShown.current = false })
        .catch((err: Error) => {
          if (active && !refreshErrorShown.current) {
            refreshErrorShown.current = true
            toast({ title: "Live updates paused", description: err.message, variant: "destructive" })
          }
        })
    }, 5000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [refreshProjectData, toast])

  if (loading) return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl items-center justify-center px-5 text-sm text-slate-500">Loading project workspace...</main>
  if (error || !project) return <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><Button variant="ghost" className="text-slate-400" onClick={onBack}><ArrowLeft /> Back to projects</Button><div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">{error || "Project not found"}</div></main>

  return <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
    <button className="mb-7 flex items-center gap-2 text-sm text-slate-500 transition hover:text-white" onClick={onBack}><ArrowLeft className="size-4" /> Back to projects</button>
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 text-sm text-violet-300"><span className="size-2 rounded-full bg-emerald-400" /> {project.category || "General"}</div><h1 className="text-4xl font-semibold tracking-tight text-white">{project.name}</h1><p className="mt-3 max-w-2xl text-slate-400">{project.description || "No description added yet."}</p></div><div className="flex items-center gap-2 text-sm text-slate-500"><Users className="size-4" /> {project.team?.length ?? 0} members</div></div>
    <div className="mb-7 flex gap-1 overflow-x-auto border-b border-white/[0.08]"><DetailTab active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</DetailTab><DetailTab active={activeTab === "issues"} onClick={() => setActiveTab("issues")}>Issues <Badge>{issues.length}</Badge></DetailTab><DetailTab active={activeTab === "chat"} onClick={() => setActiveTab("chat")}>Chat <Badge>{messages.length}</Badge></DetailTab></div>
    {activeTab === "overview" && <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]"><section className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><SummaryCard label="Open issues" value={String(issues.filter((issue) => issue.status?.toLowerCase() !== "done").length)} /><SummaryCard label="Team members" value={String(project.team?.length ?? 0)} /><SummaryCard label="Messages" value={String(messages.length)} /></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-4 flex items-center justify-between"><SectionTitle icon={<Clock3 />} title="Recent issues" action="View all" onAction={() => setActiveTab("issues")} /><Button size="sm" className="bg-violet-500 hover:bg-violet-400" onClick={() => setCreateOpen(true)}><Plus /> Issue</Button></div>{issues.slice(0, 4).map((issue) => <IssueRow key={issue.id} issue={issue} comments={comments[issue.id]?.length ?? 0} team={project.team ?? []} token={token} onUpdated={(updated) => setIssues((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}{issues.length === 0 && <EmptyPanel text="No issues have been added to this project yet." />}</div></section><ProjectSidebar project={project} chatName={chatName} onInvite={() => setInviteOpen(true)} /></div>}
    {activeTab === "issues" && <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-4 flex justify-end"><Button size="sm" className="bg-violet-500 hover:bg-violet-400" onClick={() => setCreateOpen(true)}><Plus /> Create issue</Button></div>{issues.length === 0 ? <EmptyPanel text="No issues have been added to this project yet." /> : issues.map((issue) => <IssueRow key={issue.id} issue={issue} comments={comments[issue.id]?.length ?? 0} expandedComments={comments[issue.id]} team={project.team ?? []} token={token} onUpdated={(updated) => setIssues((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}</div>}
    {activeTab === "chat" && <ChatPanel token={token} projectId={projectId} chatName={chatName} messages={messages} onSent={(message) => setMessages((current) => [...current, message])} />}
    {createOpen && <CreateIssueDialog token={token} projectId={projectId} onClose={() => setCreateOpen(false)} onCreated={(issue) => { setIssues((current) => [issue, ...current]); setCreateOpen(false) }} />}
    {inviteOpen && <InviteUserDialog token={token} projectId={projectId} onClose={() => setInviteOpen(false)} />}
  </main>
}

function DetailTab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) { return <button onClick={onClick} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition ${active ? "border-violet-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>{children}</button> }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">{children}</span> }
function SummaryCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p></div> }
function SectionTitle({ icon, title, action, onAction }: { icon: React.ReactNode; title: string; action?: string; onAction?: () => void }) { return <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-medium text-white"><span className="text-violet-300 [&_svg]:size-4">{icon}</span>{title}</h2>{action && <button className="text-xs text-violet-300 hover:text-violet-200" onClick={onAction}>{action}</button>}</div> }
function IssueRow({ issue, comments, expandedComments, team, token, onUpdated }: { issue: Issue; comments: number; expandedComments?: Comment[]; team: User[]; token: string; onUpdated: (issue: Issue) => void }) {
  const { toast } = useToast()
  const [visibleComments, setVisibleComments] = useState<Comment[]>(expandedComments ?? [])
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setVisibleComments(expandedComments ?? [])
  }, [expandedComments])
  const submitComment = async () => {
    if (!comment.trim()) return
    setSaving(true)
    try {
      const created = await createComment(token, issue.id, comment.trim())
      setVisibleComments((current) => [...current, created])
      setComment("")
      toast({ title: "Comment added" })
    } catch (err) {
      toast({ title: "Comment could not be added", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" })
    } finally { setSaving(false) }
  }
  const assign = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!event.target.value) return
    try {
      const updated = await assignIssue(token, issue.id, Number(event.target.value))
      onUpdated(updated)
      toast({ title: "Issue assigned" })
    } catch (err) {
      toast({ title: "Issue could not be assigned", description: err instanceof Error ? err.message : "Choose a project member.", variant: "destructive" })
    }
  }
  return <div className="border-t border-white/[0.07] py-4 first:border-t-0"><div className="flex items-start justify-between gap-4"><div><h3 className="font-medium text-slate-200">{issue.title}</h3><p className="mt-1 text-sm text-slate-500">{issue.description || "No description"}</p></div><span className={`rounded-md px-2 py-1 text-xs capitalize ${issue.status?.toLowerCase() === "done" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{issue.status || "open"}</span></div><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="capitalize">{issue.priority || "normal"} priority</span><span className="flex items-center gap-1"><MessageCircle className="size-3" /> {visibleComments.length || comments} comments</span><select value={issue.assignee?.id ?? ""} onChange={assign} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300 outline-none"><option value="">Assign issue</option>{team.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}</select></div>{visibleComments.map((item) => <div key={item.id} className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400"><span className="font-medium text-slate-300">{item.user?.fullName || "Team member"}: </span>{item.content}</div>)}<div className="mt-3 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitComment()} placeholder="Add a comment..." className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none placeholder:text-slate-600" /><Button size="sm" disabled={saving} className="h-8 border-violet-400/30 bg-violet-500 px-3 text-xs text-white shadow-sm shadow-violet-500/20 hover:bg-violet-400 hover:text-white" onClick={submitComment}>{saving ? "Adding..." : "Comment"}</Button></div></div>
}
function ProjectSidebar({ project, chatName, onInvite }: { project: Project; chatName: string; onInvite: () => void }) {
  const owner = project.owner
  const collaborators = (project.team ?? []).filter((member) => member.id !== owner?.id).slice(0, 5)
  const renderMember = (member: User, isOwner = false) => (
    <div key={member.id ?? member.email} className={`flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-white/[0.04] ${isOwner ? "bg-violet-400/[0.06]" : ""}`}>
      <span className={`flex size-8 items-center justify-center rounded-full text-xs ${isOwner ? "bg-violet-400/15 text-violet-200" : "bg-sky-400/10 text-sky-200"}`}>{member.fullName.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm text-slate-300">{member.fullName}</p>
          {isOwner && <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-medium text-violet-200">Owner</span>}
        </div>
        <p className="truncate text-xs text-slate-600">{member.email}</p>
      </div>
    </div>
  )

  return <aside className="space-y-5"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><SectionTitle icon={<Tag />} title="Project tags" /> <div className="flex flex-wrap gap-2">{project.tags?.length ? project.tags.map((tag) => <span key={tag} className="rounded-md bg-violet-400/10 px-2 py-1 text-xs text-violet-200">{tag}</span>) : <span className="text-sm text-slate-500">No tags added</span>}</div></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="flex items-center justify-between"><SectionTitle icon={<Users />} title="Collaborators" /><Button variant="ghost" size="icon-sm" aria-label="Invite user" onClick={onInvite}><Mail /></Button></div><div className="space-y-3">{owner && renderMember(owner, true)}{collaborators.map((member) => renderMember(member))}{!owner && collaborators.length === 0 && <span className="text-sm text-slate-500">No collaborators yet</span>}</div><Button variant="outline" size="sm" className="mt-4 w-full border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-violet-400/10" onClick={onInvite}><Mail /> Invite teammate</Button></div><div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] p-5 transition hover:border-violet-300/30 hover:bg-violet-400/10"><MessageCircle className="size-5 text-violet-300" /><p className="mt-3 text-sm font-medium text-white">{chatName}</p><p className="mt-1 text-xs leading-5 text-slate-400">Project conversations are available in the Chat tab.</p></div></aside>
}
function ChatPanel({ token, projectId, chatName, messages, onSent }: { token: string; projectId: number; chatName: string; messages: Message[]; onSent: (message: Message) => void }) {
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const send = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      const message = await createMessage(token, projectId, content.trim())
      onSent(message)
      setContent("")
    } catch (err) {
      toast({ title: "Message could not be sent", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" })
    } finally { setSending(false) }
  }
  return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><SectionTitle icon={<MessageCircle />} title={chatName} /><div className="space-y-3">{messages.length ? messages.map((message) => <div key={message.id} className="flex gap-3 rounded-xl bg-white/[0.03] p-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-xs text-violet-200">{message.sender?.fullName?.slice(0, 1) || "?"}</span><div><p className="text-xs font-medium text-slate-300">{message.sender?.fullName || "Team member"}</p><p className="mt-1 text-sm leading-6 text-slate-400">{message.content}</p><p className="mt-1 text-[10px] text-slate-600">{message.createdAt ? new Date(message.createdAt).toLocaleString() : "Recently"}</p></div></div>) : <EmptyPanel text="No messages in this project chat yet." />}</div><div className="mt-5 flex gap-2 border-t border-white/[0.07] pt-5"><input value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} placeholder="Write to the project chat..." className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-slate-600" /><Button disabled={sending} className="bg-violet-500 hover:bg-violet-400" onClick={send}><Send className="size-4" /></Button></div></div>
}
function EmptyPanel({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-slate-500">{text}</p> }

function CreateIssueDialog({ token, projectId, onClose, onCreated }: { token: string; projectId: number; onClose: () => void; onCreated: (issue: Issue) => void }) {
  const { toast } = useToast()
  const [form, setForm] = useState<CreateIssueInput>({ title: "", description: "", status: "OPEN", projectId, priority: "MEDIUM" })
  const [busy, setBusy] = useState(false)
  const update = (key: keyof CreateIssueInput, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) {
      toast({ title: "Issue title required", description: "Add a short title for this issue.", variant: "destructive" })
      return
    }

    setBusy(true)
    try {
      const issue = await createIssue(token, { ...form, title: form.title.trim(), description: form.description.trim() })
      toast({ title: "Issue created", description: `${issue.title} was added to the project.` })
      onCreated(issue)
    } catch (err) {
      toast({ title: "Issue could not be created", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" })
    } finally { setBusy(false) }
  }
  return <DialogShell onClose={onClose}><div className="mb-7"><p className="text-sm text-violet-300">Project workspace</p><h2 className="mt-2 text-2xl font-semibold text-white">Create an issue</h2></div><form className="space-y-4" onSubmit={submit}><Field label="Title" value={form.title} onChange={(value) => update("title", value)} placeholder="e.g. Improve onboarding flow" required /><Field label="Description" value={form.description} onChange={(value) => update("description", value)} placeholder="What needs to be done?" /><div className="grid grid-cols-2 gap-3"><label className="block text-sm text-slate-300">Status<select value={form.status} onChange={(event) => update("status", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label><label className="block text-sm text-slate-300">Priority<select value={form.priority} onChange={(event) => update("priority", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label></div><Field label="Due date" type="datetime-local" value={form.dueDate ?? ""} onChange={(value) => update("dueDate", value)} placeholder="" /><Button type="submit" disabled={busy} className="h-10 w-full bg-violet-500 hover:bg-violet-400">{busy ? "Creating..." : "Create issue"}</Button></form></DialogShell>
}

function InviteUserDialog({ token, projectId, onClose }: { token: string; projectId: number; onClose: () => void }) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast({ title: "Valid email required", description: "Enter the teammate's email address.", variant: "destructive" })
      return
    }

    onClose()
    toast({ title: "Sending invitation", description: `We're sending an invitation to ${normalizedEmail}.` })
    try {
      const response = await inviteUser(token, projectId, normalizedEmail)
      toast({ title: "Invitation sent", description: response.message || `Invitation sent to ${normalizedEmail}.` })
    } catch (err) {
      toast({ title: "Invitation could not be sent", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" })
    }
  }
  return <DialogShell onClose={onClose}><div className="mb-7"><p className="text-sm text-violet-300">Project workspace</p><h2 className="mt-2 text-2xl font-semibold text-white">Invite a teammate</h2><p className="mt-2 text-sm leading-6 text-slate-400">We&apos;ll email an invitation link. They must register with this email before they can be assigned issues.</p></div><form className="space-y-4" onSubmit={submit}><Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="teammate@company.com" required /><Button type="submit" className="h-10 w-full bg-violet-500 hover:bg-violet-400">Send invitation</Button></form></DialogShell>
}

function AuthDialog({ mode, onModeChange, onClose, onAuthenticated }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onClose: () => void; onAuthenticated: (email: string, password: string, fullName: string) => Promise<void> }) {
  const { toast } = useToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      toast({ title: "Missing login details", description: "Enter both your email and password.", variant: "destructive" })
      return
    }
    if (mode === "register" && !fullName.trim()) {
      toast({ title: "Missing name", description: "Enter your full name to create an account.", variant: "destructive" })
      return
    }
    setBusy(true)
    setError("")
    try {
      await onAuthenticated(email, password, fullName)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to authenticate"
      setError(message)
      toast({ title: mode === "login" ? "Sign in failed" : "Account creation failed", description: message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }
  return <DialogShell onClose={onClose}><div className="mb-7"><p className="text-sm text-violet-300">Welcome to Orbit</p><h2 className="mt-2 text-2xl font-semibold text-white">{mode === "login" ? "Sign in to your workspace" : "Create your workspace"}</h2></div><form className="space-y-4" onSubmit={submit}>{mode === "register" && <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Alex Morgan" />}<Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" /><Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />{error && <p className="text-sm text-red-300">{error}</p>}<Button type="submit" disabled={busy} className="h-10 w-full bg-violet-500 hover:bg-violet-400">{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</Button></form><p className="mt-5 text-center text-sm text-slate-500">{mode === "login" ? "New here?" : "Already have an account?"} <button className="text-violet-300 hover:text-violet-200" onClick={() => onModeChange(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p></DialogShell>
}

function CreateProjectDialog({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (project: Project) => void }) {
  const { toast } = useToast()
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [category, setCategory] = useState("full stack"); const [tags, setTags] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      toast({ title: "Project name required", description: "Enter a name before creating the project.", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const project = await createProject(token, { name, description, category, tags: tags.split(",").map((item) => item.trim()).filter(Boolean) })
      toast({ title: "Project created", description: `${project.name} is ready for your team.` })
      onCreated(project)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create project"
      setError(message)
      toast({ title: "Project could not be created", description: message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }
  return <DialogShell onClose={onClose}><div className="mb-7"><p className="text-sm text-violet-300">Workspace</p><h2 className="mt-2 text-2xl font-semibold text-white">Create a project</h2></div><form className="space-y-4" onSubmit={submit}><Field label="Project name" value={name} onChange={setName} placeholder="e.g. Mobile app redesign" required /><Field label="Description" value={description} onChange={setDescription} placeholder="What are you building?" /><div className="grid grid-cols-2 gap-3"><label className="block text-sm text-slate-300">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="full stack">Full stack</option><option value="frontend">Frontend</option><option value="backend">Backend</option><option value="mobile">Mobile</option><option value="design">Design</option></select></label><Field label="Tags" value={tags} onChange={setTags} placeholder="react, nextjs" /></div>{error && <p className="text-sm text-red-300">{error}</p>}<Button type="submit" disabled={busy} className="h-10 w-full bg-violet-500 hover:bg-violet-400">{busy ? "Creating..." : "Create project"}</Button></form></DialogShell>
}

function DialogShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#101522] p-6 shadow-2xl"><button className="absolute right-4 top-4 rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close dialog"><X className="size-4" /></button>{children}</div></div> }
function Field({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) { return <label className="block text-sm text-slate-300">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/60" /></label> }

export default App
