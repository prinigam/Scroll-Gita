import { createContext, useContext } from 'react';
import type { ReaderRepository } from '@/repositories/reader';

export const ReaderContext = createContext<ReaderRepository | null>(null);
export function useReaderRepository() {
  const repository = useContext(ReaderContext);
  if (!repository)
    throw new Error('Reader repository must be initialized before use');
  return repository;
}
