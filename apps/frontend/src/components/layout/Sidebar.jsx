import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  Table2,
  UserCircle,
} from 'lucide-react'
import clsx from 'clsx'

import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutGrid },
  { to: ROUTES.NEW_UPLOAD, label: 'New Upload', icon: Plus },
  { to: ROUTES.JOBS, label: 'Jobs', icon: ListChecks },
  { to: ROUTES.RESULTS, label: 'Results', icon: Table2 },
  { to: ROUTES.AI_ENRICHMENT, label: 'AI Enrichment', icon: Sparkles, tag: 'Beta' },
]

const FOOTER_ITEMS = [
  { to: ROUTES.ACCOUNT, label: 'Account', icon: UserCircle },
  { to: ROUTES.HELP, label: 'Help', icon: LifeBuoy },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: SettingsIcon },
]

function NavItem({ to, label, icon: Icon, tag }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent-soft text-accent'
            : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {tag && (
        <span className="rounded-full bg-surface-active px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          {tag}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-base-raised">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="" className="size-8 rounded-md" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-ink">BulkFlow</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              Enterprise Ingestion
            </span>
          </div>
        </div>

        <NavLink
          to={ROUTES.NEW_UPLOAD}
          className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent text-sm font-semibold text-[#04141a] transition-colors hover:bg-accent-strong"
        >
          <Plus className="size-4" />
          New Upload
        </NavLink>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border px-3 py-3">
        {FOOTER_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted"
        >
          <BookOpen className="size-3.5" />
          Docs
        </a>
        <span className="flex items-center gap-1.5 text-xs text-ink-faint">
          <span className="size-1.5 rounded-full bg-status-completed" />
          Status
        </span>
      </div>

      {user && (
        <NavLink
          to={ROUTES.ACCOUNT}
          className="flex items-center gap-2.5 border-t border-border px-4 py-3 hover:bg-surface-hover"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
            {user.name?.slice(0, 2).toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm text-ink">{user.name}</span>
            <span className="truncate text-xs text-ink-faint">{user.email}</span>
          </div>
        </NavLink>
      )}
    </aside>
  )
}
