/**
 * Утилиты для работы с JWT токенами
 */

/**
 * Декодирует JWT токен и возвращает payload
 * ВАЖНО: Не проверяет подпись, только декодирует base64
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Правильное декодирование base64 с поддержкой UTF-8
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    
    // Преобразуем бинарную строку в UTF-8
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Декодируем UTF-8
    const decoded = new TextDecoder('utf-8').decode(bytes);
    
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (error) {
    console.error('[JWT] Failed to decode token:', error);
    return null;
  }
}

/**
 * Получает ID пользователя из JWT токена
 * Ищет в стандартных claims: sub, nameid, или http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier
 */
export function getUserIdFromToken(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  
  if (!payload) {
    console.warn('[JWT] Failed to decode token payload');
    return null;
  }

  // Логируем все claims для отладки
  console.log('[JWT] Token payload claims:', Object.keys(payload));
  console.log('[JWT] Token payload:', payload);

  // Стандартные claims для ID пользователя (проверяем в порядке приоритета)
  const userIdClaim = 
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    payload['nameidentifier'] ||
    payload.sub || 
    payload.nameid;

  console.log('[JWT] Found userId claim:', userIdClaim, 'type:', typeof userIdClaim);

  if (!userIdClaim) {
    console.warn('[JWT] No userId claim found in token');
    return null;
  }

  // Преобразуем в число
  const userId = typeof userIdClaim === 'string' 
    ? Number.parseInt(userIdClaim, 10) 
    : typeof userIdClaim === 'number' 
      ? userIdClaim 
      : null;

  if (Number.isNaN(userId) || userId === null) {
    console.warn('[JWT] Failed to parse userId:', userIdClaim);
    return null;
  }

  console.log('[JWT] Parsed userId:', userId);
  return userId;
}

/**
 * Получает имя пользователя из JWT токена
 */
export function getFirstNameFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  
  if (!payload) {
    return null;
  }

  const firstName = payload.firstName || payload['first_name'] || null;
  
  return typeof firstName === 'string' ? firstName : null;
}

/**
 * Получает фамилию пользователя из JWT токена
 */
export function getLastNameFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  
  if (!payload) {
    return null;
  }

  const lastName = payload.lastName || payload['last_name'] || null;
  
  return typeof lastName === 'string' ? lastName : null;
}

/**
 * Получает полное ФИО пользователя из JWT токена
 */
export function getFullNameFromToken(token: string | null): string | null {
  const firstName = getFirstNameFromToken(token);
  const lastName = getLastNameFromToken(token);

  if (!firstName && !lastName) {
    return null;
  }

  return `${firstName || ''} ${lastName || ''}`.trim() || null;
}

