import { useCallback, useEffect, useMemo, useState } from "react";
import { GameGrid } from "../components/Grid Components";
import {
  Clue,
  CrosswordPuzzle,
  parseActiveGame,
  ParsedCell,
  SolvedCrosswordPuzzle,
  ThemeInterface,
} from "../types";
import { BACKEND_URL } from "../utils/wsProvider";
import { ThemedButton } from "../components/themed components";
import { ThemeComponent } from "./gamePage";

export default function AdminPage() {
  const [state, setState] = useState<
    "puzzleList" | "createPuzzle" | "createTheme"
  >("puzzleList");

  //    ----
  const [puzzleList, setPuzzleList] = useState<SolvedCrosswordPuzzle[] | null>(
    null,
  );

  useEffect(() => {
    if (state === "puzzleList") {
      getPuzzleList()
        .then((puzzles) => {
          setPuzzleList(puzzles);
        })
        .catch((error) => {
          console.error("Error fetching puzzle list:", error);
        });
    }
  }, [state]);

  //    ----
  const [gridRawText, setGridRawText] = useState("");
  const [cluesRawText, setCluesRawText] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<Date>(new Date());

  const grid: CrosswordPuzzle["grid"] = useMemo(() => {
    return gridRawText.split("\n").map((row, rowIndex) => {
      return row.split("").map((cell, colIndex) => {
        return {
          row: rowIndex,
          col: colIndex,
          isBlack: cell === "-",
          haveSolution: cell !== "-",
          solution: cell !== "-" ? cell : null,
        };
      });
    });
  }, [gridRawText]);

  const parsedGame: ReturnType<typeof parseActiveGame> = useMemo(() => {
    return parseActiveGame(
      grid,
      gridRawText
        .split("\n")
        .map((row, rowIndex) => {
          return row.split("").map((cell, colIndex) => {
            if (cell === "-") {
              return null;
            }
            return {
              playerId: "null",
              position: { row: rowIndex, col: colIndex },
              valid: true,
              answer: cell,
            };
          });
        })
        .flat()
        .filter((cell): cell is NonNullable<typeof cell> => cell !== null),
    );
  }, [grid]);

  const submitPuzzle = useCallback(() => {
    const url = BACKEND_URL + "/api/puzzles";
    if (selectedThemeId === null) {
      alert("Please select a theme before submitting the puzzle.");
      return;
    }
    const body = {
      data: {
        grid: grid,
        clues: clues,
        themeId: selectedThemeId,
        date: puzzleDate.toISOString().split("T")[0],
      },
    };
    console.log("Submitting puzzle:", body);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Puzzle submitted successfully:", data);
        alert("Puzzle submitted successfully!");
      })
      .catch((error) => {
        console.error("Error submitting puzzle:", error);
        alert("Error submitting puzzle. Check console for details.");
      });
  }, [grid, cluesRawText, selectedThemeId, puzzleDate]);

  //   --

  const [themes, setThemes] = useState<ThemeInterface[] | null>(null);

  useEffect(() => {
    fetchThemes().then((themes) => setThemes(themes));
  }, []);

  const [themeData, setThemeData] = useState<{
    title: string;
    backgroundColor: string;
    textColor: string;
    icon: string;
  }>({ title: "", backgroundColor: "", textColor: "", icon: "" });

  const clues = useMemo(() => {
    function getCluesFromString(cluesString: string): Clue[] {
      let direction: "across" | "down" = "across";
      const ret: Clue[] = [];
      for (const line of cluesString.split("\n")) {
        if (line.trim() === "---") {
          direction = direction === "across" ? "down" : "across";
          continue;
        }
        const [indexStr, ...clue] = line.trim().split(" ");
        if (!indexStr || clue.length === 0) {
          continue;
        }
        ret.push({
          id: `${indexStr}-${direction}`,
          index: parseInt(indexStr, 10),
          clue: clue.join(" "),
          direction,
        });
      }
      return ret;
    }
    return getCluesFromString(cluesRawText);
  }, [cluesRawText]);

  function submitTheme(): void {
    const url = BACKEND_URL + "/api/themes";

    const body = {
      data: {
        title: themeData.title,
        backgroundColor: themeData.backgroundColor,
        textColor: themeData.textColor,
        icon: themeData.icon,
      },
    };
    console.log("Submitting theme:", body);

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Theme submitted successfully:", data);
        alert("Theme submitted successfully!");
      })
      .catch((error) => {
        console.error("Error submitting theme:", error);
        alert("Error submitting theme. Check console for details.");
      });
  }

  return (
    <div className="min-h-screen p-10 text-primary text-2xl">
      <h1>ADMIN</h1>
      <div className="flex gap-x-4 mt-10">
        {["puzzleList", "createPuzzle", "createTheme"].map((s) => (
          <button
            key={s}
            onClick={() =>
              setState(s as "puzzleList" | "createPuzzle" | "createTheme")
            }
            className={`px-4 text-sm py-2 rounded-lg ${
              state === s ? "bg-primary text-white" : "bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-x-4 mt-10">
        {state === "puzzleList" && (
          <div className="mt-10">
            <h2>Puzzle List</h2>
            {puzzleList ? (
              <ul className="mt-4">
                {puzzleList.map((puzzle, index) => (
                  <li key={index} className="mb-2">
                    <div className="flex gap-x-2">
                      <span className="order-2 text-xs text-black">
                        across :{" "}
                        {
                          puzzle.clues.filter(
                            (clue) => clue.direction === "across",
                          ).length
                        }{" "}
                        | down :{" "}
                        {
                          puzzle.clues.filter(
                            (clue) => clue.direction === "down",
                          ).length
                        }
                      </span>
                      <GameGrid
                        cells={parseActiveGame(puzzle.grid, []).parsedCells}
                        boardSize={{
                          width: puzzle.grid[0].length,
                          height: puzzle.grid.length,
                        }}
                        cursorPositions={{}}
                        userId={null}
                        onMouseMove={function (x: number, y: number): void {}}
                        onKeyPress={() => {}}
                        selectedCellPos={null}
                        selectedWord={null}
                        onCellClick={function (cell: ParsedCell): void {
                          throw new Error("Function not implemented.");
                        }}
                      />
                    </div>
                    <span className="text-sm text-white">
                      {puzzle.themeId} - {puzzle.date}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading puzzles...</p>
            )}
          </div>
        )}
        {state === "createPuzzle" && (
          <div className="mt-10">
            <h2>Create Puzzle</h2>
            <div className="flex flex-row gap-x-4 mt-10">
              {themes?.map((theme) => (
                <h5
                  className={`text-sm font-semibold text-white after:content-[''] after:block after:w-full after:h-1 after:rounded-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform ${selectedThemeId === theme.id ? "after:bg-primary" : "after:bg-gray-300"}`}
                  onClick={() => setSelectedThemeId(theme.id)}
                  key={theme.id}
                >
                  {theme.title}
                </h5>
              ))}
            </div>
            <ThemedButton
              onClick={submitPuzzle}
              className="mt-4 bg-primary text-white"
            >
              Submit Puzzle
            </ThemedButton>
            {selectedThemeId ?? "NO THEME ID SELECTED"}
            <input
              type="date"
              value={puzzleDate.toISOString().split("T")[0]}
              onChange={(e) => setPuzzleDate(new Date(e.target.value))}
              className="mt-4 p-2 border rounded"
            />
            <div className="flex flex-row gap-x-4">
              <textarea
                className="mt-10 p-2 border rounded"
                placeholder="adasd-w"
                value={gridRawText}
                onChange={(e) => setGridRawText(e.target.value)}
              />
              <div className="w-140 bg-red-50 aspect-square">
                {parsedGame.size.width} x {parsedGame.size.height}
                <GameGrid
                  cells={parsedGame.parsedCells}
                  boardSize={parsedGame.size}
                  cursorPositions={{}}
                  userId={null}
                  onMouseMove={function (x: number, y: number): void {}}
                  onKeyPress={() => {}}
                  selectedCellPos={null}
                  selectedWord={null}
                  onCellClick={function (cell: ParsedCell): void {
                    throw new Error("Function not implemented.");
                  }}
                />
              </div>
            </div>
            <div className="flex flex-row gap-x-4">
              <textarea
                className="mt-10 p-2 border rounded"
                placeholder="1 asdasda"
                value={cluesRawText}
                onChange={(e) => setCluesRawText(e.target.value)}
              />
              <div className="w-140 bg-red-50 aspect-square">
                {clues.map((clue) => (
                  <div key={clue.id}>
                    {clue.index} ({clue.direction}): {clue.clue}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {state === "createTheme" && (
          <div className="mt-10 flex-col flex">
            <h2>Create Theme</h2>
            <ThemedButton
              onClick={submitTheme}
              className="mt-4 bg-primary text-white"
            >
              Submit Theme
            </ThemedButton>
            <div className="flex flex-row gap-x-4">
              <div className="flex flex-col gap-x-4">
                <input
                  className="mt-10 p-2 border rounded"
                  placeholder="Title"
                  value={themeData.title}
                  onChange={(e) =>
                    setThemeData({ ...themeData, title: e.target.value })
                  }
                />
                <input
                  className="mt-10 p-2 border rounded"
                  placeholder="Background Color"
                  value={themeData.backgroundColor}
                  onChange={(e) =>
                    setThemeData({
                      ...themeData,
                      backgroundColor: e.target.value,
                    })
                  }
                />
                <input
                  className="mt-10 p-2 border rounded"
                  placeholder="Text Color"
                  value={themeData.textColor}
                  onChange={(e) =>
                    setThemeData({ ...themeData, textColor: e.target.value })
                  }
                />
                <input
                  className="mt-10 p-2 border rounded"
                  placeholder="Icon URL"
                  value={themeData.icon}
                  onChange={(e) =>
                    setThemeData({ ...themeData, icon: e.target.value })
                  }
                />
              </div>
              <ThemeComponent
                theme={{
                  id: "-1",
                  title: themeData.title,
                  backgroundColor: themeData.backgroundColor,
                  textColor: themeData.textColor,
                  icon: themeData.icon,
                }}
                onSelect={function (): void {}}
                isSelected={null}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function fetchThemes(): Promise<ThemeInterface[]> {
  const response = await fetch(BACKEND_URL + "/api/themes");
  const data = await response.json();
  return data.themes;
}
export async function getPuzzleList(
  themeId?: string,
): Promise<SolvedCrosswordPuzzle[]> {
  return fetch(BACKEND_URL + "/api/puzzles?themeId=" + themeId)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      return data.puzzles as SolvedCrosswordPuzzle[];
    });
}
