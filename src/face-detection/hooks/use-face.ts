import { use, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import FaceDetectionWotker from "../face-detection.worker";
import EventManager, { detectExampleFace, loadModels } from "../events";

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

// function detectFacesToAnonymize(
//   exampleDescriptors: Float32Array[],
//   ImageWithDescriptor: ImageWithDescriptor,
// ) {
//   const threshold = 0.5;

//   const matchedDescriptors = detections.filter(({ descriptor }) => {
//     return exampleDescriptors.some((exampleDescriptor) => {
//       const distance = faceapi.euclideanDistance(exampleDescriptor, descriptor);
//       return distance < threshold;
//     });
//   });
// }

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

async function getImageWithDetections(
  allFaces: Float32Array[],
  targetImageData: { id: number; src: string },
) {
  const { id, src } = targetImageData;
  const imgElement = new Image();
  imgElement.src = src;
  await imgElement.decode();
  const detections = await faceapi
    .detectAllFaces(imgElement)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const threshold = 0.5;

  const matchedDescriptors = detections.filter(({ descriptor }) => {
    return allFaces.some((exampleDescriptor) => {
      const distance = faceapi.euclideanDistance(exampleDescriptor, descriptor);
      return distance < threshold;
    });
  });

  return { id, src, imgElement, detections: matchedDescriptors };
}

function useFace() {
  const [exampleImage, setExampleImage] = useState<string | null>(null);
  const [targetImages, setTargetImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputImages, setOutputImages] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const eventManagerRef = useRef<EventManager | null>(null);

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new FaceDetectionWotker();
    loadModels(workerRef?.current);
    // workerRef.current?.postMessage({ type: "LOAD_MODELS" });
    // eventManagerRef.current?.loadModels();
    // Cleanup
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFace = async () => {
    if (!exampleImage || !workerRef.current) {
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      //   workerRef.current.postMessage({ type: "LOAD_MODELS" });

      const exampleImageElement = await base64ToImageElement(exampleImage);
      const offscreenCanvas = new OffscreenCanvas(
        exampleImageElement.width,
        exampleImageElement.height,
      );
      const ctx = offscreenCanvas.getContext("2d");
      ctx?.drawImage(
        exampleImageElement,
        0,
        0,
        exampleImageElement.width,
        exampleImageElement.height,
      );
      const imgData = ctx?.getImageData(
        0,
        0,
        exampleImageElement.width,
        exampleImageElement.height,
      );
      // ===============

      await detectExampleFace(workerRef.current, {
        message: {
          w: exampleImageElement.width,
          h: exampleImageElement.height,
          buffer: imgData?.data.buffer,
        },
        transfelable: [imgData?.data.buffer],
      });
      // workerRef.current.postMessage(
      //   {
      //     type: "DETECT_EXAMPLE_FACE",
      //     w: exampleImageElement.width,
      //     h: exampleImageElement.height,
      //     buffer: imgData?.data.buffer,
      //   },
      //   [imgData?.data.buffer],
      // );
      // THE SAME DATA BUFFER CAN BE TRANSFERED ONLY ONCE
      // workerRef.current.postMessage(
      //   {
      //     type: "DETECT_ALL_FACES",
      //     w: exampleImageElement.width,
      //     h: exampleImageElement.height,
      //     buffer: imgData?.data.buffer,
      //   },
      //   [imgData?.data.buffer],
      // );
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data;
        console.log("event", event);
        switch (type) {
          case "EXAMPLE_FACE_DETECTED":
            console.log("example face detected", data);
            break;
          case "ALL_FACES_DETECTED":
            console.log("all faces detected", data);
            break;
          case "MODELS_LOADED":
            console.log("models loaded");
            break;
          case "WORKER_ERROR":
            console.error("worker error", data);
            break;
        }
      };
      return;
      // const exampleImageElement = await base64ToImageElement(exampleImage);

      const exampleFace =
        null; /* await extractExampleFace(exampleImageElement); */
      const allFaces = null; /* await extractAllFaces(exampleImageElement) */
      console.log("allFaces", allFaces);
      if (!exampleFace) {
        setError("No face detected in the example image");
        return;
      }

      const canvas = document.createElement("canvas");
      // const ctx = canvas.getContext("2d")!;

      const targetImagesWithId = targetImages.map((targetImage, index) => ({
        id: index,
        src: targetImage,
      }));

      for (const targetImage of targetImagesWithId) {
        const ImageWithDescriptors = await getImageWithDetections(
          allFaces.map((face) => face.descriptor),
          targetImage,
        );
        const detections = ImageWithDescriptors.detections;
        const imgElement = ImageWithDescriptors.imgElement;
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        for (const detection of detections) {
          const { x, y, width, height } = detection?.detection?.box;
          ctx.filter = "blur(60px)";
          ctx.drawImage(imgElement, x, y, width, height, x, y, width, height);
          ctx.filter = "none";
        }
        setOutputImages((prevState) => [...prevState, canvas.toDataURL()]);
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
