import { Check, Copy } from 'lucide-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopyWithFeedback } from '@/shared/hooks/use-copy-with-feedback';
import type { CopyableInfoRowProps } from '../interfaces/copyable-info-row-props.interface';

export function CopyableInfoRow({
  icon,
  label,
  value,
  multiline = false,
}: CopyableInfoRowProps): ReactElement {
  const { t } = useTranslation();
  const { isCopied, copy } = useCopyWithFeedback();

  return (
    <button
      type="button"
      onClick={() => {
        void copy(value);
      }}
      aria-label={t('common.copy.fieldLabel', { field: label })}
      className="hover:bg-secondary flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-foreground text-sm ${multiline ? 'whitespace-pre-wrap break-words' : 'truncate'}`}
        >
          {value}
        </p>
        <p className="text-muted-foreground text-xs">
          {isCopied ? t('common.copy.copied') : label}
        </p>
      </div>
      <span className="text-muted-foreground shrink-0">
        {isCopied ? (
          <Check className="text-emerald-600 h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </span>
    </button>
  );
}
