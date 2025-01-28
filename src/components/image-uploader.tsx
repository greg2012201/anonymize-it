import { fileUpload } from "@/lib/utils";
import InputField from "./ui/input-field";

type Props = {
  onImageUpload: (uploadedImages: string[]) => void;
  id: string;
  label: string;
  allowMultipleFiles?: boolean;
};

function ImageUploader({
  onImageUpload,
  id,
  label,
  allowMultipleFiles = false,
}: Props) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) =>
    await fileUpload(e, onImageUpload);

  return (
    <div className="flex w-full max-w-[800px] flex-col items-center gap-1.5">
      <InputField
        multiple={allowMultipleFiles}
        onChange={handleFileUpload}
        name="file"
        type="file"
        id={id}
        label={label}
      />
    </div>
  );
}

export default ImageUploader;
