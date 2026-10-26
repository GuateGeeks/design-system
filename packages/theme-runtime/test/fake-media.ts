type Listener = (event: { matches: boolean; media: string }) => void;

export interface FakeMedia {
  set(query: string, matches: boolean): void;
  listenerCount(): number;
  restore(): void;
}

/** Replaces window.matchMedia with a controllable fake. Queries default to not matching. */
export function fakeMatchMedia(): FakeMedia {
  const original = window.matchMedia;
  const state = new Map<string, boolean>();
  const listeners = new Map<string, Set<Listener>>();
  const listFor = (q: string) => listeners.get(q) ?? listeners.set(q, new Set()).get(q)!;

  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() { return state.get(query) ?? false; },
    onchange: null,
    addEventListener: (_: string, l: Listener) => listFor(query).add(l),
    removeEventListener: (_: string, l: Listener) => listFor(query).delete(l),
    addListener: (l: Listener) => listFor(query).add(l),
    removeListener: (l: Listener) => listFor(query).delete(l),
    dispatchEvent: () => true,
  })) as unknown as typeof window.matchMedia;

  return {
    set(query, matches) {
      state.set(query, matches);
      for (const l of [...listFor(query)]) l({ matches, media: query });
    },
    listenerCount: () => [...listeners.values()].reduce((n, s) => n + s.size, 0),
    restore() { window.matchMedia = original; },
  };
}
