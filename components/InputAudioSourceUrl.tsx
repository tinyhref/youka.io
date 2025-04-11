import React, { useEffect, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { Button } from "./ui/button";
import { clipboard } from "electron";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaste, faSpinner, faX } from "@fortawesome/free-solid-svg-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useTranslation } from "react-i18next";
import { autocomplete } from "@/lib/autocomplete";
import * as youtube from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { AudioSourceUrl } from "@/schemas";

interface Props {
  value: AudioSourceUrl;
  onChange: (value: AudioSourceUrl) => void;
}

interface AutocompleteItem {
  type: "autocomplete";
  value: string;
}

interface SearchResultItem {
  type: "search";
  value: string;
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  duration: number;
}

export default function InputAudioSourceUrl({ onChange }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<any>();
  const [localValue, setLocalValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<"search" | "autocomplete">("autocomplete");
  const [autocompleteItems, setAutocompleteItems] = useState<
    AutocompleteItem[]
  >([]);
  const [searchItems, setSearchItems] = useState<SearchResultItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState<boolean>(false);

  useEffect(() => {
    if (localValue.trim() === "") {
      setAutocompleteItems([]);
      setSearchItems([]);
      setComboboxOpen(false);
      setMode("autocomplete");
      return;
    }

    const id = youtube.parseYoutubeUrl(localValue);
    if (id) {
      const item = searchItems.find((item) => item.id === id);
      if (item) return;
      fetchById(id);
      return;
    }

    if (mode === "autocomplete") {
      fetchAutocompleteItems(localValue);
    } else if (mode === "search") {
      fetchSearchResults(localValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, mode]);

  function SearchResultItem({ item }: { item: SearchResultItem }) {
    return (
      <div className="flex flex-row items-center h-20 p-2 max-w-full">
        <img className="w-20 mr-2" src={item.thumbnail} alt={item.title} />
        <div className="flex flex-col">
          <div className="text-lg truncate block select-none">{item.title}</div>
          {item.subtitle && (
            <div className="text-sm dark:text-gray-400 truncate block select-none">
              {item.subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  function AutocompleteItem({ item }: { item: AutocompleteItem }) {
    return <div className="px-4 py-2">{item.value}</div>;
  }

  async function fetchById(id: string) {
    const info = await youtube.info(id);
    if (!info) return;
    onChange({
      type: "url",
      url: localValue,
      id: info.id,
      duration: info.duration || 0,
      title: info.title,
      thumbnail: info.image,
    });
  }

  async function fetchAutocompleteItems(q: string) {
    if (!q.trim()) {
      setAutocompleteItems([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    try {
      setLoading(true);
      const items = await autocomplete(q, abortControllerRef.current.signal);
      const qLower = q.toLowerCase();
      const found = items.find((item) => item === qLower);
      const autocompleteItems: AutocompleteItem[] = [];
      items.forEach((item) => {
        autocompleteItems.push({ type: "autocomplete", value: item });
      });
      if (!found) {
        autocompleteItems.unshift({ type: "autocomplete", value: qLower });
      }
      setAutocompleteItems(autocompleteItems);
      setComboboxOpen(true);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSearchResults(q: string) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const searchResult = await youtube.search(
        q,
        abortControllerRef.current.signal
      );
      const items: SearchResultItem[] = [];
      searchResult.items?.forEach((item) => {
        if (item.type === "song") {
          const url = `https://www.youtube.com/watch?v=${item.id}`;
          if (item.duration) {
            const searchItem: SearchResultItem = {
              type: "search",
              value: url,
              id: item.id,
              title: item.title,
              subtitle: item.channel?.name || "",
              thumbnail: item.image,
              duration: item.duration,
            };
            items.push(searchItem);
          }
        }
      });
      setSearchItems(items);
      setComboboxOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAutocomplete(s: string) {
    setAutocompleteItems([]);
    setMode("search");
    setLocalValue(s);
  }

  function handleSelectSearch(s: string) {
    setLocalValue(s);
    const item = searchItems.find((item) => item.value === s);
    if (item) {
      onChange({
        type: "url",
        url: item.value,
        id: item.id,
        duration: item.duration,
        title: item.title,
        thumbnail: item.thumbnail,
      });
    }
    setMode("autocomplete");
  }

  function handleSelect(s: string) {
    if (mode === "autocomplete") {
      handleSelectAutocomplete(s);
    } else if (mode === "search") {
      handleSelectSearch(s);
    }
  }

  function handleChange(e: any) {
    const s = e.target.value;
    setLocalValue(s);
    setMode("autocomplete");
  }

  function handlePaste() {
    const text = clipboard.readText();
    if (text) {
      setLocalValue(text);
    }
  }

  function handleClear() {
    setLocalValue("");
    setMode("autocomplete");
    inputRef.current.focus();
  }

  return (
    <Combobox as="div" className="relative w-full" onChange={handleSelect}>
      <div className="flex relative h-10 w-full">
        <Combobox.Input
          data-hj-allow
          className="flex-grow rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          value={localValue}
          onChange={handleChange}
          ref={inputRef}
          placeholder={t("Paste a URL or start typing to search")}
        />
        <div className="absolute right-0 flex flex-row items-center">
          {!localValue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" onClick={handlePaste}>
                  <FontAwesomeIcon icon={faPaste} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("Paste")}</TooltipContent>
            </Tooltip>
          )}
          {loading && <FontAwesomeIcon icon={faSpinner} spin />}
          {localValue && (
            <Button variant="ghost" onClick={handleClear}>
              <FontAwesomeIcon icon={faX} size="xs" />
            </Button>
          )}
        </div>
      </div>
      {comboboxOpen && mode === "search" && searchItems.length > 0 && (
        <Combobox.Options
          static
          className="absolute z-10 mt-1 max-h-[40vh] w-full max-w-full overflow-y-auto overflow-x-hidden rounded-md bg-background py-1 text-base ring-1 ring-border ring-opacity-5 focus:outline-none sm:text-sm"
        >
          {searchItems.map((item) => (
            <Combobox.Option
              key={item.value}
              value={item.value}
              className={({ active }) =>
                cn("cursor-default select-none", active ? "bg-accent" : "")
              }
            >
              <SearchResultItem item={item} />
            </Combobox.Option>
          ))}
        </Combobox.Options>
      )}
      {comboboxOpen && mode === "autocomplete" && autocompleteItems.length > 0 && (
        <Combobox.Options
          static
          className="absolute z-10 mt-1 max-h-[40vh] w-full max-w-full overflow-y-auto overflow-x-hidden rounded-md bg-background py-1 text-base ring-1 ring-border ring-opacity-5 focus:outline-none sm:text-sm"
        >
          {autocompleteItems.map((item) => (
            <Combobox.Option
              key={item.value}
              value={item.value}
              className={({ active }) =>
                cn("cursor-default select-none", active ? "bg-accent" : "")
              }
            >
              <AutocompleteItem item={item} />
            </Combobox.Option>
          ))}
        </Combobox.Options>
      )}
    </Combobox>
  );
}
