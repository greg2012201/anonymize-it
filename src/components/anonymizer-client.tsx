"use client";

import { useCallback } from "react";
import { Button } from "./ui/button";

import { Preview } from "./preview";
import { ImageUploader } from "./preview/image-uploader";
import useFace from "@/hooks/use-face";
import useLoadModels from "@/hooks/use-load-models";

function AnonymizerClient() {
  useLoadModels();
  const {
    outputImages,
    handleFace,
    loadExampleImage,
    loadTargetImages,
    isLoading,
    exampleImage,
    targetImages,
  } = useFace();

  const handleProcess = () => {
    handleFace();
  };

  const handleOnImageUpload = useCallback(
    (data: string[]) => {
      loadTargetImages((prevData) => [...prevData, ...data]);
    },
    [loadTargetImages],
  );
  return (
    <div className="flex w-full max-w-[800px] flex-col items-center gap-1.5">
      <Preview
        exampleImagePlaceholder={
          <ImageUploader
            type="single"
            onImageUpload={(img) => loadExampleImage(img[0])}
          />
        }
        targetImagesPlaceholder={
          <ImageUploader type="multiple" onImageUpload={handleOnImageUpload} />
        }
        images={outputImages?.length ? outputImages : targetImages}
        exampleImage={exampleImage}
      />
      <div className="flex space-x-4"></div>{" "}
      {isLoading && <span>Loading...</span>}
      <Button type="button" onClick={handleProcess} disabled={isLoading}>
        Process
      </Button>
    </div>
  );
}

export default AnonymizerClient;
