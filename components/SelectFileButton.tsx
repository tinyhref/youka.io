import React, { useRef } from "react";
import { Button, ButtonProps } from "./ui/button";

interface Props extends ButtonProps {
  accept?: string;
  onValueChange: (file: File) => void;
}

export function SelectFileButton({
  onValueChange,
  children,
  accept,
  ...props
}: Props) {
  const inputRef = useRef<any>();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onValueChange(file);
    }
  };

  return (
    <>
      <input
        type="file"
        onChange={handleChange}
        ref={inputRef}
        className="hidden"
        accept={accept}
      />
      <Button onClick={handleClick} {...props}>
        {children}
      </Button>
    </>
  );
}
