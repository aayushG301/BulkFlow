import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Mail } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { validateLoginForm, hasErrors } from '@/utils/validators'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ROUTES } from '@/constants/routes'

export function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateLoginForm(form)
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return

    setIsSubmitting(true)
    try {
      await login(form)
      const redirectTo = location.state?.from?.pathname || ROUTES.DASHBOARD
      navigate(redirectTo, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not log you in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Sign in to BulkFlow"
      subtitle="Monitor and manage your data ingestion pipelines."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          icon={Mail}
          value={form.email}
          onChange={updateField('email')}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={updateField('password')}
          error={errors.password}
        />

        <Button type="submit" variant="primary" icon={LogIn} isLoading={isSubmitting} className="mt-1">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src="/logo.svg" alt="BulkFlow" className="size-11 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold text-ink">{title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-panel">{children}</div>
      </div>
    </div>
  )
}
