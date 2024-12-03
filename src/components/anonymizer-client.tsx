"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import useLoadModels from "@/hooks/use-load-models";
import useFace from "@/hooks/use-face";

function AnonymizerClient() {
    const [uploadedImage, setUploadedImage] = useState<string | null>();

    useLoadModels();
    const { blurredImage, error, handleFace, isLoading, outputImageContainerRef } = useFace(uploadedImage ?? null);
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0];
        console.log("file", e.target);
        if (file) {
            const reader = new FileReader();
            // reader.onloadstart = () => setIsLoading(true);
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setUploadedImage(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcess = () => {
        console.log("begin");
        handleFace();
    };
    return (
        <div className="flex flex-col w-full max-w-[800px] items-center gap-1.5">
            <Input className="max-w-[400px]" onChange={handleFileUpload} id="file" name="file" type="file" />
            {/*  <Button type="submit">Send</Button> */}
            <div className="flex [&>img]:w-[400px] space-x-4">
                {uploadedImage && <img ref={outputImageContainerRef} src={uploadedImage} />}
                <img src={blurredImage} />
            </div>
            {isLoading && <span>Loading...</span>}
            <Button type="button" onClick={handleProcess} disabled={isLoading}>
                Process
            </Button>
        </div>
    );
}

export default AnonymizerClient;
