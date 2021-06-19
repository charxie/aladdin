/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef, useState} from "react";
import {Box, Line, Sphere} from "@react-three/drei";
import {Mesh, Vector3} from "three";
import {useStore} from "../stores/common";
import {SensorModel} from "../models/sensorModel";

const Sensor = ({
                    id,
                    cx,
                    cy,
                    cz,
                    lx = 1,
                    ly = 1,
                    height = 0.1,
                    color = 'white',
                    lineColor = 'black',
                    lineWidth = 0.1,
                    selected = false,
                    showLabel = false,
                    light = true,
                    heatFlux = false,
                }: SensorModel) => {

    cy = -cy; // we want positive y to point north

    const setCommonStore = useStore(state => state.set);
    const getElementById = useStore(state => state.getElementById);
    const [hovered, setHovered] = useState(false);
    const baseRef = useRef<Mesh>();
    const handleRef = useRef<Mesh>();

    const position = new Vector3(cx, cz, cy);
    const positionLL = new Vector3(cx - lx / 2, 0, cy - ly / 2);
    const positionUL = new Vector3(cx - lx / 2, 0, cy + ly / 2);
    const positionLR = new Vector3(cx + lx / 2, 0, cy - ly / 2);
    const positionUR = new Vector3(cx + lx / 2, 0, cy + ly / 2);

    const element = getElementById(id);

    const selectMe = () => {
        setCommonStore((state) => {
            for (const e of state.elements) {
                e.selected = e.id === id;
            }
        });
    };

    return (

        <group name={'Sensor Group'}>

            {/* draw rectangle (too small to cast shadow) */}
            <Box receiveShadow
                 ref={baseRef}
                 args={[lx, height, ly]}
                 position={[cx, height / 2, cy]}
                 name={'Sensor'}
                 onPointerDown={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
                 }}
                 onContextMenu={(e) => {
                     if (e.intersections.length > 0) {
                         const intersected = e.intersections[0].object === baseRef.current;
                         if (intersected) {
                             selectMe();
                         }
                     }
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
                <meshStandardMaterial attach="material" color={element?.lit ? 'red' : color}/>
            </Box>

            {!selected &&
            <>
                {/* draw wireframe lines upper face */}
                <Line points={[[positionLL.x, height, positionLL.z], [positionLR.x, height, positionLR.z]]}
                      name={'Line LL-LR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionLR.x, height, positionLR.z], [positionUR.x, height, positionUR.z]]}
                      name={'Line LR-UR Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUR.x, height, positionUR.z], [positionUL.x, height, positionUL.z]]}
                      name={'Line UR-UL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[[positionUL.x, height, positionUL.z], [positionLL.x, height, positionLL.z]]}
                      name={'Line UL-LL Upper Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe lines lower face */}
                <Line points={[positionLL, positionLR]}
                      name={'Line LL-LR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, positionUR]}
                      name={'Line LR-UR Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, positionUL]}
                      name={'Line UR-UL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, positionLL]}
                      name={'Line UL-LL Lower Face'}
                      lineWidth={lineWidth}
                      color={lineColor}/>

                {/* draw wireframe vertical lines */}
                <Line points={[positionLL, [positionLL.x, height, positionLL.z]]}
                      name={'Line LL-LL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionLR, [positionLR.x, height, positionLR.z]]}
                      name={'Line LR-LR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUL, [positionUL.x, height, positionUL.z]]}
                      name={'Line UL-UL Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
                <Line points={[positionUR, [positionUR.x, height, positionUR.z]]}
                      name={'Line UR-UR Vertical'}
                      lineWidth={lineWidth}
                      color={lineColor}/>
            </>
            }

            {/* draw handle */}
            {selected &&
            <Sphere
                ref={handleRef}
                position={position}
                args={[0.1, 6, 6]}
                name={'Handle'}>
                <meshStandardMaterial attach="material" color={'orange'}/>
            </Sphere>
            }
            {(hovered || showLabel) && !selected &&
            <textSprite
                name={'Label'}
                text={'Sensor'}
                fontSize={90}
                fontFace={'Times Roman'}
                textHeight={1}
                scale={[0.5, 0.2, 0.2]}
                position={[cx, height + 0.2, cy]}
            />
            }
        </group>
    )
};

export default Sensor;
