export type User = {
  id?: number
  fullName: string
  email: string
}

export type Project = {
  id: number
  name: string
  description: string
  category: string
  tags: string[]
  issues?: unknown[]
  team?: User[]
  owner?: User
}

export type Issue = {
  id: number
  title: string
  description: string
  status: string
  priority: string
  dueDate?: string
  createdAt?: string
  tags: string[]
  assignee?: User
}

export type Comment = {
  id: number
  content: string
  createdAt?: string
  user?: User
}

export type Message = {
  id: number
  content: string
  createdAt?: string
  sender?: User
}

export type Chat = {
  id: number
  name: string
  users?: User[]
}

export type Invitation = {
  id: number
  token: string
  email: string
  projectId: number
}

export type CreateIssueInput = {
  title: string
  description: string
  status: string
  projectId: number
  priority: string
  dueDate?: string
}

export type PricingPlan = {
  planType: "FREE" | "MONTHLY" | "ANNUALLY"
  name: string
  monthlyPrice: number
  annualPrice: number
  annualDiscountPercent: number
  features: string[]
}

export type Subscription = {
  id: number
  subscriptionStartDate: string
  subscriptionEndDate: string
  planType: PricingPlan["planType"]
  valid: boolean
  cancelAtPeriodEnd: boolean
}

type AuthResponse = {
  jwt: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function getErrorMessage(status: number, body: string) {
  if (status === 401) return "Your session has expired. Please sign in again."
  if (status === 403) return "You do not have permission to perform this action."
  if (status === 404) return "The requested resource could not be found."
  if (status >= 500) return "The server could not complete that request. Please try again."

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string }
    const parsedMessage = parsed.message ?? parsed.error
    if (parsedMessage) return parsedMessage
  } catch {
    // The backend may return plain text for validation errors.
  }

  return body.length > 160 ? "Please check your details and try again." : body || "Request failed."
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new ApiError(getErrorMessage(response.status, message), response.status)
  }

  return response.json() as Promise<T>
}

export async function login(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function register(fullName: string, email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password }),
  })
}

export function getProfile(token: string) {
  return request<User>("/api/users/profile", {}, token)
}

export function getPricing() {
  return request<PricingPlan[]>("/api/pricing")
}

export function getSubscription(token: string) {
  return request<Subscription>("/api/subscriptions/user", {}, token)
}

export function cancelSubscription(token: string) {
  return request<Subscription>("/api/subscriptions/cancel", { method: "PATCH" }, token)
}

export type PaymentLink = {
  paymentLinkUrl: string
  paymentId: string
}

export function createPaymentLink(token: string, planType: PricingPlan["planType"]) {
  return request<PaymentLink>(`/api/payments/${encodeURIComponent(planType)}`, { method: "POST" }, token)
}

export function verifyPayment(
  token: string,
  paymentLinkId: string,
  planType: PricingPlan["planType"],
) {
  return request<Subscription>(
    `/api/payments/verify?paymentLinkId=${encodeURIComponent(paymentLinkId)}&planType=${encodeURIComponent(planType)}`,
    { method: "POST" },
    token,
  )
}

export function getProjects(token: string, keyword?: string) {
  const path = keyword
    ? `/api/projects/search?keyword=${encodeURIComponent(keyword)}`
    : "/api/projects"
  return request<Project[]>(path, {}, token)
}

export function createProject(
  token: string,
  project: Pick<Project, "name" | "description" | "category" | "tags">,
) {
  return request<Project>(
    "/api/projects",
    {
      method: "POST",
      body: JSON.stringify(project),
    },
    token,
  )
}

export function deleteProject(token: string, projectId: number) {
  return request<{ message: string }>(`/api/projects/${projectId}`, { method: "DELETE" }, token)
}

export function getProject(token: string, projectId: number) {
  return request<Project>(`/api/projects/${projectId}`, {}, token)
}

export function getIssues(token: string, projectId: number) {
  return request<Issue[]>(`/api/issues/project/${projectId}`, {}, token)
}

export function getProjectChat(token: string, projectId: number) {
  return request<Chat>(`/api/projects/${projectId}/chat`, {}, token)
}

export function getMessages(token: string, projectId: number) {
  return request<Message[]>(`/api/messages/chat/${projectId}`, {}, token)
}

export function getComments(token: string, issueId: number) {
  return request<Comment[]>(`/api/comments/${issueId}`, {}, token)
}

export function createIssue(token: string, issue: CreateIssueInput) {
  return request<Issue>("/api/issues", {
    method: "POST",
    body: JSON.stringify(issue),
  }, token)
}

export function assignIssue(token: string, issueId: number, userId: number) {
  return request<Issue>(`/api/issues/${issueId}/assignee/${userId}`, { method: "PUT" }, token)
}

export function createComment(token: string, issueId: number, content: string) {
  return request<Comment>("/api/comments", {
    method: "POST",
    body: JSON.stringify({ issueId, content }),
  }, token)
}

export function createMessage(token: string, projectId: number, content: string) {
  return request<Message>("/api/messages/send", {
    method: "POST",
    body: JSON.stringify({ projectId, content }),
  }, token)
}

export function inviteUser(token: string, projectId: number, email: string) {
  return request<{ message: string }>("/api/projects/invite", {
    method: "POST",
    body: JSON.stringify({ projectId, email }),
  }, token)
}

export function acceptInvitation(token: string, invitationToken: string) {
  return request<Invitation>(
    `/api/projects/accept-invitation?token=${encodeURIComponent(invitationToken)}`,
    {},
    token,
  )
}
