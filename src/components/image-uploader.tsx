import { fileUpload } from "@/lib/utils";
import InputField from "./ui/input-field";

type Props = {
    onImageUpload: (uploadedImages: string[]) => void;
    id: string;
    label: string;
    allowMultipleFiles?: boolean;
};

function ImageUploader({ onImageUpload, id, label, allowMultipleFiles = false }: Props) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => fileUpload(e, onImageUpload);

    return (
        <div className="flex flex-col w-full max-w-[800px] items-center gap-1.5">
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
