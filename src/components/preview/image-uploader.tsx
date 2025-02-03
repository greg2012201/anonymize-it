import { fileUpload } from "@/lib/utils";
import { Images, Image } from "lucide-react";
import { ReactNode, useRef } from "react";

type WithImageUploadProps = {
  children: ReactNode;
  onImageUpload: (img: string[]) => void;
  allowMultipleImages?: boolean;
};

function WithImageUpload({
  children,
  onImageUpload,
  allowMultipleImages = false,
}: WithImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) =>
    await fileUpload(e, onImageUpload);
  return (
    <div
      className={`flex h-full w-full cursor-pointer items-center justify-center bg-muted text-muted-foreground`}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
        multiple={allowMultipleImages}
      />
      {children}
    </div>
  );
}

type ImageUploaderProps = {
  type: "single" | "multiple";
  onImageUpload: (img: string[]) => void;
};

export function ImageUploader({ type, onImageUpload }: ImageUploaderProps) {
  const Icon = type === "single" ? Image : Images;

  return (
    <WithImageUpload
      allowMultipleImages={type === "multiple"}
      onImageUpload={onImageUpload}
    >
      <div className="flex h-full w-full flex-col items-center justify-center space-y-4 px-2 text-muted-foreground">
        <Icon className="max-w-full" size={200} />
        No example image
      </div>
    </WithImageUpload>
  );
}
