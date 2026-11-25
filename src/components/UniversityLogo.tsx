'use client';

import { useState } from 'react';
import { findUniversity, type NigerianUniversity } from '@/lib/universities';

interface UniversityLogoProps {
  university?: NigerianUniversity | string | null;
  size?: number;
  className?: string;
}

export function UniversityLogo({ university, size = 22, className = '' }: UniversityLogoProps) {
  const uni = typeof university === 'string' ? findUniversity(university) : university;
  const [imgError, setImgError] = useState(false);

  if (uni?.logoUrl && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={uni.logoUrl}
        alt={uni.shortName}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`inline-block shrink-0 rounded-full bg-white object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const primary = uni?.colors[0] ?? '#0A7D3E';
  const secondary = uni?.colors[1] ?? '#FFD23F';
  const mono = (uni?.monogram ?? 'UNI').slice(0, 3);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* University Crest / Flag Shield */}
      <path
        d="M4 4.5C4 3.67 4.67 3 5.5 3h17c.83 0 1.5.67 1.5 1.5v10.2c0 5.1-3.9 8.7-10 10.8C7.9 23.4 4 19.8 4 14.7V4.5z"
        fill={primary}
        stroke={secondary}
        strokeWidth="1.6"
      />
      {/* Diagonal Sash */}
      <path
        d="M4.8 11.5L23.2 6.5v4L4.8 15.5z"
        fill={secondary}
        opacity="0.28"
      />
      {/* Monogram */}
      <text
        x="14"
        y="16.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={mono.length >= 3 ? '7.5' : '9'}
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        {mono}
      </text>
    </svg>
  );
}
