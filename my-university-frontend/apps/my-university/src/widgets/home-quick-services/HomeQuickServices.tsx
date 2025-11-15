import { Link } from 'react-router-dom';

import { Button } from '@maxhub/max-ui';
import { cn } from '@shared/utils/className';
import { CalendarIcon, DeadlineIcon, EventsIcon, LibraryIcon, TeamsIcon } from '@shared/icons';
import { ROUTES } from '@shared/config/routes';

import styles from './HomeQuickServices.module.scss';

const QUICK_SERVICES = [
  {
    id: 'calendar',
    label: 'Расписание',
    icon: CalendarIcon,
    route: ROUTES.schedule,
  },
  {
    id: 'deadlines',
    label: 'Дедлайны',
    icon: DeadlineIcon,
    route: ROUTES.deadlines,
  },
  {
    id: 'events',
    label: 'События',
    icon: EventsIcon,
    route: ROUTES.events,
  },
  {
    id: 'library',
    label: 'Библиотека',
    icon: LibraryIcon,
    route: ROUTES.library,
  },
  {
    id: 'teams',
    label: 'Команды',
    icon: TeamsIcon,
    route: ROUTES.studentProjects,
  },
] as const;

export function HomeQuickServices() {
  return (
    <div className={styles.quickServicesGrid}>
      {QUICK_SERVICES.map((service) => {
        const Icon = service.icon;
        const serviceClassName = styles[`quickService_${service.id}`];

        return (
          <Button
            key={service.id}
            asChild
            size="small"
            mode="secondary"
            appearance="neutral"
            className={cn(styles.quickService, serviceClassName)}
          >
            <Link to={service.route} aria-label={service.label}>
              <span className={styles.quickServiceContent}>
                <Icon className={styles.quickServiceIcon} />
                <span className={styles.quickServiceLabel}>{service.label}</span>
              </span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

