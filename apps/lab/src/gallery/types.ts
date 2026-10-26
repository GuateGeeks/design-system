import type { ReactNode } from 'react';

export type GroupId = 'actions' | 'surfaces' | 'forms' | 'overlays' | 'structure';

export interface GalleryState {
  id: string;
  label: string;
  render: () => ReactNode;
  /**
   * How the Components page shows the state: 'inline' (default) renders it in the page;
   * 'frame' needs its own document (full-screen layouts, open modals) and shows in a device frame;
   * 'link' would disturb the page (focus on mount, toasts) and is offered as a frame link.
   * Every state is still a standalone frame for the visual and a11y suites.
   */
  preview?: 'inline' | 'frame' | 'link';
}

export interface GalleryEntry { id: string; name: string; group: GroupId; description: string; states: GalleryState[] }
