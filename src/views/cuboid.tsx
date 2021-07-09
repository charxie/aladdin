/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Euler, Face, Mesh, Raycaster, Vector2, Vector3} from "three";
import {useStore} from "../stores/common";
import {CuboidModel} from "../models/CuboidModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {ActionType, MoveHandleType, ObjectType, ResizeHandleType} from "../types";
import {
    RESIZE_HANDLE_SIZE,
    MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_RADIUS,
    HIGHLIGHT_HANDLE_COLOR,
    RESIZE_HANDLE_COLOR,
    MOVE_HANDLE_COLOR_1,
    MOVE_HANDLE_COLOR_2,
    MOVE_HANDLE_COLOR_3
} from "../constants";
import {Util} from "../Util";
import {ElementModel} from "../models/ElementModel";

const Cuboid = ({
                    id,
                    cx,
                    cy,
                    lx = 1,
                    ly = 1,
                    lz = 1,
                    rotation = [0, 0, 0],
                    color = 'silver',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    selected = false,
                    locked = false,
                }: CuboidModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const moveHandleType = useStore(state => state.moveHandleType);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const getElementById = useStore(state => state.getElementById);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const addElement = useStore(state => state.addElement);
    const setElementPosition = useStore(state => state.setElementPosition);
    const setElementNormal = useStore(state => state.setElementNormal);
    const objectTypeToAdd = useStore(state => state.objectTypeToAdd);

    const {camera, gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);
    const [showGrid, setShowGrid] = useState<boolean>(false);
    const ray = useMemo(() => new Raycaster(), []);

    const elementModel = getElementById(id);
    const baseRef = useRef<Mesh>();
    const grabRef = useRef<ElementModel | null>(null);
    const faceNormalRef = useRef<Vector3>(Util.UNIT_VECTOR_POS_Z);
    const gridLength = useRef<number>(10);
    const gridPositionRef = useRef<Vector3>(new Vector3(0, 0, 0));
    const gridRotationRef = useRef<Euler>(new Euler(0, 0, 0));
    const gridScale = useRef<Vector3>(new Vector3(1, 1, 1));
    const resizeHandleLLTopRef = useRef<Mesh>();
    const resizeHandleULTopRef = useRef<Mesh>();
    const resizeHandleLRTopRef = useRef<Mesh>();
    const resizeHandleURTopRef = useRef<Mesh>();
    const resizeHandleLLBotRef = useRef<Mesh>();
    const resizeHandleULBotRef = useRef<Mesh>();
    const resizeHandleLRBotRef = useRef<Mesh>();
    const resizeHandleURBotRef = useRef<Mesh>();
    const moveHandleLowerFaceRef = useRef<Mesh>();
    const moveHandleUpperFaceRef = useRef<Mesh>();
    const moveHandleLeftFaceRef = useRef<Mesh>();
    const moveHandleRightFaceRef = useRef<Mesh>();
    const moveHandleTopFaceRef = useRef<Mesh>();

    const hx = lx / 2;
    const hy = ly / 2;
    const hz = lz / 2;
    const positionLLTop = useMemo(() => new Vector3(-hx, hz, -hy), [hx, hy, hz]);
    const positionULTop = useMemo(() => new Vector3(-hx, hz, hy), [hx, hy, hz]);
    const positionLRTop = useMemo(() => new Vector3(hx, hz, -hy), [hx, hy, hz]);
    const positionURTop = useMemo(() => new Vector3(hx, hz, hy), [hx, hy, hz]);
    const positionLLBot = useMemo(() => new Vector3(-hx, -hz, -hy), [hx, hy, hz]);
    const positionULBot = useMemo(() => new Vector3(-hx, -hz, hy), [hx, hy, hz]);
    const positionLRBot = useMemo(() => new Vector3(hx, -hz, -hy), [hx, hy, hz]);
    const positionURBot = useMemo(() => new Vector3(hx, -hz, hy), [hx, hy, hz]);

    const handleLift = MOVE_HANDLE_RADIUS;
    const positionLowerFace = useMemo(() => new Vector3(0, handleLift - hz, -hy - MOVE_HANDLE_OFFSET), [hy, hz]);
    const positionUpperFace = useMemo(() => new Vector3(0, handleLift - hz, hy + MOVE_HANDLE_OFFSET), [hy, hz]);
    const positionLeftFace = useMemo(() => new Vector3(-hx - MOVE_HANDLE_OFFSET, handleLift - hz, 0), [hx, hz]);
    const positionRightFace = useMemo(() => new Vector3(hx + MOVE_HANDLE_OFFSET, handleLift - hz, 0), [hx, hz]);
    const positionTopFace = useMemo(() => new Vector3(0, hz + MOVE_HANDLE_OFFSET, 0), [hz]);

    const selectMe = (e: ThreeEvent<MouseEvent>, action: ActionType) => {
        // We must check if there is really a first intersection, onPointerDown does not guarantee it
        // onPointerDown listener for an object can still fire an event even when the object is behind another one
        if (e.intersections.length > 0) {
            const intersection = e.intersections[0];
            if (intersection.object === e.eventObject) {
                setCommonStore((state) => {
                    for (const e of state.elements) {
                        e.selected = e.id === id;
                    }
                    switch (action) {
                        case ActionType.Move:
                            state.moveHandleType = e.eventObject.name as MoveHandleType;
                            state.resizeHandleType = null;
                            break;
                        case ActionType.Resize:
                            state.resizeHandleType = e.eventObject.name as ResizeHandleType;
                            state.moveHandleType = null;
                            break;
                        default:
                            state.moveHandleType = null;
                            state.resizeHandleType = null;
                    }
                });
            }
        }
    };

    const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType) => {
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setHoveredHandle(handle);
                if ( // unfortunately, I cannot find a way to tell the type of an enum variable
                    handle === MoveHandleType.Top ||
                    handle === MoveHandleType.Upper ||
                    handle === MoveHandleType.Lower ||
                    handle === MoveHandleType.Left ||
                    handle === MoveHandleType.Right
                ) {
                    domElement.style.cursor = 'move';
                } else {
                    domElement.style.cursor = 'pointer';
                }
            }
        }
    };

    const noHoverHandle = () => {
        setHoveredHandle(null);
        domElement.style.cursor = 'default';
    };

    // only these elements are allowed to be on the cuboid
    const legalOnCuboid = (type: ObjectType) => {
        return (
            type === ObjectType.Sensor
        );
    };

    const setupGridHelper = (face: Face) => {
        faceNormalRef.current = face.normal;
        if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_POS_Y)) {
            // top face in view coordinate system
            gridLength.current = Math.max(lx, ly);
            gridPositionRef.current = new Vector3(0, hz, 0);
            gridRotationRef.current = new Euler(0, 0, 0);
            gridScale.current = new Vector3(lx / gridLength.current, 1, ly / gridLength.current);
        } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_POS_X)) {
            // east face in view coordinate system
            gridLength.current = Math.max(ly, lz);
            gridPositionRef.current = new Vector3(hx, 0, 0);
            gridRotationRef.current = new Euler(0, 0, Util.HALF_PI);
            gridScale.current = new Vector3(1, lz / gridLength.current, ly / gridLength.current);
        } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_NEG_X)) {
            // west face in view coordinate system
            gridLength.current = Math.max(ly, lz);
            gridPositionRef.current = new Vector3(-hx, 0, 0);
            gridRotationRef.current = new Euler(0, 0, Util.HALF_PI);
            gridScale.current = new Vector3(1, lz / gridLength.current, ly / gridLength.current);
        } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_POS_Z)) {
            // south face in the view coordinate system
            gridLength.current = Math.max(lx, lz);
            gridPositionRef.current = new Vector3(0, 0, hy);
            gridRotationRef.current = new Euler(Util.HALF_PI, 0, 0);
            gridScale.current = new Vector3(lx / gridLength.current, lz / gridLength.current, 1);
        } else if (Util.isSame(faceNormalRef.current, Util.UNIT_VECTOR_NEG_Z)) {
            // north face in the view coordinate system
            gridLength.current = Math.max(lx, lz);
            gridPositionRef.current = new Vector3(0, 0, -hy);
            gridRotationRef.current = new Euler(Util.HALF_PI, 0, 0);
            gridScale.current = new Vector3(lx / gridLength.current, lz / gridLength.current, 1);
        }
    };

    return (

        <group name={'Cuboid Group ' + id}
               position={[cx, hz, cy]}
               rotation={Util.getEulerInView(rotation)}>

            {/* draw rectangular cuboid */}
            <Box castShadow={shadowEnabled}
                 receiveShadow={shadowEnabled}
                 userData={{simulation: true, aabb: true}}
                 uuid={id}
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 name={'Cuboid'}
                 onPointerDown={(e) => {
                     if (e.button === 2) return; // ignore right-click
                     selectMe(e, ActionType.Select);
                     const selectedElement = getSelectedElement();
                     if (selectedElement?.id === id) {
                         // no child of this cuboid is clicked
                         if (legalOnCuboid(objectTypeToAdd) && elementModel) {
                             setShowGrid(true);
                             const intersection = e.intersections[0];
                             addElement(elementModel, intersection.point, intersection.face?.normal);
                             setCommonStore(state => {
                                 state.objectTypeToAdd = ObjectType.None;
                             });
                         }
                     } else {
                         // a child of this cuboid is clicked
                         if (selectedElement) {
                             if (legalOnCuboid(selectedElement.type as ObjectType)) {
                                 setShowGrid(true);
                                 grabRef.current = selectedElement;
                                 let face;
                                 for (const x of e.intersections) {
                                     if (x.object === baseRef.current) {
                                         face = x.face;
                                         break;
                                     }
                                 }
                                 if (face) {
                                     setupGridHelper(face);
                                 }
                                 setCommonStore((state) => {
                                     state.enableOrbitController = false;
                                 });
                             }
                         }
                     }
                 }}
                 onPointerUp={(e) => {
                     grabRef.current = null;
                     setShowGrid(false);
                     setCommonStore((state) => {
                         state.enableOrbitController = true;
                     });
                 }}
                 onPointerMove={(e) => {
                     if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
                         const mouse = new Vector2();
                         mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                         mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                         ray.setFromCamera(mouse, camera);
                         let intersects;
                         switch (grabRef.current.type) {
                             case ObjectType.Sensor:
                                 if (baseRef.current) {
                                     intersects = ray.intersectObjects([baseRef.current]);
                                     if (intersects.length > 0) {
                                         let p = Util.viewToModel(intersects[0].point);
                                         const face = intersects[0].face;
                                         if (face) {
                                             setupGridHelper(face);
                                             const n = Util.viewToModel(face.normal);
                                             setElementNormal(grabRef.current.id, n.x, n.y, n.z);
                                         }
                                         if (elementModel) {
                                             p = Util.relativeCoordinates(p.x, p.y, p.z, elementModel);
                                         }
                                         setElementPosition(grabRef.current.id, p.x, p.y, p.z);
                                     }
                                 }
                                 break;
                         }
                     }
                 }}
                 onContextMenu={(e) => {
                     selectMe(e, ActionType.Select);
                     setCommonStore((state) => {
                         Util.copyVector(state.pastePoint, e.intersections[0].point);
                         const face = e.intersections[0].face;
                         if (face) {
                             state.pasteNormal = face.normal.clone();
                         }
                         state.clickObjectType = ObjectType.Cuboid;
                     });
                 }}
                 onPointerOver={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             setHovered(true);
                         }
                     }
                 }}
                 onPointerOut={(e) => {
                     setHovered(false);
                 }}
            >
                <meshStandardMaterial attach="material" color={color}/>
            </Box>

            {showGrid &&
            <gridHelper name={'Cuboid Grid'}
                        position={gridPositionRef.current}
                        rotation={gridRotationRef.current}
                        scale={gridScale.current}
                        args={[gridLength.current, 20, 'gray', 'gray']}/>
            }

            {!selected &&
            <>
                {/* draw wireframe lines top */}
                <Line points={[positionLLTop, positionLRTop]}
                      name={'Line LL-LR Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLRTop, positionURTop]}
                      name={'Line LR-UR Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionURTop, positionULTop]}
                      name={'Line UR-UL Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionULTop, positionLLTop]}
                      name={'Line UL-LL Top'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line
                    points={[positionLLBot, positionLRBot]}
                    name={'Line LL-LR Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionLRBot, positionURBot]}
                    name={'Line LR-UR Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionURBot, positionULBot]}
                    name={'Line UR-UL Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionULBot, positionLLBot]}
                    name={'Line UL-LL Bottom'}
                    lineWidth={lineWidth}
                    color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line
                    points={[positionLLBot, positionLLTop]}
                    name={'Line LL-LL Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionLRBot, positionLRTop]}
                    name={'Line LR-LR Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionULBot, positionULTop]}
                    name={'Line UL-UL Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
                <Line
                    points={[positionURBot, positionURTop]}
                    name={'Line UR-UR Vertical'}
                    lineWidth={lineWidth}
                    color={lineColor}/>
            </>
            }

            {/* draw handles */}
            {selected && !locked &&
            <>
                {/* resize handles */}
                <Box ref={resizeHandleLLTopRef}
                     name={ResizeHandleType.LowerLeftTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionLLTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerLeftTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerLeftTop ||
                            resizeHandleType === ResizeHandleType.LowerLeftTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleULTopRef}
                     name={ResizeHandleType.UpperLeftTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionULTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperLeftTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperLeftTop ||
                            resizeHandleType === ResizeHandleType.UpperLeftTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLRTopRef}
                     name={ResizeHandleType.LowerRightTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionLRTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerRightTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerRightTop ||
                            resizeHandleType === ResizeHandleType.LowerRightTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleURTopRef}
                     name={ResizeHandleType.UpperRightTop}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={positionURTop}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperRightTop);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperRightTop ||
                            resizeHandleType === ResizeHandleType.UpperRightTop ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLLBotRef}
                     name={ResizeHandleType.LowerLeft}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={new Vector3(-hx, RESIZE_HANDLE_SIZE / 2 - hz, -hy)}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx + hx, cy + hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerLeft);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerLeft ||
                            resizeHandleType === ResizeHandleType.LowerLeft ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleULBotRef}
                     name={ResizeHandleType.UpperLeft}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={new Vector3(-hx, RESIZE_HANDLE_SIZE / 2 - hz, hy)}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx + hx, cy - hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperLeft);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperLeft ||
                            resizeHandleType === ResizeHandleType.UpperLeft ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLRBotRef}
                     name={ResizeHandleType.LowerRight}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={new Vector3(hx, RESIZE_HANDLE_SIZE / 2 - hz, -hy)}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx - hx, cy + hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.LowerRight);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.LowerRight ||
                            resizeHandleType === ResizeHandleType.LowerRight ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleURBotRef}
                     name={ResizeHandleType.UpperRight}
                     args={[RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE, RESIZE_HANDLE_SIZE]}
                     position={new Vector3(hx, RESIZE_HANDLE_SIZE / 2 - hz, hy)}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                         setCommonStore(state => {
                             Util.setVector2(state.resizeAnchor, cx - hx, cy - hy);
                         });
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.UpperRight);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.UpperRight ||
                            resizeHandleType === ResizeHandleType.UpperRight ? HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>

                {/* move handles */}
                <Sphere ref={moveHandleLowerFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Lower}
                        position={positionLowerFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Lower);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Lower ||
                            moveHandleType === MoveHandleType.Lower ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_2
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleUpperFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Upper}
                        position={positionUpperFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Upper);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Upper ||
                            moveHandleType === MoveHandleType.Upper ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_2
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleLeftFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Left}
                        position={positionLeftFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Left);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Left ||
                            moveHandleType === MoveHandleType.Left ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_1
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleRightFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Right}
                        position={positionRightFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Right);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Right ||
                            moveHandleType === MoveHandleType.Right ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_1
                        }
                    />
                </Sphere>
                <Sphere ref={moveHandleTopFaceRef}
                        args={[MOVE_HANDLE_RADIUS, 6, 6]}
                        name={MoveHandleType.Top}
                        position={positionTopFace}
                        onPointerDown={(e) => {
                            selectMe(e, ActionType.Move);
                        }}
                        onPointerOver={(e) => {
                            hoverHandle(e, MoveHandleType.Top);
                        }}
                        onPointerOut={(e) => {
                            noHoverHandle();
                        }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === MoveHandleType.Top ||
                            moveHandleType === MoveHandleType.Top ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR_3
                        }
                    />
                </Sphere>
            </>
            }

            {hovered && !selected &&
            <textSprite
                name={'Label'}
                text={'Box'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.4, 0.2, 0.2]}
                position={[0, hz + 0.2, 0]}
            />
            }

        </group>
    )
};

export default React.memo(Cuboid);
