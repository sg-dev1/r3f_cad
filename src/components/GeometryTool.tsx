import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Line, Points } from '@react-three/drei';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  addEntity,
  resetLastPoint,
  selectLines,
  selectPoints,
  selectPointsMap,
  selectLastPoint,
  callSketchSolverBackend,
  selectConstraints,
  buildSolverRequestType,
  addConstraint,
  selectCircles,
} from '@/app/slices/sketchSlice';
import { calcIntersectionWithPlane } from '@/utils/threejs_utils';
import { GeometryType, geometryTypeToString } from '@/app/types/EntityType';
import LineObject from './LineObject';
import PointObject from './PointObject';
import { XY_PLANE } from '@/utils/threejs_planes';
import {
  ToolState,
  selectToolState,
  setLengthConstraintLineId,
  setSelectedEntityId,
} from '@/app/slices/sketchToolStateSlice';
import { SlvsConstraints } from '@/app/types/Constraints';
import ZeroCoordinateCross from './ZeroCoordinateCross';
import { Vector3Like } from 'three';
import CircleObject from './CircleObject';

export interface GeometryToolRefType {
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export interface GeometryToolProps {
  //onGeometryClick: (type: GeometryType, id: number) => void;
}

// Workaround for creating the circle, since circleRadius always has the old value in circleToolOnClick().
// But circleRadius is needed as useState() for rendering.
let g_circleRadius: number = 0;

const GeometryTool = forwardRef<any, any>(({}: GeometryToolProps, ref) => {
  const [currentMousePos, setCurrentMousePos] = useState<[x: number, y: number, z: number] | null>(null);
  const [pointsToDraw, setPointsToDraw] = useState<[x: number, y: number, z: number][]>([]);
  const [objectsClicked, setObjectsClicked] = useState<{ type: GeometryType; id: number }[]>([]);
  const [circleMidPoint, setCircleMidPoint] = useState<Vector3Like | null>(null);
  const [circleRadius, setCircleRadius] = useState<number>(0);
  const { camera, scene, raycaster } = useThree();

  const dispatch = useAppDispatch();
  const sketchPoints = useAppSelector(selectPoints);
  const sketchPointsMap = useAppSelector(selectPointsMap);
  const sketchLines = useAppSelector(selectLines);
  const sketchCircles = useAppSelector(selectCircles);
  const sketchLastPoint = useAppSelector(selectLastPoint);
  const sketchConstraints = useAppSelector(selectConstraints);

  const toolState = useAppSelector(selectToolState);

  // ---

  const lineToolOnClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    //console.log(event);

    const intersect = calcIntersectionWithPlane(
      raycaster,
      camera,
      XY_PLANE,
      event.clientX,
      event.clientY,
      event.target as HTMLElement
    );
    if (intersect) {
      dispatch(addEntity({ p: { ...intersect, id: 0 }, type: GeometryType.LINE }));
    }
    //console.log(intersect);
  };

  const lineToolOnPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();

    //console.log('onPointerMove', event);
    const intersect = calcIntersectionWithPlane(
      raycaster,
      camera,
      XY_PLANE,
      event.clientX,
      event.clientY,
      event.target as HTMLElement
    );
    if (intersect) {
      setCurrentMousePos([intersect.x, intersect.y, intersect.z]);
    }
  };

  const pointToolOnClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    const intersect = calcIntersectionWithPlane(
      raycaster,
      camera,
      XY_PLANE,
      event.clientX,
      event.clientY,
      event.target as HTMLElement
    );
    if (intersect) {
      dispatch(addEntity({ p: { ...intersect, id: 0 }, type: GeometryType.POINT }));
    }
  };

  const circleToolOnClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    const intersect = calcIntersectionWithPlane(
      raycaster,
      camera,
      XY_PLANE,
      event.clientX,
      event.clientY,
      event.target as HTMLElement
    );
    if (intersect) {
      if (circleMidPoint === null) {
        setCircleMidPoint(intersect);
      } else {
        //console.log('Create the circle!', circleRadius, g_circleRadius);
        dispatch(addEntity({ p: { ...circleMidPoint, id: 0 }, type: GeometryType.CIRCLE, radius: g_circleRadius }));

        setCircleMidPoint(null);
      }
    }
  };

  const circleToolOnPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (circleMidPoint !== null) {
      const intersect = calcIntersectionWithPlane(
        raycaster,
        camera,
        XY_PLANE,
        event.clientX,
        event.clientY,
        event.target as HTMLElement
      );
      if (intersect) {
        // update the radius
        const radius = intersect.sub(circleMidPoint).length();
        //console.log('circle radius', radius);
        setCircleRadius(radius);
        g_circleRadius = radius;
      }
    }
  };

  const lineToolReset = () => {
    setCurrentMousePos(null);
    dispatch(resetLastPoint());
  };

  const geometryToolReset = () => {
    lineToolReset();

    setCircleMidPoint(null);
    setCircleRadius(0);
  };

  const onGeometryClick = (type: GeometryType, id: number) => {
    console.log(
      '[SketcherView.onGeometryClick] Geometry with type ' + geometryTypeToString(type) + ' and id ' + id + ' clicked'
    );

    // Add constraint in case a constraint tool was selected
    if (ToolState.CONSTRAINT_COINCIDENCE === toolState) {
      if (type === GeometryType.POINT) {
        console.log(objectsClicked);
        if (objectsClicked.length === 1) {
          dispatch(
            addConstraint({
              id: 0,
              t: SlvsConstraints.SLVS_C_POINTS_COINCIDENT,
              v: [0, objectsClicked[0].id, id, 0, 0],
            })
          );
          setObjectsClicked([]);
        } else if (objectsClicked.length === 0) {
          setObjectsClicked([{ type: type, id: id }]);
        }
      }
      // line not supported - TODO indicate that visually
    } else if (ToolState.CONSTRAINT_HORIZONTAL === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_HORIZONTAL, v: [0, 0, 0, id, 0] }));
      }
      // TODO support for two points
      // TODO indicate for everything else that it is not supported
    } else if (ToolState.CONSTRAINT_VERTICAL === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(addConstraint({ id: 0, t: SlvsConstraints.SLVS_C_VERTICAL, v: [0, 0, 0, id, 0] }));
      }
      // TODO support for two points
      // TODO indicate for everything else that it is not supported
    } else if (ToolState.CONSTRAINT_LENGTH === toolState) {
      if (type === GeometryType.LINE) {
        dispatch(setLengthConstraintLineId(id));
      }
      // Point type not supported - TODO indicate that visually
    } else if (ToolState.CURSOR_TOOL === toolState) {
      // Selection functionality
      dispatch(setSelectedEntityId(id));
    }
  };

  // ---

  useEffect(() => {
    dispatch(
      callSketchSolverBackend(
        buildSolverRequestType({
          workplane: 'xy',
          points: sketchPoints,
          lines: sketchLines,
          circles: sketchCircles,
          constraints: sketchConstraints,
        })
      )
    );
  }, [sketchPoints, sketchLines, sketchConstraints]);

  useImperativeHandle(
    ref,
    () => ({
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        if (ToolState.LINE_TOOL === toolState) {
          lineToolOnClick(event);
        } else if (ToolState.POINT_TOOL === toolState) {
          pointToolOnClick(event);
        } else if (ToolState.CIRCLE_TOOL === toolState) {
          circleToolOnClick(event);
        }
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        //console.log('onPointerMove', toolState);
        if (ToolState.LINE_TOOL === toolState) {
          lineToolOnPointerMove(event);
        } else if (ToolState.CIRCLE_TOOL === toolState) {
          circleToolOnPointerMove(event);
          lineToolReset();
        } else {
          geometryToolReset();
        }
      },
    }),
    [camera, scene, raycaster, toolState, circleMidPoint]
  );

  useEffect(() => {
    if (currentMousePos && sketchLastPoint) {
      setPointsToDraw([[sketchLastPoint.x, sketchLastPoint.y, sketchLastPoint.z], currentMousePos]);
    } else if (!currentMousePos) {
      setPointsToDraw([]);
    }
  }, [currentMousePos]);

  return (
    <>
      {pointsToDraw.length === 2 && (
        <Line
          points={[pointsToDraw[0], pointsToDraw[1]]} // array of points
          color={'gray'}
          lineWidth={1.5} // default is 1
          segments
          dashed={false} // default
        />
      )}
      {sketchLines.map((line) => {
        const p1 = sketchPointsMap[line.p1_id];
        const p2 = sketchPointsMap[line.p2_id];
        //console.log('id', line.id, 'line', line);
        return (
          <LineObject
            key={line.id}
            id={line.id}
            start={[p1.x, p1.y, p1.z]}
            end={[p2.x, p2.y, p2.z]}
            onGeometryClick={onGeometryClick}
            length={line.length}
          />
        );
      })}

      <Points>
        <pointsMaterial vertexColors size={8} />
        {sketchPoints.map((point) => {
          //console.log('id', point.id, 'point', point);
          return (
            <PointObject
              key={point.id}
              id={point.id}
              position={[point.x, point.y, point.z]}
              onGeometryClick={onGeometryClick}
            />
          );
        })}
      </Points>

      {/* TODO update X and Y in case plane changes (when this is implemented) */}
      {circleMidPoint !== null && circleRadius > 0 && (
        <CircleObject
          id={-1}
          centerX={circleMidPoint.x}
          centerY={circleMidPoint.y}
          radius={circleRadius}
          color="grey"
          enableHover={false}
        />
      )}

      {sketchCircles.map((circle) => {
        // TODO update X and Y in case plane changes (when this is implemented)
        const midPoint = sketchPointsMap[circle.mid_pt_id];
        return (
          <CircleObject
            key={circle.id}
            id={circle.id}
            centerX={midPoint.x}
            centerY={midPoint.y}
            radius={circle.radius}
            color="white"
            enableHover={true}
            onGeometryClick={onGeometryClick}
          />
        );
      })}

      <ZeroCoordinateCross onGeometryClick={onGeometryClick} />
    </>
  );
});

export default GeometryTool;
