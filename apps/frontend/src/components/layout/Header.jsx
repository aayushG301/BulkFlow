import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Menu, Plus, Settings as SettingsIcon, UserCircle } from 'lucide-react'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { useAuth } from '@/hooks/useAuth'
import { getSocket } from '@/hooks/useJobSocket'
import { ROUTES } from '@/constants/routes'

export function Header({ breadcrumb, actions, onOpenMobileNav }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [socketConnected, setSocketConnected] = useState(false)

  // Reflects the real shared socket connection - not a decorative fake
  // metric - so this only reads "Live" when a room-level connection is
  // actually usable elsewhere in the app.
  useEffect(() => {
    const socket = getSocket()
    setSocketConnected(socket.connected)

    const handleConnect = () => setSocketConnected(true)
    const handleDisconnect = () => setSocketConnected(false)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-base-raised px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="rounded-md p-1.5 text-ink-muted hover:bg-surface-hover lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <Breadcrumbs items={breadcrumb} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={
            'hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-ink-muted sm:inline-flex'
          }
        >
          <span
            className={
              'size-1.5 rounded-full ' +
              (socketConnected ? 'bg-status-completed animate-pulse-dot' : 'bg-status-cancelled')
            }
          />
          {socketConnected ? 'Live Socket' : 'Socket Offline'}
        </span>

        {actions}

        <Button
          as="a"
          href={ROUTES.NEW_UPLOAD}
          onClick={(event) => {
            event.preventDefault()
            navigate(ROUTES.NEW_UPLOAD)
          }}
          variant="primary"
          size="sm"
          icon={Plus}
          className="max-sm:hidden"
        >
          New Upload
        </Button>

        <Dropdown
          trigger={
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent"
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'BF'}
            </button>
          }
        >
          {({ close }) => (
            <>
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-faint">{user?.email}</p>
              </div>
              <DropdownItem
                icon={UserCircle}
                onClick={() => {
                  close()
                  navigate(ROUTES.ACCOUNT)
                }}
              >
                Account
              </DropdownItem>
              <DropdownItem
                icon={SettingsIcon}
                onClick={() => {
                  close()
                  navigate(ROUTES.SETTINGS)
                }}
              >
                Settings
              </DropdownItem>
              <DropdownItem icon={LogOut} danger onClick={handleLogout}>
                Log out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  )
}
