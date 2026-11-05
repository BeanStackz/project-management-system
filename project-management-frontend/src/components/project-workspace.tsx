import { useCallback, useEffect, useRef, useState} from "react"
import { ArrowLeft, Clock3, MessageCircle, Mail, Plus, Send, Tag, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogShell, Field } from "@/components/dialogs"
import { useToast } from "@/components/ui/toast"
import { assignIssue, createComment, createIssue, createMessage, getComments, getIssues, getMessages, getProject, getProjectChat, inviteUser, type Comment, type CreateIssueInput, type Issue, type Message, type Project, type User } from "@/lib/api"

export function ProjectDetails({ token, projectId, isPro, onBack }: { token: string; projectId: number; isPro: boolean; onBack: () => void }) {
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
    {activeTab === "overview" && <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]"><section className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><SummaryCard label="Open issues" value={String(issues.filter((issue) => issue.status?.toLowerCase() !== "done").length)} /><SummaryCard label="Team members" value={String(project.team?.length ?? 0)} /><SummaryCard label="Messages" value={String(messages.length)} /></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-4 flex items-center justify-between"><SectionTitle icon={<Clock3 />} title="Recent issues" action="View all" onAction={() => setActiveTab("issues")} /><Button size="sm" className="bg-violet-500 hover:bg-violet-400" onClick={() => setCreateOpen(true)}><Plus /> Issue</Button></div>{issues.slice(0, 4).map((issue) => <IssueRow key={issue.id} issue={issue} comments={comments[issue.id]?.length ?? 0} team={project.team ?? []} token={token} isPro={isPro} onUpdated={(updated) => setIssues((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}{issues.length === 0 && <EmptyPanel text="No issues have been added to this project yet." />}</div></section><ProjectSidebar project={project} chatName={chatName} canInvite={isPro} onInvite={() => setInviteOpen(true)} /></div>}
    {activeTab === "issues" && <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="mb-4 flex justify-end"><Button size="sm" className="bg-violet-500 hover:bg-violet-400" onClick={() => setCreateOpen(true)}><Plus /> Create issue</Button></div>{issues.length === 0 ? <EmptyPanel text="No issues have been added to this project yet." /> : issues.map((issue) => <IssueRow key={issue.id} issue={issue} comments={comments[issue.id]?.length ?? 0} expandedComments={comments[issue.id]} team={project.team ?? []} token={token} isPro={isPro} onUpdated={(updated) => setIssues((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}</div>}
    {activeTab === "chat" && <ChatPanel token={token} projectId={projectId} chatName={chatName} messages={messages} onSent={(message) => setMessages((current) => [...current, message])} />}
    {createOpen && <CreateIssueDialog token={token} projectId={projectId} isPro={isPro} onClose={() => setCreateOpen(false)} onCreated={(issue) => { setIssues((current) => [issue, ...current]); setCreateOpen(false) }} />}
    {inviteOpen && isPro && <InviteUserDialog token={token} projectId={projectId} onClose={() => setInviteOpen(false)} />}
  </main>
}

export function DetailTab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) { return <button onClick={onClick} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition ${active ? "border-violet-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>{children}</button> }
export function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">{children}</span> }
export function SummaryCard({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold text-white">{value}</p></div> }
export function SectionTitle({ icon, title, action, onAction }: { icon: React.ReactNode; title: string; action?: string; onAction?: () => void }) { return <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-medium text-white"><span className="text-violet-300 [&_svg]:size-4">{icon}</span>{title}</h2>{action && <button className="text-xs text-violet-300 hover:text-violet-200" onClick={onAction}>{action}</button>}</div> }
export function IssueRow({ issue, comments, expandedComments, team, token, isPro, onUpdated }: { issue: Issue; comments: number; expandedComments?: Comment[]; team: User[]; token: string; isPro: boolean; onUpdated: (issue: Issue) => void }) {
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
  return <div className="border-t border-white/[0.07] py-4 first:border-t-0"><div className="flex items-start justify-between gap-4"><div><h3 className="font-medium text-slate-200">{issue.title}</h3><p className="mt-1 text-sm text-slate-500">{issue.description || "No description"}</p></div><span className={`rounded-md px-2 py-1 text-xs capitalize ${issue.status?.toLowerCase() === "done" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{issue.status || "open"}</span></div><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="capitalize">{issue.priority || "normal"} priority</span><span className="flex items-center gap-1"><MessageCircle className="size-3" /> {visibleComments.length || comments} comments</span>{isPro && <select value={issue.assignee?.id ?? ""} onChange={assign} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300 outline-none"><option value="">Assign issue</option>{team.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}</select>}</div>{visibleComments.map((item) => <div key={item.id} className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400"><span className="font-medium text-slate-300">{item.user?.fullName || "Team member"}: </span>{item.content}</div>)}<div className="mt-3 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitComment()} placeholder="Add a comment..." className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none placeholder:text-slate-600" /><Button size="sm" disabled={saving} className="h-8 border-violet-400/30 bg-violet-500 px-3 text-xs text-white shadow-sm shadow-violet-500/20 hover:bg-violet-400 hover:text-white" onClick={submitComment}>{saving ? "Adding..." : "Comment"}</Button></div></div>
}
export function ProjectSidebar({ project, chatName, canInvite, onInvite }: { project: Project; chatName: string; canInvite: boolean; onInvite: () => void }) {
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

  return <aside className="space-y-5"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><SectionTitle icon={<Tag />} title="Project tags" /> <div className="flex flex-wrap gap-2">{project.tags?.length ? project.tags.map((tag) => <span key={tag} className="rounded-md bg-violet-400/10 px-2 py-1 text-xs text-violet-200">{tag}</span>) : <span className="text-sm text-slate-500">No tags added</span>}</div></div><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="flex items-center justify-between"><SectionTitle icon={<Users />} title="Collaborators" />{canInvite && <Button variant="ghost" size="icon-sm" aria-label="Invite user" onClick={onInvite}><Mail /></Button>}</div><div className="space-y-3">{owner && renderMember(owner, true)}{collaborators.map((member) => renderMember(member))}{!owner && collaborators.length === 0 && <span className="text-sm text-slate-500">No collaborators yet</span>}</div>{canInvite ? <Button variant="outline" size="sm" className="mt-4 w-full border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-violet-400/10" onClick={onInvite}><Mail /> Invite teammate</Button> : <p className="mt-4 text-xs leading-5 text-slate-500">Upgrade to Pro to collaborate with your team.</p>}</div><div className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] p-5 transition hover:border-violet-300/30 hover:bg-violet-400/10"><MessageCircle className="size-5 text-violet-300" /><p className="mt-3 text-sm font-medium text-white">{chatName}</p><p className="mt-1 text-xs leading-5 text-slate-400">Project conversations are available in the Chat tab.</p></div></aside>
}
export function ChatPanel({ token, projectId, chatName, messages, onSent }: { token: string; projectId: number; chatName: string; messages: Message[]; onSent: (message: Message) => void }) {
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
export function EmptyPanel({ text }: { text: string }) { return <p className="py-8 text-center text-sm text-slate-500">{text}</p> }

export function CreateIssueDialog({ token, projectId, isPro, onClose, onCreated }: { token: string; projectId: number; isPro: boolean; onClose: () => void; onCreated: (issue: Issue) => void }) {
  const { toast } = useToast()
  const [form, setForm] = useState<CreateIssueInput>({ title: "", description: "", status: "OPEN", projectId, priority: isPro ? "MEDIUM" : "NORMAL" })
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
  return <DialogShell onClose={onClose}><div className="mb-7"><p className="text-sm text-violet-300">Project workspace</p><h2 className="mt-2 text-2xl font-semibold text-white">Create an issue</h2></div><form className="space-y-4" onSubmit={submit}><Field label="Title" value={form.title} onChange={(value) => update("title", value)} placeholder="e.g. Improve onboarding flow" required /><Field label="Description" value={form.description} onChange={(value) => update("description", value)} placeholder="What needs to be done?" /><div className="grid grid-cols-2 gap-3"><label className="block text-sm text-slate-300">Status<select value={form.status} onChange={(event) => update("status", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></label><label className="block text-sm text-slate-300">Priority<select disabled={!isPro} value={form.priority} onChange={(event) => update("priority", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none"><option value="NORMAL">Normal</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label></div><Field label="Due date" type="datetime-local" value={form.dueDate ?? ""} onChange={(value) => update("dueDate", value)} placeholder="" disabled={!isPro} /><Button type="submit" disabled={busy} className="h-10 w-full bg-violet-500 hover:bg-violet-400">{busy ? "Creating..." : "Create issue"}</Button></form></DialogShell>
}

export function InviteUserDialog({ token, projectId, onClose }: { token: string; projectId: number; onClose: () => void }) {
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

