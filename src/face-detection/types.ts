import * as faceapi from "face-api.js";

export type DataTransfer = {
  w: number;
  h: number;
  buffer: ArrayBuffer | undefined;
  transferrable: (ArrayBuffer | undefined)[];
};

export type ImageWithDescriptors = {
  id: number;
  src: string;
  imgElement: {
    w: number;
    h: number;
    buffer: ArrayBuffer | undefined;
    transferrable: (ArrayBuffer | undefined)[];
  };
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

  detectMatchingFaces: (
    transferObj: DataTransfer & { allFaces: Float32Array[] },
  ) => Promise<
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
  descriptors: Float32Array<ArrayBufferLike>[];
  detections: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<
      { detection: faceapi.FaceDetection },
      faceapi.FaceLandmarks68
    >
  >[];
};
