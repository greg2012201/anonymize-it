"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

function AnonymizerClient() {
    const [uploadedImage, setUploadedImage] = useState<string | null>();

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
    return (
        <form className="flex flex-col w-full max-w-[800px] items-center gap-1.5">
            <Input className="max-w-[400px]" onChange={handleFileUpload} id="file" name="file" type="file" />
            {/*  <Button type="submit">Send</Button> */}
            <div className="flex [&>img]:w-[400px] space-x-4">
                {uploadedImage && <img src={uploadedImage} />}
                {uploadedImage && <img src={uploadedImage} />}
            </div>
        </form>
    );
}

export default AnonymizerClient;
