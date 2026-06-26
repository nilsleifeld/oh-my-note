import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

export type FeedJumpController = {
  ensureDayVisible: (day: string) => Promise<void>;
};

type FeedJumpContextValue = {
  registerFeedController: (controller: FeedJumpController | null) => void;
  getFeedController: () => FeedJumpController | null;
};

const FeedJumpContext = createContext<FeedJumpContextValue | null>(null);

export function FeedJumpProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<FeedJumpController | null>(null);

  const registerFeedController = useCallback(
    (controller: FeedJumpController | null) => {
      controllerRef.current = controller;
    },
    [],
  );

  const getFeedController = useCallback(() => controllerRef.current, []);

  return (
    <FeedJumpContext.Provider
      value={{ registerFeedController, getFeedController }}
    >
      {children}
    </FeedJumpContext.Provider>
  );
}

export function useFeedJumpRegistration(): FeedJumpContextValue {
  const value = useContext(FeedJumpContext);
  if (!value) {
    throw new Error(
      "useFeedJumpRegistration must be used within FeedJumpProvider",
    );
  }
  return value;
}

export function useFeedJump(): FeedJumpContextValue {
  return useFeedJumpRegistration();
}
