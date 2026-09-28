import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, User, UserPlus } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { validateRegisterForm, hasErrors } from '@/utils/validators'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ROUTES } from '@/constants/routes'
import { AuthShell } from '@/pages/auth/Login'

export function Register() {
  const { register, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateRegisterForm(form)
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return

    setIsSubmitting(true)
    try {
      await register(form)
      await login({ email: form.email, password: form.password })
      toast.success('Welcome to BulkFlow!')
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start ingesting and monitoring bulk data in minutes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          icon={User}
          autoComplete="name"
          value={form.name}
          onChange={updateField('name')}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          value={form.email}
          onChange={updateField('email')}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={!errors.password ? 'At least 8 characters' : undefined}
          value={form.password}
          onChange={updateField('password')}
          error={errors.password}
        />

        <Button type="submit" variant="primary" icon={UserPlus} isLoading={isSubmitting} className="mt-1">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
