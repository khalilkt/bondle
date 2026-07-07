import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActiveGame,
  CellPosition,
  Direction,
  getWordAtPosition,
  ParsedCell,
} from "../types";
import { motion } from "motion/react";
import { cx } from "../utils/cx";

interface GameGridProps {
  cells: ActiveGame["parsedCells"];
  boardSize: ActiveGame["size"];
  cursorPositions: ActiveGame["state"]["cursorPositions"];

  selectedCellPos: CellPosition | null;
  selectedWord: CellPosition[] | null;
  onCellClick: (cell: ParsedCell) => void;

  userId: string | null;
  onMouseMove: (x: number, y: number) => void;
  onKeyPress: (key: string | null) => void;
}

export function GameGrid({
  cells,

  selectedCellPos,
  selectedWord,
  onCellClick,

  boardSize,
  cursorPositions,
  onMouseMove,
  onKeyPress,
  userId,
  ...divProps
}: GameGridProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, "onMouseMove" | "onKeyPress">) {
  const gridRef = useRef<HTMLDivElement>(null);

  const [lastMouseMoveTime, setLastMouseMoveTime] = useState<number>(0);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const time = Date.now();
      if (time - lastMouseMoveTime < 100) return;

      const rect = gridRef.current!.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      onMouseMove(x, y);
      setLastMouseMoveTime(time);
    },
    [lastMouseMoveTime, onMouseMove],
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const { key } = event;
      onKeyPress(key);
    },
    [onKeyPress],
  );

  useEffect(() => {
    addEventListener("keydown", handleKeyPress);

    return () => {
      removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div
      ref={gridRef}
      {...divProps}
      onMouseMove={handleMouseMove}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${boardSize.width}, 1fr)`,
        gridTemplateRows: `repeat(${boardSize.height}, 1fr)`,
        ...divProps.style,
      }}
      className={cx(
        "grid relative h-full p-1 gap-px overflow-hidden w-fit",
        divProps.className,
      )}
    >
      {Object.keys(cursorPositions).length > 0 && (
        <>
          {Object.entries(cursorPositions)
            .filter(([uId, pos]) => uId !== userId)
            .map(([userId, pos]) => (
              <motion.div
                key={userId}
                animate={{
                  left: pos.x * 100 + "%",
                  top: pos.y * 100 + "%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="absolute pointer-events-none border-2 z-10"
              >
                <svg
                  viewBox="0 0 1024 1024"
                  className="w-6 h-6"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <path
                      d="M593.066667 846.933333c-2.133333 0-4.266667 0-8.533334-2.133333s-8.533333-6.4-12.8-10.666667l-78.933333-183.466666-96 89.6c-2.133333 4.266667-6.4 6.4-12.8 6.4-2.133333 0-6.4 0-8.533333-2.133334-6.4-2.133333-12.8-10.666667-12.8-19.2V256c0-8.533333 4.266667-17.066667 12.8-19.2 2.133333-2.133333 6.4-2.133333 8.533333-2.133333 4.266667 0 10.666667 2.133333 14.933333 6.4l341.333334 320c6.4 6.4 8.533333 14.933333 6.4 23.466666-2.133333 8.533333-10.666667 12.8-19.2 14.933334l-134.4 12.8 83.2 181.333333c2.133333 4.266667 2.133333 10.666667 0 17.066667-2.133333 4.266667-6.4 10.666667-10.666667 12.8l-61.866667 27.733333c-4.266667-4.266667-8.533333-4.266667-10.666666-4.266667z"
                      fill="#E0E0E0"
                    ></path>
                    <path
                      d="M384 256l341.333333 320-164.266666 14.933333 96 209.066667-61.866667 27.733333-91.733333-211.2L384 725.333333V256m0-42.666667c-6.4 0-10.666667 2.133333-17.066667 4.266667-14.933333 6.4-25.6 21.333333-25.6 38.4v469.333333c0 17.066667 10.666667 32 25.6 38.4 6.4 4.266667 12.8 4.266667 17.066667 4.266667 10.666667 0 21.333333-4.266667 29.866667-10.666667l72.533333-68.266666 66.133333 155.733333c4.266667 10.666667 12.8 19.2 23.466667 23.466667 4.266667 2.133333 10.666667 2.133333 14.933333 2.133333 6.4 0 10.666667-2.133333 17.066667-4.266667l61.866667-27.733333c10.666667-4.266667 19.2-12.8 23.466666-23.466667 4.266667-10.666667 4.266667-23.466667 0-32l-70.4-153.6 104.533334-8.533333c17.066667-2.133333 32-12.8 36.266666-27.733333 6.4-14.933333 2.133333-34.133333-10.666666-44.8l-341.333334-320c-6.4-10.666667-17.066667-14.933333-27.733333-14.933334z"
                      fill="#212121"
                    ></path>
                  </g>
                </svg>
              </motion.div>
            ))}
        </>
      )}
      {cells.map((cell, index) => {
        const isSelected =
          selectedCellPos &&
          selectedCellPos.row === cell.row &&
          selectedCellPos.col === cell.col;

        let border = "border-[#696969] shadow-[0_4px_0px_rgba(0,0,0,0.3)] ";
        let bg = "bg-white";
        let text = "";

        if (cell?.entry?.valid === true) {
          text = "text-[#0062E1]";
        } else if (cell?.entry?.valid === false) {
          // add a line through the div
          text =
            "relative overflow-hidden before:content-[''] before:absolute before:rounded-full before:w-[calc(150%+4px)] before:border-b-2 before:border-red-500 before:rotate-[-45deg]";
        }

        if (cell.haveSolution) {
          border += "border-r-1 border-b-1";
        }

        if (cell.isBlack) {
          bg = "bg-[#8D99AE]";
          border = "";
          bg = "bg-transparent ";
        }
        if (!cell.haveSolution) {
          bg = "bg-transparent";
        }

        if (
          selectedWord?.some(
            (pos) => pos.row === cell.row && pos.col === cell.col,
          )
        ) {
          bg = "bg-[#99DAFF]";
        }
        if (isSelected) {
          bg = "bg-[#FFD900]";
        }

        return (
          <div
            id={`cell-${cell.row}-${cell.col}`}
            onClick={() => onCellClick(cell)}
            key={`${cell.row}:${cell.col}`}
            className={`relative overflow-hidden aspect-square rounded-lg  flex text-2xl font-medium items-center justify-center ${bg} ${border} font-bold ${text} cursor-pointer select-none`}
          >
            <span className="text-xs">{cell?.entry?.answer}</span>
            {cell.clueNumber && (
              <div className="absolute top-0.5 left-0.5 text-[8px] font-normal text-black">
                {cell.clueNumber}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
