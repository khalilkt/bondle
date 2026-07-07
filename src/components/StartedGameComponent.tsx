import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActiveGame,
  CellPosition,
  Direction,
  getWordAtPosition,
  ParsedCell,
} from "../types";
import { useGame } from "../hooks/useGame";

import { useWS } from "../utils/wsProvider";
import { GameGrid } from "./Grid Components";
import { ThemedButton } from "./themed components";
import { CluesComponent } from "./Clues Components";
import { time } from "console";

export function StartedGameState({
  gameId,
  game,
  gameActions,
}: {
  gameId: string;
  game: ActiveGame;
  gameActions: ReturnType<typeof useGame>["gameActions"];
}) {
  const { userId } = useWS();

  const [selectedCellPos, setSelectedCellPos] = useState<CellPosition | null>(
    null,
  );
  const [selectDirection, setSelectDirection] = useState<Direction>("across");

  const selectedCell = useMemo(() => {
    if (!selectedCellPos) return null;
    return game.parsedCells.find(
      (cell) =>
        cell.row === selectedCellPos!.row && cell.col === selectedCellPos!.col,
    );
  }, [selectedCellPos, game.parsedCells]);

  const selectedWord = useMemo(() => {
    if (!selectedCell) return null;
    const word = getWordAtPosition({
      cells: game.parsedCells,
      position: selectedCell,
      direction: selectDirection,
    });

    return word;
  }, [selectedCell, selectDirection, setSelectDirection]);

  useEffect(() => {
    if (!selectedWord || selectedWord.length < 2) {
      setSelectDirection((prev) => (prev === "across" ? "down" : "across"));
    }
  }, [selectedWord]);

  const selectedClueId = useMemo(() => {
    if (!selectedWord) return null;
    const firstCell = game.parsedCells.find(
      (cell) =>
        cell.row === selectedWord[0].row && cell.col === selectedWord[0].col,
    );
    if (!firstCell) return null;
    const clue = game.puzzle?.clues.find(
      (c) =>
        c.index === firstCell.clueNumber && c.direction === selectDirection,
    );
    return clue?.id ?? null;
  }, [selectedWord, selectDirection, game.parsedCells, game.puzzle?.clues]);

  const handleCellClick = useCallback(
    (cell: ParsedCell) => {
      if (cell.haveSolution === false) return;
      if (!cell) return;
      if (cell.isBlack) return;

      if (
        selectedCellPos?.row === cell.row &&
        selectedCellPos?.col === cell.col
      ) {
        setSelectDirection((prev) => (prev === "across" ? "down" : "across"));
      } else {
        setSelectedCellPos({ row: cell.row, col: cell.col });
      }
    },
    [selectedCellPos, selectDirection],
  );

  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      gameActions.cursorMove(x, y);
    },
    [gameActions],
  );

  const play = useCallback(
    (key: string | null, row: number, col: number) => {
      gameActions.play(key, row, col, undefined, (error) => {
        console.error("Failed to play move:", error);
      });
    },
    [gameActions],
  );

  const handleKeyPress = useCallback(
    (key: string | null) => {
      if (!selectedCell) return;
      if (!key) return;
      const isBackspace = key === "Backspace";
      if (!isBackspace && !key.match(/^[a-zA-Z]$/)) {
        return;
      }
      if (key.length === 1) {
        play(key, selectedCell.row, selectedCell.col);
      } else if (isBackspace) {
        play(null, selectedCell.row, selectedCell.col);
      }
      const indexInWord = selectedWord?.findIndex(
        (pos) => pos.row === selectedCell.row && pos.col === selectedCell.col,
      );
      if (indexInWord !== undefined && indexInWord !== -1) {
        const nextIndex = indexInWord + (!isBackspace ? 1 : -1);
        if (nextIndex < (selectedWord?.length || 0) && nextIndex >= 0) {
          const nextPos = selectedWord![nextIndex];
          setSelectedCellPos(nextPos);
        } else {
          // setSelectedCell(null);
        }
      }
    },
    [selectedCell, selectedWord, play],
  );

  const handleClueClick = useCallback((clueId: string) => {
    const clue = game.puzzle?.clues.find((c) => c.id === clueId);
    if (!clue) return;
    const cell = game.parsedCells.find((c) => c.clueNumber === clue.index);
    if (!cell) return;
    setSelectedCellPos({ row: cell.row, col: cell.col });
    setSelectDirection(clue.direction);
  }, []);

  return (
    <ThemedButton
      clickable={false}
      className="w-full flex bg-bg-div gap-x-2 h-[90vh] items-center justify-between"
    >
      <div className="flex flex-col h-full w-fit">
        <GameGrid
          cells={game.parsedCells}
          boardSize={game.size}
          cursorPositions={game.state.cursorPositions}
          onMouseMove={handleMouseMove}
          userId={userId}
          className=""
          selectedCellPos={selectedCellPos}
          selectedWord={selectedWord}
          onCellClick={handleCellClick}
          onKeyPress={handleKeyPress}
        />
        <button
          onClick={() => {
            gameActions.validate();
          }}
          className="active:scale-95 cursor-pointer"
        >
          validate
        </button>
      </div>
      <div className="flex flex-col gap-x-2">
        {game.players.map((player) => {
          const isOnline = game.onlinePlayers.includes(player.userId);
          return (
            <div
              className={`bg-[#FF6F6F] font-bold text-white rounded-full w-10 h-10 flex items-center justify-center ${player.userId === userId ? "border-2 border-green-500" : ""} ${isOnline ? "opacity-100" : "opacity-20"}`}
              key={player.userId}
            >
              {player.name.at(0)?.toUpperCase() || "?"}
            </div>
          );
        })}
      </div>
      <div className="max-w-180 gap-x-2 h-full">
        <CluesComponent
          clues={game.puzzle?.clues ?? []}
          onClueClick={handleClueClick}
          selectedClueId={selectedClueId}
        />
      </div>
    </ThemedButton>
  );
}
