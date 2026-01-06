import React from "react";
import { Coffee, SquareStop } from "lucide-react";

interface ActionButtonsProps {
  isPaused: boolean;
  handlePauseResume: () => void;
  handleStop: () => void;
}

export default function ActionButtons({
  isPaused,
  handlePauseResume,
  handleStop,
}: ActionButtonsProps) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 text-sm font-semibold text-white shadow hover:from-yellow-500 hover:to-yellow-600"
        onClick={handlePauseResume}
      >
        <Coffee className="h-4 w-4" />
        {isPaused ? "Break Off" : "Break"}
      </button>
      <button
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-danger to-danger px-4 py-2 text-sm font-semibold text-white shadow hover:from-red-600 hover:to-danger"
        onClick={handleStop}
      >
        <SquareStop className="h-4 w-4" />
        Stop
      </button>
    </div>
  );
}
