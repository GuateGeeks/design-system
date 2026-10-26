export * from './layout.ts';
// plan.ts has its own row grid (ROW_Z) distinct from layout.ts's; it is exported as PLAN_ROW_Z.
export {
  CELL_W, CELL_D, ROW_Z as PLAN_ROW_Z, GARDEN_D, FRONT_D, PORCH, SERVICE_PLANS, PLAN_LIMITS, FOOTPRINTS, footprintOf, derivePlanServices, planCampus,
} from './plan.ts';
export * from './plan-fixtures.ts';
export { describe as describeCampusChange, programs as CAMPUS_PROGRAMS } from './feedback.ts';
export type * from './types.ts';
export { composeCampus } from './compose.ts';
export { groupPlan, entitySignature, buildEntityGroup, selectionOf } from './entities.ts';
export { RUN, walkerWorld, tickActors } from './activity.ts';
export { buildWorkshop, buildPopulation } from './actors.ts';
export { buildRoom, buildWorkshopShell, buildStorage, buildCirculation, buildEnvironment } from './architecture.ts';
export * from './scene.ts';
export { xrayBlockers } from './xray.ts';
