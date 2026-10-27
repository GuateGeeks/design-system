import type { GeekyIntent } from '@guategeeks/mascot/react';

export interface SnippetChoice { intent?: GeekyIntent; action?: string; render: '2d' | '3d'; label?: string }

const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The JSX a product writes for the current choice on the Geeky page. */
export function geekySnippet({ intent, action, render, label }: SnippetChoice): string {
  const props = [
    intent ? `intent="${intent}"` : action ? `action="${attr(action)}"` : null,
    render === '3d' ? 'render="3d"' : null,
    label ? `label="${attr(label)}"` : null,
  ].filter(Boolean);
  return `import { Geeky } from '@guategeeks/mascot/react';\n\n<Geeky ${props.join(' ')} />`;
}
