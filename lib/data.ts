import {
  Bell,
  Bot,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
  ShieldCheck,
  User,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Medical Chat', href: '/chat', icon: Bot },
  { label: 'Medical Report Analyzer', href: '/reports', icon: FileText },
  { label: 'Medical Image Analyzer', href: '/images', icon: ScanLine },
  { label: 'Emergency', href: '/emergency', icon: AlertTriangle },
  { label: 'History', href: '/history', icon: History },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Admin', href: '/admin', icon: ShieldCheck },
]

export const logoutNav: NavItem = {
  label: 'Logout',
  href: '/login',
  icon: LogOut,
}

export const mobileNav: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chat', href: '/chat', icon: Bot },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'History', href: '/history', icon: History },
  { label: 'Profile', href: '/profile', icon: User },
]

/* Current logged-in user
   This will be connected to the database/session later.
*/
export type CurrentUser = {
  id?: string
  name: string
  firstName: string
  email: string
  phone: string
  initials: string
  joined: string
  role?: 'USER' | 'ADMIN'
}

export const currentUser: CurrentUser = {
  name: '',
  firstName: '',
  email: '',
  phone: '',
  initials: '',
  joined: '',
  role: 'USER',
}

export type HistoryType = 'chat' | 'report' | 'image'
export type HistoryStatus = 'completed' | 'analyzed'

export type HistoryItem = {
  id: string
  type: HistoryType
  title: string
  date: string
  time: string
  status: HistoryStatus
}

/* Real history will come from the database */
export const historyItems: HistoryItem[] = []

/* Real conversations will come from the database */
export const conversations = []

export const suggestedPrompts = [
  'What do these medical terms mean?',
  'How can I prepare questions for my doctor?',
  'Can you explain this medical report?',
  'Help me understand my lab results.',
]

export type NotificationKind =
  | 'report'
  | 'message'
  | 'image'
  | 'system'

export type NotificationItem = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  time: string
  unread: boolean
}

/* Real notifications will come from the database */
export const notifications: NotificationItem[] = []

export type AdminUser = {
  id: string
  name: string
  email: string
  phone: string
  role: 'User' | 'Admin'
  active: boolean
}

/* Real admin users will come from the database */
export const adminUsers: AdminUser[] = []