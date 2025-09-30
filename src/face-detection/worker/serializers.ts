export function serializeDetection(det: any): any {
  if (!det) return det;

  const box = det.box ?? det._box;
  return {
    score: det.score ?? det._score,
    classScore: det.classScore ?? det._classScore,
    className: det.className ?? det._className,
    box: box ? serializeBox(box) : undefined,
    imageDims: det.imageDims ?? det._imageDims,
  };
}

export function serializeBox(box: any): any {
  return {
    x: box.x ?? box._x,
    y: box.y ?? box._y,
    width: box.width ?? box._width,
    height: box.height ?? box._height,
  };
}

export function serializeLandmarks(landmarks: any): any {
  if (!landmarks?.positions) return landmarks;
  return {
    positions: landmarks.positions.map((pt: any) => ({
      x: pt.x ?? pt._x,
      y: pt.y ?? pt._y,
    })),
  };
}
export function serializeFaceApiResult(result: any): any {
  if (!result) return result;

  const out: Record<string, any> = {};

  if ("detection" in result)
    out.detection = serializeDetection(result.detection);
  if ("descriptor" in result)
    out.descriptor = ArrayBuffer.isView(result.descriptor)
      ? Array.from(result.descriptor) // or keep Float32Array for zero-copy
      : result.descriptor;
  if ("expression" in result) out.expression = result.expression;
  if ("landmarks" in result)
    out.landmarks = serializeLandmarks(result.landmarks);
  if ("alignedRect" in result)
    out.alignedRect = serializeDetection(result.alignedRect);

  return out;
}
