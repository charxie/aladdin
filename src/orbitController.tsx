/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useRef} from "react";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {useFrame, useThree} from "@react-three/fiber";
import {useStore} from "./stores/common";
import {Util} from "./Util";
import {Vector3} from "three";

export interface OrbitControllerProps {
    enabled?: boolean;
    autoRotate?: boolean;
    panCenter?: Vector3;
    orbitControlsRef?: React.MutableRefObject<OrbitControls | undefined>;
    canvasRef?: React.MutableRefObject<HTMLCanvasElement | undefined>;

    [key: string]: any;
}

// Get a reference to the Three.js Camera, and the canvas html element.
// We need these to setup the OrbitControls class.
// https://threejs.org/docs/#examples/en/controls/OrbitControls
const OrbitController = ({
                             enabled = true,
                             autoRotate = false,
                             panCenter = new Vector3(),
                             orbitControlsRef,
                             canvasRef,
                             ...rest
                         }: OrbitControllerProps) => {

    const setCommonStore = useStore(state => state.set);
    const {camera, gl: {domElement}} = useThree();
    // Ref to the controls, so that we can update them on every frame using useFrame
    const controls = useRef<OrbitControls>(null);

    useEffect(() => {
        const c = controls.current;
        if (c) {
            if (panCenter) {
                c.target.set(panCenter.x, panCenter.y, panCenter.z);
            }
            c.addEventListener('end', onInteractionEnd);
            c.update();
            if (orbitControlsRef) {
                orbitControlsRef.current = c;
            }
            if (canvasRef) {
                canvasRef.current = domElement;
            }
        }
        return () => {
            if (c) {
                c.removeEventListener('end', onInteractionEnd);
            }
        }
    }, []);

    const onInteractionEnd = () => {
        setCommonStore((state) => {
            const w = state.world;
            // for some reason, a single click would trigger camera position to change
            // to fix this, if the camera position doesn't change much, we do not save.
            // FIXME: why can't set function be used with a proxy?
            const v = new Vector3(w.cameraPosition.x, w.cameraPosition.y, w.cameraPosition.z);
            const u = camera.position.clone();
            if (Math.abs(u.normalize().dot(v.normalize())) < 0.99) {
                w.cameraPosition.x = camera.position.x;
                w.cameraPosition.y = camera.position.y;
                w.cameraPosition.z = camera.position.z;
            }
            if (controls.current) {
                w.panCenter.x = controls.current.target.x;
                w.panCenter.y = controls.current.target.y;
                w.panCenter.z = controls.current.target.z;
            }
        });
    };

    // animation
    useFrame((state) => {
        if (autoRotate) {
            if (controls.current) {
                controls.current.update();
            }
        }
    });

    return (
        <orbitControls
            ref={controls}
            args={[camera, domElement]}
            autoRotate={autoRotate}
            enabled={enabled}
            enableRotate={true}
            enablePan={true}
            enableZoom={true}
            enableDamping={true}
            target={panCenter}
            maxAzimuthAngle={Infinity}
            minAzimuthAngle={-Infinity}
            maxPolarAngle={Util.HALF_PI}
            minPolarAngle={0}
        />
    );

};

export default OrbitController;
