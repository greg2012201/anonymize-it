import * as faceapi from "face-api.js";
import * as Comlink from "comlink";
import type {
  DataTransfer,
  FaceDetectionWorker,
  ImageWithDescriptors,
} from "./types";
import { serializeFaceApiResult } from "./worker/serializers";

const MODEL_PATH = `/models`;

faceapi.env.setEnv(faceapi.env.createNodejsEnv());

faceapi.env.monkeyPatch({
  //@ts-ignore
  Canvas: OffscreenCanvas,
  //@ts-ignore
  createCanvasElement: () => {
    return new OffscreenCanvas(480, 270);
  },
});

const createCanvas = async (transferObj: DataTransfer) => {
  try {
    const buf = transferObj as ArrayBuffer | undefined;
    if (!buf) return new OffscreenCanvas(20, 20);

    const blob = new Blob([buf]);
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
    return canvas;
  } catch (error) {
    console.error(
      "Error creating image from buffer, using empty canvas instead",
      error,
    );
    return new OffscreenCanvas(20, 20);
  }
};

class WorkerClass implements FaceDetectionWorker {
  async detectExampleFace(transferObj: DataTransfer) {
    const canvas = await createCanvas(transferObj);
    const exampleFace = await faceapi
      .detectSingleFace(canvas as unknown as faceapi.TNetInput)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return serializeFaceApiResult(exampleFace);
  }
  async extractAllFaces(transferObj: DataTransfer) {
    const canvas = await createCanvas(transferObj);
    const detections = await faceapi
      .detectAllFaces(canvas as unknown as faceapi.TNetInput)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.map(serializeFaceApiResult);
  }

  async detectMatchingFaces(
    transferObj: DataTransfer & { allFaces: Float32Array[] },
  ) {
    const allFaces = transferObj.allFaces;
    const detections = await this.extractAllFaces(transferObj);
    const threshold = 0.5;

    const matchedDescriptors = detections.filter(({ descriptor }) => {
      return allFaces.some((exampleDescriptor) => {
        const distance = faceapi.euclideanDistance(
          exampleDescriptor,
          descriptor,
        );
        return distance < threshold;
      });
    });
    return matchedDescriptors.map(serializeFaceApiResult);
  }

  async drawOutputImage(imageWithDescriptors: ImageWithDescriptors) {
    const decodedCanvas = await createCanvas(imageWithDescriptors.imgElement);

    const canvas = new OffscreenCanvas(
      decodedCanvas.width,
      decodedCanvas.height,
    );
    const ctxRes = canvas.getContext("2d", { willReadFrequently: true })!;
    const detections = imageWithDescriptors.detections;
    ctxRes.drawImage(
      decodedCanvas as unknown as CanvasImageSource,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    for (const detection of detections) {
      const { x, y, width, height } = detection?.detection?.box;

      const padding = 0.2;
      const expandedX = Math.max(0, x - width * padding);
      const expandedY = Math.max(0, y - height * padding);
      const expandedWidth = Math.min(
        canvas.width - expandedX,
        width * (1 + 2 * padding),
      );
      const expandedHeight = Math.min(
        canvas.height - expandedY,
        height * (1 + 2 * padding),
      );

      for (let i = 0; i < 3; i++) {
        ctxRes.filter = "blur(50px)";
        ctxRes.drawImage(
          decodedCanvas as unknown as CanvasImageSource,
          expandedX,
          expandedY,
          expandedWidth,
          expandedHeight,
          expandedX,
          expandedY,
          expandedWidth,
          expandedHeight,
        );
      }
      ctxRes.filter = "none";
    }

    return canvas.convertToBlob();
  }
}

async function loadModels() {
  console.log("WorkerClass init...");
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
  ]);
  console.log("worker initialized and models loaded");
}

(async () => {
  await loadModels();
  const worker = new WorkerClass();
  Comlink.expose(worker);
})();
