import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function readImageData(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve(dataUrl);
    };
    reader.readAsDataURL(file);
  });
}

export async function fileUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  callback: (imgData: string[]) => void,
) {
  event.preventDefault();
  const files = event.target.files;

  if (files) {
    const fileArray = Array.from(files);
    const results = await Promise.all(
      fileArray.map((file) => {
        return readImageData(file);
      }),
    );
    callback(results);
  }
}
