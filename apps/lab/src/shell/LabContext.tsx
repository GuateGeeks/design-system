import { createContext, useContext, useState, type ReactNode } from 'react';

export type Viewport = 'phone' | 'tablet' | 'desktop';
export const VIEWPORTS: Record<Viewport, { width: number; height: number }> = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 },
};

const LabContext = createContext<{ viewport: Viewport; setViewport(v: Viewport): void } | null>(null);

export function LabProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<Viewport>('phone');
  return <LabContext.Provider value={{ viewport, setViewport }}>{children}</LabContext.Provider>;
}

export function useLab() {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab must be used inside <LabProvider>');
  return ctx;
}
