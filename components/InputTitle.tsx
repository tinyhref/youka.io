import React, { useEffect, useRef } from "react";
import { Input } from "./ui/input";

interface InputTitleProps {
  value: string;
  onChange: (value: string) => void;
}
export default function InputTitle({ value, onChange }: InputTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: any) {
    const value = e.target.value;
    onChange(value);
  }

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 50);
  }, []);

  return (
    <Input ref={inputRef} type="text" value={value} onChange={handleChange} />
  );
}
