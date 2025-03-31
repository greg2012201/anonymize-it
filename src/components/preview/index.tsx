"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { CarouselModal } from "./carousel-modal";

type RightProps = {
  images: string[];
};

function Right({ images }: RightProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CarouselModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        images={images}
      />
      <div onClick={() => setIsModalOpen(true)}>
        <Image
          src={images[0] || "/image-placeholder.svg"}
          alt="First image"
          width={400}
          height={400}
          className="h-full w-full object-cover"
        />
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 text-white transition-opacity duration-300`}
        >
          <ChevronRight className="h-12 w-12" />
          <span className="sr-only">View gallery</span>
        </div>
      </div>
    </>
  );
}

type SplitViewImageProps = {
  exampleImage?: string | null;
  images: string[];
} & Record<"exampleImagePlaceholder" | "targetImagesPlaceholder", ReactNode>;

export function Preview({
  exampleImage,
  images,
  exampleImagePlaceholder,
  targetImagesPlaceholder,
}: SplitViewImageProps) {
  /* TODO: MOVE THIS THE SEPARATE COMPONENT  */

  return (
    <div className="flex h-[400px] w-full gap-2 overflow-hidden">
      {/* Left side - Example Image */}
      <div className="w-1/2 rounded-lg border bg-muted">
        {exampleImage ? (
          <Image
            src={exampleImage || "/image-placeholder.svg"}
            alt="Example"
            width={400}
            height={400}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          exampleImagePlaceholder
        )}
      </div>
      {/* Right side - First Image from List */}
      <div className="relative w-1/2 cursor-pointer rounded-lg border bg-muted transition-all duration-300 ease-in-out">
        {images.length > 0 ? (
          <Right images={images} />
        ) : (
          targetImagesPlaceholder
        )}
      </div>
    </div>
  );
}
