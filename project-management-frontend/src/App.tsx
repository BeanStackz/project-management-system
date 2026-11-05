import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getSubscription, type Subscription } from "@/lib/api"
import { getRoute } from "@/app/routes"
import type { AuthMode, Page } from "@/app/types"
import { Header } from "@/components/layout/header"
import { AuthDialog } from "@/components/dialogs"
import { HomePage } from "@/pages/home"
import { ProjectsPage } from "@/pages/projects"
import { PricingPage } from "@/pages/pricing"
import { PaymentResultPage } from "@/pages/payment-result"
import { InvitationAcceptancePage } from "@/pages/invitation"
import { ProjectDetails } from "@/components/project-workspace"

function App() {
  const { token, user, status, signIn, signUp, signOut } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [page, setPage] = useState<Page>(() => getRoute().page)
  const [projectId, setProjectId] = useState<number | null>(() => getRoute().projectId)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useEffect(() => { if (!token) { setSubscription(null); return }; let active = true; getSubscription(token).then((next) => active && setSubscription(next)).catch(() => active && setSubscription(null)); return () => { active = false } }, [token])
  useEffect(() => { const onHashChange = () => { const route = getRoute(); setPage(route.page); setProjectId(route.projectId) }; window.addEventListener("hashchange", onHashChange); return () => window.removeEventListener("hashchange", onHashChange) }, [])
  useEffect(() => { const close = () => setAccountMenuOpen(false); if (accountMenuOpen) { document.addEventListener("click", close); return () => document.removeEventListener("click", close) } }, [accountMenuOpen])
  const navigate = (nextPage: Page) => { const hash = nextPage === "projects" || nextPage === "pricing" ? `#${nextPage}` : ""; const path = window.location.pathname === "/upgrade_plan/success" ? "/" : window.location.pathname; window.history.pushState(null, "", `${path}${hash}`); setPage(nextPage); setProjectId(null); setMobileMenuOpen(false) }
  const handleAuth = async (email: string, password: string, fullName: string) => { if (authMode === "login") await signIn(email, password); else await signUp(fullName, email, password); setAuthOpen(false); if (getRoute().page !== "accept-invitation") navigate("projects") }
  return <div className="min-h-svh bg-[#070a12] text-slate-100"><Header page={page} user={user} subscription={subscription} accountMenuOpen={accountMenuOpen} mobileMenuOpen={mobileMenuOpen} onNavigate={navigate} onSignIn={() => setAuthOpen(true)} onSignOut={() => { signOut(); setAccountMenuOpen(false); navigate("home") }} onAccountMenu={() => setAccountMenuOpen((open) => !open)} onMobileMenu={() => setMobileMenuOpen((open) => !open)} />{status === "loading" ? <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center text-sm text-slate-500">Restoring your workspace...</main> : page === "accept-invitation" ? <InvitationAcceptancePage token={token ?? ""} invitationToken={getRoute().invitationToken ?? ""} onSignIn={() => setAuthOpen(true)} onAccepted={() => navigate("projects")} /> : page === "home" ? <HomePage token={token ?? ""} onExplore={() => navigate("projects")} onSignIn={() => setAuthOpen(true)} /> : page === "pricing" ? <PricingPage token={token} subscription={subscription} onSubscriptionChange={setSubscription} onSignIn={() => setAuthOpen(true)} /> : page === "payment-result" ? <PaymentResultPage token={token} onVerified={setSubscription} onHome={() => navigate("home")} onPricing={() => navigate("pricing")} /> : page === "details" && projectId ? <ProjectDetails token={token ?? ""} projectId={projectId} isPro={subscription !== null && subscription.planType !== "FREE"} onBack={() => navigate("projects")} /> : <ProjectsPage token={token ?? ""} user={user} subscription={subscription} onSignIn={() => setAuthOpen(true)} />}{authOpen && <AuthDialog mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthOpen(false)} onAuthenticated={handleAuth} />}</div>
}
export default App
