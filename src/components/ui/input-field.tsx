import React, { ChangeEvent, InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  labelClassName?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

function InputField({
  label,
  id,
  name,
  className,
  labelClassName,
  onChange,
  accept = ".jpg,.jpeg,.png,.gif",
  multiple,
  ...rest
}: InputFieldProps) {
  return (
    <div>
      {label && (
        <Label htmlFor={id} className={`text-sm ${labelClassName || ""}`}>
          {label}
        </Label>
      )}
      <Input
        id={id}
        name={name}
        type="file"
        onChange={onChange}
        className={`max-w-[400px] ${className || ""}`}
        accept={accept}
        multiple={multiple}
        {...rest}
      />
    </div>
  );
}

export default InputField;
