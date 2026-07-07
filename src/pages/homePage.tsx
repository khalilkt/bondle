import { useCallback, useEffect, useRef, useState } from "react";
import { useWS } from "../utils/wsProvider";
import { GameGrid } from "../components/Grid Components";
import { parseActiveGame } from "../types";
import { ThemedButton } from "../components/themed components";

export default function HomePage() {
  const { emit, connected } = useWS();
  const [error, setError] = useState<string | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [demoCurorsorPositions, setDemoCursorPositions] = useState({
    "1": {
      x: 4 / 8,
      y: 3 / 8,
    },
    "2": {
      x: 1 / 8,
      y: 5 / 8,
    },
    "3": {
      x: 6 / 8,
      y: 1 / 8,
    },
  });

  const joinButtonRef = useRef<HTMLButtonElement>(null);

  const randomizeCursorPositions = useCallback(() => {
    console.log("Randomizing cursor positions");
    const newPositions: typeof demoCurorsorPositions = {
      ...demoCurorsorPositions,
    };
    for (const key of Object.keys(demoCurorsorPositions) as Array<
      keyof typeof demoCurorsorPositions
    >) {
      newPositions[key] =
        Math.random() < 0.2
          ? {
              x: Math.random() - 0.1,
              y: Math.random() - 0.1,
            }
          : newPositions[key];
    }
    setDemoCursorPositions(newPositions);
  }, [demoCurorsorPositions]);

  useEffect(() => {
    const interval = setInterval(() => {
      randomizeCursorPositions();
    }, 500);

    return () => clearInterval(interval);
  }, [randomizeCursorPositions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const key = e.key;
      if (key === "Backspace") {
        setGameCode((prev) => (prev ? prev.slice(0, -1) : ""));
      } else if (/^[a-zA-Z0-9]$/.test(key)) {
        setGameCode((prev) => {
          if (prev && prev.length >= 4) {
            return prev;
          }
          return prev ? prev + key : key;
        });
      }
    },
    [gameCode],
  );

  const handleNext = useCallback(() => {
    if (gameCode === null) {
      setGameCode("");
      joinButtonRef.current?.focus();
      return;
    }

    const gameId = "game-" + gameCode.toUpperCase().trim();
    const url = `/game/${gameId}`;
    window.location.href = url;
  }, [gameCode]);

  const handleStartGame = useCallback(async () => {
    if (!connected) return;
    const name = prompt("Enter your name");
    if (!name) {
      return;
    }
    emit(
      "game:0..START_GAME",
      {
        playerName: name,
      },
      (error) => {
        console.error("Failed to start game:", error);
        setError(error.message || "Failed to start game");
      },
      (response: { gameId: string }) => {
        const { gameId } = response;
        window.location.href = `/game/${gameId}`;
      },
    );
  }, [connected, emit]);

  return (
    <div className="flex flex-col gap-2 items-center py-20 justify-between h-screen">
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex flex-col gap-8 items-center">
        <h1 className="text-[80px] text-primary font-bold">BONDLE</h1>
        <div className="w-60 aspect-square">
          <GameGrid
            cells={
              parseActiveGame(
                [
                  "aaaaa-aa",
                  "aaaaa-aa",
                  "aaaaa-aa",
                  "aaa--aaa",
                  "aaaaaa--",
                  "aaaaaaaa",
                  "---aaaaa",
                  "aaa---aa",
                ].map((row, rowIndex) => {
                  return row.split("").map((cell, colIndex) => {
                    return {
                      row: rowIndex,
                      col: colIndex,
                      isBlack: cell === "-",
                      haveSolution: cell !== "-",
                    };
                  });
                }),
                [],
              ).parsedCells
            }
            selectedCellPos={null}
            selectedWord={null}
            onCellClick={() => {}}
            boardSize={{ width: 8, height: 8 }}
            cursorPositions={demoCurorsorPositions}
            onMouseMove={() => {}}
            onKeyPress={() => {}}
            userId={"xxx"}
          />
        </div>
      </div>
      <div className="flex gap-y-2 flex-col items-center">
        <ThemedButton
          onClick={handleStartGame}
          disabled={!connected}
          className="bg-secondary text-white"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter="url(#filter0_d_104_19661)">
              <path
                d="M24.9767 10.912C27.4522 12.2582 27.4522 15.7431 24.9767 17.0893L10.0293 25.2176C7.62337 26.526 4.66663 24.823 4.66663 22.1289V5.87237C4.66663 3.17828 7.62337 1.47534 10.0293 2.78371L24.9767 10.912Z"
                fill="white"
              />
            </g>
            <defs>
              <filter
                id="filter0_d_104_19661"
                x="0"
                y="0"
                width="28"
                height="30"
                filterUnits="userSpaceOnUse"
                color-interpolation-filters="sRGB"
              >
                <feFlood flood-opacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow_104_19661"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow_104_19661"
                  result="shape"
                />
              </filter>
            </defs>
          </svg>
          START GAME
        </ThemedButton>
        <div className="flex gap-2">
          <ThemedButton
            ref={joinButtonRef}
            onClick={() => {
              if (gameCode === null) {
                setGameCode("");
                joinButtonRef.current?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleNext();
              }
              handleKeyDown(e);
            }}
            disabled={!connected}
            className={`focus:scale-130 min-w-27.5 z-10 focus:border-s2 focus:border-primary ${gameCode !== null ? (gameCode.length ? "text-primary bg-lightGray " : "bg-lightGray text-darkGray ") : "bg-tertiary text-white"}`}
          >
            {gameCode === null && (
              <svg
                width="33"
                height="33"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.65614 3.65614C2.75 4.56228 2.75 6.02069 2.75 8.9375C2.75 11.8543 2.75 13.3127 3.65614 14.2189C4.56228 15.125 6.02069 15.125 8.9375 15.125C11.8543 15.125 13.3127 15.125 14.2189 14.2189C15.125 13.3127 15.125 11.8543 15.125 8.9375C15.125 6.02069 15.125 4.56228 14.2189 3.65614C13.3127 2.75 11.8543 2.75 8.9375 2.75C6.02069 2.75 4.56228 2.75 3.65614 3.65614Z"
                  fill="white"
                />
                <path
                  d="M18.7811 18.7811C17.875 19.6873 17.875 21.1457 17.875 24.0625C17.875 26.9793 17.875 28.4377 18.7811 29.3439C19.6873 30.25 21.1457 30.25 24.0625 30.25C26.9793 30.25 28.4377 30.25 29.3439 29.3439C30.25 28.4377 30.25 26.9793 30.25 24.0625C30.25 21.1457 30.25 19.6873 29.3439 18.7811C28.4377 17.875 26.9793 17.875 24.0625 17.875C21.1457 17.875 19.6873 17.875 18.7811 18.7811Z"
                  fill="white"
                />
                <path
                  d="M2.75 24.0625C2.75 21.1457 2.75 19.6873 3.65614 18.7811C4.56228 17.875 6.02069 17.875 8.9375 17.875C11.8543 17.875 13.3127 17.875 14.2189 18.7811C15.125 19.6873 15.125 21.1457 15.125 24.0625C15.125 26.9793 15.125 28.4377 14.2189 29.3439C13.3127 30.25 11.8543 30.25 8.9375 30.25C6.02069 30.25 4.56228 30.25 3.65614 29.3439C2.75 28.4377 2.75 26.9793 2.75 24.0625Z"
                  fill="white"
                />
                <path
                  d="M18.7811 3.65614C17.875 4.56228 17.875 6.02069 17.875 8.9375C17.875 11.8543 17.875 13.3127 18.7811 14.2189C19.6873 15.125 21.1457 15.125 24.0625 15.125C26.9793 15.125 28.4377 15.125 29.3439 14.2189C30.25 13.3127 30.25 11.8543 30.25 8.9375C30.25 6.02069 30.25 4.56228 29.3439 3.65614C28.4377 2.75 26.9793 2.75 24.0625 2.75C21.1457 2.75 19.6873 2.75 18.7811 3.65614Z"
                  fill="white"
                />
              </svg>
            )}
            {gameCode === null
              ? "JOIN GAME"
              : gameCode.length
                ? gameCode.toUpperCase()
                : "AA11"}
          </ThemedButton>
          {gameCode !== null && (
            <ThemedButton
              onClick={handleNext}
              className="bg-lightGray text-darkGray"
            >
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="w-6 h-6 rotate-90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_93_28500)">
                  <path
                    d="M29.1663 50V45.8333H37.4997V37.5H45.833V87.5H54.1663V37.5H62.4997V45.8333H70.833V50H79.1663V37.5H70.833V29.1667H62.4997V20.8333H58.333V16.6667H54.1663V12.5H45.833V16.6667H41.6663V20.8333H37.4997V29.1667H29.1663V37.5H20.833V50H29.1663Z"
                    fill="#2F0081"
                    fill-opacity="0.36"
                  />
                  <path
                    d="M29.1663 50V45.8333H37.4997V37.5H45.833V87.5H54.1663V37.5H62.4997V45.8333H70.833V50H79.1663V37.5H70.833V29.1667H62.4997V20.8333H58.333V16.6667H54.1663V12.5H45.833V16.6667H41.6663V20.8333H37.4997V29.1667H29.1663V37.5H20.833V50H29.1663Z"
                    fill="#2F0081"
                    fill-opacity="0.36"
                  />
                  <g clip-path="url(#clip1_93_28500)">
                    <path
                      d="M29.1663 50V45.8333H37.4997V37.5H45.833V87.5H54.1663V37.5H62.4997V45.8333H70.833V50H79.1663V37.5H70.833V29.1667H62.4997V20.8333H58.333V16.6667H54.1663V12.5H45.833V16.6667H41.6663V20.8333H37.4997V29.1667H29.1663V37.5H20.833V50H29.1663Z"
                      fill="#2F0081"
                      fill-opacity="0.36"
                    />
                    <path
                      d="M29.1663 50V45.8333H37.4997V37.5H45.833V87.5H54.1663V37.5H62.4997V45.8333H70.833V50H79.1663V37.5H70.833V29.1667H62.4997V20.8333H58.333V16.6667H54.1663V12.5H45.833V16.6667H41.6663V20.8333H37.4997V29.1667H29.1663V37.5H20.833V50H29.1663Z"
                      fill="#2F0081"
                      fill-opacity="0.36"
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_93_28500">
                    <rect width="100" height="100" fill="white" />
                  </clipPath>
                  <clipPath id="clip1_93_28500">
                    <rect width="100" height="100" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </ThemedButton>
          )}
        </div>
      </div>
    </div>
  );
}
