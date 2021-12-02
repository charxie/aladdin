/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import WallTexture00 from 'src/resources/wall_00.png';
import WallTexture01 from 'src/resources/wall_01.png';
import WallTexture02 from 'src/resources/wall_02.png';
import WallTexture03 from 'src/resources/wall_03.png';
import WallTexture04 from 'src/resources/wall_04.png';
import WallTexture05 from 'src/resources/wall_05.png';
import WallTexture06 from 'src/resources/wall_06.png';
import WallTexture07 from 'src/resources/wall_07.png';
import WallTexture08 from 'src/resources/wall_08.png';
import WallTexture09 from 'src/resources/wall_09.png';
import WallTexture10 from 'src/resources/wall_10.png';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Raycaster,
  RepeatWrapping,
  Shape,
  ShapeBufferGeometry,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, WallTexture } from 'src/types';
import { Util } from 'src/Util';
import { useStore } from 'src/stores/common';
import { ElementModel } from 'src/models/ElementModel';
import { WindowModel } from 'src/models/WindowModel';
import { WallModel } from 'src/models/WallModel';
import { ElementModelFactory } from 'src/models/ElementModelFactory';
import { RoofPoint } from 'src/models/RoofModel';
import { ElementGrid } from '../elementGrid';
import Window from '../window';
import WallWireFrame from './wallWireFrame';
import WallResizeHandleWarpper from './wallResizeHandleWarpper';
import * as Selector from '../../stores/selector';
import { HALF_PI, TWO_PI } from '../../constants';

const Wall = ({
  id,
  cx,
  cy,
  lx = 1,
  ly = 0.5,
  lz = 4,
  relativeAngle,
  leftOffset,
  rightOffset,
  leftJoints,
  rightJoints,
  textureType,
  parentId,
  selected = false,
  locked = false,
}: WallModel) => {
  const textureLoader = useMemo(() => {
    let textureImg;
    switch (textureType) {
      case WallTexture.NoTexture:
        textureImg = WallTexture00;
        break;
      case WallTexture.Texture01:
        textureImg = WallTexture01;
        break;
      case WallTexture.Texture02:
        textureImg = WallTexture02;
        break;
      case WallTexture.Texture03:
        textureImg = WallTexture03;
        break;
      case WallTexture.Texture04:
        textureImg = WallTexture04;
        break;
      case WallTexture.Texture05:
        textureImg = WallTexture05;
        break;
      case WallTexture.Texture06:
        textureImg = WallTexture06;
        break;
      case WallTexture.Texture07:
        textureImg = WallTexture07;
        break;
      case WallTexture.Texture08:
        textureImg = WallTexture08;
        break;
      case WallTexture.Texture09:
        textureImg = WallTexture09;
        break;
      case WallTexture.Texture10:
        textureImg = WallTexture10;
        break;
      default:
        textureImg = WallTexture00;
    }

    return new TextureLoader().load(textureImg, (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      let repeatX = 0.6;
      let repeatY = 0.6;
      switch (textureType) {
        case WallTexture.Texture03:
          repeatX = 2;
          repeatY = 1;
          break;
        case WallTexture.Texture06:
          repeatX = 1;
          repeatY = 1;
          break;
      }
      texture.repeat.set(repeatX, repeatY);
      setTexture(texture);
    });
  }, [textureType]);
  const [texture, setTexture] = useState(textureLoader);

  const getElementById = useStore(Selector.getElementById);
  const parent = getElementById(parentId) as ElementModel;
  const wallModel = getElementById(id) as WallModel;

  const setCommonStore = useStore(Selector.set);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const selectMe = useStore(Selector.selectMe);
  const removeElementById = useStore(Selector.removeElementById);
  const elements = useStore(Selector.elements);
  const deletedWindowAndParentID = useStore(Selector.deletedWindowAndParentID);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);

  const objectTypeToAddRef = useRef(useStore.getState().objectTypeToAdd);
  const moveHandleTypeRef = useRef(useStore.getState().moveHandleType);
  const resizeHandleTypeRef = useRef(useStore.getState().resizeHandleType);
  const resizeAnchorRef = useRef(useStore.getState().resizeAnchor);
  const buildingWallIDRef = useRef(useStore.getState().buildingWallID);
  const enableFineGridRef = useRef(useStore.getState().enableFineGrid);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const outSideWallRef = useRef<Mesh>(null);
  const insideWallRef = useRef<Mesh>(null);
  const topSurfaceRef = useRef<Mesh>(null);
  const grabRef = useRef<ElementModel | null>(null);

  const buildingWindowIDRef = useRef<string | null>(null);
  const isSettingWindowStartPointRef = useRef(false);
  const isSettingWindowEndPointRef = useRef(false);
  const invalidWindowIDRef = useRef<string | null>(null);

  const [originElements, setOriginElements] = useState<ElementModel[] | null>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [windows, setWindows] = useState<WindowModel[]>([]);

  const { camera, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const whiteWallMaterial = useMemo(() => new MeshStandardMaterial({ color: 'white', side: DoubleSide }), []);

  const hx = lx / 2;
  const hy = ly / 2;
  const hz = lz / 2;
  const highLight = lx === 0;
  const wallAbsPosition = Util.wallAbsolutePosition(new Vector3(cx, cy), parent).setZ(lz / 2 + parent.lz);
  const wallAbsAngle = parent.rotation[2] + relativeAngle;

  const drawTopSurface = (shape: Shape, lx: number, ly: number, leftOffsetState: number, rightOffsetState: number) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x - rightOffsetState, y);
    shape.lineTo(-x + leftOffsetState, y);
    shape.lineTo(-x, -y);
  };

  const drawRectangle = (
    shape: Shape,
    lx: number,
    ly: number,
    cx = 0,
    cy = 0,
    leftOffsetState = 0,
    rightOffsetState = 0,
  ) => {
    const x = lx / 2;
    const y = ly / 2;
    shape.moveTo(cx - x + leftOffsetState, cy - y);
    shape.lineTo(cx + x - rightOffsetState, cy - y);
    shape.lineTo(cx + x - rightOffsetState, cy + y);
    shape.lineTo(cx - x + leftOffsetState, cy + y);
    shape.lineTo(cx - x + leftOffsetState, cy - y);
  };

  if (leftJoints.length > 0) {
    const targetWall = getElementById(leftJoints[0]) as WallModel;
    if (targetWall) {
      const deltaAngle = (Math.PI * 3 - (relativeAngle - targetWall.relativeAngle)) % TWO_PI;
      if (deltaAngle < HALF_PI && deltaAngle > 0) {
        leftOffset = ly / Math.tan(deltaAngle);
      }
    }
  }

  if (rightJoints.length > 0) {
    const targetWall = getElementById(rightJoints[0]) as WallModel;
    if (targetWall) {
      const deltaAngle = (Math.PI * 3 + relativeAngle - targetWall.relativeAngle) % TWO_PI;
      if (deltaAngle < HALF_PI && deltaAngle > 0) {
        rightOffset = ly / Math.tan(deltaAngle);
      }
    }
  }

  // outside wall
  if (outSideWallRef.current) {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz);

    windows.forEach((w) => {
      if (w.id !== invalidWindowIDRef.current) {
        const window = new Shape();
        drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      }
    });
    outSideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
  }

  // inside wall
  if (insideWallRef.current) {
    const wallShape = new Shape();
    drawRectangle(wallShape, lx, lz, 0, 0, leftOffset, rightOffset);

    windows.forEach((w) => {
      if (w.id !== invalidWindowIDRef.current) {
        const window = new Shape();
        drawRectangle(window, w.lx * lx, w.lz * lz, w.cx * lx, w.cz * lz);
        wallShape.holes.push(window);
      }
    });

    insideWallRef.current.geometry = new ShapeBufferGeometry(wallShape);
    insideWallRef.current.material = whiteWallMaterial;
  }

  // top surface
  if (topSurfaceRef.current) {
    const topSurfaceShape = new Shape();
    drawTopSurface(topSurfaceShape, lx, ly, leftOffset, rightOffset);
    topSurfaceRef.current.geometry = new ShapeBufferGeometry(topSurfaceShape);
    topSurfaceRef.current.material = whiteWallMaterial;
  }

  // subscribe common store
  useEffect(() => {
    useStore.subscribe((state) => (objectTypeToAddRef.current = state.objectTypeToAdd));
    useStore.subscribe((state) => (moveHandleTypeRef.current = state.moveHandleType));
    useStore.subscribe((state) => (resizeHandleTypeRef.current = state.resizeHandleType));
    useStore.subscribe((state) => (resizeAnchorRef.current = state.resizeAnchor));
    useStore.subscribe((state) => (buildingWallIDRef.current = state.buildingWallID));
    useStore.subscribe((state) => (enableFineGridRef.current = state.enableFineGrid));
  }, []);

  useEffect(() => {
    if (deletedWindowAndParentID && deletedWindowAndParentID[1] === id) {
      resetCurrentState();
      setShowGrid(false);
      setCommonStore((state) => {
        state.deletedWindowAndParentID = null;
      });
    }
  }, [deletedWindowAndParentID]);

  // windows
  useEffect(() => {
    setWindows(elements.filter((e) => e.type === ObjectType.Window && e.parentId === id));
  }, [elements]);

  const getWindowRelativePos = (p: Vector3, wall: WallModel) => {
    const { cx, cy, cz } = wall;
    const foundation = getElementById(wall.parentId);
    if (foundation && wallAbsAngle !== undefined) {
      const wallAbsPos = Util.wallAbsolutePosition(new Vector3(cx, cy, cz), foundation).setZ(lz / 2 + foundation.lz);
      const relativePos = new Vector3().subVectors(p, wallAbsPos).applyEuler(new Euler(0, 0, -wallAbsAngle));
      return relativePos;
    }
    return new Vector3();
  };

  const snapToNormalGrid = (v: Vector3) => {
    return new Vector3(Math.round(v.x), v.y, Math.round(v.z));
  };

  const snapToFineGrid = (v: Vector3) => {
    const x = parseFloat((Math.round(v.x / 0.2) * 0.2).toFixed(1));
    const z = parseFloat((Math.round(v.z / 0.2) * 0.2).toFixed(1));
    return new Vector3(x, v.y, z);
  };

  const movingWindowInsideWall = (p: Vector3, wlx: number, wlz: number) => {
    const maxX = (lx - wlx) / 2;
    const maxZ = (lz - wlz) / 2;
    if (p.x > maxX) {
      p.setX(maxX - 0.1);
    } else if (p.x < -maxX) {
      p.setX(-maxX + 0.1);
    }
    if (p.z > maxZ) {
      p.setZ(maxZ - 0.1);
    } else if (p.z < -maxZ) {
      p.setZ(-maxZ + 0.1);
    }
    return p;
  };

  const resizingWindowInsideWall = (p: Vector3) => {
    p.setZ(Math.min(p.z, lz / 2 - 0.2));
    if (p.x > lx / 2) {
      p.setX(lx / 2 - 0.2);
    }
    if (p.x < -lx / 2) {
      p.setX(-lx / 2 + 0.2);
    }
    return p;
  };

  const checkWindowCollision = (id: string, p: Vector3, wlx: number, wlz: number) => {
    if (wlx < 0.1 || wlz < 0.1) {
      invalidWindowIDRef.current = id;
      return false;
    }
    for (const w of windows) {
      if (w.id !== id) {
        const minX = w.cx * lx - (w.lx * lx) / 2; // target window left
        const maxX = w.cx * lx + (w.lx * lx) / 2; // target window right
        const minZ = w.cz * lz - (w.lz * lz) / 2; // target window bot
        const maxZ = w.cz * lz + (w.lz * lz) / 2; // target window up
        const wMinX = p.x - wlx / 2; // current window left
        const wMaxX = p.x + wlx / 2; // current window right
        const wMinZ = p.z - wlz / 2; // current window bot
        const wMaxZ = p.z + wlz / 2; // current window up
        if (
          ((wMinX >= minX && wMinX <= maxX) ||
            (wMaxX >= minX && wMaxX <= maxX) ||
            (minX >= wMinX && minX <= wMaxX) ||
            (maxX >= wMinX && maxX <= wMaxX)) &&
          ((wMinZ >= minZ && wMinZ <= maxZ) ||
            (wMaxZ >= minZ && wMaxZ <= maxZ) ||
            (minZ >= wMinZ && minZ <= wMaxZ) ||
            (maxZ >= wMinZ && maxZ <= wMaxZ))
        ) {
          invalidWindowIDRef.current = id;
          return false; // has collision
        }
      }
    }
    invalidWindowIDRef.current = null;
    return true; // no collision
  };

  const checkWallLoop = (id: string) => {
    const startID = id;
    const points: RoofPoint[] = [];

    let wall = getElementById(id) as WallModel;
    while (wall && wall.leftJoints.length > 0) {
      const point = [...wall.leftPoint];
      points.push({ x: point[0], y: point[1] });
      const id = wall.leftJoints[0];
      if (id === startID) {
        return points;
      } else {
        wall = getElementById(id) as WallModel;
      }
    }
    return null;
  };

  const setRayCast = (e: PointerEvent) => {
    const mouse = new Vector2();
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getPositionOnGrid = (p: Vector3) => {
    if (enableFineGridRef.current) {
      p = snapToFineGrid(p);
    } else {
      p = snapToNormalGrid(p);
    }
    return p;
  };

  const checkIsFirstWall = (e: ThreeEvent<PointerEvent>) => {
    for (const intersection of e.intersections) {
      if (intersection.object.name.includes('Wall Intersection Plane')) {
        return intersection.object.name === `Wall Intersection Plane ${id}`;
      }
    }
    return false;
  };

  const checkIfCanSelectMe = (e: ThreeEvent<PointerEvent>) => {
    if (
      e.button === 2 ||
      buildingWallIDRef.current ||
      buildingWindowIDRef.current ||
      moveHandleTypeRef.current ||
      resizeHandleTypeRef.current ||
      useStore.getState().objectTypeToAdd !== ObjectType.None ||
      selected
    ) {
      return false;
    }
    return true;
  };

  const resetCurrentState = () => {
    grabRef.current = null;
    buildingWindowIDRef.current = null;
    isSettingWindowStartPointRef.current = false;
    isSettingWindowEndPointRef.current = false;
    invalidWindowIDRef.current = null;
  };

  const handleIntersectionPointerDown = (e: ThreeEvent<PointerEvent>) => {
    // return on right-click or not first wall
    if (e.button === 2 || buildingWallIDRef.current || !checkIsFirstWall(e)) {
      return;
    }

    setRayCast(e);

    if (intersectionPlaneRef.current) {
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);

      if (intersects.length > 0) {
        const pointer = intersects[0].point;

        // set window start point
        if (isSettingWindowStartPointRef.current) {
          setCommonStore((state) => {
            state.enableOrbitController = false;
            state.moveHandleType = null;
            state.resizeHandleType = ResizeHandleType.LowerRight;
            state.resizeAnchor.copy(pointer);
          });
          isSettingWindowStartPointRef.current = false;
          isSettingWindowEndPointRef.current = true;
          return;
        }

        // add new elements
        switch (objectTypeToAddRef.current) {
          case ObjectType.Roof: {
            const points = checkWallLoop(wallModel.id);
            if (points && parent) {
              const roof = ElementModelFactory.makeRoof(lz, parent, points);
              setCommonStore((state) => {
                state.elements.push(roof);
              });
            }
            setCommonStore((state) => {
              state.objectTypeToAdd = ObjectType.None;
            });
            return;
          }
        }

        const selectedElement = getSelectedElement();

        // a child of this wall is clicked
        if (selectedElement && selectedElement.parentId === id) {
          grabRef.current = selectedElement;
          if (moveHandleTypeRef.current || resizeHandleTypeRef.current) {
            setShowGrid(true);
            setOriginElements([...elements]);
          }
        }
      }
    }
  };

  const handleIntersectionPointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || grabRef.current === null || grabRef.current.parentId !== id) {
      return;
    }
    if (invalidWindowIDRef.current) {
      if (isSettingWindowEndPointRef.current) {
        setCommonStore((state) => {
          state.elements.pop();
        });
      } else {
        setCommonStore((state) => {
          if (originElements) {
            state.elements = [...originElements];
          }
        });
      }
      invalidWindowIDRef.current = null;
      setOriginElements(null);
    }
    setCommonStore((state) => {
      state.moveHandleType = null;
      state.resizeHandleType = null;
      state.enableOrbitController = true;
      state.buildingWindowID = null;
    });
    setShowGrid(false);
    resetCurrentState();
  };

  const handleIntersectionPointerMove = (e: ThreeEvent<PointerEvent>) => {
    // return if it's not first wall when adding new window
    if (isSettingWindowStartPointRef.current && !checkIsFirstWall(e)) {
      if (grabRef.current) {
        removeElementById(grabRef.current.id, false);
      }
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Window;
        state.buildingWindowID = null;
      });
      setShowGrid(false);
      resetCurrentState();
      return;
    }

    setRayCast(e);

    if (intersectionPlaneRef.current) {
      const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
      if (intersects.length > 0) {
        const pointer = intersects[0].point;

        // move or resize
        if (grabRef.current && grabRef.current.parentId === id) {
          const moveHandleType = moveHandleTypeRef.current;
          const resizeHandleType = resizeHandleTypeRef.current;

          switch (grabRef.current.type) {
            case ObjectType.Window: {
              let p = getWindowRelativePos(pointer, wallModel);
              p = getPositionOnGrid(p);

              if (moveHandleType) {
                p = movingWindowInsideWall(p, grabRef.current.lx * lx, grabRef.current.lz * lz);
                checkWindowCollision(grabRef.current.id, p, grabRef.current.lx * lx, grabRef.current.lz * lz);
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.cx = p.x / lx;
                      e.cz = p.z / lz;
                      e.color = e.id === invalidWindowIDRef.current ? 'red' : '#477395';
                    }
                  }
                });
              } else if (resizeHandleType) {
                p = resizingWindowInsideWall(p);
                let resizeAnchor = getWindowRelativePos(resizeAnchorRef.current, wallModel);
                if (isSettingWindowEndPointRef.current) {
                  resizeAnchor = getPositionOnGrid(resizeAnchor);
                }
                const v = new Vector3().subVectors(resizeAnchor, p); // window diagonal vector
                let relativePos = new Vector3().addVectors(resizeAnchor, p).divideScalar(2);
                checkWindowCollision(grabRef.current.id, relativePos, Math.abs(v.x), Math.abs(v.z));
                setCommonStore((state) => {
                  for (const e of state.elements) {
                    if (e.id === grabRef.current?.id) {
                      e.lx = Math.abs(v.x) / lx;
                      e.lz = Math.abs(v.z) / lz;
                      e.cx = relativePos.x / lx;
                      e.cz = relativePos.z / lz;
                      e.color = e.id === invalidWindowIDRef.current ? 'red' : '#477395';
                    }
                  }
                });
              }
              break;
            }
            case ObjectType.SolarPanel: {
              break;
            }
            case ObjectType.Sensor: {
              break;
            }
          }
        }

        // add new element
        switch (objectTypeToAddRef.current) {
          case ObjectType.Window: {
            let relativePos = getWindowRelativePos(pointer, wallModel);
            relativePos = getPositionOnGrid(relativePos);

            const newWindow = ElementModelFactory.makeWindow(wallModel, relativePos.x / lx, 0, relativePos.z / lz);
            setCommonStore((state) => {
              state.enableOrbitController = false;
              state.objectTypeToAdd = ObjectType.None;
              state.elements.push(newWindow);
              state.moveHandleType = MoveHandleType.Mid;
              state.selectedElement = newWindow;
              state.buildingWindowID = newWindow.id;
            });
            setShowGrid(true);
            grabRef.current = newWindow;
            buildingWindowIDRef.current = newWindow.id;
            isSettingWindowStartPointRef.current = true;
            break;
          }
          case ObjectType.SolarPanel: {
            break;
          }
          case ObjectType.Sensor: {
            break;
          }
        }
      }
    }
  };

  const handleIntersectionPointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (isSettingWindowStartPointRef.current && grabRef.current) {
      removeElementById(grabRef.current.id, false);
      setCommonStore((state) => {
        state.objectTypeToAdd = ObjectType.Window;
        state.buildingWindowID = null;
      });
      setShowGrid(false);
      resetCurrentState();
    }
  };

  const handleWallBodyPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (checkIfCanSelectMe(e)) {
      setCommonStore((state) => {
        state.contextMenuObjectType = null;
      });
      selectMe(id, e, ActionType.Select);
    }
  };

  return (
    <>
      {wallAbsPosition && wallAbsAngle !== undefined && (
        <group
          name={`Wall Group ${id}`}
          position={wallAbsPosition}
          rotation={[0, 0, wallAbsAngle]}
          userData={{ parentId: parentId, aabb: true }}
        >
          {/* outside wall */}
          <mesh
            name={'Outside Wall'}
            uuid={id}
            userData={{ simulation: true }}
            ref={outSideWallRef}
            rotation={[HALF_PI, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onContextMenu={(e) => {
              if (grabRef.current) {
                return;
              }
              selectMe(id, e, ActionType.Select);
              setCommonStore((state) => {
                if (e.intersections.length > 0 && e.intersections[0].object === outSideWallRef.current) {
                  state.contextMenuObjectType = ObjectType.Wall;
                }
              });
            }}
            onPointerDown={handleWallBodyPointerDown}
          >
            <meshBasicMaterial map={texture} side={DoubleSide} />
          </mesh>

          {/* inside wall */}
          <mesh
            name={'Inside Wall'}
            ref={insideWallRef}
            position={[0, ly, 0]}
            rotation={[HALF_PI, 0, 0]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={handleWallBodyPointerDown}
          />

          {/* top surface */}
          <mesh
            name={'Top Wall'}
            ref={topSurfaceRef}
            position={[0, hy, hz]}
            castShadow={shadowEnabled}
            receiveShadow={shadowEnabled}
            onPointerDown={handleWallBodyPointerDown}
          />

          {/* side surfaces */}
          {leftOffset === 0 && (
            <Plane
              args={[lz, ly]}
              position={[-hx + 0.01, hy, 0]}
              rotation={[0, HALF_PI, 0]}
              onPointerDown={handleWallBodyPointerDown}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}
          {rightOffset === 0 && (
            <Plane
              args={[lz, ly]}
              position={[hx - 0.01, hy, 0]}
              rotation={[0, HALF_PI, 0]}
              onPointerDown={handleWallBodyPointerDown}
            >
              <meshStandardMaterial color={'white'} side={DoubleSide} />
            </Plane>
          )}

          {/* intersection plane */}
          <Plane
            name={`Wall Intersection Plane ${id}`}
            ref={intersectionPlaneRef}
            args={[lx, lz]}
            position={[0, ly / 2 + 0.01, 0]}
            rotation={[HALF_PI, 0, 0]}
            visible={false}
            onPointerDown={handleIntersectionPointerDown}
            onPointerUp={handleIntersectionPointerUp}
            onPointerMove={handleIntersectionPointerMove}
            onPointerOut={handleIntersectionPointerOut}
          />

          {windows.map((e) => {
            return <Window key={e.id} {...(e as WindowModel)} />;
          })}

          {/* wireFrame */}
          <WallWireFrame x={hx} z={hz} />

          {/* handles */}
          {selected && !locked && <WallResizeHandleWarpper x={hx} z={hz} id={id} highLight={highLight} />}

          {/* grid */}
          {showGrid && (moveHandleTypeRef.current || resizeHandleTypeRef.current) && (
            <group position={[0, -0.001, 0]} rotation={[HALF_PI, 0, 0]}>
              <ElementGrid args={[lx, lz, 0]} objectType={ObjectType.Wall} />
            </group>
          )}
        </group>
      )}
    </>
  );
};

export default React.memo(Wall);
