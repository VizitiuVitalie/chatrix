import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { requestNotificationPermissionIfDefault } from '@/modules/push/helpers/request-notification-permission.helper';
import { InstallBanner } from '@/modules/pwa/components/install-banner';
import {
  getErrorMessage,
  isThrottleError,
} from '@/shared/api/helpers/api-error.helper';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { BrandLogo } from '@/shared/ui/brand-logo';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { LanguageSwitcher } from '@/shared/ui/language-switcher';

import { buildLoginSchema } from '../helpers/build-login-schema.helper';
import { scrollFormIntoViewOnMobile } from '../helpers/scroll-form-into-view-on-mobile.helper';
import type { LoginFormData } from '../interfaces/login-form-data.interface';

export function LoginPage(): ReactElement {
  const { t } = useTranslation();
  const { login, bootError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const loginSchema = useMemo(() => buildLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  async function onSubmit(data: LoginFormData): Promise<void> {
    setSubmitError(null);
    try {
      void requestNotificationPermissionIfDefault();
      await login(data);
    } catch (error) {
      setSubmitError(
        isThrottleError(error)
          ? t('auth.errors.tooManyAttempts')
          : getErrorMessage(error),
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm select-none lg:mx-0">
      <div className="flex items-center gap-3">
        <BrandLogo size={44} className="shrink-0 drop-shadow-sm" />
        <span className="text-foreground text-xl font-bold tracking-tight">
          {t('common.appName')}
        </span>
        <div className="ml-auto">
          <LanguageSwitcher />
        </div>
      </div>

      <h1 className="text-foreground mt-6 text-2xl font-bold leading-tight lg:mt-12 lg:text-[36px]">
        {t('auth.welcomeBack')}
      </h1>
      <p className="text-muted-foreground mt-2 hidden max-w-sm text-sm lg:mt-3 lg:block">
        {t('auth.welcomeBackSubtitle')}
      </p>

      {bootError !== null && (
        <Alert variant="destructive" className="mt-4 lg:mt-6">
          <AlertDescription>{bootError}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 lg:mt-10">
        <InstallBanner />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onFocus={scrollFormIntoViewOnMobile}
        className="space-y-4 lg:space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="username">{t('auth.username')}</Label>
          <div className="relative">
            <User className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={!!errors.username}
              className="h-12 select-text rounded-xl pl-11"
              {...register('username')}
            />
          </div>
          {errors.username && (
            <p className="text-destructive text-sm">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Lock className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-12 select-text rounded-xl pl-11 pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? t('auth.hidePassword') : t('auth.showPassword')
              }
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-xl text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? t('common.loading') : t('common.login')}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {t('auth.noAccount')}{' '}
        <Link
          to="/register"
          draggable={false}
          className="text-primary font-medium hover:underline"
        >
          {t('common.register')}
        </Link>
      </p>
    </div>
  );
}
