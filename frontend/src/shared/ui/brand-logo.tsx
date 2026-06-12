import type { ReactElement } from 'react';

import type { BrandLogoProps } from '@/shared/interfaces/brand-logo-props.interface';

export function BrandLogo({
  size = 32,
  ...rest
}: BrandLogoProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
      {...rest}
    >
      <defs>
        <linearGradient
          id="chatrix-brand-bg"
          x1="74"
          y1="58"
          x2="452"
          y2="454"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7E99F4" />
          <stop offset="1" stopColor="#8E72EF" />
        </linearGradient>
      </defs>
      <rect
        x="48"
        y="48"
        width="416"
        height="416"
        rx="92"
        fill="url(#chatrix-brand-bg)"
      />
      <rect x="152" y="152" width="52" height="52" rx="12" fill="#FFFFFF" />
      <rect x="228" y="152" width="52" height="52" rx="12" fill="#FFFFFF" />
      <rect x="304" y="152" width="52" height="52" rx="12" fill="#FFFFFF" />
      <rect x="152" y="228" width="52" height="52" rx="12" fill="#FFFFFF" />
      <rect x="152" y="304" width="52" height="52" rx="12" fill="#FFFFFF" />
      <rect x="228" y="304" width="52" height="52" rx="12" fill="#FFFFFF" />
      <rect x="304" y="304" width="52" height="52" rx="12" fill="#FFFFFF" />
    </svg>
  );
}
