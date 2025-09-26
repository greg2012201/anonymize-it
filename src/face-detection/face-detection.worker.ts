import * as faceapi from "face-api.js";
import * as Comlink from "comlink";

const MODEL_PATH =
  process.env.NEXT_PUBLIC_MODEL_PATH || "http://localhost:3000/models";

faceapi.env.setEnv(faceapi.env.createNodejsEnv());

faceapi.env.monkeyPatch({
  Canvas: OffscreenCanvas,
  createCanvasElement: () => {
    return new OffscreenCanvas(480, 270);
  },
});

const getCanvas = (event: MessageEvent) => {
  try {
    const imgData = new ImageData(
      new Uint8ClampedArray(event?.data?.buffer),
      event?.data?.w,
      event?.data?.h,
    );

    return faceapi.createCanvasFromMedia(imgData);
  } catch (error) {
    console.error(
      `error executing event: ${event.type} properties: w:${event?.data?.w}, h:${typeof event?.data?.h}`,
      error,
    );
    return new OffscreenCanvas(20, 20);
  }
};
class WorkerClass {
  async detectExampleFace(event: MessageEvent) {
    const canvas = getCanvas(event);
    const exampleFace = await faceapi
      .detectSingleFace(canvas)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return exampleFace;
  }

  logSomething(args: string) {
    console.log("WorkerClass logSomething", args);
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
