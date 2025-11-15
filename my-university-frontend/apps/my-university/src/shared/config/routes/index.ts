import type { FromEnum, KeysOf } from '@api/types';

export const ROUTE_SEGMENTS = {
  root: '',
  hub: 'hub',
  events: 'events',
  schedule: 'schedule',
  library: 'library',
  profile: 'profile',
  studentProjects: 'student-projects',
  groups: 'groups',
  deadlines: 'deadlines',
} as const;

export type RouteKey = KeysOf<typeof ROUTE_SEGMENTS>;

export const ROUTES = Object.freeze(
  Object.fromEntries(
    Object.entries(ROUTE_SEGMENTS).map(([key, segment]) => [key, `/${segment}`]),
  ) as Record<RouteKey, `/${FromEnum<typeof ROUTE_SEGMENTS>}`>,
);

export type RoutePath = (typeof ROUTES)[RouteKey];

export const DEFAULT_ROUTE: RoutePath = ROUTES.hub;

export const APP_ROUTES = Object.freeze({
  mainNav: [ROUTES.hub, ROUTES.events, ROUTES.profile] as const,
  menu: [ROUTES.hub, ROUTES.schedule, ROUTES.events, ROUTES.library, ROUTES.groups, ROUTES.deadlines] as const,
});

export function getRoutePath<T extends RouteKey>(key: T): (typeof ROUTES)[T] {
  return ROUTES[key];
}

export type AppNavId = 'hub' | 'events' | 'profile';

const NAVIGATION_PATH_PREFIXES: Array<{ id: AppNavId; prefix: RoutePath }> = [
  { id: 'events', prefix: ROUTES.events },
  { id: 'profile', prefix: ROUTES.profile },
];

export function getNavIdByPathname(pathname: string): AppNavId {
  const match = NAVIGATION_PATH_PREFIXES.find((item) => pathname.startsWith(item.prefix));

  if (match) {
    return match.id;
  }

  return 'hub';
}

export function getBookUrl(bookId: string): string {
  return `${ROUTES.library}/${bookId}`;
}

export function getProjectUrl(projectId: string): string {
  return `${ROUTES.studentProjects}/${projectId}`;
}
