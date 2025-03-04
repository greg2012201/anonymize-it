import "../lib/face-env-worker-patch";
import * as faceapi from "face-api.js";

const MODEL_PATH =
  process.env.NEXT_PUBLIC_MODEL_PATH || "http://localhost:3000/models";

// https://github.com/justadudewhohacks/face-api.js/issues/47
self.onmessage = async (event) => {
  try {
    const results = await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_PATH),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH),
    ]);
    console.log("results", results);
    self.postMessage({ type: "MODELS_LOADED" });
  } catch (error) {
    console.log("error in worker", error);
    self.postMessage({ type: "MODELS_ERROR", error });
  }
};
