import type { Page } from "@/app/types"

export type Route = { page: Page; projectId: number | null; invitationToken: string | null }

export const PAYMENT_SUCCESS_PATH = import.meta.env.VITE_PAYMENT_SUCCESS_PATH ?? "/upgrade_plan/success"

export function getRoute(): Route {
  const hash = window.location.hash
  const match = hash.match(/^#project\/(\d+)$/)
  if (match) return { page: "details", projectId: Number(match[1]), invitationToken: null }
  const invitationMatch = hash.match(/^#accept-invitation\?token=([^&]+)$/)
  const pathInvitationToken = window.location.pathname === "/accept-invitation" ? new URLSearchParams(window.location.search).get("token") : null
  if (invitationMatch || pathInvitationToken) return { page: "accept-invitation", projectId: null, invitationToken: decodeURIComponent(invitationMatch?.[1] ?? pathInvitationToken ?? "") }
  if (window.location.pathname === PAYMENT_SUCCESS_PATH) return { page: "payment-result", projectId: null, invitationToken: null }
  return { page: hash === "#projects" ? "projects" : hash === "#pricing" ? "pricing" : "home", projectId: null, invitationToken: null }
}
