interface FlattenResult {
  strings: string[];
  rebuild: (translations: Record<string, string>) => unknown;
}

function shouldSkipPath(path: string, skipKeys: Set<string>): boolean {
  if (!path) {
    return false;
  }

  const segments = path.split('.').filter(Boolean);
  return segments.some((segment) => skipKeys.has(segment));
}

export function flattenPayloadStrings(input: unknown, skipKeys: string[] = []): FlattenResult {
  const collected: string[] = [];
  const skipKeySet = new Set(skipKeys);

  const walk = (value: unknown, path: string): unknown => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0 && !shouldSkipPath(path, skipKeySet)) {
        collected.push(trimmed);
        return { __translate_ref__: trimmed };
      }
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => walk(item, `${path}[${index}]`));
    }

    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        result[key] = walk(entry, nextPath);
      });
      return result;
    }

    return value;
  };

  const template = walk(input, '');

  const rebuild = (translations: Record<string, string>) => {
    const unwind = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((item) => unwind(item));
      }

      if (value && typeof value === 'object') {
        const ref = (value as Record<string, unknown>).__translate_ref__;
        if (typeof ref === 'string') {
          return translations[ref] ?? ref;
        }

        const result: Record<string, unknown> = {};
        Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
          result[key] = unwind(entry);
        });
        return result;
      }

      return value;
    };

    return unwind(template);
  };

  return { strings: [...new Set(collected)], rebuild };
}
