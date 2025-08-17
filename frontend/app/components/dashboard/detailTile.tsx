import type React from "react";
import {Detail} from "@/app/types/Detail";

export default function DetailTile({ label, value, icon: Icon }: Detail) {
    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 shadow-sm h-full flex flex-col">
        <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs sm:text-sm w-full">
        <Icon className="h-4 w-4 text-[#56FF0A]" />
            <span>{label}</span>
            </div>
            <div className="mt-2 font-mono text-neutral-200 text-xs sm:text-sm break-words leading-snug flex-grow flex items-center justify-center text-center">
        {value}
        </div>
        </div>
)
}