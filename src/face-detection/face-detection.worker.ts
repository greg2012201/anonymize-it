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
  async extractAllFaces(event: MessageEvent) {
    const canvas = getCanvas(event);
    const detections = await faceapi
      .detectAllFaces(canvas)
      .withFaceLandmarks()
      .withAgeAndGender()
      .withFaceExpressions()
      .withFaceDescriptors();

    return detections;
  }

  async detectMatchingFaces(event: MessageEvent) {
    const canvas = getCanvas(event);
    const allFaces = event?.data?.allFaces as Float32Array[];
    const detections = await faceapi
      .detectAllFaces(canvas)
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
    return matchedDescriptors;
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
