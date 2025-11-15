import { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNavIdByPathname, type AppNavId } from '@shared/config/routes';
import { authService } from '@api/services';

import { AppRoutes } from './AppRoutes';
import { NavigationMenu } from './NavigationMenu';
import styles from './MainLayout.module.scss';

export function MainLayout() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const deviceRef = useRef<HTMLDivElement>(null);

  const activeNavId: AppNavId = useMemo(
    () => getNavIdByPathname(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    if (deviceRef.current && typeof window !== 'undefined') {
      (window as unknown as { __appDeviceContainer?: HTMLDivElement }).__appDeviceContainer =
        deviceRef.current;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __appDeviceContainer?: HTMLDivElement }).__appDeviceContainer;
      }
    };
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMenuExpanded(false);
  };

  const handleToggleMenu = () => {
    setIsMenuExpanded((prev) => !prev);
  };

  const handleLogout = () => {
    setIsMenuExpanded(false);
    void authService.logout();
    console.warn('[auth] logout requested');
  };

  return (
    <div className={styles.preview}>
      <div ref={deviceRef} className={styles.device}>
        <div className={styles.deviceContent}>
          <AppRoutes />
        </div>

        <NavigationMenu
          activeNavId={activeNavId}
          currentPathname={location.pathname}
          isExpanded={isMenuExpanded}
          onNavigate={handleNavigate}
          onToggleExpand={handleToggleMenu}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}
