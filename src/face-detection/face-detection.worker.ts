import * as faceapi from "face-api.js";
import * as Comlink from "comlink";
import {
  DataTransfer,
  FaceDetectionWorker,
  ImageWithDescriptors,
} from "./types";
import { serializeFaceApiResult } from "./worker/serializers";

const MODEL_PATH =
  process.env.NEXT_PUBLIC_MODEL_PATH || "http://localhost:3000/models";

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
      .withAgeAndGender()
      .withFaceExpressions()
      .withFaceDescriptors();

    return detections.map(serializeFaceApiResult);
  }

  async detectMatchingFaces(
    transferObj: DataTransfer & { allFaces: Float32Array[] },
  ) {
    const canvas = getImage(transferObj);
    const allFaces = transferObj.allFaces;
    const detections = await faceapi
      .detectAllFaces(canvas as faceapi.TNetInput)
      .withFaceLandmarks()
      .withFaceDescriptors();
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
    const ctxRes = canvas.getContext("2d")!;
    const detections = imageWithDescriptors.detections;
    const imgElement = getImage(imageWithDescriptors.imgElement);
    ctxRes.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    for (const detection of detections) {
      const { x, y, width, height } = detection?.detection?.box;
      ctxRes.filter = "blur(60px)";
      ctxRes.drawImage(imgElement, x, y, width, height, x, y, width, height);
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
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_PATH),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH),
  ]);
  console.log("worker initialized and models loaded");
}

(async () => {
  await loadModels();
  const worker = new WorkerClass();
  Comlink.expose(worker);
})();
4;
