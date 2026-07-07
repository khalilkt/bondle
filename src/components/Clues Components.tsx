import { Clue, Direction } from "../types";
import { ThemedButton } from "./themed components";

function CluesList({
  clues,

  onClueClick,
  selectedClueId,
}: {
  clues: Clue[];
  onClueClick: (clueId: string) => void;
  selectedClueId: string | null;
}) {
  return (
    <ul className="flex flex-col gap-y-px text-start overflow-y-auto h-full w-fit">
      {clues.map((clue) => {
        const isSelected = clue.id === selectedClueId;
        return (
          <div
            key={clue.id}
            className={`font-roboto px-2 py-1 rounded-md text-sm ${isSelected ? "bg-blue-500 text-white" : ""}`}
            onClick={() => onClueClick(clue.id)}
          >
            {clue.index}. {clue.clue}
          </div>
        );
      })}
    </ul>
  );
}

export function CluesComponent({
  clues,
  onClueClick,
  selectedClueId,
}: {
  clues: Clue[];
  onClueClick: (clueId: string) => void;
  selectedClueId: string | null;
}) {
  return (
    <ThemedButton
      className={
        " flex items-start gap-x-2 overflow-y-auto h-full overflow-clip bg-white rounded-xl w-fit "
      }
      clickable={false}
    >
      {["across", "down"].map((direction) => (
        <div className="flex flex-col items-start mt-4 gap-y-2 w-fit h-full">
          <div className="font-bold text-sm">
            {direction.charAt(0).toUpperCase() + direction.slice(1)}
          </div>
          <CluesList
            clues={clues.filter((clue) => clue.direction === direction)}
            onClueClick={onClueClick}
            selectedClueId={selectedClueId}
          />
        </div>
      ))}
    </ThemedButton>
  );
}
