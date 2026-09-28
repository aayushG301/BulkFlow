import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { KeyRound, Save, Trash2 } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { authApi } from '@/services/auth.api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { validatePasswordChangeForm, hasErrors } from '@/utils/validators'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { formatDate } from '@/utils/formatDate'
import { ROUTES } from '@/constants/routes'

export function Account() {
  const { user, updateProfile, logout } = useAuth()
  const { setPageHeader } = useOutletContext()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setPageHeader({ breadcrumb: [{ label: 'Account' }] })
  }, [setPageHeader])

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    if (!name.trim()) return

    setIsSavingProfile(true)
    try {
      await updateProfile({ name: name.trim() })
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update your profile.'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    const validationErrors = validatePasswordChangeForm(passwordForm)
    setPasswordErrors(validationErrors)
    if (hasErrors(validationErrors)) return

    setIsChangingPassword(true)
    try {
      await authApi.changePassword(passwordForm)
      toast.success('Password changed.')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change your password.'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await authApi.deleteMe()
      await logout()
      toast.success('Your account has been deactivated.')
      navigate(ROUTES.LOGIN)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete your account.'))
      setIsDeleting(false)
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Account</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your profile and security settings.</p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
          <Badge tone={user.isEmailVerified ? 'completed' : 'warning'}>
            {user.isEmailVerified ? 'Email verified' : 'Email unverified'}
          </Badge>
        </div>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Email" value={user.email} disabled readOnly hint="Email cannot be changed" />
          <Input label="Member since" value={formatDate(user.createdAt)} disabled readOnly />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" icon={Save} isLoading={isSavingProfile}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Change password</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
            }
            error={passwordErrors.currentPassword}
          />
          <Input
            label="New password"
            type="password"
            hint={!passwordErrors.newPassword ? 'At least 8 characters' : undefined}
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
            }
            error={passwordErrors.newPassword}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" icon={KeyRound} isLoading={isChangingPassword}>
              Update password
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-status-failed/30 bg-status-failed-soft p-5">
        <h2 className="text-sm font-semibold text-status-failed">Danger zone</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Deactivating your account signs you out everywhere and disables sign-in.
        </p>
        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          className="mt-3"
          onClick={() => setConfirmDelete(true)}
        >
          Delete account
        </Button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This deactivates your account immediately. This can't be undone from here."
        confirmLabel="Delete account"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
