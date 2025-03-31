import * as faceapi from "face-api.js";

const MODEL_PATH =
  process.env.NEXT_PUBLIC_MODEL_PATH || "http://localhost:3000/models";

faceapi.env.setEnv(faceapi.env.createNodejsEnv());

faceapi.env.monkeyPatch({
  Canvas: OffscreenCanvas,
  createCanvasElement: () => {
    return new OffscreenCanvas(480, 270);
  },
});

console.log("WORKER LOADED");

self.onmessage = async (event) => {
  const { type, data } = event.data;
  const getCanvas = () => {
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

  try {
    switch (type) {
      case "LOAD_MODELS":
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_PATH),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH),
        ]);
        console.log("models loaded");
        self.postMessage({ type: "MODELS_LOADED" });
        break;

      case "DETECT_EXAMPLE_FACE":
        const exampleFace = await faceapi
          .detectSingleFace(getCanvas())
          .withFaceLandmarks()
          .withFaceDescriptor();
        console.log("example", exampleFace);
        self.postMessage({ type: "EXAMPLE_FACE_DETECTED", data: exampleFace });
        break;

      case "DETECT_ALL_FACES":
        const allFaces = await faceapi
          .detectAllFaces(getCanvas())
          .withFaceLandmarks()
          .withAgeAndGender()
          .withFaceExpressions()
          .withFaceDescriptors();
        self.postMessage({ type: "ALL_FACES_DETECTED", data: allFaces });
        break;
    }
  } catch (error) {
    console.error("error in worker", error);
    self.postMessage({ type: "WORKER_ERROR", error });
  }
};
