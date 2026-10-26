import { useContext, useSyncExternalStore, type ComponentType } from 'react';
import { ThemeContext } from '@guategeeks/theme-runtime/react';

/* Extension points (spec §4.3): each point maps values to components; editions request a value per point. */
const registry = new Map<string, Map<string, ComponentType<any>>>();

export function registerVariant(point: string, value: string, component: ComponentType<any>): void {
  const values = registry.get(point) ?? new Map<string, ComponentType<any>>();
  values.set(value, component);
  registry.set(point, values);
}

export function getVariants(point: string): string[] {
  return [...(registry.get(point)?.keys() ?? [])];
}

const noSubscribe = () => () => {};
const noState = () => null;

/** The requested value for `point`; works without a ThemeProvider (returns `fallback`). */
function useRequestedVariant(point: string, fallback: string): string {
  const ctx = useContext(ThemeContext);
  const state = useSyncExternalStore(ctx?.controller.subscribe ?? noSubscribe, ctx?.controller.getState ?? noState, ctx?.controller.getState ?? noState);
  return state?.variants[point] ?? fallback;
}

export interface VariantSlotProps<P> {
  point: string;
  fallback: string;
  props: P;
}

/** Renders the component registered for the requested value, or the fallback's when that value is not registered here. */
export function VariantSlot<P extends object>({ point, fallback, props }: VariantSlotProps<P>) {
  const requested = useRequestedVariant(point, fallback);
  const values = registry.get(point);
  const Component = values?.get(requested) ?? values?.get(fallback);
  return Component ? <Component {...props} /> : null;
}
