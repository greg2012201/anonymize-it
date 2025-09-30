"use client";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dispatch, type SetStateAction } from "react";

type CarouselModalProps = {
  images: string[];
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function CarouselModal({
  images,
  isOpen,
  setIsOpen,
}: CarouselModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] max-h-[900px]">
        <DialogHeader>
          <DialogTitle>Image Carousel</DialogTitle>
          <DialogDescription>
            Browse through the images using the carousel controls.
          </DialogDescription>
        </DialogHeader>
        <Carousel className="mx-auto w-full h-full flex flex-col">
          <CarouselContent className="h-[calc(90vh-8rem)] sm:h-[calc(90vh-6rem)]">
            {images.map((src, index) => (
              <CarouselItem key={index} className="flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Carousel image ${index + 1}`}
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-full w-auto h-auto rounded-md object-contain"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
