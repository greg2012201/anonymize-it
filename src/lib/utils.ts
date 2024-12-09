import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function fileUpload(event: React.ChangeEvent<HTMLInputElement>, callback: (imgData: string[]) => void) {
    event.preventDefault();
    const files = event.target.files;

    if (files) {
        const fileArray = Array.from(files);
        const results: string[] = [];
        fileArray.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                results.push(dataUrl);
            };
            reader.readAsDataURL(file);
        });
        callback(results);
    }
}
