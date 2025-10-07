import { useEffect } from "react";
import * as faceapi from "face-api.js";

const MODEL_PATH = `/models`;

async function loadModels(onError: (err: any) => void) {
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
    ]);
    console.log("models loaded");
  } catch (err) {
    onError("Failed to load face detection models");
    console.error(err);
  }
}

function useLoadModels() {
  useEffect(() => {
    loadModels((e) => console.log("Error Loading Models", e));
  }, []);
}

export default useLoadModels;
