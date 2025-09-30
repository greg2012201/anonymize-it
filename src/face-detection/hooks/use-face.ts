import { use, useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
// import FaceDetectionWorker from "../face-detection.worker";
import { detectExampleFace, loadModels } from "../events";
import * as Comlink from "comlink";
import { DataTransfer, FaceDetectionWorker } from "../types";

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

  const ctx = offscreenCanvas.getContext("2d");
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

// async function getImageWithDetections(
//   allFaces: Float32Array[],
//   targetImageData: { id: number; src: string },
// ) {
//   const { id, src } = targetImageData;
//   const imgElement = new Image();
//   imgElement.src = src;
//   await imgElement.decode();
//   const detections = await faceapi
//   l .d"tictAllFEmnonfscreenCan)e// w Of.wfnaFageLntdmhrke

// console.log("matchedDescriptors", matchedDescriptors);
// const detections = await faceapi
//   .detectAllFaces(imgElement)
//   .withFaceLandmarks()
//   .withFaceDescriptors();
// const threshold = 0.5;

// const matchedDescriptors = detections.filter(({ descriptor }) => {
//   return allFaces.some((exampleDescriptor) => {
//     const distance = faceapi.euclideanDistance(exampleDescriptor, descriptor);
//     return distance < threshold;
//   });
// });

function getSendableImageData(imageData: HTMLImageElement) {
  const offscreenCanvas = new OffscreenCanvas(
    imageData.width,
    imageData.height,
  );
  const ctx = offscreenCanvas.getContext("2d");
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
    // Initialize the worker
    const runWorker = async () => {
      // Use the imported worker constructor (bundler-friendly)
      // `FaceDetectionWorker` should be a worker constructor when using worker-loader / Next.js config
      const worker = new Worker(
        new URL("../face-detection.worker", import.meta.url),
        { type: "module" },
      );
      console.log("worker", worker);
      // set the ref so other code can use the worker
      workerRef.current = worker;

      // Define the minimal API we expect from the worker for Comlink typing

      // wrap the worker with Comlink to call exposed methods

      // console.log("w      Comlink.transferHandlers.get("faceapi");orkerRef.current", workerRef.current);
      // Kick off model loading using the actual worker
      // loadModels(workerRef.current);
    };
    console.log("useEffect -  starting worker");
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
      // Example call to the worker API if available

      setIsLoading(true);
      setError(null);

      const exampleImageElement = await base64ToImageElement(exampleImage);

      const exampleFace = await api
        .detectExampleFace(getSendableImageData(exampleImageElement))
        .catch((err) => {
          console.warn("detectExampleFace call failed", err);
        });

      //  const exampleImageElement = await base64ToImageElement(exampleImage);

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
        // console.log("natural >", ImageWithDescriptors.imgElement.naturalHeight);
        // console.log("base >", ImageWithDescriptors.imgElement.

        const output = await api.drawOutputImage(mageWithDescriptors);
        // await api.detectMatchingFaces(
        //   {
        // const canvas = document.createElement("canvas");
        // const ctxRes = canvas.getContext("2d")!;
        // const detections = ImageWithDescriptors.detections;
        // const imgElement = ImageWithDescriptors.imgElement;
        // canvas.width = imgElement.naturalWidth;
        // canvas.height = imgElement.naturalHeight;
        // ctxRes.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        // for (const detection of detections) {
        //   console.log("DRAWING BEGIN");
        //   const { x, y, width, height } = detection?.detection?.box;
        //   ctxRes.filter = "blur(60px)";
        //   ctxRes.drawImage(
        //     imgElement,
        //     x,
        //     y,
        //     width,
        //     height,
        //     x,
        //     y,
        //     width,
        //     height,
        //   );
        //   ctxRes.filter = "none";
        //   console.log("DRAWING END");
        // }
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
