import React, { useState } from 'react';
import { CountryTeam } from '../types';

export const COUNTRY_FLAG_CODES: Record<string, string> = {
  turkiye: 'tr',
  brezilya: 'br',
  arjantin: 'ar',
  almanya: 'de',
  fransa: 'fr',
  ingiltere: 'gb-eng',
  ispanya: 'es',
  italya: 'it',
  portekiz: 'pt',
  hollanda: 'nl',
  belcika: 'be',
  hirvatistan: 'hr',
  japonya: 'jp',
  guney_kore: 'kr',
  abd: 'us',
  meksika: 'mx',
  fas: 'ma',
  senegal: 'sn',
  nijerya: 'ng',
  misir: 'eg',
  uruguay: 'uy',
  kolombiya: 'co',
  sili: 'cl',
  isvicre: 'ch',
  isvec: 'se',
  norvec: 'no',
  danimarka: 'dk',
  avusturya: 'at',
  polonya: 'pl',
  cekya: 'cz',
  sirbistan: 'rs',
  yunanistan: 'gr',
  macaristan: 'hu',
  kanada: 'ca',
  avustralya: 'au',
  suudi_arabistan: 'sa',
  katar: 'qa',
  iran: 'ir',
  gana: 'gh',
  kamerun: 'cm',
};

export const getCountryFlagCode = (teamOrId?: CountryTeam | { id?: string; flagCode?: string } | string | null): string => {
  if (!teamOrId) return '';
  if (typeof teamOrId === 'string') {
    return COUNTRY_FLAG_CODES[teamOrId] || teamOrId.toLowerCase();
  }
  if (teamOrId.flagCode) return teamOrId.flagCode.toLowerCase();
  if (teamOrId.id && COUNTRY_FLAG_CODES[teamOrId.id]) return COUNTRY_FLAG_CODES[teamOrId.id];
  return '';
};

export const getCountryFlagUrl = (teamOrId?: CountryTeam | { id?: string; flagCode?: string } | string | null): string => {
  const code = getCountryFlagCode(teamOrId);
  if (!code) return '';
  return `https://flagcdn.com/w80/${code}.png`;
};

interface CountryFlagProps {
  team?: CountryTeam | { id?: string; name?: string; flag?: string; flagCode?: string } | null;
  countryId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'flag' | 'circle' | 'rounded';
  className?: string;
  alt?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  team,
  countryId,
  size = 'md',
  shape = 'flag',
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  const id = countryId || team?.id || '';
  const code = getCountryFlagCode(team || id);
  const teamName = team?.name || id || 'Ülke';
  const imgUrl = code ? `https://flagcdn.com/w80/${code}.png` : '';

  // Dimension classes based on size & shape
  let sizeClasses = '';
  if (shape === 'circle') {
    switch (size) {
      case 'xs':
        sizeClasses = 'w-4 h-4 text-[10px]';
        break;
      case 'sm':
        sizeClasses = 'w-6 h-6 text-xs';
        break;
      case 'md':
        sizeClasses = 'w-8 h-8 text-sm';
        break;
      case 'lg':
        sizeClasses = 'w-12 h-12 text-xl';
        break;
      case 'xl':
        sizeClasses = 'w-16 h-16 text-2xl';
        break;
    }
  } else {
    // Flag or rounded rectangular ratio ~ 3:2
    switch (size) {
      case 'xs':
        sizeClasses = 'w-4 h-2.5';
        break;
      case 'sm':
        sizeClasses = 'w-5 h-3.5';
        break;
      case 'md':
        sizeClasses = 'w-7 h-5';
        break;
      case 'lg':
        sizeClasses = 'w-10 h-7';
        break;
      case 'xl':
        sizeClasses = 'w-14 h-9.5';
        break;
    }
  }

  const shapeClasses =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? 'rounded-md'
      : 'rounded-sm';

  if (!imgUrl || hasError) {
    // Fallback: render emoji or colored badge
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden font-bold select-none ${sizeClasses} ${shapeClasses} ${className}`}
        title={teamName}
      >
        {team?.flag || '🏳️'}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none border border-white/25 shadow-sm bg-slate-900/60 ${sizeClasses} ${shapeClasses} ${className}`}
      title={teamName}
    >
      <img
        src={imgUrl}
        alt={alt || `${teamName} Bayrağı`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover block select-none pointer-events-none"
      />
    </div>
  );
};
