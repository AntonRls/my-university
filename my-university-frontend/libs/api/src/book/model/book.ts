export type Book = {
  id: string;
  title: string;
  description: string;
  author: string;
  tags: ReadonlyArray<string>;
  availableCount: number;
  isFavorite: boolean;
  isReserved: boolean;
  reservationEndDate?: string;
};

