import * as faceapi from "face-api.js";

export type DataTransfer = ArrayBuffer | undefined;

export type ImageWithDescriptors = {
  id: number;
  src: string;
  imgElement: DataTransfer;
  detections: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<
      {
        detection: faceapi.FaceDetection;
      },
      faceapi.FaceLandmarks68
    >
  >[];
};

export interface FaceDetectionWorker {
  detectExampleFace: (
    transferObj: DataTransfer,
  ) => Promise<Float32Array[] | null>;

  detectMatchingFaces: (transferObj: {
    allFaces: Float32Array[];
    buffer: ArrayBuffer;
  }) => Promise<
    faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<
        { detection: faceapi.FaceDetection },
        faceapi.FaceLandmarks68
      >
    >[]
  >;
  drawOutputImage: (
    imageWithDescriptors: ImageWithDescriptors,
  ) => Promise<Blob>;

  extractAllFaces: (transferObj: DataTransfer) => Promise<
    faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<
        {
          detection: faceapi.FaceDetection;
        },
        faceapi.FaceLandmarks68
      >
    >[]
  >;
}

export type ImageWithDescriptor = {
  id: number;
  src: string;
  imgElement: HTMLImageElement;
  descriptors: Float32Array[];
  detections: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<
      { detection: faceapi.FaceDetection },
      faceapi.FaceLandmarks68
    >
  >[];
};
