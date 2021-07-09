/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Box, Cone, Cylinder, Line, Sphere} from "@react-three/drei";
import {Euler, Mesh, TextureLoader, Vector3} from "three";
import {useStore} from "../stores/common";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_RADIUS, RESIZE_HANDLE_COLOR, RESIZE_HANDLE_SIZE} from "../constants";
import {ActionType, MoveHandleType, ObjectType, Orientation, ResizeHandleType} from "../types";
import {Util} from "../Util";
import {SolarPanelModel} from "../models/SolarPanelModel";
import SolarPanelBlueLandscapeImage from "../resources/solar-panel-blue-landscape.png";
import SolarPanelBluePortraitImage from "../resources/solar-panel-blue-portrait.png";
import SolarPanelBlackLandscapeImage from "../resources/solar-panel-black-landscape.png";
import SolarPanelBlackPortraitImage from "../resources/solar-panel-black-portrait.png";
import {getSunDirection} from "../analysis/sunTools";

const SolarPanel = ({
                        id,
                        pvModel,
                        cx,
                        cy,
                        cz,
                        lx,
                        ly,
                        lz,
                        tiltAngle,
                        relativeAzimuth,
                        poleHeight,
                        poleRadius,
                        poleSpacingX,
                        poleSpacingY,
                        drawSunBeam,
                        rotation = [0, 0, 0],
                        normal = [0, 0, 1],
                        color = 'white',
                        lineColor = 'black',
                        lineWidth = 0.1,
                        selected = false,
                        showLabel = false,
                        locked = false,
                        parent,
                        orientation = Orientation.portrait,
                    }: SolarPanelModel) => {

    const setCommonStore = useStore(state => state.set);
    const world = useStore(state => state.world);
    const shadowEnabled = useStore(state => state.viewState.shadowEnabled);
    const getElementById = useStore(state => state.getElementById);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const {gl: {domElement}} = useThree();
    const [hovered, setHovered] = useState(false);
    const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);
    const [hoveredResizeHandleLower, setHoveredResizeHandleLower] = useState(false);
    const [hoveredResizeHandleUpper, setHoveredResizeHandleUpper] = useState(false);
    const [hoveredResizeHandleLeft, setHoveredResizeHandleLeft] = useState(false);
    const [hoveredResizeHandleRight, setHoveredResizeHandleRight] = useState(false);
    const baseRef = useRef<Mesh>();
    const moveHandleRef = useRef<Mesh>();
    const resizeHandleLowerRef = useRef<Mesh>();
    const resizeHandleUpperRef = useRef<Mesh>();
    const resizeHandleLeftRef = useRef<Mesh>();
    const resizeHandleRightRef = useRef<Mesh>();

    if (parent) {
        const p = getElementById(parent.id);
        if (p) {
            switch (p.type) {
                case ObjectType.Foundation:
                    cz = p.cz + p.lz / 2;
                    if (Util.isZero(rotation[2])) {
                        cx = p.cx + cx * p.lx;
                        cy = p.cy + cy * p.ly;
                    } else {
                        // we must rotate the real length, not normalized length
                        const v = new Vector3(cx * p.lx, cy * p.ly, 0);
                        v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
                        cx = p.cx + v.x;
                        cy = p.cy + v.y;
                    }
                    break;
                case ObjectType.Cuboid:
                    if (Util.isZero(rotation[2])) {
                        cx = p.cx + cx * p.lx;
                        cy = p.cy + cy * p.ly;
                        cz = p.cz + cz * p.lz;
                    } else {
                        // we must rotate the real length, not normalized length
                        const v = new Vector3(cx * p.lx, cy * p.ly, cz * p.lz);
                        v.applyAxisAngle(Util.UNIT_VECTOR_POS_Z, rotation[2]);
                        cx = p.cx + v.x;
                        cy = p.cy + v.y;
                        cz = p.cz + v.z;
                    }
                    break;
            }
        }
    }
    cy = -cy; // we want positive y to point north
    cz = poleHeight + lz / 2 + parent.lz;
    if (orientation === Orientation.portrait) {
        lx = pvModel.nominalWidth;
        ly = pvModel.nominalLength;
    } else {
        lx = pvModel.nominalLength;
        ly = pvModel.nominalWidth;
    }
    lz = pvModel.thickness;

    const hx = lx / 2;
    const hy = ly / 2;
    const hz = lz / 2;
    const positionLL = new Vector3(-hx, hz, -hy);
    const positionUL = new Vector3(-hx, hz, hy);
    const positionLR = new Vector3(hx, hz, -hy);
    const positionUR = new Vector3(hx, hz, hy);
    const element = getElementById(id);

    const texture = useMemo(() => {
        const loader = new TextureLoader();
        let texture;
        switch (orientation) {
            case Orientation.portrait:
                texture = loader.load(pvModel.color === 'Blue' ?
                    SolarPanelBluePortraitImage : SolarPanelBlackPortraitImage);
                break;
            default:
                texture = loader.load(pvModel.color === 'Blue' ?
                    SolarPanelBlueLandscapeImage : SolarPanelBlackLandscapeImage);
        }
        return texture;
    }, [orientation, pvModel.color]);

    const selectMe = (e: ThreeEvent<MouseEvent>, action: ActionType) => {
        // We must check if there is really a first intersection, onPointerDown does not guarantee it
        // onPointerDown listener for an object can still fire an event even when the object is behind another one
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

    const euler = useMemo(() => {
        const v = Util.arrayToVector3(normal);
        if (Util.isSame(v, Util.UNIT_VECTOR_POS_Z)) {
            // top face in model coordinate system
            return new Euler(0, rotation[2], 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_X)) {
            // east face in model coordinate system
            return new Euler(0, rotation[2], Util.HALF_PI);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_X)) {
            // west face in model coordinate system
            return new Euler(0, rotation[2], Util.HALF_PI);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_Y)) {
            // south face in the model coordinate system
            return new Euler(0, rotation[2] + Util.HALF_PI, Util.HALF_PI);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_Y)) {
            // north face in the model coordinate system
            return new Euler(0, rotation[2] + Util.HALF_PI, Util.HALF_PI);
        }
        return new Euler(0, rotation[2], 0);
    }, [normal, rotation]);

    const spritePosition = useMemo(() => {
        const v = Util.arrayToVector3(normal);
        if (Util.isSame(v, Util.UNIT_VECTOR_POS_Z)) {
            // top face in model coordinate system
            return new Vector3(0, lz + 0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_X)) {
            // east face in model coordinate system
            return new Vector3(0, -0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_X)) {
            // west face in model coordinate system
            return new Vector3(0, 0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_POS_Y)) {
            // south face in the model coordinate system
            return new Vector3(0, -0.2, 0);
        } else if (Util.isSame(v, Util.UNIT_VECTOR_NEG_Y)) {
            // north face in the model coordinate system
            return new Vector3(0, 0.2, 0);
        }
        return new Vector3(0, lz + 0.2, 0);
    }, [normal]);

    const hoverHandle = (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType) => {
        if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === e.eventObject;
            if (intersected) {
                setHoveredHandle(handle);
                if ( // unfortunately, I cannot find a way to tell the type of an enum variable
                    handle === ResizeHandleType.Upper ||
                    handle === ResizeHandleType.Lower ||
                    handle === ResizeHandleType.Left ||
                    handle === ResizeHandleType.Right
                ) {
                    domElement.style.cursor = 'move';
                } else {
                    domElement.style.cursor = 'pointer';
                }
                switch (handle) {
                    case ResizeHandleType.Lower:
                        setHoveredResizeHandleLower(true);
                        break;
                    case ResizeHandleType.Upper:
                        setHoveredResizeHandleUpper(true);
                        break;
                    case ResizeHandleType.Left:
                        setHoveredResizeHandleLeft(true);
                        break;
                    case ResizeHandleType.Right:
                        setHoveredResizeHandleRight(true);
                        break;
                }
            }
        }
    };

    const noHoverHandle = () => {
        setHoveredHandle(null);
        setHoveredResizeHandleLower(false);
        setHoveredResizeHandleUpper(false);
        setHoveredResizeHandleLeft(false);
        setHoveredResizeHandleRight(false);
        domElement.style.cursor = 'default';
    };

    const sunDirection = useMemo(() => {
        return Util.modelToView(getSunDirection(new Date(world.date), world.latitude));
    }, [world.date, world.latitude]);

    const relativeEuler = new Euler(tiltAngle, relativeAzimuth, 0);
    const normalVector = useMemo(() => {
        const v = new Vector3();
        return drawSunBeam ? Util.modelToView(v.fromArray(normal)).applyEuler(relativeEuler) : v;
    }, [drawSunBeam, normal, relativeEuler]);

    return (

        <group name={'Solar Panel Group ' + id}
               rotation={euler}
               position={[cx, cz + hz, cy]}>

            {/* draw panel */}
            <Box receiveShadow={shadowEnabled}
                 castShadow={shadowEnabled}
                 userData={{simulation: true, aabb: true}}
                 uuid={id}
                 ref={baseRef}
                 args={[lx, lz, ly]}
                 rotation={relativeEuler}
                 name={'Solar Panel'}
                 onPointerDown={(e) => {
                     if (e.button === 2) return; // ignore right-click
                     selectMe(e, ActionType.Select);
                 }}
                 onContextMenu={(e) => {
                     selectMe(e, ActionType.Select);
                 }}
                 onPointerOver={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             setHovered(true);
                             domElement.style.cursor = 'move';
                         }
                     }
                 }}
                 onPointerOut={(e) => {
                     setHovered(false);
                     domElement.style.cursor = 'default';
                 }}
            >
                <meshStandardMaterial attachArray="material" color={color}/>
                <meshStandardMaterial attachArray="material" color={color}/>
                <meshStandardMaterial attachArray="material" map={texture}/>
                <meshStandardMaterial attachArray="material" color={color}/>
                <meshStandardMaterial attachArray="material" color={color}/>
                <meshStandardMaterial attachArray="material" color={color}/>
            </Box>

            {/* draw pole */}
            {poleHeight > 0 &&
            <Cylinder castShadow={shadowEnabled}
                      args={[poleRadius, poleRadius, poleHeight, 6, 2]}
                      position={[0, -poleHeight / 2 - lz / 2, 0]}>
                <meshStandardMaterial attach="material" color={color}/>
            </Cylinder>
            }

            {/*draw sun beam*/}
            {drawSunBeam && sunDirection.y > 0 &&
            <group>
                <Line points={[[0, 0, 0], sunDirection.clone().multiplyScalar(100)]}
                      name={'Sun Beam'}
                      lineWidth={0.5}
                      color={'white'}/>
                <Line points={[[0, 0, 0], normalVector.clone().multiplyScalar(0.75)]}
                      name={'Normal Vector'}
                      lineWidth={0.5}
                      color={'white'}/>
                <Line points={[sunDirection.clone().multiplyScalar(0.5), normalVector.clone().multiplyScalar(0.5)]}
                      name={'Angle'}
                      lineWidth={0.5}
                      color={'white'}/>
                <textSprite
                    name={'Angle Value'}
                    text={Util.toDegrees(sunDirection.angleTo(normalVector)).toFixed(1) + '°'}
                    fontSize={20}
                    fontFace={'Times Roman'}
                    textHeight={0.1}
                    position={sunDirection.clone().multiplyScalar(0.75).add(normalVector.clone().multiplyScalar(0.75)).multiplyScalar(0.5)}
                />
                <Cone args={[0.04, 0.2, 4, 2]}
                      name={'Normal Vector Arrow Head'}
                      rotation={relativeEuler}
                      position={normalVector.clone().multiplyScalar(0.75)}>
                    <meshStandardMaterial attach="material" color={'white'}/>
                </Cone>
            </group>
            }

            {!selected &&
            <group rotation={[tiltAngle, relativeAzimuth, 0]}>
                {/* draw wireframe lines upper face */}
                <Line points={[positionLL, positionLR]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, positionUR]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, positionUL]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, positionLL]}
                      name={'Line UL-LL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[[positionLL.x, -hz, positionLL.z], [positionLR.x, -hz, positionLR.z]]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, -hz, positionLR.z], [positionUR.x, -hz, positionUR.z]]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, -hz, positionUR.z], [positionUL.x, -hz, positionUL.z]]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, -hz, positionUL.z], [positionLL.x, -hz, positionLL.z]]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[[positionLL.x, -hz, positionLL.z], positionLL]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, -hz, positionLR.z], positionLR]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, -hz, positionUL.z], positionUL]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, -hz, positionUR.z], positionUR]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </group>
            }

            {/* draw move handle */}
            {selected && !locked &&
            <Sphere
                ref={moveHandleRef}
                position={new Vector3(0, 0, 0)}
                args={[MOVE_HANDLE_RADIUS, 6, 6]}
                name={'Handle'}
                onPointerDown={(e) => {
                    selectMe(e, ActionType.Move);
                }}>
                <meshStandardMaterial attach="material" color={'orange'}/>
            </Sphere>
            }

            {/*draw resize handles */}
            {selected && !locked &&
            <group rotation={[tiltAngle, relativeAzimuth, 0]}>
                <Box ref={resizeHandleLowerRef}
                     position={[(positionLL.x + positionLR.x) / 2, positionLL.y, positionLL.z]}
                     args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                     name={ResizeHandleType.Lower}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.Lower);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.Lower ||
                            resizeHandleType === ResizeHandleType.Lower ?
                                HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleUpperRef}
                     position={[(positionUL.x + positionUR.x) / 2, positionUL.y, positionUL.z]}
                     args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                     name={ResizeHandleType.Upper}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.Upper);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.Upper ||
                            resizeHandleType === ResizeHandleType.Upper ?
                                HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleLeftRef}
                     position={[positionLL.x, positionLL.y, (positionLL.z + positionUL.z) / 2]}
                     args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                     name={ResizeHandleType.Left}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.Left);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.Left ||
                            resizeHandleType === ResizeHandleType.Left ?
                                HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
                <Box ref={resizeHandleRightRef}
                     position={[positionLR.x, positionLR.y, (positionLR.z + positionUR.z) / 2]}
                     args={[RESIZE_HANDLE_SIZE, lz * 1.2, RESIZE_HANDLE_SIZE]}
                     name={ResizeHandleType.Right}
                     onPointerDown={(e) => {
                         selectMe(e, ActionType.Resize);
                     }}
                     onPointerOver={(e) => {
                         hoverHandle(e, ResizeHandleType.Right);
                     }}
                     onPointerOut={(e) => {
                         noHoverHandle();
                     }}
                >
                    <meshStandardMaterial
                        attach="material"
                        color={
                            hoveredHandle === ResizeHandleType.Right ||
                            resizeHandleType === ResizeHandleType.Right ?
                                HIGHLIGHT_HANDLE_COLOR : RESIZE_HANDLE_COLOR
                        }
                    />
                </Box>
            </group>
            }

            {/*draw label */}
            {(hovered || showLabel) && !selected &&
            <textSprite
                name={'Label'}
                text={element?.label ? element.label : 'Solar Panel'}
                fontSize={20}
                fontFace={'Times Roman'}
                textHeight={0.2}
                position={spritePosition}
            />
            }
        </group>
    )
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default SolarPanel;
