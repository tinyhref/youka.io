import React, { useRef, useState } from "react";
import { Button } from "./ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import lyricsFinder from "@/lib/lyrics";
import * as report from "@/lib/report";
import {
  faCompress,
  faExpand,
  faPaste,
  faSearch,
  faSpinner,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { clipboard } from "electron";
import { Textarea } from "./ui/textarea";

interface ImageInputProps {
  query?: string;
  value?: string;
  onChange: (url: string) => void;
}
export default function InputLyrics({
  value,
  onChange,
  query,
}: ImageInputProps) {
  const { t } = useTranslation();
  const [searchingLyrics, setSearchingLyrics] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleSearchLyrics(e: any) {
    if (!query) return;
    e.preventDefault();
    await fetchLyrics(query);
  }

  async function fetchLyrics(query: string) {
    if (query.trim() !== "") {
      try {
        setSearchingLyrics(true);
        const lyrics = await lyricsFinder(query);
        if (lyrics) {
          onChange(lyrics);
        }
      } catch (e) {
        report.error(e as Error);
      } finally {
        setSearchingLyrics(false);
      }
    }
  }

  function handlePasteLyrics() {
    const text = clipboard.readText();
    if (text) {
      onChange(text);
    }
  }

  function handleClearLyrics() {
    onChange("");
  }

  function handleChange(e: any) {
    const lyrics = e.target.value;
    onChange(lyrics);
  }

  function handleExpand(e: any) {
    e.preventDefault();
    if (!textareaRef.current) return;
    if (expanded) {
      textareaRef.current.style.height = "auto";
    } else {
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
    setExpanded(!expanded);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center">
        {!value && (
          <Button size="sm" onClick={handlePasteLyrics} variant="ghost">
            <FontAwesomeIcon icon={faPaste} />
            {t("Paste")}
          </Button>
        )}
        {query && (
          <Button
            size="sm"
            disabled={searchingLyrics || query === ""}
            onClick={handleSearchLyrics}
            variant="ghost"
          >
            <FontAwesomeIcon icon={faSearch} />
            {t("Search")}
            {searchingLyrics && (
              <FontAwesomeIcon className="ml-2" icon={faSpinner} spin />
            )}
          </Button>
        )}
        {value && (
          <Button size="sm" onClick={handleClearLyrics} variant="ghost">
            <FontAwesomeIcon icon={faX} />
            {t("Clear")}
          </Button>
        )}
        {value && (
          <Button size="sm" onClick={handleExpand} variant="ghost">
            <FontAwesomeIcon icon={expanded ? faCompress : faExpand} />
            {expanded ? t("Collapse") : t("Expand")}
          </Button>
        )}
      </div>
      <Textarea ref={textareaRef} value={value} onChange={handleChange} />
    </div>
  );
}
