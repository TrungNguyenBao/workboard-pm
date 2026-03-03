import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from '@/shared/components/ui/toast'
import { AuthLayout } from '../components/auth-layout'

type FormData = { email: string; password: string }

export default function LoginPage() {
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const schema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/')
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({ title: t('auth.loginFailed'), description: detail ?? t('auth.pleaseTryAgain'), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Mobile-only logo */}
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white text-lg font-bold">
          W
        </div>
      </div>

      <h1 className="text-xl font-semibold text-foreground mb-1">{t('auth.welcomeBack')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('auth.signInDescription')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" autoComplete="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} />
          {errors.email && <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('auth.signingIn')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('auth.dontHaveAccount')}{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          {t('auth.signUp')}
        </Link>
      </p>
    </AuthLayout>
  )
}
