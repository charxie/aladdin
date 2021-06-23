/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {FoundationModel} from "../models/foundationModel";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {ActionType, MoveHandleType, ResizeHandleType} from "../types";
import {
    HIGHLIGHT_HANDLE_COLOR,
    MOVE_HANDLE_COLOR,
    MOVE_HANDLE_OFFSET,
    MOVE_HANDLE_RADIUS,
    RESIZE_HANDLE_COLOR,
    RESIZE_HANDLE_SIZE
} from "../constants";
import {Util} from "../util";

const Foundation = ({
                        id,
                        cx,
                        cy,
                        lx = 1,
                        ly = 1,
                        lz = 0.1,
                        rotation = [0, 0, 0],
                        color = 'gray',
                        lineColor = 'black',
                        lineWidth = 0.2,
                        selected = false,
                    }: FoundationModel) => {

        cy = -cy; // we want positive y to point north

        const setCommonStore = useStore(state => state.set);
        const shadowEnabled = useStore(state => state.shadowEnabled);
        const moveHandleType = useStore(state => state.moveHandleType);
        const resizeHandleType = useStore(state => state.resizeHandleType);
        const {gl: {domElement}} = useThree();
        const [hovered, setHovered] = useState(false);
        const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);
        const baseRef = useRef<Mesh>();
        const resizeHandleLLRef = useRef<Mesh>();
        const resizeHandleULRef = useRef<Mesh>();
        const resizeHandleLRRef = useRef<Mesh>();
        const resizeHandleURRef = useRef<Mesh>();
        const moveHandleLowerRef = useRef<Mesh>();
        const moveHandleUpperRef = useRef<Mesh>();
        const moveHandleLeftRef = useRef<Mesh>();
        const moveHandleRightRef = useRef<Mesh>();

        const wireframe = true;

        const positionLL = new Vector3(cx - lx / 2, lz / 2, cy - ly / 2);
        const positionUL = new Vector3(cx - lx / 2, lz / 2, cy + ly / 2);
        const positionLR = new Vector3(cx + lx / 2, lz / 2, cy - ly / 2);
        const positionUR = new Vector3(cx + lx / 2, lz / 2, cy + ly / 2);

        const selectMe = (e: ThreeEvent<MouseEvent>, action: ActionType) => {
            if (e.intersections.length > 0) {
                const intersected = e.intersections[0].object === e.eventObject;
                if (intersected) {
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

        const h = MOVE_HANDLE_RADIUS / 2;

        return (

            <group name={'Foundation Group ' + id} rotation={Util.getEuler(rotation)}>

                {/* draw rectangle */}
                <Box castShadow={shadowEnabled}
                     receiveShadow={shadowEnabled}
                     ref={baseRef}
                     name={'Foundation'}
                     position={[cx, lz / 2, cy]}
                     args={[lx, lz, ly]}
                     onContextMenu={(e) => {
                         selectMe(e, ActionType.Select);
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
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Select);
                     }}
                     onPointerUp={(e) => {
                     }}
                     onPointerMove={(e) => {
                     }}
                >
                    <meshStandardMaterial attach="material" color={color}/>
                </Box>

                {(wireframe && !selected) &&
                <>
                    {/* draw wireframe lines upper face */}
                    <Line points={[[positionLL.x, lz, positionLL.z], [positionLR.x, lz, positionLR.z]]}
                          name={'Line LL-LR Upper Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionLR.x, lz, positionLR.z], [positionUR.x, lz, positionUR.z]]}
                          name={'Line LR-UR Upper Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionUR.x, lz, positionUR.z], [positionUL.x, lz, positionUL.z]]}
                          name={'Line UR-UL Upper Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionUL.x, lz, positionUL.z], [positionLL.x, lz, positionLL.z]]}
                          name={'Line UL-LL Upper Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>

                    {/* draw wireframe lines lower face */}
                    <Line points={[[positionLL.x, 0, positionLL.z], [positionLR.x, 0, positionLR.z]]}
                          name={'Line LL-LR Lower Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionLR.x, 0, positionLR.z], [positionUR.x, 0, positionUR.z]]}
                          name={'Line LR-UR Lower Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionUR.x, 0, positionUR.z], [positionUL.x, 0, positionUL.z]]}
                          name={'Line UR-UL Lower Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionUL.x, 0, positionUL.z], [positionLL.x, 0, positionLL.z]]}
                          name={'Line UL-LL Lower Face'}
                          lineWidth={lineWidth}
                          color={lineColor}/>

                    {/* draw wireframe vertical lines */}
                    <Line points={[[positionLL.x, 0, positionLL.z], [positionLL.x, lz, positionLL.z]]}
                          name={'Line LL-LL Vertical'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionLR.x, 0, positionLR.z], [positionLR.x, lz, positionLR.z]]}
                          name={'Line LR-LR Vertical'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionUL.x, 0, positionUL.z], [positionUL.x, lz, positionUL.z]]}
                          name={'Line UL-UL Vertical'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                    <Line points={[[positionUR.x, 0, positionUR.z], [positionUR.x, lz, positionUR.z]]}
                          name={'Line UR-UR Vertical'}
                          lineWidth={lineWidth}
                          color={lineColor}/>
                </>
                }

                {/* draw handles */}
                {selected &&
                <>
                    {/* resize handles */}
                    <Box ref={resizeHandleLLRef}
                         position={positionLL}
                         args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                         name={ResizeHandleType.LowerLeft}
                         onPointerDown={(e) => {
                             selectMe(e, ActionType.Resize);
                             setCommonStore(state => {
                                 Util.setVector2(state.resizeAnchor, cx + lx / 2, cy + ly / 2);
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
                    <Box ref={resizeHandleULRef}
                         position={positionUL}
                         args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                         name={ResizeHandleType.UpperLeft}
                         onPointerDown={(e) => {
                             selectMe(e, ActionType.Resize);
                             setCommonStore(state => {
                                 Util.setVector2(state.resizeAnchor, cx + lx / 2, cy - ly / 2);
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
                    <Box ref={resizeHandleLRRef}
                         position={positionLR}
                         args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                         name={ResizeHandleType.LowerRight}
                         onPointerDown={(e) => {
                             selectMe(e, ActionType.Resize);
                             setCommonStore(state => {
                                 Util.setVector2(state.resizeAnchor, cx - lx / 2, cy + ly / 2);
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
                    <Box ref={resizeHandleURRef}
                         position={positionUR}
                         args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                         name={ResizeHandleType.UpperRight}
                         onPointerDown={(e) => {
                             selectMe(e, ActionType.Resize);
                             setCommonStore(state => {
                                 Util.setVector2(state.resizeAnchor, cx - lx / 2, cy - ly / 2);
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
                    <Sphere ref={moveHandleLowerRef}
                            args={[MOVE_HANDLE_RADIUS, 6, 6]}
                            position={[cx, h, cy - ly / 2 - MOVE_HANDLE_OFFSET]}
                            name={MoveHandleType.Lower}
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
                                moveHandleType === MoveHandleType.Lower ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                            }
                        />
                    </Sphere>
                    <Sphere ref={moveHandleUpperRef}
                            args={[MOVE_HANDLE_RADIUS, 6, 6]}
                            position={[cx, h, cy + ly / 2 + MOVE_HANDLE_OFFSET]}
                            name={MoveHandleType.Upper}
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
                                moveHandleType === MoveHandleType.Upper ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                            }
                        />
                    </Sphere>
                    <Sphere ref={moveHandleLeftRef}
                            args={[MOVE_HANDLE_RADIUS, 6, 6]}
                            position={[cx - lx / 2 - MOVE_HANDLE_OFFSET, h, cy]}
                            name={MoveHandleType.Left}
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
                                moveHandleType === MoveHandleType.Left ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                            }
                        />
                    </Sphere>
                    <Sphere ref={moveHandleRightRef}
                            args={[MOVE_HANDLE_RADIUS, 6, 6]}
                            position={[cx + lx / 2 + MOVE_HANDLE_OFFSET, h, cy]}
                            name={MoveHandleType.Right}
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
                                moveHandleType === MoveHandleType.Right ? HIGHLIGHT_HANDLE_COLOR : MOVE_HANDLE_COLOR
                            }
                        />
                    </Sphere>
                </>
                }

                {(hovered && !selected) &&
                <textSprite
                    name={'Label'}
                    text={'Foundation'}
                    fontSize={90}
                    fontFace={'Times Roman'}
                    textHeight={1}
                    position={[cx, lz + 0.2, cy]}
                    scale={[1, 0.2, 0.2]}/>
                }

            </group>
        )
    }
;

export default Foundation;
