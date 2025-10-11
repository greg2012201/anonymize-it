import * as faceapi from "face-api.js";
import * as Comlink from "comlink";
import {
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

const getImage = (transferObj: DataTransfer) => {
  try {
    const imgData = new ImageData(
      new Uint8ClampedArray(transferObj.buffer || []),
      transferObj.w,
      transferObj.h,
    );

    return faceapi.createCanvasFromMedia(imgData);
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
    const canvas = getImage(transferObj);
    const exampleFace = await faceapi
      .detectSingleFace(canvas as faceapi.TNetInput)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return serializeFaceApiResult(exampleFace);
  }
  async extractAllFaces(transferObj: DataTransfer) {
    const canvas = getImage(transferObj);
    const detections = await faceapi
      .detectAllFaces(canvas as faceapi.TNetInput)
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
    const canvas = new OffscreenCanvas(
      imageWithDescriptors.imgElement.w,
      imageWithDescriptors.imgElement.h,
    );
    const ctxRes = canvas.getContext("2d", { willReadFrequently: true })!;
    const detections = imageWithDescriptors.detections;
    const imgElement = getImage(imageWithDescriptors.imgElement);
    ctxRes.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

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
          imgElement,
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
