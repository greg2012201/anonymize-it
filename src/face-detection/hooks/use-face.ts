import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as Comlink from "comlink";
import { DataTransfer, FaceDetectionWorker } from "../types";

async function base64ToImageElement(
  base64Image: string,
): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });
}

async function getImageWithDetections(
  allFaces: Float32Array[],
  targetImageData: { id: number; src: string },
  detector: (
    transferObj: DataTransfer & { allFaces: Float32Array[] },
  ) => Promise<
    faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<
        { detection: faceapi.FaceDetection },
        faceapi.FaceLandmarks68
      >
    >[]
  >,
) {
  const { id, src } = targetImageData;
  const imgTargetElement = new Image();
  imgTargetElement.src = src;
  await imgTargetElement.decode();

  const imgElement = imgTargetElement;
  const offscreenCanvas = new OffscreenCanvas(
    imgElement.width,
    imgElement.height,
  );

  const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  ctx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height);
  const imgData = ctx?.getImageData(0, 0, imgElement.width, imgElement.height);
  const matchedDescriptors = await detector({
    allFaces,
    w: imgElement.width,
    h: imgElement.height,
    buffer: imgData?.data.buffer,
    transferrable: [imgData?.data.buffer],
  });

  return {
    id,
    src,
    imgElement: getSendableImageData(imgElement),
    detections: matchedDescriptors,
  };
}

function getSendableImageData(imageData: HTMLImageElement) {
  const offscreenCanvas = new OffscreenCanvas(
    imageData.width,
    imageData.height,
  );
  const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
  ctx?.drawImage(imageData, 0, 0, imageData.width, imageData.height);
  const imgData = ctx?.getImageData(0, 0, imageData.width, imageData.height);
  return {
    w: imageData.width,
    h: imageData.height,
    buffer: imgData?.data.buffer,
    transferrable: [imgData?.data.buffer],
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

      const exampleImageElement = await base64ToImageElement(exampleImage);

      const exampleFace = await api
        .detectExampleFace(getSendableImageData(exampleImageElement))
        .catch((err) => {
          console.warn("detectExampleFace call failed", err);
        });

      const allFaces = await api.extractAllFaces(
        getSendableImageData(exampleImageElement),
      );

      if (!exampleFace) {
        setError("No face detected in the example image");
        return;
      }

      const targetImagesWithId = targetImages.map((targetImage, index) => ({
        id: index,
        src: targetImage,
      }));

      for (const targetImage of targetImagesWithId) {
        const mageWithDescriptors = await getImageWithDetections(
          allFaces.map((face) => face.descriptor),
          targetImage,
          api.detectMatchingFaces,
        );

        const output = await api.drawOutputImage(mageWithDescriptors);

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
