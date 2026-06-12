import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { NEXT_LANGUAGE } from '@/shared/constants/language-switcher.constants';
import { Button } from '@/shared/ui/button';

export function LanguageSwitcher(): ReactElement {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? 'ro';
  const next = NEXT_LANGUAGE[current] ?? 'ro';

  function toggle(): void {
    void i18n.changeLanguage(next);
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle}>
      {current.toUpperCase()}
    </Button>
  );
}
