/// <reference lib="dom" />
import { getTenantApiBaseUrl } from './config';

export class ApiError<TBody = unknown> extends Error {
  public readonly status: number;

  public readonly body: TBody;

  constructor(status: number, body: TBody, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type TokenProvider = () => string | null;

type ApiRequestOptions<TBody> = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
  baseUrl?: string;
};

let resolveToken: TokenProvider | null = null;

export function configureAuthTokenProvider(provider: TokenProvider): void {
  resolveToken = provider;
}

function buildHeaders<TBody>(options: ApiRequestOptions<TBody>, includeAuthHeader: boolean) {
  const headers = new Headers(options.headers);

  const needsContentType = options.body !== undefined && !headers.has('Content-Type');

  if (needsContentType) {
    headers.set('Content-Type', 'application/json');
  }

  if (includeAuthHeader && resolveToken) {
    const token = resolveToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const method = options.method ?? 'GET';
  const includeAuthHeader = options.skipAuth !== true;
  const headers = buildHeaders(options, includeAuthHeader);
  const baseUrl = options.baseUrl ?? getTenantApiBaseUrl();
  const body =
    options.body !== undefined && options.body !== null ? JSON.stringify(options.body) : undefined;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body,
    signal: options.signal,
  });

  const parsedBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, parsedBody);
  }

  return parsedBody as TResponse;
}

export function apiGet<TResponse>(path: string, options?: ApiRequestOptions<undefined>) {
  return apiRequest<TResponse, undefined>(path, { ...options, method: 'GET' });
}

export function apiPost<TResponse, TBody>(path: string, body: TBody, options?: ApiRequestOptions<TBody>) {
  return apiRequest<TResponse, TBody>(path, { ...options, method: 'POST', body });
}

export function apiPut<TResponse, TBody>(path: string, body: TBody, options?: ApiRequestOptions<TBody>) {
  return apiRequest<TResponse, TBody>(path, { ...options, method: 'PUT', body });
}

export function apiDelete<TResponse>(path: string, options?: ApiRequestOptions<undefined>) {
  return apiRequest<TResponse, undefined>(path, { ...options, method: 'DELETE' });
}

