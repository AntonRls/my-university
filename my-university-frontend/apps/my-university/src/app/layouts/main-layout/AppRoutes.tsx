import { Navigate, Route, Routes } from 'react-router-dom';
import { EventsScreen } from '@app/pages/events/EventsScreen';
import { HomeScreen } from '@app/pages/home/HomeScreen';
import { LibraryScreen } from '@app/pages/library/LibraryScreen';
import { ProfileScreen } from '@app/pages/profile/ProfileScreen';
import { ScheduleScreen } from '@app/pages/schedule/ScheduleScreen';
import { StudentProjectsScreen } from '@app/pages/student-projects/StudentProjectsScreen';
import { GroupsScreen } from '@app/pages/groups/GroupsScreen';
import { DeadlinesScreen } from '@app/pages/deadlines/DeadlinesScreen';
import { DEFAULT_ROUTE, ROUTES } from '@shared/config/routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.hub} element={<HomeScreen />} />
      <Route path={ROUTES.events} element={<EventsScreen />} />
      <Route path={ROUTES.schedule} element={<ScheduleScreen />} />
      <Route path={`${ROUTES.library}/:id`} element={<LibraryScreen />} />
      <Route path={ROUTES.library} element={<LibraryScreen />} />
      <Route path={ROUTES.profile} element={<ProfileScreen />} />
      <Route path={`${ROUTES.studentProjects}/:id`} element={<StudentProjectsScreen />} />
      <Route path={ROUTES.studentProjects} element={<StudentProjectsScreen />} />
      <Route path={ROUTES.groups} element={<GroupsScreen />} />
      <Route path={ROUTES.deadlines} element={<DeadlinesScreen />} />
      <Route path={ROUTES.root} element={<Navigate to={DEFAULT_ROUTE} replace />} />
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
}
