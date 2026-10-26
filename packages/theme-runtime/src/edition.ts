import type { Edition } from '@guategeeks/themes';

export interface EditionContext {
  /** The user's or product's explicit choice; 'none' opts out of every edition. */
  explicit?: string | null;
  /** location.search; `?edition=<id>` previews an edition, `?edition=none` disables it. */
  search?: string;
  now: Date;
  productDefault?: string | null;
}

/** Today's date in `tz` as YYYY-MM-DD; 'en-CA' formats dates that way. */
const localDate = (now: Date, tz: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export function isWithinWindow(window: NonNullable<Edition['window']>, now: Date): boolean {
  const today = localDate(now, window.tz);
  return window.from <= today && today <= window.to;
}

/** Priority: explicit choice > URL override > active date window > product default. Unknown ids are ignored. */
export function resolveEdition(editions: Edition[], ctx: EditionContext): Edition | null {
  const byId = (id: string | null | undefined) => (id ? editions.find((e) => e.id === id) : undefined);
  if (ctx.explicit === 'none') return null;
  const explicit = byId(ctx.explicit);
  if (explicit) return explicit;
  const fromUrl = new URLSearchParams(ctx.search ?? '').get('edition');
  if (fromUrl === 'none') return null;
  const preview = byId(fromUrl);
  if (preview) return preview;
  const active = editions.find((e) => e.window && isWithinWindow(e.window, ctx.now));
  if (active) return active;
  return byId(ctx.productDefault) ?? null;
}
