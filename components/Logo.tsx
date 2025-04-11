import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo192.png";
import { cn } from "@/lib/utils";

interface Props {
  showText?: boolean;
  unclickable?: boolean;
}
export function Logo({ showText, unclickable }: Props) {
  const navigate = useNavigate();

  function handleClick() {
    if (unclickable) return;
    navigate("/home");
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center pr-3",
        unclickable ? "" : "cursor-pointer"
      )}
      onClick={handleClick}
    >
      <div className="flex flex-row items-center">
        <img
          src={logo}
          alt="youka"
          className="h-[40px] w-[40px] min-w-[40px] min-h-[40px]"
        />
        {showText && (
          <div className="flex flex-col items-center ml-2">
            <div className="text-black dark:text-white text-2xl font-bold">
              Youka
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
