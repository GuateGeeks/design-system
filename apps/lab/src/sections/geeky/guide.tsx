import { GEEKY_ACTION_LIST, GEEKY_GROUPS, GEEKY_UPSTREAM } from '@guategeeks/mascot/react';
import { Button } from '@guategeeks/ui';
import { actionName, groupName } from '../../geeky/actionNames.ts';

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-control border border-line bg-surface-2 p-3 font-mono text-xs text-ink"><code>{children}</code></pre>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">{items.map((i) => <li key={i}>{i}</li>)}</ul>
);

export function WhenToUse() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h3 className="text-lg">Úsalo para</h3>
        <List items={[
          'Dar la bienvenida en un primer uso o un onboarding.',
          'Celebrar un logro o entregar una recompensa (un certificado, una insignia).',
          'Acompañar una espera corta o un proceso: esperar, pensar.',
          'Dar una pista o una idea junto a un texto que la explica.',
          'Suavizar un error leve que el texto ya explica («Algo falló»).',
        ]} />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-lg">Evítalo en</h3>
        <List items={[
          'Errores críticos, pagos o avisos legales: ahí manda el texto claro.',
          'Formularios largos o pantallas densas, donde distrae.',
          'Más de un Geeky en la misma pantalla.',
          'Encima de contenido o controles: nunca debe taparlos.',
          'Como único portador de un mensaje: lo importante siempre va en texto.',
        ]} />
      </section>
    </div>
  );
}

export function Integrate() {
  return (
    <div className="flex flex-col gap-4 text-sm text-ink">
      <p>Instala el sistema de diseño (ver la guía de adopción) y usa el componente; toma los colores y el movimiento del tema activo.</p>
      <Code>{`import { Geeky } from '@guategeeks/mascot/react';

// Decorativo junto a un texto que dice lo importante
<Geeky intent="welcome" />

// Con nombre accesible, 3D bajo demanda y aviso al terminar
<Geeky intent="celebrate" render="3d" label="Geeky celebra tu logro" onActionEnd={next} />

// Una espera larga: ofrece pausa
<Geeky intent="waiting" paused={paused} />`}</Code>
      <p>Dentro de una escena 3D propia (por ejemplo, un campus), usa <code className="font-mono">createGeeky3D</code>:</p>
      <Code>{`import { createGeeky3D } from '@guategeeks/mascot';

const geeky = createGeeky3D(materials, { reduced, palette });
scene.add(geeky.group);
// En cada cuadro: geeky.tick(time, dt, goal)`}</Code>
    </div>
  );
}

export function Rules() {
  return (
    <List items={[
      'El mensaje importante siempre va en texto; Geeky acompaña, no informa solo.',
      'Sin «label», Geeky es decorativo y queda oculto para lectores de pantalla. Dale nombre solo si aporta algo que el texto no dice.',
      'Con movimiento reducido Geeky muestra una pose fija; no lo fuerces a moverse.',
      'Si una intención continua (esperar, pensar) queda más de 5 segundos en pantalla, ofrece un botón de pausa («paused»).',
      'Un Geeky por pantalla, sin tapar contenido ni controles.',
      'No cambies a Geeky en el producto: sus acciones, poses y dibujo se hacen en geeky-animation.',
    ]} />
  );
}

export function AllActions({ onPick }: { onPick(action: string): void }) {
  return (
    <div className="flex flex-col gap-6">
      {Object.keys(GEEKY_GROUPS).map((group) => (
        <section key={group} className="flex flex-col gap-2">
          <h3 className="text-lg">{groupName(group).text}</h3>
          <div className="flex flex-wrap gap-2">
            {GEEKY_ACTION_LIST.filter((a) => a.group === group).map((a) => {
              const name = actionName(a.id);
              return (
                <Button key={a.id} variant="secondary" onClick={() => onPick(a.id)}>
                  {name.text}{name.translated ? '' : ' (en inglés)'}
                </Button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function Version() {
  return (
    <div className="flex flex-col gap-2 text-sm text-ink">
      <p>
        El sistema de diseño usa <strong>{GEEKY_UPSTREAM.repository} v{GEEKY_UPSTREAM.version}</strong>. Geeky se crea en geeky-animation; cada versión nueva llega aquí como una propuesta de actualización que se revisa antes de aceptarla.
      </p>
      <p className="flex flex-wrap gap-4">
        <a className="text-action underline" href={GEEKY_UPSTREAM.release}>Notas de la versión</a>
        <a className="text-action underline" href={GEEKY_UPSTREAM.changelog}>Historial de cambios</a>
      </p>
    </div>
  );
}
