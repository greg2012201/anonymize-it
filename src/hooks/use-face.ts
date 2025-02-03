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
};

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

function extractExampleFace(image: HTMLImageElement) {
  return faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();
}

async function extractAllFaces(image: HTMLImageElement) {
  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withAgeAndGender()
    .withFaceExpressions()
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

      const exampleImageElement = await base64ToImageElement(exampleImage);

      const exampleFace = await extractExampleFace(exampleImageElement);
      const allFaces = await extractAllFaces(exampleImageElement);
      console.log("allFaces", allFaces);
      if (!exampleFace) {
        setError("No face detected in the example image");
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
          const imgElement = new Image();
          imgElement.src = src;
          await imgElement.decode();
          const detections = await faceapi
            .detectAllFaces(imgElement)
            .withFaceLandmarks()
            .withFaceDescriptors();

          return {
            id,
            detections,
            descriptors: detections.map((detection) => detection.descriptor),
            src,
            imgElement,
          };
        }),
      );

      const matchedImagesWithDescriptors = compareImages(
        allFaces.map((face) => face.descriptor),
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
        canvas.width = targetImgElement.naturalWidth;
        canvas.height = targetImgElement.naturalHeight;
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
