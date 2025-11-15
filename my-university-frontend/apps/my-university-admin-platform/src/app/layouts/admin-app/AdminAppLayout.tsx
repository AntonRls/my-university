import { Outlet } from 'react-router-dom';

import { AppShell } from '../AppShell';

export function AdminAppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

