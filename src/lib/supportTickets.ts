export type TicketStatus = 'open' | 'in_progress' | 'resolved'
export type TicketCategory = 'bug' | 'feature' | 'billing' | 'other'

export interface SupportTicket {
  id: string
  subject: string
  category: TicketCategory
  description: string
  status: TicketStatus
  createdAt: number
}

export const CATEGORY_META: Record<TicketCategory, { label: string }> = {
  bug: { label: 'Bug' },
  feature: { label: 'Feature Request' },
  billing: { label: 'Billing' },
  other: { label: 'Other' },
}

export const STATUS_META: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  open:        { label: 'Open',        color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  in_progress: { label: 'In Progress', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  resolved:    { label: 'Resolved',    color: '#16A34A', bg: '#ECFDF5', border: '#A7F3D0' },
}

const key = (email?: string | null) => `je-tickets-${email ?? 'guest'}`

export function loadTickets(email?: string | null): SupportTicket[] {
  try {
    return JSON.parse(localStorage.getItem(key(email)) ?? '[]')
  } catch {
    return []
  }
}

export function saveTickets(email: string | undefined | null, tickets: SupportTicket[]): void {
  localStorage.setItem(key(email), JSON.stringify(tickets))
}
