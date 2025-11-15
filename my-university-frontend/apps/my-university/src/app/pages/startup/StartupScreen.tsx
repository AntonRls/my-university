import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Button, Spinner } from '@maxhub/max-ui';

import type { AdminRole } from '@api/admin';
import type { StartupGateState } from '@shared/hooks';
import { cn } from '@shared/utils/className';

import styles from './StartupScreen.module.scss';

const ROLE_OPTIONS: ReadonlyArray<{ label: string; value: AdminRole }> = [
  { label: 'Студент', value: 'Student' },
  { label: 'Преподаватель', value: 'Teacher' },
];

type StartupScreenProps = {
  state: StartupGateState;
};

export function StartupScreen({ state }: StartupScreenProps) {
  const {
    isAuthorizing,
    isCheckingMembership,
    needsUniversitySelection,
    hasPendingRequest,
    availableUniversities,
    userUniversities,
    isUniversitiesLoading,
    isSubmitting,
    submissionSuccess,
    error,
    refetchMembership,
    submitJoinRequest,
  } = state;

  const [selectedRole, setSelectedRole] = useState<AdminRole>('Student');
  const [selectedTenant, setSelectedTenant] = useState<string>('');

  const isBootstrapping = isAuthorizing || isCheckingMembership;
  const hasUniversities = availableUniversities.length > 0;

  useEffect(() => {
    if (selectedTenant || !hasUniversities) {
      return;
    }

    setSelectedTenant(availableUniversities[0]?.tenantName ?? '');
  }, [availableUniversities, hasUniversities, selectedTenant]);

  const handleTenantChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTenant(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedTenant) {
        return;
      }

      await submitJoinRequest({ tenantId: selectedTenant, role: selectedRole });
    },
    [selectedRole, selectedTenant, submitJoinRequest],
  );

  const handleRetryMembership = useCallback(() => {
    void refetchMembership();
  }, [refetchMembership]);

  const pendingUniversities = useMemo(
    () =>
      userUniversities.filter((item) => item.approveStatus === 'Wait' || item.approveStatus === 'WaitApprove'),
    [userUniversities],
  );

  const isSubmitDisabled =
    isSubmitting || isUniversitiesLoading || !selectedTenant || availableUniversities.length === 0;

  const showSuccessState = submissionSuccess || pendingUniversities.length > 0;

  return (
    <main className={styles.root}>
      <section className={styles.panel} aria-live="polite">
        <header className={styles.header}>
          <h1 className={styles.title}>Подключение к университету</h1>
          <p className={styles.subtitle}>
            Мы автоматически определяем, к каким ВУЗам у вас есть доступ. Если доступа нет, выберите университет и
            отправьте заявку.
          </p>
        </header>

        {isBootstrapping && (
          <div className={styles.centerBlock}>
            <Spinner size={36} />
            <p className={styles.centerMessage}>Загружаем данные пользователя…</p>
          </div>
        )}

        {!isBootstrapping && hasPendingRequest && (
          <div className={styles.infoBlock}>
            <p className={styles.infoTitle}>Заявка ожидает подтверждения</p>
            <p className={styles.infoDescription}>
              Как только модератор подтвердит заявку, вы получите доступ к сервисам вашего университета. Это обычно
              занимает несколько минут.
            </p>
            <ul className={styles.pendingList}>
              {pendingUniversities.map((item) => (
                <li key={item.tenantName} className={styles.pendingItem}>
                  {item.tenantName} — статус: {item.approveStatus}
                </li>
              ))}
            </ul>
            <Button mode="secondary" appearance="neutral" onClick={handleRetryMembership}>
              Обновить статус
            </Button>
          </div>
        )}

        {!isBootstrapping && !hasPendingRequest && needsUniversitySelection && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="startup-university" className={styles.label}>
                Университет
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="startup-university"
                  className={styles.select}
                  value={selectedTenant}
                  onChange={handleTenantChange}
                  disabled={isUniversitiesLoading || !hasUniversities}
                  aria-busy={isUniversitiesLoading}
                >
                  {hasUniversities ? (
                    availableUniversities.map((university) => (
                      <option key={university.id} value={university.tenantName}>
                        {university.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Нет доступных университетов</option>
                  )}
                </select>
                {isUniversitiesLoading && <Spinner size={18} className={styles.inlineSpinner} />}
              </div>
            </div>

            <fieldset className={styles.fieldset}>
              <legend className={styles.label}>Роль в университете</legend>
              <div className={styles.roles}>
                {ROLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(styles.roleOption, option.value === selectedRole && styles.roleOptionActive)}
                  >
                    <input
                      type="radio"
                      name="startup-role"
                      value={option.value}
                      checked={selectedRole === option.value}
                      onChange={() => setSelectedRole(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Button
              type="submit"
              mode="primary"
              appearance="themed"
              disabled={isSubmitDisabled}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} />
              Отправить заявку
                </>
              ) : (
                'Отправить заявку'
              )}
            </Button>
          </form>
        )}

        {!isBootstrapping && !needsUniversitySelection && !hasPendingRequest && showSuccessState && (
          <div className={styles.infoBlock}>
            <p className={styles.infoTitle}>Заявка отправлена</p>
            <p className={styles.infoDescription}>
              Мы получили ваш запрос на присоединение. После подтверждения вы автоматически получите доступ, просто
              обновите страницу или нажмите кнопку ниже.
            </p>
            <Button mode="secondary" appearance="neutral" onClick={handleRetryMembership}>
              Проверить ещё раз
            </Button>
          </div>
        )}

        {error && !isBootstrapping && (
          <div className={styles.errorBlock} role="alert">
            {error}
          </div>
        )}
      </section>
    </main>
  );
}


