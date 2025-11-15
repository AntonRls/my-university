export type KeysOf<T> = keyof T;

export type FromEnum<T extends Record<string, number | string>> = T[keyof T];
