import { useEffect, useState } from "react"
import { ArrowRight, Check, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { acceptInvitation } from "@/lib/api"

export function InvitationAcceptancePage({
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

export function InvitationState({ title, description }: { title: string; description: string }) {
  return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col items-center justify-center px-5 text-center"><div className="flex size-16 items-center justify-center rounded-2xl bg-red-400/15 text-red-300"><Mail className="size-7" /></div><h1 className="mt-6 text-3xl font-semibold text-white">{title}</h1><p className="mt-3 text-slate-400">{description}</p></main>
}

