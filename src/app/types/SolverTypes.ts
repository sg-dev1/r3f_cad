import { SlvsConstraints, ConstraintValueType } from './Constraints';

export interface SolverEntityType {
  id: number;
  t: 'point' | 'line' | 'circle' | 'arc';
  v: number[];
}

export interface SolverRequestType {
  workplane: string;
  entities: SolverEntityType[];
  constraints: { id: number; t: SlvsConstraints; v: ConstraintValueType }[];
}

export interface SolverResponseType {
  workplane: string;
  code: number;
  failed: number[];
  entities: SolverEntityType[];
  dof: number;
}
