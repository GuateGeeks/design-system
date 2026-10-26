import { copy } from '../copy.ts';
import { registry } from '../gallery/registry.ts';

/** Every frame URL, without appearance params: the visual and a11y suites read this list. */
export function FramesIndex() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl">{copy.frames.title}</h1>
      <p className="text-ink-muted">{copy.frames.description}</p>
      <ul className="flex flex-col gap-1">
        {registry.flatMap((entry) =>
          entry.states.map((state) => (
            <li key={`${entry.id}/${state.id}`}>
              <a data-frame className="text-link" href={`#/frame/${entry.id}/${state.id}`}>{`${entry.name} · ${state.label}`}</a>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
