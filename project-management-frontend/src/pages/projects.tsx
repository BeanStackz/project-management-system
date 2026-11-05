import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, ChevronDown, CircleHelp, FolderKanban, Plus, Search, Tag, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { deleteProject, getProjects, type Project, type Subscription, type User } from "@/lib/api"
import { CreateProjectDialog, DialogShell } from "@/components/dialogs"

const categories = ["all", "full stack", "frontend", "backend", "mobile", "design"]
const availableTags = ["react", "nextjs", "spring boot", "angular", "mysql", "mongodb"]

export function ProjectsPage({ token, user, subscription, onSignIn }: { token: string; user: User | null; subscription: Subscription | null; onSignIn: () => void }) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [tag, setTag] = useState("all")
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Project | null>(null)

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
  const ownedProjectCount = projects.filter((project) => project.owner?.id === user?.id).length
  const canCreateProject = subscription !== null && (subscription.planType !== "FREE" || ownedProjectCount < 1)

  if (!token) return <main className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col items-center justify-center px-5 text-center"><div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><FolderKanban className="size-7" /></div><h1 className="text-3xl font-semibold text-white">Your projects are waiting</h1><p className="mt-3 text-slate-400">Sign in to connect to your workspace and see your team&apos;s work.</p><Button className="mt-7 bg-violet-500 hover:bg-violet-400" onClick={onSignIn}>Sign in to continue <ArrowRight /></Button></main>

  const removeProject = async (project: Project) => {
    if (!user?.id || project.owner?.id !== user.id) return
    try {
      const response = await deleteProject(token, project.id)
      setProjects((current) => current.filter((item) => item.id !== project.id))
      setDeleteCandidate(null)
      toast({ title: "Project deleted", description: response.message || `${project.name} was deleted.` })
    } catch (err) {
      toast({ title: "Project could not be deleted", description: err instanceof Error ? err.message : "Only the project owner can delete it.", variant: "destructive" })
    }
  }

  return <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
    <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm text-violet-300">Workspace</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your projects</h1><p className="mt-2 text-slate-400">Everything your team is building, in one place.</p></div><Button disabled={!canCreateProject} title={!canCreateProject ? "Free includes 1 active project" : undefined} className="bg-violet-500 hover:bg-violet-400" onClick={() => setCreateOpen(true)}><Plus /> New project</Button></div>
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Filters</h2><CircleHelp className="size-4 text-slate-500" /></div><FilterGroup label="Category">{categories.map((item) => <FilterOption key={item} label={item} selected={category === item} onClick={() => setCategory(item)} />)}</FilterGroup><FilterGroup label="Tags">{["all", ...availableTags].map((item) => <FilterOption key={item} label={item} selected={tag === item} onClick={() => setTag(item)} />)}</FilterGroup></aside>
      <section><div className="mb-5 flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadProjects(query)} placeholder="Search projects..." className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/60" /></div><Button variant="outline" size="icon" className="border-white/10 bg-white/[0.03] text-slate-400" onClick={() => { setQuery(""); loadProjects() }}><X className="size-4" /></Button></div>
        {error && <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {loading ? <div className="rounded-2xl border border-white/[0.08] p-10 text-center text-sm text-slate-500">Loading your projects...</div> : filteredProjects.length === 0 ? <EmptyProjects onCreate={() => canCreateProject && setCreateOpen(true)} /> : <div className="grid gap-4 xl:grid-cols-2">{filteredProjects.map((project) => <ProjectCard key={project.id} project={project} canDelete={project.owner?.id === user?.id} onDelete={() => setDeleteCandidate(project)} />)}</div>}
      </section>
    </div>
    {createOpen && <CreateProjectDialog token={token} onClose={() => setCreateOpen(false)} onCreated={(project) => { setProjects((current) => [project, ...current]); setCreateOpen(false) }} />}
    {deleteCandidate && <DeleteProjectDialog project={deleteCandidate} onClose={() => setDeleteCandidate(null)} onConfirm={() => removeProject(deleteCandidate)} />}
  </main>
}

export function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="mb-7"><p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><div className="space-y-1">{children}</div></div> }
export function FilterOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm capitalize transition ${selected ? "bg-violet-500/15 text-violet-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><span className={`flex size-4 items-center justify-center rounded-full border ${selected ? "border-violet-300 bg-violet-400 text-[#0b0e18]" : "border-slate-600"}`}>{selected && <Check className="size-3" />}</span>{label}</button> }
export function ProjectCard({ project, canDelete, onDelete }: { project: Project; canDelete: boolean; onDelete: () => void }) { return <article onClick={() => { window.location.hash = `project/${project.id}` }} className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.04]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-2 flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" /><span className="text-xs capitalize text-violet-300">{project.category || "General"}</span></div><h2 className="truncate text-lg font-semibold text-white">{project.name}</h2></div><div className="flex items-center gap-1"><ChevronDown className="size-4 rotate-[-90deg] text-slate-500 transition group-hover:text-violet-300" />{canDelete && <button type="button" aria-label={`Delete ${project.name}`} title="Delete project" className="rounded-md p-1.5 text-slate-500 transition hover:bg-red-400/10 hover:text-red-300" onClick={(event) => { event.stopPropagation(); onDelete() }}><Trash2 className="size-4" /></button>}</div></div><p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{project.description || "No description added yet."}</p><div className="mt-5 flex flex-wrap gap-2">{(project.tags ?? []).map((projectTag) => <span key={projectTag} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-400"><Tag className="size-3" />{projectTag}</span>)}</div><div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-slate-500"><span>{project.issues?.length ?? 0} issues</span><span>{project.team?.length ?? 0} collaborators</span></div></article> }
export function EmptyProjects({ onCreate }: { onCreate: () => void }) { return <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400"><FolderKanban className="size-5" /></div><h2 className="mt-4 font-medium text-white">No projects found</h2><p className="mt-1 text-sm text-slate-500">Try another filter or start something new.</p><Button size="sm" className="mt-5 bg-violet-500 hover:bg-violet-400" onClick={onCreate}><Plus /> Create project</Button></div> }

export function DeleteProjectDialog({ project, onClose, onConfirm }: { project: Project; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogShell onClose={onClose}>
      <div className="pr-5">
        <p className="text-sm font-medium text-red-300">Delete project</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Delete &quot;{project.name}&quot;?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">This permanently removes the project, its issues, and its conversations. This action cannot be undone.</p>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={busy} className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10" onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={busy} className="bg-red-500 text-white hover:bg-red-400" onClick={confirm}>{busy ? "Deleting..." : "Delete project"}</Button>
      </div>
    </DialogShell>
  )
}

