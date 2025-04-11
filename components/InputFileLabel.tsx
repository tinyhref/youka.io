import rollbar from "@/lib/rollbar";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

interface InputLabel extends InputHTMLAttributes<HTMLInputElement> {
  filepath?: string;
  onChangePromise: (file: File) => Promise<void>;
}

export default function InputFileLabel({
  filepath,
  onChangePromise,
  ...props
}: InputLabel) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      setError(null);
      await onChangePromise(file);
    } catch (error) {
      rollbar.error("Error processing file", { error, file });
      setError("Error processing file");
    } finally {
      setLoading(false);
    }
  }

  function normalizeFilepath(filepath: string) {
    if (filepath.startsWith("file://")) {
      return filepath.slice(7);
    }
    return filepath;
  }

  return (
    <div className="flex flex-col">
      <input
        type="file"
        onChange={handleChange}
        {...props}
        ref={inputRef}
        className="hidden"
      />
      <div
        onClick={handleClick}
        className="flex flex-row items-center border rounded-md cursor-pointer text-sm"
      >
        <div className="text-sm bg-muted rounded-l-md px-4 py-2 shrink-0">
          {t("Choose File")}
          {loading && (
            <FontAwesomeIcon className="ml-2" icon={faSpinner} spin />
          )}
        </div>
        <div className="px-2 text-sm max-w-[340px] truncate overflow-hidden">
          {filepath ? normalizeFilepath(filepath) : t("No file chosen")}
        </div>
      </div>
      {error && <div className="text-sm my-2 text-red-500">{error}</div>}
    </div>
  );
}
