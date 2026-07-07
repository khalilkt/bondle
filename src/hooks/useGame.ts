import { use, useEffect, useState } from "react";
import { useWS, WSError } from "../utils/wsProvider";
import { ActiveGame, parseActiveGame, RawActiveGame } from "../types";

interface GameUpdateEvent {
  gameId: string;
  game: RawActiveGame;
}

interface GameError {
  message: string;
  code?: string;
  details?: any;
}

export function useGame(gameId: string) {
  const { addEventListener, removeEventListener, emit, connected } = useWS();
  const [game, setGame] = useState<ActiveGame | GameError | null>(null);

  const gameActions = {
    play: (
      letter: string | null,
      row: number,
      col: number,
      onSuccess?: (response: any) => void,
      onError?: (error: WSError) => void,
    ) => {
      sendGameEvent("PLAY", {
        data: { move: "PLAY", letter, row, col },
        onError: (error) => {
          console.error("Failed to play move:", error);
          if (onError) onError(error);
        },
        onSuccess,
      });
    },
    cursorMove: (x: number, y: number) => {
      sendGameEvent("CURSOR_MOVE", {
        data: { move: "CURSOR_MOVE", x, y },
      });
    },
    validate: () => {
      sendGameEvent("PLAY", {
        data: { move: "VALIDATE" },
        onError: (error) => {
          console.error("Failed to validate:", error);
          alert(error.message || "Failed to validate");
        },
        onSuccess: (response) => {
          console.log("Successfully validated:", response);
        },
      });
    },

    startGame: (puzzleId: string) => {
      sendGameEvent("PLAY", {
        data: { move: "START_GAME", puzzleId },
        onSuccess: (response) => {
          console.log("Successfully started game:", response);
        },
        onError: (error) => {
          console.error("Failed to start game:", error);
          alert(error.message || "Failed to start game");
        },
      });
    },
  };

  useEffect(() => {
    if (!connected) return;

    const handleGameUpdate = (data: Map<string, unknown>) => {
      console.log("Received game update:", data);
      (data as unknown as GameUpdateEvent).gameId === gameId;
      const game = (data as unknown as GameUpdateEvent).game;
      setGame({
        ...game,
        ...(game.puzzle
          ? parseActiveGame(game.puzzle.grid, game.state.entries)
          : {
              parsedCells: [],
              size: { width: 0, height: 0 },
            }),
      });
    };

    addEventListener(`game:${gameId}..UPDATE`, handleGameUpdate);

    return () => {
      removeEventListener(`game:${gameId}..UPDATE`, handleGameUpdate);
    };
  }, [gameId, connected]);

  function sendGameEvent(
    event: string,
    {
      data,
      onError,
      onSuccess,
    }: {
      data?: any;
      onError?: (error: WSError) => void;
      onSuccess?: (response: any) => void;
    },
  ) {
    const eventName = `game:${gameId}..${event}`;
    emit(eventName, data ?? {}, onError, onSuccess);
  }

  function joinGameRoom() {
    console.log("Joining game room:", gameId);
    sendGameEvent("JOIN_ROOM", {
      onError: (error) => {
        console.error("Failed to join game room:", error);
      },
      onSuccess: (response) => {
        console.log("Successfully joined game room:", response);
      },
    });
  }
  function leaveGameRoom() {
    sendGameEvent("LEAVE_ROOM", {
      onError: (error) => {
        console.error("Failed to leave game room:", error);
      },
    });
  }

  function joinGame(
    playerName: string | null,
    onSuccess?: (response: any) => void,
    onError?: (error: WSError) => void,
  ) {
    sendGameEvent("JOIN_GAME", {
      data: { playerName },
      onError: (error) => {
        if (error.code !== "NEED_PLAYER_NAME") {
          setGame(error);
        }
        if (onError) onError(error);
      },
      onSuccess,
    });
  }

  return {
    game,
    gameActions,
    joinGame,
    joinGameRoom,
    leaveGameRoom,
  };
}
