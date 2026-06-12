import {
  ArrowLeft,
  Bell,
  Check,
  Download,
  Globe,
  Palette,
  X,
} from 'lucide-react';
import { useCallback, useEffect, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { usePushToggle } from '@/modules/push/hooks/use-push-toggle';
import { useInstallPrompt } from '@/modules/pwa/hooks/use-install-prompt';
import { useTheme } from '@/modules/users/hooks/use-theme';
import type { Theme } from '@/modules/users/interfaces/theme.type';
import { Switch } from '@/shared/ui/switch';

import {
  PUSH_TOGGLE_ERROR_I18N_KEY,
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
  THEME_ICON,
  type SupportedLanguageCode,
} from '../constants/settings.constants';

export function SettingsPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useCallback((): void => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/chats');
    }
  }, [location.key, navigate]);
  const currentLanguage = i18n.language.startsWith('ro') ? 'ro' : 'en';
  const pushToggle = usePushToggle();
  const theme = useTheme();
  const installPrompt = useInstallPrompt();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;
      event.preventDefault();
      goBack();
    }
    window.addEventListener('keydown', handleKeyDown);
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goBack]);

  function handleLanguageChange(code: SupportedLanguageCode): void {
    void i18n.changeLanguage(code);
  }

  function handleThemeChange(next: Theme): void {
    void theme.setTheme(next);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <header className="border-border bg-card sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={goBack}
          className="text-muted-foreground hover:bg-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-foreground text-base font-semibold">
          {t('settings.title')}
        </h2>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 lg:px-8">
        <div className="space-y-6">
          <section className="bg-card border-border rounded-xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">
                {t('settings.language.heading')}
              </h3>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">
              {t('settings.language.description')}
            </p>
            <ul className="space-y-1">
              {SUPPORTED_LANGUAGES.map(({ code, label }) => {
                const isActive = currentLanguage === code;
                return (
                  <li key={code}>
                    <button
                      type="button"
                      onClick={() => {
                        handleLanguageChange(code);
                      }}
                      className="hover:bg-secondary flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left transition-colors"
                    >
                      <span className="text-foreground text-sm">{label}</span>
                      {isActive && <Check className="text-primary h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="bg-card border-border rounded-xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="text-muted-foreground h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">
                {t('settings.theme.heading')}
              </h3>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">
              {t('settings.theme.description')}
            </p>
            <ul className="space-y-1">
              {SUPPORTED_THEMES.map(({ value, i18nKey }) => {
                const isActive = theme.theme === value;
                const Icon = THEME_ICON[value];
                return (
                  <li key={value}>
                    <button
                      type="button"
                      disabled={theme.isUpdating}
                      onClick={() => {
                        handleThemeChange(value);
                      }}
                      className="hover:bg-secondary flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="text-foreground inline-flex items-center gap-2 text-sm">
                        <Icon className="text-muted-foreground h-4 w-4" />
                        {t(i18nKey)}
                      </span>
                      {isActive && <Check className="text-primary h-4 w-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="bg-card border-border rounded-xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="text-muted-foreground h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">
                {t('settings.notifications.heading')}
              </h3>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">
              {t('settings.notifications.description')}
            </p>
            <div className="bg-secondary/50 flex items-center justify-between rounded-lg px-3 py-3">
              <span className="text-foreground text-sm">
                {t('settings.notifications.pushLabel')}
              </span>
              <Switch
                checked={pushToggle.state === 'on'}
                onCheckedChange={() => {
                  void pushToggle.toggle();
                }}
                disabled={
                  pushToggle.state === 'loading' ||
                  pushToggle.state === 'unsupported' ||
                  pushToggle.state === 'denied'
                }
                aria-label={t('settings.notifications.pushLabel')}
              />
            </div>
            {pushToggle.state === 'denied' && (
              <p className="text-muted-foreground mt-2 text-xs">
                {t('settings.notifications.deniedHint')}
              </p>
            )}
            {pushToggle.state === 'unsupported' && (
              <p className="text-muted-foreground mt-2 text-xs">
                {t('settings.notifications.unsupportedHint')}
              </p>
            )}
            {pushToggle.lastError !== null && (
              <div className="border-destructive/30 bg-destructive/10 mt-3 flex items-start justify-between gap-3 rounded-lg border px-3 py-2">
                <p className="text-destructive text-xs">
                  {t(PUSH_TOGGLE_ERROR_I18N_KEY[pushToggle.lastError])}
                </p>
                <button
                  type="button"
                  onClick={pushToggle.dismissError}
                  aria-label={t('settings.notifications.dismissError')}
                  className="text-destructive/70 hover:text-destructive shrink-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          <section className="bg-card border-border rounded-xl border p-5">
            <div className="mb-4 flex items-center gap-2">
              <Download className="text-muted-foreground h-4 w-4" />
              <h3 className="text-foreground text-sm font-semibold">
                {t('settings.install.heading')}
              </h3>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">
              {t('settings.install.description')}
            </p>
            {installPrompt.platform === 'installed' && (
              <p className="text-muted-foreground text-xs">
                {t('settings.install.installedHint')}
              </p>
            )}
            {installPrompt.platform === 'installable' && (
              <button
                type="button"
                onClick={() => {
                  void installPrompt.install();
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                {t('settings.install.installButton')}
              </button>
            )}
            {installPrompt.platform === 'ios' && (
              <p className="text-muted-foreground text-xs">
                {t('settings.install.iosInstructions')}
              </p>
            )}
            {installPrompt.platform === 'unsupported' && (
              <p className="text-muted-foreground text-xs">
                {t('settings.install.unsupportedHint')}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
