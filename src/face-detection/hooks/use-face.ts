import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as Comlink from "comlink";
import type { FaceDetectionWorker } from "../types";

async function getImageWithDetections(
  allExampleFaces: Float32Array[],
  targetImageData: { id: number; src: string },
  detector: (transferObj: {
    allExampleFaces: Float32Array[];
    allTargetImages: ArrayBuffer;
  }) => Promise<
    faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<
        { detection: faceapi.FaceDetection },
        faceapi.FaceLandmarks68
      >
    >[]
  >,
) {
  const { id, src } = targetImageData;
  const arrayBuffer = await (await fetch(src)).arrayBuffer();

  const arrayBufferForDetector = arrayBuffer.slice(0);

  const payload = {
    allExampleFaces,
    allTargetImages: arrayBufferForDetector,
  };

  const matchedDescriptors = await detector(payload);

  return {
    id,
    src,
    imgElement: arrayBuffer,
    detections: matchedDescriptors,
  };
}

function useFace() {
  const [exampleImage, setExampleImage] = useState<string | null>(null);
  const [targetImages, setTargetImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputImages, setOutputImages] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const runWorker = async () => {
      const worker = new Worker(
        new URL("../face-detection.worker", import.meta.url),
        { type: "module" },
      );

      workerRef.current = worker;
    };

    runWorker().catch((error) => {
      console.error("Error initializing worker:", error);
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFace = async () => {
    if (!exampleImage || !workerRef.current) {
      return;
    }
    try {
      const api = Comlink.wrap<Comlink.Remote<FaceDetectionWorker>>(
        workerRef.current as any,
      );

      setIsLoading(true);
      setError(null);

      const exampleArrayBuffer = await (
        await fetch(exampleImage)
      ).arrayBuffer();

      const allExampleFaces = await api.extractAllFaces(exampleArrayBuffer);
      const targetImagesWithId = targetImages.map((targetImage, index) => ({
        id: index,
        src: targetImage,
      }));

      for (const targetImage of targetImagesWithId) {
        const imageWithDescriptors = await getImageWithDetections(
          allExampleFaces.map((face) => face.descriptor),
          targetImage,
          api.detectMatchingFaces,
        );
        const output = await api.drawOutputImage(imageWithDescriptors);

        const url = URL.createObjectURL(output);
        setOutputImages((prevState) => [...prevState, url]);
      }
    } catch (err) {
      setError("Error processing image");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleFace,
    isLoading,
    error,
    outputImages,
    loadExampleImage: setExampleImage,
    loadTargetImages: setTargetImages,
    exampleImage,
    targetImages,
  };
}

export default useFace;
