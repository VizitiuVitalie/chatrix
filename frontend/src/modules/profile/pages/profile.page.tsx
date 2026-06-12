import { ArrowLeft, Check, Copy, Loader2 } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useClearMyAvatarMutation } from '@/modules/files/hooks/use-clear-my-avatar-mutation';
import { useUploadMyAvatarMutation } from '@/modules/files/hooks/use-upload-my-avatar-mutation';
import {
  BIO_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from '@/modules/users/constants/users.constants';
import { useUpdateMeMutation } from '@/modules/users/hooks/use-update-me-mutation';
import { getErrorMessage } from '@/shared/api/helpers/api-error.helper';
import { useBackendHealth } from '@/shared/hooks/use-backend-health';
import { useCopyWithFeedback } from '@/shared/hooks/use-copy-with-feedback';
import { Input } from '@/shared/ui/input';

import { ProfileAvatarEditor } from '../components/profile-avatar-editor';
import { ProfileFilesList } from '../components/profile-files-list';
import { ProfileStorageCard } from '../components/profile-storage-card';
import { SAVED_HINT_MS } from '../constants/profile.constants';
import type { ProfileAvatarEditorTarget } from '../interfaces/profile-avatar-editor-target.type';

export function ProfilePage(): ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useCallback((): void => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/chats');
    }
  }, [location.key, navigate]);

  const updateMeMutation = useUpdateMeMutation();
  const uploadAvatarMutation = useUploadMyAvatarMutation();
  const clearAvatarMutation = useClearMyAvatarMutation();
  const backendHealth = useBackendHealth();
  const isOnline = backendHealth === 'online';

  const [nickname, setNickname] = useState<string>(user?.nickname ?? '');
  const [bio, setBio] = useState<string>(user?.bio ?? '');
  const [pendingAvatar, setPendingAvatar] =
    useState<ProfileAvatarEditorTarget>('unchanged');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const { isCopied, copy } = useCopyWithFeedback();

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname);
    setBio(user.bio ?? '');
  }, [user?.id, user?.nickname, user?.bio]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    if (savedAt === null) return;
    const handle = window.setTimeout(() => {
      setSavedAt(null);
    }, SAVED_HINT_MS);
    return (): void => {
      window.clearTimeout(handle);
    };
  }, [savedAt]);

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

  const trimmedNickname = nickname.trim();
  const trimmedBio = bio.trim();

  const hasFieldChanges = useMemo(() => {
    if (!user) return false;
    return trimmedNickname !== user.nickname || trimmedBio !== (user.bio ?? '');
  }, [user, trimmedNickname, trimmedBio]);

  const hasAvatarChange = pendingAvatar !== 'unchanged';
  const hasChanges = hasFieldChanges || hasAvatarChange;

  const isSaving =
    updateMeMutation.isPending ||
    uploadAvatarMutation.isPending ||
    clearAvatarMutation.isPending;
  const canSubmit = hasChanges && !isSaving && fieldError === null;

  const handleCopyUsername = useCallback((): void => {
    if (!user) return;
    void copy(user.username);
  }, [copy, user]);

  function validate(): boolean {
    if (trimmedNickname.length === 0) {
      setFieldError(t('profile.errors.nicknameRequired'));
      return false;
    }
    if (trimmedNickname.length < NICKNAME_MIN_LENGTH) {
      setFieldError(t('profile.errors.nicknameTooShort'));
      return false;
    }
    if (!/^\S(.*\S)?$/.test(trimmedNickname)) {
      setFieldError(t('profile.errors.nicknameWhitespace'));
      return false;
    }
    if (trimmedBio.length > BIO_MAX_LENGTH) {
      setFieldError(t('profile.errors.bioTooLong'));
      return false;
    }
    setFieldError(null);
    return true;
  }

  async function submit(): Promise<void> {
    if (!user) return;
    setSubmitError(null);
    if (!validate()) return;

    try {
      if (pendingAvatar instanceof File) {
        await uploadAvatarMutation.mutateAsync(pendingAvatar);
        setPendingAvatar('unchanged');
      } else if (pendingAvatar === 'clear') {
        await clearAvatarMutation.mutateAsync();
        setPendingAvatar('unchanged');
      }

      if (hasFieldChanges) {
        await updateMeMutation.mutateAsync({
          nickname: trimmedNickname,
          bio: trimmedBio.length === 0 ? null : trimmedBio,
        });
      }

      setSavedAt(Date.now());
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  }

  if (!user) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
        {t('common.loading')}
      </div>
    );
  }

  const displayName = user.nickname.length > 0 ? user.nickname : user.username;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto lg:overflow-hidden">
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
          {t('profile.title')}
        </h2>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:min-h-0 lg:overflow-hidden lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="space-y-6 pb-[72px] lg:min-h-0 lg:overflow-y-auto lg:pb-0"
          >
            <section className="bg-card border-border flex flex-col items-center gap-4 rounded-2xl border p-6">
              <ProfileAvatarEditor
                user={user}
                pendingTarget={pendingAvatar}
                onPendingChange={setPendingAvatar}
                isSaving={isSaving}
              />
              <h3 className="text-foreground text-xl font-semibold">
                {displayName}
              </h3>
              <span
                className={
                  isOnline
                    ? 'text-[color:var(--color-online)] text-sm font-medium'
                    : 'text-muted-foreground text-sm'
                }
                aria-live="polite"
              >
                {isOnline ? t('account.online') : t('account.offline')}
              </span>
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  aria-label={t('common.copy.usernameLabel')}
                  className="text-muted-foreground hover:bg-secondary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm transition-colors"
                >
                  @{user.username}
                  {isCopied ? (
                    <Check className="text-emerald-600 h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                {isCopied && (
                  <span className="text-emerald-600 text-xs">
                    {t('common.copy.copied')}
                  </span>
                )}
              </div>
            </section>

            <section className="bg-card border-border space-y-4 rounded-2xl border p-6">
              <div>
                <label
                  htmlFor="profile-username"
                  className="text-muted-foreground mb-1 block text-xs font-semibold uppercase tracking-wide"
                >
                  {t('profile.fields.username')}
                </label>
                <Input
                  id="profile-username"
                  type="text"
                  value={user.username}
                  readOnly
                  className="bg-secondary text-muted-foreground cursor-not-allowed"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  {t('profile.fields.usernameHint')}
                </p>
              </div>

              <div>
                <label
                  htmlFor="profile-nickname"
                  className="text-foreground mb-1 block text-sm font-semibold"
                >
                  {t('profile.fields.nickname')}
                </label>
                <Input
                  id="profile-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setFieldError(null);
                  }}
                  maxLength={NICKNAME_MAX_LENGTH}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-bio"
                  className="text-foreground mb-1 flex items-center justify-between text-sm font-semibold"
                >
                  <span>{t('profile.fields.bio')}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {trimmedBio.length}/{BIO_MAX_LENGTH}
                  </span>
                </label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setFieldError(null);
                  }}
                  maxLength={BIO_MAX_LENGTH}
                  disabled={isSaving}
                  placeholder={t('profile.fields.bioPlaceholder')}
                  rows={3}
                  className="bg-card border-border focus:ring-ring text-foreground w-full select-text resize-y rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {fieldError !== null && (
                <p className="text-destructive text-sm">{fieldError}</p>
              )}
              {submitError !== null && (
                <p className="text-destructive text-sm">{submitError}</p>
              )}
            </section>

            <div className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-end gap-3 border-t border-border/80 bg-card/85 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl lg:sticky lg:left-auto lg:right-auto lg:z-auto lg:rounded-xl lg:border lg:px-4 lg:pb-3">
              {savedAt !== null && !isSaving && submitError === null && (
                <span className="text-emerald-600 text-sm">
                  {t('profile.savedHint')}
                </span>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('profile.actions.save')}
              </button>
            </div>
          </form>

          <div className="space-y-3 pb-[72px] lg:flex lg:min-h-0 lg:flex-col lg:space-y-6 lg:pb-0">
            <ProfileStorageCard />
            <ProfileFilesList />
          </div>
        </div>
      </div>
    </div>
  );
}
