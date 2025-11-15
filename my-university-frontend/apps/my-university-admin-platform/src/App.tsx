import type { ReactElement } from 'react';
import { useAtomValue } from 'jotai';
import { Navigate, Route, Routes } from 'react-router-dom';

import {
  isAuthLoadingAtom,
  isAuthInitializedAtom,
  authErrorAtom,
} from '@shared/store';
import { AuthErrorScreen } from '@shared/ui/auth-error-screen';

import { AdminDashboard } from './app/pages/admin-dashboard/AdminDashboard';
import { EventsListPage } from './app/pages/admin-events/EventsListPage';
import { CreateEventPage } from './app/pages/admin-events/CreateEventPage';
import { EditEventPage } from './app/pages/admin-events/EditEventPage';
import { AdminAppLayout } from './app/layouts/admin-app/AdminAppLayout';
import { BooksListPage } from './app/pages/admin-library/BooksListPage';
import { CreateBookPage } from './app/pages/admin-library/CreateBookPage';
import { EditBookPage } from './app/pages/admin-library/EditBookPage';
import { AdminStructurePage } from './app/pages/admin-structure/AdminStructurePage';
import { SuperAdminPage } from './app/pages/admin-super/SuperAdminPage';
import { UsersManagementPage } from './app/pages/admin-users/UsersManagementPage';
import { CreateSchedulePage } from './app/pages/admin-schedule/CreateSchedulePage';
import { CreateDeadlinePage } from './app/pages/admin-deadlines/CreateDeadlinePage';

import styles from './App.module.scss';

export function App(): ReactElement {
  const isLoading = useAtomValue(isAuthLoadingAtom);
  const isInitialized = useAtomValue(isAuthInitializedAtom);
  const error = useAtomValue(authErrorAtom);

  if (!isInitialized || isLoading) {
    return <div className={styles.status}>Выполняется авторизация...</div>;
  }

  if (error) {
    return <AuthErrorScreen error={error} />;
  }

  return (
    <Routes>
      <Route path="/" element={<AdminAppLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<EventsListPage />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="events/:eventId/edit" element={<EditEventPage />} />
        <Route path="library" element={<BooksListPage />} />
        <Route path="library/create" element={<CreateBookPage />} />
        <Route path="library/:bookId/edit" element={<EditBookPage />} />
        <Route path="structure" element={<AdminStructurePage />} />
        <Route path="super-admin" element={<SuperAdminPage />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="schedule/create" element={<CreateSchedulePage />} />
        <Route path="deadlines/create" element={<CreateDeadlinePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
