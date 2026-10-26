import { ColorRoles } from './ColorRoles.tsx';
import { ContrastMatrix } from './ContrastMatrix.tsx';
import { MotionTokens } from './MotionTokens.tsx';
import { SpacingRadii } from './SpacingRadii.tsx';
import { TypeScale } from './TypeScale.tsx';

export function FoundationsPage() {
  return (
    <div className="flex flex-col gap-12">
      <ColorRoles />
      <ContrastMatrix />
      <TypeScale />
      <SpacingRadii />
      <MotionTokens />
    </div>
  );
}
