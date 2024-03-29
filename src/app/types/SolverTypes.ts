import { SlvsConstraints } from "./Constraints";

export interface SolverRequestType {
    workplane: string;
    entities: {id: number, t: "point" | "line" | "circle" | "arc", v: number[]}[];
    constraints: {id: number, t: SlvsConstraints, v: number[]}[];
}

export interface SolverResponseType {
    code: number;
    failed: number[];
    entities: {id: number, t: "point" | "line" | "circle" | "arc", v: number[]}[];
    dof: number;
}
