import type { FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  type CreateUniversityPayload,
  type University,
  universitiesApiService,
} from '@api/services/universities-api-service';
import { PlusIcon, RefreshIcon } from '@shared/icons';

import { PageShell } from '../../../shared/layout';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui';

type CreateFormState = {
  name: string;
  tenant: string;
};

const initialFormState: CreateFormState = {
  name: '',
  tenant: '',
};

export function SuperAdminPage(): ReactElement {
  const [universities, setUniversities] = useState<ReadonlyArray<University>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState<CreateFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const loadUniversities = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const result = await universitiesApiService.getUniversities();
        setUniversities(result);
      } catch (loadError: unknown) {
        console.error('[super-admin] failed to load universities', loadError);
        setError('Не удалось загрузить университеты. Попробуйте обновить страницу.');
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadUniversities();
  }, [loadUniversities]);

  const stats = useMemo(() => {
    const tenantsSet = new Set<string>();
    let unassignedCount = 0;

    universities.forEach((university) => {
      const tenant = university.tenantName.trim();
      if (tenant.length === 0) {
        unassignedCount += 1;
        return;
      }
      tenantsSet.add(tenant);
    });

    return {
      universities: universities.length,
      tenants: tenantsSet.size,
      withoutTenant: unassignedCount,
    };
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    if (!searchQuery.trim()) {
      return universities;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return universities.filter((university) => {
      const nameMatches = university.name.toLowerCase().includes(normalizedQuery);
      const tenantMatches = university.tenantName
        .toLowerCase()
        .includes(normalizedQuery);
      const idMatches = String(university.id).includes(normalizedQuery);

      return nameMatches || tenantMatches || idMatches;
    });
  }, [searchQuery, universities]);

  const isFormValid = formState.name.trim().length > 0 && formState.tenant.trim().length > 0;

  const handleFormChange = useCallback((field: keyof CreateFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCreateUniversity = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isFormValid) {
        toast.error('Заполните название университета и тенант');
        return;
      }

      setIsSubmitting(true);

      const payload: CreateUniversityPayload = {
        name: formState.name.trim(),
        tenant_name: formState.tenant.trim(),
      };

      try {
        await universitiesApiService.createUniversity(payload);
        toast.success('Университет добавлен');
        setFormState(initialFormState);
        await loadUniversities({ silent: true });
      } catch (submitError: unknown) {
        console.error('[super-admin] failed to create university', submitError);
        toast.error('Не удалось создать университет');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.name, formState.tenant, isFormValid, loadUniversities],
  );

  const handleRefresh = useCallback(() => {
    void loadUniversities({ silent: true });
  }, [loadUniversities]);

  const errorMessage = error ? (
    <div className="rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
      {error}
    </div>
  ) : null;

  return (
    <PageShell
      title="Супер админка"
      description="Управляйте списком университетов и их тенантами в одном месте."
      actions={
        <Button
          onClick={handleRefresh}
          variant="secondary"
          icon={<RefreshIcon size={16} />}
          isLoading={isRefreshing}
        >
          Обновить
        </Button>
      }
    >
      <div className="space-y-10">
        <section className="grid gap-4 md:grid-cols-3">
          <StatsCard title="Всего университетов" value={stats.universities} />
          <StatsCard title="Уникальные тенанты" value={stats.tenants} />
          <StatsCard title="Без тенанта" value={stats.withoutTenant} hint="Настройте тенант, чтобы включить доступ." />
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Университеты</CardTitle>
              <CardDescription>Список всех доступных университетов и привязанных тенантов.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Поиск по названию, тенанту или ID"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />

              {errorMessage}

              {isLoading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Spinner />
                </div>
              ) : filteredUniversities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  {searchQuery.trim()
                    ? 'По запросу ничего не найдено'
                    : 'Университеты пока не добавлены. Создайте первый справа.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Название</TableHead>
                        <TableHead>Тенант</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUniversities.map((university) => (
                        <TableRow key={university.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{university.id}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{university.name}</span>
                              <span className="text-xs text-muted-foreground">Создано в системе</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {university.tenantName.trim().length > 0 ? (
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                                {university.tenantName}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Добавить университет</CardTitle>
              <CardDescription>Укажите читаемое название и технический тенант (slug).</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateUniversity}>
                <div className="space-y-2">
                  <Label htmlFor="university-name">
                    Название <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="university-name"
                    placeholder="Московский технический университет"
                    value={formState.name}
                    onChange={(event) => handleFormChange('name', event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-tenant">
                    Тенант <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="university-tenant"
                    placeholder="mtu"
                    value={formState.tenant}
                    onChange={(event) => handleFormChange('tenant', event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Используется в заголовках X-Tenant-Id и для сегрегации данных.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  icon={<PlusIcon size={18} />}
                  isLoading={isSubmitting}
                  disabled={!isFormValid || isSubmitting}
                >
                  Создать университет
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

type StatsCardProps = {
  title: string;
  value: number;
  hint?: string;
};

function StatsCard({ title, value, hint }: StatsCardProps): ReactElement {
  return (
    <Card className="bg-card/60 backdrop-blur">
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {title}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold text-foreground">{value}</CardTitle>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

