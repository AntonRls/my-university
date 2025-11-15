import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { cn } from '@shared/utils/className';

type AppShellProps = {
  children: ReactNode;
};

const NAV_LINKS = [
  { label: 'Обзор', to: '/' },
  { label: 'События', to: '/events' },
  { label: 'Расписание', to: '/schedule/create' },
  { label: 'Дедлайны', to: '/deadlines/create' },
  { label: 'Библиотека', to: '/library' },
  { label: 'Структура', to: '/structure' },
  { label: 'Супер админка', to: '/super-admin' },
  { label: 'Пользователи', to: '/users' },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/40 p-5 shadow-xl shadow-black/20 backdrop-blur-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary/70">My University</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Панель администратора
            </h1>
            <p className="text-sm text-muted-foreground">
              Управляйте событиями, библиотекой и очередью на вступление в одном месте.
            </p>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 rounded-2xl border border-border/50 bg-card/50 px-3 py-2 text-sm font-medium shadow-lg shadow-black/10">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex-1 min-w-[100px] rounded-xl px-4 py-2 text-center transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}


