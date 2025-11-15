type ClassDictionary = Record<string, boolean | null | undefined>;
interface ClassArray extends Array<ClassValue> {}
type ClassValue = string | ClassDictionary | ClassArray | false | null | undefined;

function isClassDictionary(value: ClassValue): value is ClassDictionary {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function cn(...values: ClassValue[]): string {
  const classNames: string[] = [];

  values.forEach((value) => {
    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      if (value.trim()) {
        classNames.push(value.trim());
      }
      return;
    }

    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) {
        classNames.push(nested);
      }
      return;
    }

    if (isClassDictionary(value)) {
      Object.entries(value).forEach(([className, condition]) => {
        if (condition) {
          classNames.push(className);
        }
      });
    }
  });

  return classNames.join(' ');
}

