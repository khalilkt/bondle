import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "../hooks/useGame";
import { BACKEND_URL, useWS, WSError } from "../utils/wsProvider";
import {
  ActiveGame,
  CrosswordPuzzle,
  SolvedCrosswordPuzzle,
  ThemeInterface,
} from "../types";
import { StartedGameState } from "../components/StartedGameComponent";
import { ThemedButton } from "../components/themed components";

import player1Icon from "../assets/players/1.png";
import player2Icon from "../assets/players/2.png";
import player3Icon from "../assets/players/3.png";
import { fetchThemes, getPuzzleList } from "./adminPage";

const PLAYER_ICONS = [player1Icon, player2Icon, player3Icon];

export default function GamePage() {
  const { gameId } = useParams();
  const { game, gameActions, joinGame, joinGameRoom, leaveGameRoom } = useGame(
    gameId!,
  );
  const { connected } = useWS();

  useEffect(() => {
    if (!connected) return;
    console.log("Attempting to join game:", gameId);
    joinGame(
      null,
      () => {
        console.log("Successfully joined game:", gameId);
        joinGameRoom();
      },
      (error) => {
        console.error("Failed to join game:", error);
        if (error.code === "NEED_PLAYER_NAME") {
          const name = prompt("Enter your name to join the game:");
          if (name) {
            joinGame(name, (response) => {
              console.log(
                "Successfully joined game after asking the player name:",
                response,
              );
              joinGameRoom();
            });
          }
        }
      },
    );
  }, [connected]);

  const state = useMemo(() => {
    if (!game) return "loading";
    if ("message" in game) return "error";
    if ("players" in game) {
      return game.status;
    }
  }, [game]);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="mx-10 w-full">
        {state === "loading" && (
          <div className="mb-4 flex flex-col">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        )}
        {state === "error" && (
          <div className="mb-4 flex flex-col gap-y-4">
            <h1 className="text-2xl font-bold">Error</h1>
            <p className="text-white">{(game as WSError).message}</p>
          </div>
        )}
        {state === "started" && (
          <StartedGameState
            gameId={gameId!}
            game={game as ActiveGame}
            gameActions={gameActions}
          />
        )}
        {state === "lobby" && (
          <LobbyGameState
            gameId={gameId!}
            game={game as ActiveGame}
            gameActions={gameActions}
          />
        )}
        {(state === "won" || state === "lost") && (
          <div className="mb-4 flex flex-col">
            <h1 className="text-2xl font-bold">Game Finished</h1>
            <p className="text-gray-500">
              {state === "won" ? "You won!" : "You lost!"}
            </p>
          </div>
        )}

        {/* {game && (
          <div className="mb-4 flex flex-col border p-2 mt-20">
            <pre className="text-xs">
              {"puzzle" in game
                ? JSON.stringify(
                    {
                      ...game,
                      puzzle: { ...game.puzzle, grid: game.puzzle.grid.length },
                    },
                    null,
                    2,
                  )
                : JSON.stringify(game, null, 2)}
            </pre>
          </div>
        )} */}
      </div>
    </div>
  );
}

export function LobbyGameState({
  gameId,
  game,
  gameActions,
}: {
  gameId: string;
  game: ActiveGame;
  gameActions: ReturnType<typeof useGame>["gameActions"];
}) {
  const { userId } = useWS();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isAdmin = useMemo(() => {
    return game.players[0]?.userId === userId;
  }, [game.players, userId]);
  const [step, setStep] = useState<"theme" | "players">(
    isAdmin ? "theme" : "players",
  );

  const [themes, setThemes] = useState<ThemeInterface[] | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [puzzleList, setPuzzleList] = useState<SolvedCrosswordPuzzle[] | null>(
    null,
  );
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes().then((themes) => setThemes(themes));
  }, []);

  useEffect(() => {
    setPuzzleList(null);
    setSelectedPuzzleId(null);
    getPuzzleList(selectedThemeId ?? undefined)
      .then((puzzles) => {
        setPuzzleList(puzzles);
      })
      .catch((error) => {
        console.error("Error fetching puzzle list:", error);
      });
  }, [selectedThemeId]);

  useEffect(() => {
    let top;
    if (step === "players") {
      top = window.innerHeight * (0.7 + 0.15);
    } else if (step === "theme") {
      top = window.innerHeight * 0.15;
    }
    containerRef.current?.scrollTo({
      top,
      behavior: "smooth",
    });
  }, [step]);

  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <section
      ref={containerRef}
      className="h-screen overflow-hidden scrollbar-none "
    >
      <div className="h-[30vh]"></div>
      <div
        onClick={() => {
          if (isAdmin) {
            setStep("theme");
          }
        }}
        className={`flex flex-col items-center justify-center h-[70vh] ${step === "theme" ? "opacity-100" : "opacity-20"}`}
      >
        <h1 className="text-4xl text-primary">Choose Theme</h1>
        <div className="flex gap-x-4">
          {themes?.map((theme) => (
            <ThemeComponent
              key={theme.id}
              theme={theme}
              onSelect={() => setSelectedThemeId(theme.id)}
              isSelected={
                selectedThemeId === null ? null : selectedThemeId === theme.id
              }
            />
          ))}
        </div>
        {selectedThemeId && (
          <div className="flex flex-col gap-y-5 mt-10 items-start">
            <h3 className="text-primary text-3xl">
              {selectedDate.toLocaleString("default", { month: "long" })}
            </h3>
            <div className="flex mt-4 items-center justify-center gap-x-4">
              <ThemedButton
                onClick={() => {
                  setSelectedDate((prevDate) => {
                    const nextDate = new Date(prevDate);
                    nextDate.setDate(prevDate.getDate() - 5);
                    return nextDate;
                  });
                }}
                className=" bg-primary text-white"
              >
                {"<-"}
              </ThemedButton>
              <div className="flex gap-x-2 items-center justify-center">
                {[...Array(5)].map((_, index) => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(selectedDate.getDate() + index);
                  const day = newDate.getDate();
                  const isNewMonth =
                    newDate.getMonth() !== selectedDate.getMonth() &&
                    newDate.getDate() === 1;
                  const puzzle = puzzleList?.find(
                    (puzzle) =>
                      puzzle.date === newDate.toISOString().split("T")[0],
                  );
                  const isSelected = selectedPuzzleId === puzzle?.id;

                  return (
                    <button
                      key={day}
                      className={`px-4 py-2 rounded ${isSelected ? "border-3 border-primary" : ""} ${puzzle ? "bg-secondary text-white" : "bg-gray-300 text-gray-500"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (puzzle) {
                          setSelectedPuzzleId(puzzle.id);
                          setStep("players");
                        }
                      }}
                    >
                      {day}
                      {isNewMonth && (
                        <span className="text-xs text-gray-400 ml-1">
                          {MONTHS[newDate.getMonth()].substring(0, 3)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <ThemedButton
                onClick={() => {
                  setStep("players");
                  setSelectedDate((prevDate) => {
                    const nextDate = new Date(prevDate);
                    nextDate.setDate(prevDate.getDate() + 5);
                    return nextDate;
                  });
                }}
                className=" bg-primary text-white"
              >
                {"->"}
              </ThemedButton>
            </div>
          </div>
        )}
      </div>
      <div
        onClick={() => {
          setStep("players");
        }}
        className="flex relative flex-col items-center justify-center h-[70vh] "
      >
        <h1 className="text-4xl text-primary">
          {isAdmin ? "Invite" : ""} players
        </h1>
        <div className="flex gap-x-10 mt-10 items-center justify-center">
          {game.players.map((player, index) => (
            <div key={index} className="flex flex-col items-center gap-y-1 ">
              <img
                src={PLAYER_ICONS[index]}
                alt={player.name}
                className="w-20 h-20"
              />
              <span className="text-xs">{player.name}</span>
            </div>
          ))}
          <h4 className="text-xl text-white animate-pulse tracking-[0.2em]">
            ({gameId.split("-")[1]})
          </h4>
        </div>
        {
          <button
            className={` absolute bottom-0 self-center text-center text-primary mt-10 cursor-pointer  transition-all ${isAdmin ? "text-3xl hover:scale-105 active:scale-95" : "text-xl opacity-50 animate-pulse"}`}
            onClick={() => {
              if (!isAdmin) return;
              if (selectedPuzzleId) {
                gameActions.startGame(selectedPuzzleId);
              } else {
                alert("Please select a puzzle before starting the game.");
              }
            }}
          >
            {isAdmin ? "Start Game" : "Waiting for Admin to Start the Game"}
          </button>
        }
      </div>
      <div className="h-[30vh]"></div>
    </section>
  );
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ThemeComponent({
  theme,
  onSelect,
  isSelected,
}: {
  theme: ThemeInterface;
  onSelect: () => void;
  isSelected: boolean | null;
}) {
  const url = BACKEND_URL + "/images/" + theme.icon;
  return (
    <ThemedButton
      key={theme.id}
      onClick={onSelect}
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      className={`relative w-50 mt-24 ${isSelected === false ? "opacity-20" : "opacity-100"}`}
    >
      <img
        src={url}
        alt={theme.title}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20  h-fit"
      />
      <h3 className="mt-10">{theme.title}</h3>
    </ThemedButton>
  );
}

// [
//             {
//               id: "1",
//               title: "Lol",
//               color: "#4068F5",
//               textColor: "#fff",
//               icon: leagueIcon,
//             },
//             {
//               id: "2",
//               title: "DOFUS",
//               color: "#E3FC80",
//               textColor: "#1A4703",
//               icon: dofusIcon,
//             },
//             {
//               id: "3",
//               title: "FOOTBALL",
//               color: "#EDEDED",
//               textColor: "#344D5B",
//               icon: footballIcon,
//             },
//           ]
