import { useState } from "react";
import * as faceapi from "face-api.js";

type ImageWithDescriptor = {
  id: number;
  descriptors: Float32Array<ArrayBufferLike>[];
  detections: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<
      {
        detection: faceapi.FaceDetection;
      },
      faceapi.FaceLandmarks68
    >
  >[];
  imgElement: HTMLCanvasElement;
};

async function createCanvasFromDataUrl(
  dataUrl: string,
): Promise<HTMLCanvasElement> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function compareImages(
  exampleDescriptors: Float32Array[],
  targetImagesWithDescriptors: ImageWithDescriptor[],
) {
  const threshold = 0.5;

  const matchedImagesWithDescriptors: ImageWithDescriptor[] = [];
  targetImagesWithDescriptors.forEach(({ detections, ...rest }) => {
    const matchedDescriptors = detections.filter(({ descriptor }) => {
      return exampleDescriptors.some((exampleDescriptor) => {
        const distance = faceapi.euclideanDistance(
          exampleDescriptor,
          descriptor,
        );
        return distance < threshold;
      });
    });

    if (matchedDescriptors.length) {
      matchedImagesWithDescriptors.push({
        detections: matchedDescriptors,
        ...rest,
      });
    }
  });
  return matchedImagesWithDescriptors;
}

async function extractAllFaces(image: HTMLCanvasElement) {
  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections;
}

function useFace() {
  const [exampleImage, setExampleImage] = useState<string | null>(null);
  const [targetImages, setTargetImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputImages, setOutputImages] = useState<string[]>([]);

  const handleFace = async () => {
    if (!exampleImage) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const exampleCanvas = await createCanvasFromDataUrl(exampleImage);

      const allExampleFaces = await extractAllFaces(exampleCanvas);

      if (!allExampleFaces.length) {
        setError("No faces detected in the example image");
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const updatedTargetImages: string[] = [];
      const targetImagesWithId = targetImages.map((targetImage, index) => ({
        id: index,
        src: targetImage,
      }));
      const targetImagesWithDescriptors = await Promise.all(
        targetImagesWithId.map(async ({ id, src }) => {
          const canvas = await createCanvasFromDataUrl(src);
          const detections = await extractAllFaces(canvas);

          return {
            id,
            detections,
            descriptors: detections.map((detection) => detection.descriptor),
            src,
            imgElement: canvas,
          };
        }),
      );

      const matchedImagesWithDescriptors = compareImages(
        allExampleFaces.map((face) => face.descriptor),
        targetImagesWithDescriptors,
      );

      for (const targetImage of targetImagesWithDescriptors) {
        const detections =
          matchedImagesWithDescriptors.find(
            (matchedImageWithDescriptors) =>
              matchedImageWithDescriptors.id === targetImage.id,
          )?.detections || [];

        if (!detections?.length) {
          updatedTargetImages.push(targetImage.src);
          continue;
        }
        const targetImgElement = targetImage.imgElement;
        canvas.width = targetImgElement.width;
        canvas.height = targetImgElement.height;
        ctx.drawImage(targetImgElement, 0, 0, canvas.width, canvas.height);

        for (const detection of detections) {
          const { x, y, width, height } = detection?.detection?.box;
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

      setOutputImages(updatedTargetImages);
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
