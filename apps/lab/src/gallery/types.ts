import type { ReactNode } from 'react';

export interface GalleryState { id: string; label: string; render: () => ReactNode }
export interface GalleryEntry { id: string; name: string; description: string; states: GalleryState[] }
