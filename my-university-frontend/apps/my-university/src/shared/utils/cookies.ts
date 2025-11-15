const isBrowser = typeof document !== 'undefined';

type SameSitePolicy = 'lax' | 'strict' | 'none';

type CookieOptions = {
  maxAge?: number;
  expires?: Date;
  path?: string;
  secure?: boolean;
  sameSite?: SameSitePolicy;
};

const DEFAULT_PATH = '/';
const DEFAULT_SAME_SITE: SameSitePolicy = 'lax';

function formatSameSite(value: SameSitePolicy): string {
  switch (value) {
    case 'strict':
      return 'Strict';
    case 'none':
      return 'None';
    default:
      return 'Lax';
  }
}

function serializeCookie(name: string, value: string, options?: CookieOptions): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options?.maxAge !== undefined) {
    const maxAge = Math.max(0, Math.trunc(options.maxAge));
    parts.push(`Max-Age=${maxAge}`);
  }

  if (options?.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  const path = options?.path ?? DEFAULT_PATH;
  parts.push(`Path=${path}`);

  const sameSite = options?.sameSite ?? DEFAULT_SAME_SITE;
  parts.push(`SameSite=${formatSameSite(sameSite)}`);

  if (options?.secure === true) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function setCookie(name: string, value: string, options?: CookieOptions): void {
  if (!isBrowser) {
    return;
  }

  document.cookie = serializeCookie(name, value, options);
}

export function getCookie(name: string): string | null {
  if (!isBrowser) {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (const rawCookie of cookies) {
    const trimmedCookie = rawCookie.trim();
    if (trimmedCookie.startsWith(encodedName)) {
      return decodeURIComponent(trimmedCookie.slice(encodedName.length));
    }
  }

  return null;
}

export function removeCookie(name: string, options?: Omit<CookieOptions, 'maxAge' | 'expires'>): void {
  const removalOptions: CookieOptions = {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  };

  setCookie(name, '', removalOptions);
}
