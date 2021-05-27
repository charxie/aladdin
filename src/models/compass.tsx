/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useRef} from "react";
import {useFrame, useLoader, useThree} from '@react-three/fiber'
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";
import {Euler, FontLoader, TextGeometryParameters} from "three";

export interface CompassProps {
    scale?: number;

    [key: string]: any;
}

const Compass = ({
                     scale = 0.01,
                     ...props
                 }: CompassProps) => {
    const model = useLoader(OBJLoader, 'static/assets/compass.obj');
    const font = useLoader(FontLoader, 'static/fonts/helvetiker_regular.typeface.json');
    const mesh = useRef<THREE.Mesh>(null!);
    const {camera} = useThree();
    useFrame((state) => {
        if (mesh.current) {
            const v = new THREE.Vector3(0.88, -0.8, 0).unproject(camera);
            mesh.current.position.set(v.x, v.y, v.z);
        }
    });
    const textGeometryParams = {font: font, height: 0.00, size: 0.005} as TextGeometryParameters;
    const textMaterial = new THREE.MeshBasicMaterial({color: 'white'});
    const compassMaterial = new THREE.MeshBasicMaterial({color: 'red'});
    return (
        <mesh
              {...props}
              ref={mesh}
              rotation={new Euler(-Math.PI / 2, 0, 0)}
        >
            <mesh position={[-0.001, 0.02, 0]} material={textMaterial}>
                <textGeometry args={['N', textGeometryParams]}/>
            </mesh>
            <mesh position={[-0.0015, -0.025, 0]} material={textMaterial}>
                <textGeometry args={['S', textGeometryParams]}/>
            </mesh>
            <mesh position={[-0.025, -0.002, 0]} material={textMaterial}>
                <textGeometry args={['W', textGeometryParams]}/>
            </mesh>
            <mesh position={[0.02, -0.002, 0]} material={textMaterial}>
                <textGeometry args={['E', textGeometryParams]}/>
            </mesh>
            <primitive object={model} scale={scale} material={compassMaterial}/>
        </mesh>
    )
};

export default Compass;
