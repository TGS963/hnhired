'use client';

import { createContext, useContext, useTransition, type ReactNode } from 'react';

type Ctx = {
  isPending: boolean;
  start: (fn: () => void) => void;
};

const SearchPendingCtx = createContext<Ctx>({
  isPending: false,
  start: (fn) => fn(),
});

export function SearchPendingProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <SearchPendingCtx.Provider value={{ isPending, start: startTransition }}>
      {children}
    </SearchPendingCtx.Provider>
  );
}

export function useSearchPending() {
  return useContext(SearchPendingCtx);
}
