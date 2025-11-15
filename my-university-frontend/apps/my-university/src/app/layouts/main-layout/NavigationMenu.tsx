import type { JSX } from 'react';
import { Button, IconButton, Typography } from '@maxhub/max-ui';

import { ROUTES, type AppNavId, type RoutePath } from '@shared/config/routes';
import { useUser } from '@shared/hooks';
import {
  CalendarIcon,
  DeadlineIcon,
  EventsIcon,
  HomeIcon,
  LibraryIcon,
  LogoutIcon,
  MoreIcon,
  ProfileIcon,
  TeamsIcon,
} from '@shared/icons';
import { UserAvatar } from '@shared/ui/user-avatar';
import { cn } from '@shared/utils/className';

import styles from './MainLayout.module.scss';

const MAIN_NAV_ITEMS: ReadonlyArray<{
  id: AppNavId;
  label: string;
  path: RoutePath;
  icon: typeof HomeIcon;
  isProfile?: boolean;
}> = [
  { id: 'hub', label: 'Главная', path: ROUTES.hub, icon: HomeIcon },
  { id: 'events', label: 'События', path: ROUTES.events, icon: EventsIcon },
  { id: 'profile', label: 'Профиль', path: ROUTES.profile, icon: ProfileIcon, isProfile: true },
];

type NavigationMenuProps = {
  activeNavId: AppNavId;
  currentPathname: string;
  isExpanded: boolean;
  // eslint-disable-next-line no-unused-vars
  onNavigate: (path: RoutePath) => void;
  onToggleExpand: () => void;
  onLogout: () => void;
};

const MENU_LINKS: ReadonlyArray<{
  id: string;
  label: string;
  path: RoutePath;
  icon: JSX.Element;
}> = [
  { id: 'hub', label: 'Мой университет', path: ROUTES.hub, icon: <HomeIcon className={styles.menuIcon} /> },
  { id: 'schedule', label: 'Расписание', path: ROUTES.schedule, icon: <CalendarIcon className={styles.menuIcon} /> },
  { id: 'events', label: 'Мероприятия', path: ROUTES.events, icon: <EventsIcon className={styles.menuIcon} /> },
  { id: 'library', label: 'Библиотека', path: ROUTES.library, icon: <LibraryIcon className={styles.menuIcon} /> },
  { id: 'deadlines', label: 'Дедлайны', path: ROUTES.deadlines, icon: <DeadlineIcon className={styles.menuIcon} /> },
  { id: 'groups', label: 'Мои группы', path: ROUTES.groups, icon: <TeamsIcon className={styles.menuIcon} /> },
  { id: 'commands', label: 'Команды', path: ROUTES.studentProjects, icon: <TeamsIcon className={styles.menuIcon} /> },
] as const;

export function NavigationMenu({
  activeNavId,
  currentPathname,
  isExpanded,
  onNavigate,
  onToggleExpand,
  onLogout,
}: NavigationMenuProps) {
  const normalizedPathname = currentPathname === ROUTES.root ? ROUTES.hub : currentPathname;
  const isPathInMainNav = MAIN_NAV_ITEMS.some((item) => normalizedPathname.startsWith(item.path));
  const isMoreButtonActive = isExpanded || !isPathInMainNav;
  const { user, fullName, initials, isInitialized } = useUser();

  const computeFallbackInitials = (value: string | null) => {
    if (!value) {
      return null;
    }

    const letters = value
      .split(/\s+/u)
      .filter(Boolean)
      .map((part) => part[0])
      .join('');

    if (letters.length === 0) {
      return null;
    }

    return letters.slice(0, 2).toUpperCase();
  };

  const fallbackName = fullName ?? (user ? `${user.first_name} ${user.last_name}`.trim() : null);
  const avatarInitials = isInitialized
    ? initials ?? computeFallbackInitials(fallbackName)
    : null;
  const displayName = isInitialized ? fallbackName ?? 'Гость' : 'Загрузка...';
  const username = isInitialized ? (user?.username ? `@${user.username}` : '—') : '...';

  return (
    <nav
      className={cn(styles.navigation, isExpanded && styles.navigationExpanded)}
      aria-label="Основная навигация"
    >
      <div className={cn(styles.menuPanel, isExpanded && styles.menuPanelVisible)}>
        <div className={styles.menuBody}>
          <div className={styles.profileSection}>
            <UserAvatar
              size={68}
              initials={avatarInitials}
              photoUrl={user?.photo_url}
              className={styles.profileAvatar}
            />
            <div className={styles.profileInfo}>
              <Typography.Title className={styles.profileName}>{displayName}</Typography.Title>
              <Typography.Body className={styles.profileCaption}>{username}</Typography.Body>
            </div>
          </div>

          <ul className={styles.menuList}>
            {MENU_LINKS.map((link) => (
              <li key={link.id}>
                <Button
                  type="button"
                  size="large"
                  mode="secondary"
                  appearance="neutral"
                  className={cn(
                    styles.menuItem,
                    currentPathname.startsWith(link.path) && styles.menuItemActive,
                  )}
                  onClick={() => onNavigate(link.path)}
                >
                  <span className={styles.menuItemContent}>
                    {link.icon}
                    <span>{link.label}</span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.logoutSection}>
          <Button
            type="button"
            size="large"
            mode="secondary"
            appearance="neutral"
            className={styles.logoutButton}
            onClick={onLogout}
          >
            <span className={styles.menuItemContent}>
              <LogoutIcon className={styles.menuIcon} />
              <span>Выйти</span>
            </span>
          </Button>
        </div>
      </div>

      <div className={styles.navRow}>
        <div className={styles.navButtons}>
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = isPathInMainNav && activeNavId === item.id;
            const handleClick = () => onNavigate(item.path);

            if (item.isProfile) {
              return (
                <IconButton
                  key={item.id}
                  size="large"
                  mode="secondary"
                  appearance="neutral"
                  className={cn(styles.navButton, isActive && styles.navButtonActive)}
                  aria-label={item.label}
                  aria-pressed={isActive}
                  onClick={handleClick}
                >
                  <UserAvatar
                    size={52}
                    initials={avatarInitials}
                    photoUrl={user?.photo_url}
                    className={cn(styles.navAvatar, isActive && styles.navAvatarActive)}
                  />
                </IconButton>
              );
            }

            const IconComponent = item.icon;

            return (
              <IconButton
                key={item.id}
                size="large"
                mode="secondary"
                appearance="neutral"
                className={cn(styles.navButton, isActive && styles.navButtonActive)}
                aria-label={item.label}
                aria-pressed={isActive}
                onClick={handleClick}
              >
                <IconComponent className={styles.navIcon} />
              </IconButton>
            );
          })}
        </div>

        <IconButton
          size="large"
          mode="secondary"
          appearance="neutral"
          className={cn(
            styles.navButton,
            styles.moreButton,
            isMoreButtonActive && styles.moreButtonActive,
          )}
          aria-label={isExpanded ? 'Свернуть меню' : 'Раскрыть меню'}
          aria-expanded={isExpanded}
          aria-pressed={isMoreButtonActive}
          onClick={onToggleExpand}
        >
          <MoreIcon className={styles.navIcon} />
        </IconButton>
      </div>
    </nav>
  );
}
