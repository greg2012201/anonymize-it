import { useRef, useState } from "react";
import * as faceapi from "face-api.js";

function useFace(originalImage: string | null) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [blurredImage, setBlurredImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFace = async () => {
        console.log("imageRef.current", imageRef.current);
        if (!imageRef.current || !originalImage) {
            return;
        }
        try {
            setIsLoading(true);
            setError(null);

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            const img = imageRef.current;

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            console.log("canvas width: " + canvas.width);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log("img", img);

            const detections = (
                await Promise.all([
                    faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(),
                    faceapi
                        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512 }))
                        .withFaceLandmarks(),
                    faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks(),
                ])
            ).flat();

            console.log("detections: ", detections);
            if (!detections?.length) {
                setError("No faces detected");
                setBlurredImage(originalImage);
                return;
            }

            for (const detection of detections) {
                const { x, y, width, height } = detection.detection.box;

                ctx.filter = "blur(60px)";
                ctx.drawImage(img, x, y, width, height, x, y, width, height);
                ctx.filter = "none";
            }

            setBlurredImage(canvas.toDataURL());
        } catch (err) {
            setError("Error processing image");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return { handleFace, blurredImage, isLoading, error, outputImageContainerRef: imageRef };
}

export default useFace;
