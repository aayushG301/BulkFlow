import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { LogOut, MailCheck, Moon } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { authApi } from '@/services/auth.api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ROUTES } from '@/constants/routes'

export function Settings() {
  const { user, logout } = useAuth()
  const { setPageHeader } = useOutletContext()
  const toast = useToast()
  const navigate = useNavigate()

  const [isResending, setIsResending] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setPageHeader({ breadcrumb: [{ label: 'Settings' }] })
  }, [setPageHeader])

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      await authApi.resendVerificationEmail(user.email)
      toast.success('Verification email sent.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not resend the verification email.'))
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  if (!user) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Verification, session, and appearance.</p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-md bg-surface-active">
              <MailCheck className="size-4 text-ink-muted" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Email verification</h2>
              <p className="mt-0.5 text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>
          <Badge tone={user.isEmailVerified ? 'completed' : 'warning'}>
            {user.isEmailVerified ? 'Verified' : 'Unverified'}
          </Badge>
        </div>

        {!user.isEmailVerified && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={handleResendVerification}
            isLoading={isResending}
          >
            Resend verification email
          </Button>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-surface-active">
            <Moon className="size-4 text-ink-muted" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Appearance</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              BulkFlow currently ships with a single dark, high-contrast theme.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Session</h2>
        <p className="mt-1 text-xs text-ink-muted">Sign out of BulkFlow on this device.</p>
        <Button variant="secondary" size="sm" icon={LogOut} className="mt-3" onClick={handleLogout} isLoading={isLoggingOut}>
          Log out
        </Button>
      </section>
    </div>
  )
}
