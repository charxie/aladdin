/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef} from "react";
import {BackSide, DoubleSide, Euler, Mesh, Raycaster, Vector2, Vector3} from "three";
import {ThreeEvent, useThree} from "@react-three/fiber";
import {Plane, useTexture} from "@react-three/drei";

import DefaultDaySkyImage from "../resources/daysky.jpg";
import DefaultNightSkyImage from "../resources/nightsky.jpg";
import DesertDaySkyImage from "../resources/desert.jpg";
import DesertNightSkyImage from "../resources/desert-night.jpg";
import ForestDaySkyImage from "../resources/forest.jpg";
import ForestNightSkyImage from "../resources/forest-night.jpg";
import GrasslandDaySkyImage from "../resources/grassland.jpg";
import GrasslandNightSkyImage from "../resources/grassland-night.jpg";

import {useStore} from "../stores/common";
import {IntersectionPlaneType, ObjectType, ResizeHandleType} from "../types";
import { ElementModel } from "../models/ElementModel";

export interface SkyProps {
    theme?: string,

    [key: string]: any;
}

const Sky = ({
                 theme = 'Default',
                 ...props
             }: SkyProps) => {

    const setCommonStore = useStore(state => state.set);
    const selectNone = useStore(state => state.selectNone);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const updateElement = useStore(state => state.updateElementById);
    const getCameraDirection = useStore(state => state.getCameraDirection);
    const resizeHandleType = useStore(state => state.resizeHandleType);
    const sunlightDirection = useStore(state => state.sunlightDirection);

    const {camera, gl: {domElement}} = useThree();
    const meshRef = useRef<Mesh>(null!);
    const grabRef = useRef<ElementModel | null>(null);
    const intersectionPlaneRef = useRef<Mesh>();
    const ray = useMemo(() => new Raycaster(), []);

    const night = sunlightDirection.y <= 0;
    const cosAngle = useMemo(() => {
        if (grabRef.current) {
            return Math.cos(grabRef.current.rotation[2]);
        }
        return 1;
    }, [grabRef.current?.rotation]);
    const sinAngle = useMemo(() => {
        if (grabRef.current) {
            return Math.sin(grabRef.current.rotation[2]);
        }
        return 0;
    }, [grabRef.current?.rotation]);
    const elementProps = useMemo(() => {
        if(grabRef.current) {
            const {lx, ly} = grabRef.current;
            const d = Math.sqrt(Math.pow(lx / 2, 2) + Math.pow(ly / 2, 2));
            const sinB = ly / 2 / d;
            const cosB = lx / 2 / d;
            const sinB_A = sinB * cosAngle - cosB * sinAngle;
            const cosB_A = cosB * cosAngle + sinB * sinAngle;
            const dx = d * cosB_A;
            const dy = d * sinB_A;
            return {dx, dy};
        }
        return {dx: 0, dy: 0};
    }, [grabRef.current?.lx, grabRef.current?.ly]);

    let intersectionPlaneType = IntersectionPlaneType.Sky;
    const intersectionPlanePosition = useMemo(() => new Vector3(), []);
    const intersectionPlaneAngle = useMemo(() => new Euler(), []);
    if (grabRef.current) {
        const v = getCameraDirection();
        const rotation = Math.atan2(v.x, v.z);
        if (resizeHandleType === ResizeHandleType.LowerLeftTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            intersectionPlanePosition.set(
                grabRef.current.cx - elementProps.dx, 
                0, 
                -grabRef.current.cy - elementProps.dy
            );
            intersectionPlaneAngle.set(0, rotation, 0);
        } else if (resizeHandleType === ResizeHandleType.UpperLeftTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            intersectionPlanePosition.set(
                grabRef.current.cx - elementProps.dy,
                0,
                -grabRef.current.cy + elementProps.dx
            );
            intersectionPlaneAngle.set(0, rotation, 0);
        } else if (resizeHandleType === ResizeHandleType.LowerRightTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            intersectionPlanePosition.set(
                grabRef.current.cx + elementProps.dy,
                0,
                -grabRef.current.cy - elementProps.dx
            );
            intersectionPlaneAngle.set(0, rotation, 0);
        } else if (resizeHandleType === ResizeHandleType.UpperRightTop) {
            intersectionPlaneType = IntersectionPlaneType.Vertical;
            intersectionPlanePosition.set(
                grabRef.current.cx + elementProps.dx,
                0,
                -grabRef.current.cy + elementProps.dy
            );
            intersectionPlaneAngle.set(0, rotation, 0);
        }
    }

    const scale = useMemo(() => {
        switch (theme) {
            case 'Desert':
                return 0.5;
            case 'Forest':
                return 0.3;
            case 'Grassland':
                return 0.2;
            default:
                return 0.2;
        }
    }, [theme]);

    const textureImg = useMemo(() => {
        switch (theme) {
            case 'Desert':
                return night ? DesertNightSkyImage : DesertDaySkyImage;
            case 'Forest':
                return night ? ForestNightSkyImage : ForestDaySkyImage;
            case 'Grassland':
                return night ? GrasslandNightSkyImage : GrasslandDaySkyImage;
            default:
                return night ? DefaultNightSkyImage : DefaultDaySkyImage;
        }
    }, [theme, night]);

    const texture = useTexture(textureImg);

    const legalOnGround = (type: ObjectType) => {
        return (
            type === ObjectType.Foundation ||
            type === ObjectType.Cuboid ||
            type === ObjectType.Tree ||
            type === ObjectType.Human
        );
    };

    const clickSky = (e: ThreeEvent<MouseEvent>) => {
        // We must check if there is really a first intersection, onClick does not guarantee it
        // onClick listener for an object can still fire an event even when the object is behind another one
        if (e.intersections.length > 0) {
            const skyClicked = e.intersections[0].object === meshRef.current;
            if (skyClicked) {
                selectNone();
                setCommonStore((state) => {
                    state.clickObjectType = ObjectType.Sky;
                });
            } else {
                const selectedElement = getSelectedElement();
                if (selectedElement) {
                    if (legalOnGround(selectedElement.type as ObjectType)) {
                        grabRef.current = selectedElement;
                        if (selectedElement.type !== ObjectType.Foundation &&
                            selectedElement.type !== ObjectType.Cuboid) {
                            setCommonStore((state) => {
                                state.enableOrbitController = false;
                            });
                        }
                    }
                }
            }
        }
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (grabRef.current && grabRef.current.type && !grabRef.current.locked) {
            const mouse = new Vector2();
            mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
            mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
            ray.setFromCamera(mouse, camera);
            let intersects;
            if (grabRef.current.type === ObjectType.Cuboid &&
                intersectionPlaneRef.current &&
                intersectionPlaneType === IntersectionPlaneType.Vertical &&
                (resizeHandleType === ResizeHandleType.LowerLeftTop ||
                    resizeHandleType === ResizeHandleType.UpperLeftTop ||
                    resizeHandleType === ResizeHandleType.LowerRightTop ||
                    resizeHandleType === ResizeHandleType.UpperRightTop )
                ) {
                    intersects = ray.intersectObjects([intersectionPlaneRef.current]);
                    if (intersects.length > 0) {
                        const p = intersects[0].point;
                        updateElement(grabRef.current.id, {lz: Math.max(1, p.y)});
                    }
            }
        }
    }

    return (
        <>
            <mesh
                {...props}
                ref={meshRef}
                name={'Sky'}
                scale={[1, scale, 1]}
                onContextMenu={(e) => {
                    clickSky(e);
                }}
                onClick={(e) => {
                    if (e.button === 2) return; // ignore right-click
                    clickSky(e);
                }}
                onPointerDown={(e) => {
                    if (e.button === 2) return; // ignore right-click
                    clickSky(e);
                }}
            >
                <sphereGeometry args={[900, 16, 8, 0, 2 * Math.PI, 0, Math.PI / 2]}/>
                <meshBasicMaterial map={texture}
                                side={BackSide}
                                opacity={1}
                                color={'skyblue'}/>
            </mesh>
            {grabRef.current && intersectionPlaneType !== IntersectionPlaneType.Sky &&
            <Plane 
                ref={intersectionPlaneRef}
                visible={false}
                name={'Sky Intersection Plane'}
                rotation={intersectionPlaneAngle}
                position={intersectionPlanePosition}
                args={[1000, 1000]}
                onPointerMove={handlePointerMove}
                onPointerUp={() => {
                    grabRef.current = null;
                }}
            >
                <meshStandardMaterial side={DoubleSide}/>
            </Plane>
            }
        </>
    )
};

export default React.memo(Sky);
