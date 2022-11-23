/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */
import React, { useEffect, useRef } from 'react';
import { RoofTexture } from 'src/types';
import { useRoofTexture, useTransparent } from './hooks';
import { RoofSegmentProps } from './roofRenderer';
import * as Selector from 'src/stores/selector';
import { useStore } from 'src/stores/common';
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, Mesh, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';

export const RoofSegment = ({
  id,
  index,
  segment,
  defaultAngle,
  thickness,
  textureType,
  heatmaps,
  color,
}: {
  id: string;
  index: number;
  segment: RoofSegmentProps;
  defaultAngle: number;
  thickness: number;
  textureType: RoofTexture;
  heatmaps: CanvasTexture[];
  color: string;
}) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const { transparent, opacity } = useTransparent();
  const texture = useRoofTexture(textureType);

  const surfaceMeshRef = useRef<Mesh>(null);

  const { points, angle, length } = segment;
  const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
  const isFlat = Math.abs(leftRoof.z) < 0.1;
  const { invalidate } = useThree();

  useEffect(() => {
    if (surfaceMeshRef.current) {
      const v10 = new Vector3().subVectors(points[1], points[0]);
      const length10 = v10.length();
      const geo = new BufferGeometry();
      const triangle = points.length === 6;
      const positions = new Float32Array(triangle ? 9 : 18);
      const zOffset = 0.01;
      positions[0] = points[0].x;
      positions[1] = points[0].y;
      positions[2] = points[0].z + thickness + zOffset; // a small number to ensure the surface mesh stay atop
      positions[3] = points[1].x;
      positions[4] = points[1].y;
      positions[5] = points[1].z + thickness + zOffset;
      positions[6] = points[2].x;
      positions[7] = points[2].y;
      positions[8] = points[2].z + thickness + zOffset;
      if (!triangle) {
        positions[9] = points[2].x;
        positions[10] = points[2].y;
        positions[11] = points[2].z + thickness + zOffset;
        positions[12] = points[3].x;
        positions[13] = points[3].y;
        positions[14] = points[3].z + thickness + zOffset;
        positions[15] = points[0].x;
        positions[16] = points[0].y;
        positions[17] = points[0].z + thickness + zOffset;
      }
      // don't call geo.setFromPoints. It doesn't seem to work correctly.
      geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geo.computeVertexNormals();
      const uvs = [];
      const scale = showSolarRadiationHeatmap ? 1 : 10;
      if (triangle) {
        // find the position of the top point relative to the first edge point
        const v20 = new Vector3().subVectors(points[2], points[0]);
        const mid = v20.dot(v10.normalize()) / length10;
        uvs.push(0, 0);
        uvs.push(scale, 0);
        uvs.push(mid * scale, scale);
      } else {
        // find the position of the top-left and top-right points relative to the lower-left point
        // the points go anticlockwise
        const v20 = new Vector3().subVectors(points[2], points[0]);
        const v30 = new Vector3().subVectors(points[3], points[0]);
        v10.normalize();
        const topLeft = v30.dot(v10) / length10;
        const topRight = v20.dot(v10) / length10;
        uvs.push(0, 0);
        uvs.push(scale, 0);
        uvs.push(scale * topRight, scale);
        uvs.push(scale * topRight, scale);
        uvs.push(scale * topLeft, scale);
        uvs.push(0, 0);
      }
      geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

      /* bounding rectangle for debugging */
      // const v10 = new Vector3().subVectors(points[1], points[0]);
      // const v20 = new Vector3().subVectors(points[2], points[0]);
      // const v21 = new Vector3().subVectors(points[2], points[1]);
      // // find the distance from top to the edge: https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
      // const length10 = v10.length();
      // const distance = new Vector3().crossVectors(v20, v21).length() / length10;
      // const normal = new Vector3().crossVectors(v20, v21);
      // const side = new Vector3().crossVectors(normal, v10).normalize().multiplyScalar(distance);
      // const p3 = points[0].clone().add(side);
      // const p4 = points[1].clone().add(side);
      // const geo = new BufferGeometry();
      // const positions = new Float32Array(18);
      // positions[0]=points[0].x;
      // positions[1]=points[0].y;
      // positions[2]=points[0].z;
      // positions[3]=points[1].x;
      // positions[4]=points[1].y;
      // positions[5]=points[1].z;
      // positions[6]=p3.x;
      // positions[7]=p3.y;
      // positions[8]=p3.z;
      // positions[9]=p3.x;
      // positions[10]=p3.y;
      // positions[11]=p3.z;
      // positions[12]=points[1].x;
      // positions[13]=points[1].y;
      // positions[14]=points[1].z;
      // positions[15]=p4.x;
      // positions[16]=p4.y;
      // positions[17]=p4.z;
      // geo.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ));
      // geo.computeVertexNormals();
      // v10.normalize();
      // const uvs = [];
      // uvs.push(0, 0);
      // uvs.push(1, 0);
      // uvs.push(0, 1);
      // uvs.push(0, 1);
      // uvs.push(1, 0);
      // uvs.push(1, 1);
      // geo.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ));

      surfaceMeshRef.current.geometry = geo;
      invalidate();
    }
  }, [points, thickness, showSolarRadiationHeatmap]);

  return (
    <>
      <mesh
        ref={surfaceMeshRef}
        uuid={id + '-' + index}
        name={`Roof segment ${index} surface`}
        castShadow={shadowEnabled && !transparent}
        receiveShadow={shadowEnabled}
        userData={{ simulation: true }}
      >
        {showSolarRadiationHeatmap && index < heatmaps.length ? (
          <meshBasicMaterial map={heatmaps[index]} />
        ) : (
          <meshStandardMaterial
            map={texture}
            color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
            transparent={transparent}
            opacity={opacity}
          />
        )}
      </mesh>
      <mesh name={`Roof segment ${index} bulk`} castShadow={false} receiveShadow={false}>
        <convexGeometry args={[points, isFlat ? defaultAngle : angle, isFlat ? 1 : length]} />
        <meshStandardMaterial color={'white'} transparent={transparent} opacity={opacity} />
      </mesh>
    </>
  );
};

export default React.memo(RoofSegment);
