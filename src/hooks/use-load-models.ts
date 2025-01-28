import { useEffect } from "react";
import * as faceapi from "face-api.js";

async function loadModels(onError: (err: any) => void) {
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);
    console.log("models loaded");
    // TODO: set set loading state
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
