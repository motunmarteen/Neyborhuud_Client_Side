'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SentinelBottomSheetContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  openSheet: () => void;
  closeSheet: () => void;
}

const SentinelBottomSheetContext = createContext<SentinelBottomSheetContextType | undefined>(undefined);

export function SentinelBottomSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSheet = () => setIsOpen(true);
  const closeSheet = () => setIsOpen(false);

  return (
    <SentinelBottomSheetContext.Provider value={{ isOpen, setIsOpen, openSheet, closeSheet }}>
      {children}
    </SentinelBottomSheetContext.Provider>
  );
}

export function useSentinelBottomSheet() {
  const context = useContext(SentinelBottomSheetContext);
  if (context === undefined) {
    throw new Error('useSentinelBottomSheet must be used within a SentinelBottomSheetProvider');
  }
  return context;
}
