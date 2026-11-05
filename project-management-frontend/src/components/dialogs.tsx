import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { createProject, type Project } from "@/lib/api"
import type { AuthMode } from "@/app/types"

export function AuthDialog({ mode, onModeChange, onClose, onAuthenticated }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onClose: () => void; onAuthenticated: (email: string, password: string, fullName: string) => Promise<void> }) {
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

export function CreateProjectDialog({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: (project: Project) => void }) {
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

export function DialogShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#101522] p-6 shadow-2xl"><button className="absolute right-4 top-4 rounded-md p-1 text-slate-500 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close dialog"><X className="size-4" /></button>{children}</div></div> }
export function Field({ label, value, onChange, placeholder, type = "text", required, disabled }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean; disabled?: boolean }) { return <label className="block text-sm text-slate-300">{label}<input disabled={disabled} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50" /></label> }
