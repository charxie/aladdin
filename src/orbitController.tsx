/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera, useFrame, useThree } from '@react-three/fiber';
import { useStore } from './stores/common';
import { Util } from './Util';
import { Vector3 } from 'three';
import { WORKSPACE_SIZE } from './constants';
import * as Selector from 'src/stores/selector';

export interface OrbitControllerProps {
  orbitControlsRef?: React.MutableRefObject<OrbitControls | undefined>;
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | undefined>;
  currentCamera?: Camera;

  [key: string]: any;
}

// Get a reference to the Three.js Camera, and the canvas html element.
// We need these to setup the OrbitControls class.
// https://threejs.org/docs/#examples/en/controls/OrbitControls
const OrbitController = ({ orbitControlsRef, canvasRef, currentCamera, ...rest }: OrbitControllerProps) => {
  const orthographic = useStore(Selector.world.orthographic);
  const cameraPosition = useStore(Selector.world.cameraPosition);
  const cameraZoom = useStore(Selector.world.cameraZoom);
  const panCenter = useStore((state) => state.world.panCenter);
  const enableOrbitController = useStore((state) => state.enableOrbitController);
  const autoRotate = useStore((state) => state.viewState.autoRotate);
  const setCommonStore = useStore((state) => state.set);

  const { camera, gl, scene } = useThree();
  camera.up.set(0, 0, 1);
  const cam = currentCamera ?? camera; // just in case the camera has not been set up yet
  const setThree = useThree((state) => state.set);
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef<OrbitControls>(null);
  const minPan = useMemo(() => new Vector3(-WORKSPACE_SIZE / 2, -WORKSPACE_SIZE / 2, 0), []);
  const maxPan = useMemo(() => new Vector3(WORKSPACE_SIZE / 2, WORKSPACE_SIZE / 2, WORKSPACE_SIZE / 8), []);

  useEffect(() => {
    // we have to manually set the camera position when loading a state from a file (as world is reconstructed)
    if (controls.current) {
      controls.current.object.position.copy(cameraPosition);
      controls.current.update();
    }
    if (cam) {
      cam.zoom = orthographic ? cameraZoom : 1;
    }
  }, [cameraPosition, currentCamera]);

  useEffect(() => {
    // we have to manually set the target position when loading a state from a file (as world is reconstructed)
    if (controls.current) {
      controls.current.target.copy(panCenter);
      controls.current.update();
    }
  }, [panCenter]);

  useEffect(() => {
    setThree({ frameloop: autoRotate ? 'always' : 'demand' });
  }, [autoRotate]);

  useEffect(() => {
    setCommonStore((state) => {
      state.cameraDirection = getCameraDirection(cam);
    });
    const c = controls.current;
    if (c) {
      c.addEventListener('change', render);
      c.addEventListener('end', onInteractionEnd);
      c.update();
      if (orbitControlsRef) {
        orbitControlsRef.current = c;
      }
      if (canvasRef) {
        canvasRef.current = gl.domElement;
      }
    }
    return () => {
      if (c) {
        c.removeEventListener('end', onInteractionEnd);
        c.removeEventListener('change', render);
      }
    };
  }, [currentCamera]);

  const getCameraDirection = (cam: Camera) => {
    const dir = new Vector3().subVectors(cam.localToWorld(new Vector3(0, 0, 1)), cam.position);
    if (dir.x === 0 && dir.y === 0) {
      cam.getWorldDirection(dir);
    }
    return dir;
  };

  const render = () => {
    if (controls.current) {
      controls.current.target.clamp(minPan, maxPan);
    }
    gl.render(scene, cam);
    setCommonStore((state) => {
      state.cameraDirection = getCameraDirection(cam);
    });
  };

  const onInteractionEnd = () => {
    setCommonStore((state) => {
      // FIXME: why can't set function be used with a proxy?
      // Using set or copy will result in crash in run time.
      if (controls.current) {
        const w = state.world;
        if (orthographic) {
          w.cameraZoom = cam.zoom;
        }
        w.cameraPosition.x = cam.position.x;
        w.cameraPosition.y = cam.position.y;
        w.cameraPosition.z = cam.position.z;
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

  // do not enable damping, it messes up with rotation state persistence
  return (
    <orbitControls
      ref={controls}
      args={[cam, gl.domElement]}
      autoRotate={autoRotate}
      enabled={enableOrbitController}
      enableRotate={true}
      enablePan={true}
      enableZoom={true}
      enableDamping={false}
      target={new Vector3().copy(panCenter)}
      maxAzimuthAngle={Infinity}
      minAzimuthAngle={-Infinity}
      maxPolarAngle={Util.HALF_PI}
      minPolarAngle={0}
    />
  );
};

export default OrbitController;
