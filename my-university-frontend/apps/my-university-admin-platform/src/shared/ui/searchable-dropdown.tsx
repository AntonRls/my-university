/* eslint-disable no-unused-vars */
import type { ChangeEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Input } from './input';
import { Label } from './label';
import { cn } from '../utils/className';

type SelectionOptionBase = {
  id: number;
  name?: string;
  label?: string;
  title?: string;
};

type SearchableDropdownBaseProps<T extends SelectionOptionBase> = {
  label: ReactNode;
  selectedValue: number | null;
  options: T[];
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
};

type SearchableDropdownProps<T extends SelectionOptionBase> = Omit<
  SearchableDropdownBaseProps<T>,
  'selectedValue'
> & {
  value: number | null;
};

function getOptionLabel(option: SelectionOptionBase) {
  return option.label ?? option.name ?? option.title ?? String(option.id);
}

function SearchableDropdownBase<T extends SelectionOptionBase>({
  label,
  selectedValue,
  options,
  onChange,
  placeholder = 'Выберите',
  disabled = false,
}: SearchableDropdownBaseProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return options;
    }
    const normalized = search.trim().toLowerCase();
    return options.filter((option) => getOptionLabel(option).toLowerCase().includes(normalized));
  }, [options, search]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedValue) ?? null,
    [options, selectedValue],
  );

  const handleDocumentClick = useCallback(
    (event: MouseEvent) => {
      if (
        panelRef.current?.contains(event.target as Node) ||
        buttonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
      setSearch('');
    },
    [panelRef],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [handleDocumentClick]);

  const handleSelect = (optionId: number) => {
    onChange(optionId);
    setIsOpen(false);
    setSearch('');
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  return (
    <div className="relative">
      <Label>{label}</Label>
      <button
        type="button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() =>
          setIsOpen((prev) => {
            if (prev) {
              setSearch('');
            }
            return !prev;
          })
        }
        className={cn(
          'flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-left text-sm text-foreground transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled ? 'cursor-not-allowed opacity-70' : '',
        )}
      >
        <span>{selectedOption ? getOptionLabel(selectedOption) : placeholder}</span>
        <span className="text-base text-muted-foreground">{isOpen ? '▴' : '▾'}</span>
      </button>

      {isOpen && !disabled ? (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 z-10 mt-2 rounded-2xl border border-border bg-card shadow-lg shadow-black/10"
        >
          <div className="p-3">
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Поиск..."
              className="mb-2"
            />
            <div className="max-h-60 space-y-1 overflow-y-auto pb-1">
              {filteredOptions.length === 0 ? (
                <div className="text-xs text-muted-foreground">Ничего не найдено</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-primary/10',
                      selectedOption?.id === option.id ? 'bg-primary/10 text-primary' : '',
                    )}
                  >
                    <span>{getOptionLabel(option)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SearchableDropdown<T extends SelectionOptionBase>({
  value,
  ...rest
}: SearchableDropdownProps<T>) {
  return <SearchableDropdownBase selectedValue={value} {...rest} />;
}

