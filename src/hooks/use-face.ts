import { useState, useEffect } from "react";
import * as faceapi from "face-api.js";

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

function compareImages(
  exampleDescriptor: Float32Array,
  targetDescriptors: Float32Array[],
) {
  const threshold = 0.6;
  return targetDescriptors.filter((targetDescriptor) => {
    const distance = faceapi.euclideanDistance(
      exampleDescriptor,
      targetDescriptor,
    );
    return distance < threshold;
  });
}

function extractExampleFace(image: HTMLImageElement) {
  return faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();
}

function useFace() {
  const [blurredImages, setBlurredImages] = useState<string[]>([]);
  const [exampleImage, setExampleImage] = useState<string | null>(null);
  const [targetImages, setTargetImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingTargetImages, setMatchingTargetImages] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };
    loadModels();
  }, []);

  const handleFace = async () => {
    if (!exampleImage) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const exampleImageElement = await base64ToImageElement(exampleImage);

      const exampleFace = await extractExampleFace(exampleImageElement);

      if (!exampleFace) {
        setError("No face detected in the example image");
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const updatedTargetImages: string[] = [];

      const targetDescriptors = await Promise.all(
        targetImages.map(async (targetImage) => {
          const imgElement = new Image();
          imgElement.src = targetImage;
          await imgElement.decode();
          const detections = await faceapi
            .detectAllFaces(imgElement)
            .withFaceLandmarks()
            .withFaceDescriptors();
          return detections.map((detection) => detection.descriptor);
        }),
      );
      const flattenedDescriptors = targetDescriptors.flat();

      const matchedDescriptors = compareImages(
        exampleFace.descriptor,
        flattenedDescriptors,
      );

      const matchingImageUrls = targetImages.filter((_, index) => {
        const descriptorsForImage = targetDescriptors[index];
        return descriptorsForImage.some((descriptor) =>
          matchedDescriptors.some(
            (matchedDescriptor) => matchedDescriptor === descriptor,
          ),
        );
      });
      if (matchedDescriptors.length > 0) {
        setMatchingTargetImages((prev) => [...prev, ...targetImages]);
      }
      for (const targetImage of matchingImageUrls) {
        const targetImgElement = new Image();
        targetImgElement.src = targetImage;
        await targetImgElement.decode();

        const detections = await faceapi
          .detectAllFaces(targetImgElement)
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (!detections.length) {
          continue;
        }

        canvas.width = targetImgElement.naturalWidth;
        canvas.height = targetImgElement.naturalHeight;
        ctx.drawImage(targetImgElement, 0, 0, canvas.width, canvas.height);

        for (const detection of detections) {
          const { x, y, width, height } = detection.detection.box;
          ctx.filter = "blur(60px)";
          ctx.drawImage(
            targetImgElement,
            x,
            y,
            width,
            height,
            x,
            y,
            width,
            height,
          );
          ctx.filter = "none";
        }

        updatedTargetImages.push(canvas.toDataURL());
      }

      setBlurredImages(updatedTargetImages);
    } catch (err) {
      setError("Error processing image");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleFace,
    blurredImages,
    isLoading,
    error,
    matchingTargetImages,
    loadExampleImage: setExampleImage,
    loadTargetImages: setTargetImages,
  };
}

export default useFace;
