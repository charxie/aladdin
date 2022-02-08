/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import {BufferGeometry, Float32BufferAttribute, Vector3} from "three";

class ParaboloidGeometry extends BufferGeometry {

  constructor( semiLatusRectum = 1, rimRadius = 1, radialSegments = 16, depthSegments = 4) {

    super();
    this.type = 'ParaboloidGeometry';

    this.parameters = {
      semilatusRectum: semiLatusRectum,
      rimRadius: rimRadius,
      radialSegments: radialSegments,
      depthSegments: depthSegments
    };

    radialSegments = Math.max( 3, Math.floor( radialSegments ) );
    depthSegments = Math.max( 2, Math.floor( depthSegments ) );

    let index = 0;
    const grid = [];

    const vertex = new Vector3();
    const normal = new Vector3();
    const tangential = new Vector3();

    // buffers

    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];

    const TWO_PI = Math.PI * 2;
    const depth = rimRadius * rimRadius / (2 * semiLatusRectum);
    const dy = 1 / depthSegments;
    let cos, sin;

    // generate vertices, normals and uvs

    for ( let iy = 0; iy <= depthSegments; iy ++ ) {

      const verticesRow = [];

      const v = iy * dy;
      const t = v * depth;

      // special case for the poles

      let uOffset = 0;
      if ( iy === 0) {
        uOffset = 0.5 / radialSegments;
      } else if ( iy === depthSegments) {
        uOffset = - 0.5 / radialSegments;
      }

      for ( let ix = 0; ix <= radialSegments; ix ++ ) {

        const u = ix / radialSegments;
        cos = Math.cos( u * TWO_PI );
        sin = Math.sin( u * TWO_PI );

        // vertex
        vertex.x = semiLatusRectum * cos * t;
        vertex.y = semiLatusRectum * sin * t;
        vertex.z = semiLatusRectum * t * t / 2;
        vertices.push( vertex.x, vertex.y, vertex.z );

        // tangential vector
        tangential.set(semiLatusRectum * cos, semiLatusRectum * sin, semiLatusRectum * t).normalize();

        // normal vector
        normal.crossVectors(tangential, new Vector3(cos, sin, 0));
        normals.push( normal.x, normal.y, normal.z );

        // uv
        uvs.push( u + uOffset, 1 - v );
        verticesRow.push( index ++ );

      }

      grid.push( verticesRow );

    }

    // indices

    for ( let iy = 0; iy < depthSegments; iy ++ ) {
      for ( let ix = 0; ix < radialSegments; ix ++ ) {
        const a = grid[ iy ][ ix + 1 ];
        const b = grid[ iy ][ ix ];
        const c = grid[ iy + 1 ][ ix ];
        const d = grid[ iy + 1 ][ ix + 1 ];
        if ( iy !== 0) indices.push( a, b, d );
        if ( iy !== depthSegments - 1) indices.push( b, c, d );
      }
    }

    // build geometry
    this.setIndex( indices );
    this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
    this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
    this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

  }

  static fromJSON( data ) {
    return new ParaboloidGeometry(data.semiLatusRectum, data.rimRadius, data.radialSegments, data.depthSegments);
  }

}

export { ParaboloidGeometry };
