import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface InputArtistsProps {
  artists: string[];
  onChange: (value: string[]) => void;
}

export default function InputArtists({ artists, onChange }: InputArtistsProps) {
  return (
    <div className="flex flex-col gap-2">
      {artists.map((artist, index) => (
        <div key={index} className="flex gap-2">
          <Input
            key={index}
            value={artist}
            onChange={(e) => {
              const newArtists = [...artists];
              newArtists[index] = e.target.value;
              onChange(newArtists);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(artists.filter((_, i) => i !== index))}
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...artists, ""])}
        className="w-fit"
      >
        <FontAwesomeIcon icon={faPlus} />
      </Button>
    </div>
  );
}
