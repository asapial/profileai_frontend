"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type MascotMood = "idle" | "peek" | "cover";

type AuthMascotApi = {
  mood: MascotMood;
  setPeeking: (value: boolean) => void;
  setCovering: (value: boolean) => void;
  /**
   * Reports the active password field in one call so the peek → cover
   * sequence cannot get out of order. `visible` is the eye-toggle state.
   */
  setPasswordState: (focused: boolean, visible: boolean) => void;
};

const noop = () => {};

const AuthMascotContext = createContext<AuthMascotApi>({
  mood: "idle",
  setPeeking: noop,
  setCovering: noop,
  setPasswordState: noop,
});

/** How long the companion peeks before covering a masked password. */
const PEEK_MS = 340;

export function AuthMascotProvider({ children }: { children: React.ReactNode }) {
  const [peeking, setPeekingState] = useState(false);
  const [covering, setCoveringState] = useState(false);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCoverTimer = useCallback(() => {
    if (coverTimer.current) {
      clearTimeout(coverTimer.current);
      coverTimer.current = null;
    }
  }, []);

  const setPeeking = useCallback((value: boolean) => setPeekingState(value), []);
  const setCovering = useCallback((value: boolean) => setCoveringState(value), []);

  const setPasswordState = useCallback(
    (focused: boolean, visible: boolean) => {
      clearCoverTimer();

      if (!focused) {
        setPeekingState(false);
        setCoveringState(false);
        return;
      }

      // While the password is visible the companion leans in and peeks.
      if (visible) {
        setPeekingState(true);
        setCoveringState(false);
        return;
      }

      // Masked: take a quick curious look, then cover both eyes and hold.
      setPeekingState(true);
      setCoveringState(false);
      coverTimer.current = setTimeout(() => {
        setCoveringState(true);
        coverTimer.current = null;
      }, PEEK_MS);
    },
    [clearCoverTimer],
  );

  useEffect(() => clearCoverTimer, [clearCoverTimer]);

  const mood: MascotMood = covering ? "cover" : peeking ? "peek" : "idle";
  const value = useMemo(
    () => ({ mood, setPeeking, setCovering, setPasswordState }),
    [mood, setPeeking, setCovering, setPasswordState],
  );

  return (
    <AuthMascotContext.Provider value={value}>
      {children}
    </AuthMascotContext.Provider>
  );
}

/**
 * Lets a form tell the studio mascot what is happening on the password
 * fields. Outside an AuthScene the setters are no-ops.
 */
export function useAuthMascot() {
  return useContext(AuthMascotContext);
}
