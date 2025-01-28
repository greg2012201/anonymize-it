"use client";

import { useCallback } from "react";
import { Button } from "./ui/button";
import useLoadModels from "@/hooks/use-load-models";
import useFace from "@/hooks/use-face";
import ImageUploader from "./image-uploader";

function AnonymizerClient() {
    useLoadModels();
    const { blurredImages, handleFace, loadExampleImage, loadTargetImages, isLoading } = useFace();

    const handleProcess = () => {
        handleFace();
    };

    const handleOnImageUpload = useCallback(
        (data: string[]) => {
            loadTargetImages((prevData) => [...prevData, ...data]);
        },
        [loadTargetImages]
    );

    return (
        <div className="flex flex-col w-full max-w-[800px] items-center gap-1.5">
            <div className="flex space-x-4">
                {" "}
                <ImageUploader
                    id="example-face-uploader"
                    label="image with the example faces"
                    onImageUpload={(img) => loadExampleImage(img[0])}
                />
                <ImageUploader
                    id="to-anonymize"
                    allowMultipleFiles
                    label="images that should be anonymized"
                    onImageUpload={handleOnImageUpload}
                />
            </div>{" "}
            <div className="flex [&>img]:w-[400px] space-x-4">
                {blurredImages.map((blurredImage) => (
                    <img key={blurredImage} src={blurredImage} />
                ))}
            </div>
            {isLoading && <span>Loading...</span>}
            <Button type="button" onClick={handleProcess} disabled={isLoading}>
                Process
            </Button>
        </div>
    );
}

export default AnonymizerClient;
