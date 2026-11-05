import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, Check, FolderKanban, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { getProjects } from "@/lib/api"

export function HomePage({ token, onExplore, onSignIn }: { token: string; onExplore: () => void; onSignIn: () => void }) {
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

export function WorkspacePreview() {
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

export function MiniMetric({ label, value, color }: { label: string; value: string; color: "violet" | "sky" }) {
  return <div className={`rounded-xl border border-white/[0.07] p-3 ${color === "violet" ? "bg-violet-500/[0.07]" : "bg-sky-500/[0.07]"}`}><div className="text-[10px] text-slate-500">{label}</div><div className="mt-1 text-xl font-semibold text-white">{value}</div></div>
}

export function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-4 rounded-2xl p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300 [&_svg]:size-5">{icon}</span><div><h3 className="text-sm font-medium text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>
}

