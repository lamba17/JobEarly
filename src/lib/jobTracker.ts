export type Status = 'wishlist' | 'applied' | 'phone_screen' | 'interview' | 'final_round' | 'offer' | 'rejected' | 'withdrawn'
export type Portal = 'linkedin' | 'indeed' | 'naukri' | 'company' | 'referral' | 'other'

export interface JobApplication {
  id: string
  company: string
  role: string
  location: string
  portal: Portal
  dateApplied: string
  status: Status
  salary: string
  notes: string
  followUpDate: string
  createdAt: number
}

export const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  wishlist:     { label: 'Wishlist',     color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' },
  applied:      { label: 'Applied',      color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  phone_screen: { label: 'Phone Screen', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  interview:    { label: 'Interview',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  final_round:  { label: 'Final Round',  color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  offer:        { label: 'Offer',        color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  rejected:     { label: 'Rejected',     color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  withdrawn:    { label: 'Withdrawn',    color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
}

export const PORTAL_META: Record<Portal, { label: string; color: string }> = {
  linkedin: { label: 'LinkedIn',        color: '#0A66C2' },
  indeed:   { label: 'Indeed',          color: '#003A9B' },
  naukri:   { label: 'Naukri',          color: '#FF7555' },
  company:  { label: 'Company Website', color: '#10B981' },
  referral: { label: 'Referral',        color: '#8B5CF6' },
  other:    { label: 'Other',           color: '#6B7280' },
}

export const ALL_STATUSES = Object.keys(STATUS_META) as Status[]
export const ALL_PORTALS = Object.keys(PORTAL_META) as Portal[]

export function jobTrackerKey(email?: string | null): string {
  return `je-tracker-${email ?? 'guest'}`
}

export function loadJobs(email?: string | null): JobApplication[] {
  try {
    return JSON.parse(localStorage.getItem(jobTrackerKey(email)) ?? '[]')
  } catch {
    return []
  }
}
