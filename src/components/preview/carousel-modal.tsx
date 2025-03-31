"use client";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Image Carousel</DialogTitle>
          <DialogDescription>
            Browse through the images using the carousel controls.
          </DialogDescription>
        </DialogHeader>
        <Carousel className="mx-auto w-full max-w-xs">
          <CarouselContent>
            {images.map((src, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Carousel image ${index + 1}`}
                    width={600}
                    height={400}
                    className="w-full rounded-md object-cover"
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
