/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useMemo, useRef, useState} from "react";
import {Plane} from "@react-three/drei";
import {useStore} from "../stores/common";
import {Mesh, Raycaster, Vector2} from "three";
import {MoveHandleType, ObjectType} from "../types";
import {ElementModel} from "../models/elementModel";
import {useThree} from "@react-three/fiber";
import {MOVE_HANDLE_OFFSET} from "../constants";

const Ground = () => {

    const setCommonStore = useStore(state => state.set);
    const getSelectedElement = useStore(state => state.getSelectedElement);
    const selectNone = useStore(state => state.selectNone);
    const moveHandleType = useStore(state => state.moveHandleType);
    const groundColor = useStore(state => state.groundColor);
    const setElementPosition = useStore(state => state.setElementPosition);
    const [grab, setGrab] = useState<ElementModel | null>(null);
    const {camera, gl: {domElement}} = useThree();
    const planeRef = useRef<Mesh>();
    const ray = useMemo(() => new Raycaster(), []);

    return (
        <Plane receiveShadow
               ref={planeRef}
               name={'Ground'}
               onContextMenu={(e) => {
                   if (e.intersections.length > 0) {
                       const groundClicked = e.intersections[0].object === planeRef.current;
                       if (groundClicked) {
                           selectNone();
                           setCommonStore((state) => {
                               state.clickObjectType = ObjectType.Ground;
                           });
                       }
                   }
               }}
               onPointerDown={(e) => {
                   if (e.intersections.length > 0) {
                       const groundClicked = e.intersections[0].object === planeRef.current;
                       if (groundClicked) {
                           setCommonStore((state) => {
                               state.clickObjectType = ObjectType.Ground;
                           });
                           selectNone();
                       } else {
                           setGrab(getSelectedElement());
                           setCommonStore((state) => {
                               state.enableOrbitController = false;
                           });
                       }
                   }
               }}
               onPointerUp={(e) => {
                   setGrab(null);
                   setCommonStore((state) => {
                       state.enableOrbitController = true;
                   });
               }}
               onPointerMove={(e) => {
                   if (grab && planeRef && planeRef.current && grab.type) {
                       const mouse = new Vector2();
                       mouse.x = (e.offsetX / domElement.clientWidth) * 2 - 1;
                       mouse.y = -(e.offsetY / domElement.clientHeight) * 2 + 1;
                       ray.setFromCamera(mouse, camera);
                       const intersects = ray.intersectObjects([planeRef.current]);
                       if (intersects.length > 0) {
                           const p = intersects[0].point;
                           switch (grab.type) {
                               case ObjectType.Sensor:
                                   setElementPosition(grab.id, p.x, -p.z, 0);
                                   break;
                               case ObjectType.Foundation:
                                   switch (moveHandleType) {
                                       case MoveHandleType.MoveHandleLower:
                                           setElementPosition(grab.id, p.x, -p.z - grab.ly / 2 - MOVE_HANDLE_OFFSET, 0);
                                           break;
                                       case MoveHandleType.MoveHandleUpper:
                                           setElementPosition(grab.id, p.x, -p.z + grab.ly / 2 + MOVE_HANDLE_OFFSET, 0);
                                           break;
                                       case MoveHandleType.MoveHandleLeft:
                                           setElementPosition(grab.id, p.x + grab.lx / 2 + MOVE_HANDLE_OFFSET, -p.z, 0);
                                           break;
                                       case MoveHandleType.MoveHandleRight:
                                           setElementPosition(grab.id, p.x - grab.lx / 2 - MOVE_HANDLE_OFFSET, -p.z, 0);
                                           break;
                                   }
                                   break;
                               case ObjectType.Cuboid:
                                   break;
                           }
                       }
                   }
               }}
               rotation={[-Math.PI / 2, 0, 0]}
               position={[0, -0.01, 0]}
               args={[10000, 10000]}
        >
            <meshStandardMaterial attach="material" color={groundColor}/>
        </Plane>
    )
};

export default Ground;
