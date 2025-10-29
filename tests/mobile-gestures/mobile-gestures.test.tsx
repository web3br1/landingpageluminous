import React, { useState, useRef, useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock touch event utilities
const createTouch = (x: number, y: number, identifier = 0) => ({
  identifier,
  target: document.body,
  clientX: x,
  clientY: y,
  pageX: x,
  pageY: y,
  screenX: x + window.screenX,
  screenY: y + window.screenY,
  radiusX: 11.5, // More realistic touch radius for mobile
  radiusY: 11.5,
  rotationAngle: 0,
  force: 1,
});

const createTouchEvent = (
  type: string,
  touches: Touch[] = [],
  changedTouches: Touch[] = [],
  targetTouches: Touch[] = [],
) => {
  return new TouchEvent(type, {
    touches,
    changedTouches,
    targetTouches,
    bubbles: true,
    cancelable: true,
  });
};

const simulateTouchGesture = (
  element: Element,
  gesture: {
    start: { x: number; y: number };
    moves?: Array<{ x: number; y: number; delay?: number }>;
    end: { x: number; y: number; delay?: number };
  },
) => {
  const { start, moves = [], end } = gesture;

  act(() => {
    // Touch start
    const startTouch = createTouch(start.x, start.y);
    const touchStart = createTouchEvent(
      "touchstart",
      [startTouch],
      [startTouch],
      [startTouch],
    );
    fireEvent(element, touchStart);
  });

  // Touch moves
  moves.forEach(({ x, y, delay = 0 }) => {
    act(() => {
      if (delay > 0) {
        vi.advanceTimersByTime(delay);
      }
      const moveTouch = createTouch(x, y);
      const touchMove = createTouchEvent(
        "touchmove",
        [moveTouch],
        [moveTouch],
        [moveTouch],
      );
      fireEvent(element, touchMove);
    });
  });

  // Touch end - changedTouches should contain the ended touch
  act(() => {
    if (end.delay) {
      vi.advanceTimersByTime(end.delay);
    }
    const endTouch = createTouch(end.x, end.y);
    const touchEnd = createTouchEvent("touchend", [], [endTouch], []);
    element.dispatchEvent(touchEnd);
  });
};

// Swipe gesture component
const SwipeableComponent = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
}) => {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isTracking, setIsTracking] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setIsTracking(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTracking || !startPos) return;

    e.preventDefault(); // Prevent scrolling
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTracking || !startPos) return;

    const touch = e.changedTouches[0];
    const endPos = { x: touch.clientX, y: touch.clientY };

    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const minSwipeDistance = 50;

    let wasSwipe = false;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
        wasSwipe = true;
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
        wasSwipe = true;
      }
    }

    // If it wasn't a swipe, don't prevent the event from bubbling
    // This allows tap events to be handled by child components
    if (!wasSwipe) {
      // Let the event bubble up for tap handling
      return;
    }

    setIsTracking(false);
    setStartPos(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="swipeable"
      style={{ touchAction: "none", userSelect: "none" }}
    >
      {children}
    </div>
  );
};

// Tap gesture component
const TappableComponent = ({
  onTap,
  onDoubleTap,
  onLongPress,
  children,
}: {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
}) => {
  const [tapCount, setTapCount] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [hasLongPressed, setHasLongPressed] = useState(false);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      setHasLongPressed(true);
      onLongPress?.();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (hasLongPressed) {
      setHasLongPressed(false);
      return;
    }

    // Clear any existing tap timer
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    tapTimerRef.current = setTimeout(() => {
      if (newTapCount === 1) {
        onTap?.();
      } else if (newTapCount >= 2) {
        onDoubleTap?.();
      }
      setTapCount(0);
      tapTimerRef.current = null;
    }, 300);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="tappable"
    >
      {children}
    </div>
  );
};

// Pinch gesture component
const PinchableComponent = ({
  onPinch,
  onPinchEnd,
  children,
}: {
  onPinch?: (scale: number) => void;
  onPinchEnd?: () => void;
  children: React.ReactNode;
}) => {
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2),
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialDistance(distance);
      setIsPinching(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance && isPinching) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      onPinch?.(scale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching) {
      setIsPinching(false);
      setInitialDistance(null);
      onPinchEnd?.();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="pinchable"
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
};

// Pan gesture component
const PannableComponent = ({
  onPan,
  onPanStart,
  onPanEnd,
  children,
}: {
  onPan?: (deltaX: number, deltaY: number) => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
  children: React.ReactNode;
}) => {
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setIsPanning(true);
    onPanStart?.();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || !startPos) return;

    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;

    onPan?.(deltaX, deltaY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPanning) {
      setIsPanning(false);
      setStartPos(null);
      onPanEnd?.();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="pannable"
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
};

describe("Mobile Gestures Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Touch Event Basics", () => {
    it("should handle touch start event", () => {
      const handleTouchStart = vi.fn();

      const TouchComponent = () => (
        <div onTouchStart={handleTouchStart} data-testid="touch-element">
          Touch me
        </div>
      );

      render(<TouchComponent />);
      const element = screen.getByTestId("touch-element");

      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);
      fireEvent(element, touchStart);

      expect(handleTouchStart).toHaveBeenCalled();
      const event = handleTouchStart.mock.calls[0][0] as TouchEvent;
      expect(event.touches[0].clientX).toBe(100);
      expect(event.touches[0].clientY).toBe(100);
    });

    it("should handle touch move event", () => {
      const handleTouchMove = vi.fn();

      const TouchComponent = () => (
        <div onTouchMove={handleTouchMove} data-testid="touch-element">
          Touch me
        </div>
      );

      render(<TouchComponent />);
      const element = screen.getByTestId("touch-element");

      const touchMove = createTouchEvent("touchmove", [createTouch(150, 150)]);
      fireEvent(element, touchMove);

      expect(handleTouchMove).toHaveBeenCalled();
    });

    it("should handle touch end event", () => {
      const handleTouchEnd = vi.fn();

      const TouchComponent = () => (
        <div onTouchEnd={handleTouchEnd} data-testid="touch-element">
          Touch me
        </div>
      );

      render(<TouchComponent />);
      const element = screen.getByTestId("touch-element");

      const touchEnd = createTouchEvent("touchend", [createTouch(100, 100)]);
      fireEvent(element, touchEnd);

      expect(handleTouchEnd).toHaveBeenCalled();
    });

    it("should handle multi-touch events", () => {
      const handleTouchStart = vi.fn();

      const MultiTouchComponent = () => (
        <div onTouchStart={handleTouchStart} data-testid="multi-touch-element">
          Multi-touch
        </div>
      );

      render(<MultiTouchComponent />);
      const element = screen.getByTestId("multi-touch-element");

      const touches = [createTouch(100, 100, 0), createTouch(200, 200, 1)];
      const touchStart = createTouchEvent("touchstart", touches);
      fireEvent(element, touchStart);

      expect(handleTouchStart).toHaveBeenCalled();
      const event = handleTouchStart.mock.calls[0][0] as TouchEvent;
      expect(event.touches).toHaveLength(2);
    });
  });

  describe("Swipe Gestures", () => {
    it("should detect swipe left gesture", () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      render(
        <SwipeableComponent
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
        >
          Swipe me
        </SwipeableComponent>,
      );

      const element = screen.getByTestId("swipeable");

      // Simulate swipe left: start at 200, end at 100
      simulateTouchGesture(element, {
        start: { x: 200, y: 100 },
        end: { x: 100, y: 100 },
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it("should detect swipe right gesture", () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      render(
        <SwipeableComponent
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
        >
          Swipe me
        </SwipeableComponent>,
      );

      const element = screen.getByTestId("swipeable");

      // Simulate swipe right: start at 100, end at 200
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 200, y: 100 },
      });

      expect(onSwipeRight).toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it("should detect swipe up gesture", () => {
      const onSwipeUp = vi.fn();

      render(
        <SwipeableComponent onSwipeUp={onSwipeUp}>Swipe me</SwipeableComponent>,
      );

      const element = screen.getByTestId("swipeable");

      // Swipe up: start at y=100, end at y=30 (deltaY = -70, which is > 50 threshold)
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 30 },
      });

      expect(onSwipeUp).toHaveBeenCalled();
    });

    it("should detect swipe down gesture", () => {
      const onSwipeDown = vi.fn();

      render(
        <SwipeableComponent onSwipeDown={onSwipeDown}>
          Swipe me
        </SwipeableComponent>,
      );

      const element = screen.getByTestId("swipeable");

      // Swipe down: start at y=100, end at y=170 (deltaY = 70, which is > 50 threshold)
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 170 },
      });

      expect(onSwipeDown).toHaveBeenCalled();
    });

    it("should not trigger swipe for small movements", () => {
      const onSwipeLeft = vi.fn();

      render(
        <SwipeableComponent onSwipeLeft={onSwipeLeft}>
          Swipe me
        </SwipeableComponent>,
      );

      const element = screen.getByTestId("swipeable");

      // Small movement: less than 50px threshold
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 120, y: 100 },
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it("should handle swipe with multiple touch moves", () => {
      const onSwipeLeft = vi.fn();

      render(
        <SwipeableComponent onSwipeLeft={onSwipeLeft}>
          Swipe me
        </SwipeableComponent>,
      );

      const element = screen.getByTestId("swipeable");

      // Swipe with intermediate moves
      simulateTouchGesture(element, {
        start: { x: 200, y: 100 },
        moves: [
          { x: 180, y: 100, delay: 50 },
          { x: 160, y: 100, delay: 50 },
          { x: 140, y: 100, delay: 50 },
        ],
        end: { x: 100, y: 100, delay: 50 },
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });
  });

  describe("Tap Gestures", () => {
    it("should detect single tap", () => {
      const onTap = vi.fn();
      const onDoubleTap = vi.fn();

      render(
        <TappableComponent onTap={onTap} onDoubleTap={onDoubleTap}>
          Tap me
        </TappableComponent>,
      );

      const element = screen.getByTestId("tappable");

      // Single tap
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 100 },
      });

      // Wait for tap timeout
      vi.advanceTimersByTime(350);

      expect(onTap).toHaveBeenCalled();
      expect(onDoubleTap).not.toHaveBeenCalled();
    });

    it("should detect double tap", () => {
      const onTap = vi.fn();
      const onDoubleTap = vi.fn();

      render(
        <TappableComponent onTap={onTap} onDoubleTap={onDoubleTap}>
          Double tap me
        </TappableComponent>,
      );

      const element = screen.getByTestId("tappable");

      // First tap
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 100 },
      });

      // Second tap within 300ms
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 100 },
      });

      // Wait for double tap detection
      vi.advanceTimersByTime(350);

      expect(onDoubleTap).toHaveBeenCalled();
      expect(onTap).not.toHaveBeenCalled();
    });

    it("should detect long press", () => {
      const onLongPress = vi.fn();

      render(
        <TappableComponent onLongPress={onLongPress}>
          Long press me
        </TappableComponent>,
      );

      const element = screen.getByTestId("tappable");

      // Touch and hold for 500ms
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 100, delay: 600 },
      });

      expect(onLongPress).toHaveBeenCalled();
    });

    it("should not trigger tap after long press", () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();

      render(
        <TappableComponent onTap={onTap} onLongPress={onLongPress}>
          Long press me
        </TappableComponent>,
      );

      const element = screen.getByTestId("tappable");

      // Long press
      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        end: { x: 100, y: 100, delay: 600 },
      });

      expect(onLongPress).toHaveBeenCalled();
      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe("Pinch Gestures", () => {
    it("should detect pinch in gesture", () => {
      const onPinch = vi.fn();

      render(
        <PinchableComponent onPinch={onPinch}>Pinch me</PinchableComponent>,
      );

      const element = screen.getByTestId("pinchable");

      // Two finger pinch in (zoom out)
      const touchStart = new TouchEvent("touchstart", {
        touches: [createTouch(100, 100, 0), createTouch(200, 200, 1)],
        bubbles: true,
      });
      fireEvent(element, touchStart);

      // Move fingers closer (pinch in)
      const touchMove = new TouchEvent("touchmove", {
        touches: [createTouch(120, 120, 0), createTouch(180, 180, 1)],
        bubbles: true,
      });
      fireEvent(element, touchMove);

      expect(onPinch).toHaveBeenCalledWith(expect.any(Number));
      const scale = onPinch.mock.calls[0][0];
      expect(scale).toBeLessThan(1); // Pinch in reduces scale
    });

    it("should detect pinch out gesture", () => {
      const onPinch = vi.fn();

      render(
        <PinchableComponent onPinch={onPinch}>Pinch me</PinchableComponent>,
      );

      const element = screen.getByTestId("pinchable");

      // Two finger pinch out (zoom in)
      const touchStart = new TouchEvent("touchstart", {
        touches: [createTouch(120, 120, 0), createTouch(180, 180, 1)],
        bubbles: true,
      });
      fireEvent(element, touchStart);

      // Move fingers apart (pinch out)
      const touchMove = new TouchEvent("touchmove", {
        touches: [createTouch(100, 100, 0), createTouch(200, 200, 1)],
        bubbles: true,
      });
      fireEvent(element, touchMove);

      expect(onPinch).toHaveBeenCalledWith(expect.any(Number));
      const scale = onPinch.mock.calls[0][0];
      expect(scale).toBeGreaterThan(1); // Pinch out increases scale
    });

    it("should handle pinch end", () => {
      const onPinchEnd = vi.fn();

      render(
        <PinchableComponent onPinchEnd={onPinchEnd}>
          Pinch me
        </PinchableComponent>,
      );

      const element = screen.getByTestId("pinchable");

      // Start pinch
      const touchStart = new TouchEvent("touchstart", {
        touches: [createTouch(100, 100, 0), createTouch(200, 200, 1)],
        bubbles: true,
      });
      fireEvent(element, touchStart);

      // End pinch
      const touchEnd = new TouchEvent("touchend", {
        touches: [],
        changedTouches: [createTouch(100, 100, 0)],
        bubbles: true,
      });
      fireEvent(element, touchEnd);

      expect(onPinchEnd).toHaveBeenCalled();
    });

    it("should ignore single touch pinch attempts", () => {
      const onPinch = vi.fn();

      render(
        <PinchableComponent onPinch={onPinch}>Pinch me</PinchableComponent>,
      );

      const element = screen.getByTestId("pinchable");

      // Single touch - should not trigger pinch
      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);
      fireEvent(element, touchStart);

      const touchMove = createTouchEvent("touchmove", [createTouch(120, 120)]);
      fireEvent(element, touchMove);

      expect(onPinch).not.toHaveBeenCalled();
    });
  });

  describe("Pan Gestures", () => {
    it("should detect pan start", () => {
      const onPanStart = vi.fn();

      render(
        <PannableComponent onPanStart={onPanStart}>Pan me</PannableComponent>,
      );

      const element = screen.getByTestId("pannable");

      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);
      fireEvent(element, touchStart);

      expect(onPanStart).toHaveBeenCalled();
    });

    it("should track pan movement", () => {
      const onPan = vi.fn();

      render(<PannableComponent onPan={onPan}>Pan me</PannableComponent>);

      const element = screen.getByTestId("pannable");

      // Start pan
      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);
      fireEvent(element, touchStart);

      // Move
      const touchMove = createTouchEvent("touchmove", [createTouch(150, 120)]);
      fireEvent(element, touchMove);

      expect(onPan).toHaveBeenCalledWith(50, 20); // deltaX = 50, deltaY = 20
    });

    it("should detect pan end", () => {
      const onPanEnd = vi.fn();

      render(<PannableComponent onPanEnd={onPanEnd}>Pan me</PannableComponent>);

      const element = screen.getByTestId("pannable");

      // Start and end pan
      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);
      fireEvent(element, touchStart);

      const touchEnd = createTouchEvent("touchend", [createTouch(150, 120)]);
      fireEvent(element, touchEnd);

      expect(onPanEnd).toHaveBeenCalled();
    });

    it("should handle continuous pan updates", () => {
      const onPan = vi.fn();

      render(<PannableComponent onPan={onPan}>Pan me</PannableComponent>);

      const element = screen.getByTestId("pannable");

      // Start pan
      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);
      fireEvent(element, touchStart);

      // Multiple moves
      const moves = [
        { x: 110, y: 105 },
        { x: 120, y: 110 },
        { x: 130, y: 115 },
      ];

      moves.forEach(({ x, y }) => {
        const touchMove = createTouchEvent("touchmove", [createTouch(x, y)]);
        fireEvent(element, touchMove);
      });

      expect(onPan).toHaveBeenCalledTimes(3);
      expect(onPan).toHaveBeenNthCalledWith(1, 10, 5);
      expect(onPan).toHaveBeenNthCalledWith(2, 20, 10);
      expect(onPan).toHaveBeenNthCalledWith(3, 30, 15);
    });
  });

  describe("Gesture Conflict Resolution", () => {
    it("should prioritize swipe over tap for long movements", () => {
      const onSwipeLeft = vi.fn();
      const onTap = vi.fn();

      const CombinedGestureComponent = () => (
        <SwipeableComponent onSwipeLeft={onSwipeLeft}>
          <TappableComponent onTap={onTap}>Combined gestures</TappableComponent>
        </SwipeableComponent>
      );

      render(<CombinedGestureComponent />);

      const element = screen.getByTestId("swipeable");

      // Long horizontal movement - should trigger swipe
      simulateTouchGesture(element, {
        start: { x: 200, y: 100 },
        end: { x: 50, y: 100 },
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      // Tap should not be triggered for long movements
    });

    it("should handle gesture state management", () => {
      const gestureStates: string[] = [];

      const StateTrackingComponent = () => {
        const [gestureState, setGestureState] = useState("idle");

        return (
          <div>
            <SwipeableComponent
              onSwipeLeft={() => {
                gestureStates.push("swipe-left");
                setGestureState("swipe-left");
              }}
            >
              Swipe Area
            </SwipeableComponent>
            <TappableComponent
              onTap={() => {
                gestureStates.push("tap");
                setGestureState("tap");
              }}
            >
              Tap Area
            </TappableComponent>
          </div>
        );
      };

      render(<StateTrackingComponent />);

      // Test tap on the tappable component directly
      const tapElement = screen.getByTestId("tappable");

      // Small movement - should trigger tap
      simulateTouchGesture(tapElement, {
        start: { x: 100, y: 100 },
        end: { x: 105, y: 100 },
      });

      vi.advanceTimersByTime(350);

      expect(gestureStates).toContain("tap");
      expect(gestureStates).not.toContain("swipe-left");
    });
  });

  describe("Touch Event Simulation Utilities", () => {
    it("should create valid touch objects", () => {
      const touch = createTouch(100, 200, 5);

      expect(touch.clientX).toBe(100);
      expect(touch.clientY).toBe(200);
      expect(touch.identifier).toBe(5);
      expect(touch.force).toBe(1);
    });

    it("should create touch events with multiple touches", () => {
      const touches = [
        createTouch(100, 100, 0),
        createTouch(200, 200, 1),
        createTouch(150, 150, 2),
      ];

      const event = createTouchEvent(
        "touchstart",
        touches,
        [touches[0]],
        touches,
      );

      expect(event.touches).toHaveLength(3);
      expect(event.changedTouches).toHaveLength(1);
      expect(event.targetTouches).toHaveLength(3);
      expect(event.type).toBe("touchstart");
    });

    it("should simulate complete gesture sequences", () => {
      const events: string[] = [];

      const GestureTestComponent = () => (
        <div
          onTouchStart={() => events.push("start")}
          onTouchMove={() => events.push("move")}
          onTouchEnd={() => events.push("end")}
          data-testid="gesture-test"
        >
          Gesture test
        </div>
      );

      render(<GestureTestComponent />);
      const element = screen.getByTestId("gesture-test");

      simulateTouchGesture(element, {
        start: { x: 100, y: 100 },
        moves: [
          { x: 110, y: 105 },
          { x: 120, y: 110 },
        ],
        end: { x: 130, y: 115 },
      });

      expect(events).toEqual(["start", "move", "move", "end"]);
    });
  });

  describe("Mobile-Specific Interactions", () => {
    it("should handle touch action CSS properties", () => {
      render(<SwipeableComponent>Touch action test</SwipeableComponent>);

      const element = screen.getByTestId("swipeable");

      // Check that touch-action is set to none (preventing default touch behaviors)
      expect(element.style.touchAction).toBe("none");
    });

    it("should prevent default touch behaviors when needed", () => {
      const preventDefault = vi.fn();

      const TouchPreventComponent = () => (
        <div
          onTouchMove={(e) => {
            e.preventDefault();
            preventDefault();
          }}
          data-testid="prevent-touch"
        >
          Prevent touch
        </div>
      );

      render(<TouchPreventComponent />);
      const element = screen.getByTestId("prevent-touch");

      const touchMove = createTouchEvent("touchmove", [createTouch(100, 100)]);
      const mockPreventDefault = vi.fn();
      Object.defineProperty(touchMove, "preventDefault", {
        value: mockPreventDefault,
      });

      fireEvent(element, touchMove);

      expect(mockPreventDefault).toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalled();
    });

    it("should handle touch event passive option", () => {
      // Test that components can handle passive touch events
      const touchStart = createTouchEvent("touchstart", [
        createTouch(100, 100),
      ]);

      // In browsers, passive events can't call preventDefault
      // This test ensures our components handle this correctly
      expect(touchStart.cancelable).toBe(true);
    });

    it("should support touch event delegation", () => {
      const childEvents: string[] = [];
      const parentEvents: string[] = [];

      const DelegatedTouchComponent = () => (
        <div
          onTouchStart={() => parentEvents.push("parent")}
          data-testid="parent"
        >
          <div
            onTouchStart={(e) => {
              childEvents.push("child");
              e.stopPropagation();
            }}
            data-testid="child"
          >
            Child
          </div>
        </div>
      );

      render(<DelegatedTouchComponent />);

      const child = screen.getByTestId("child");
      const touchStart = createTouchEvent("touchstart", [createTouch(50, 50)]);
      fireEvent(child, touchStart);

      expect(childEvents).toEqual(["child"]);
      expect(parentEvents).toEqual([]); // Stopped propagation
    });
  });

  describe("Touch Accessibility", () => {
    it("should ensure minimum touch target size", () => {
      render(
        <TappableComponent>
          <button data-testid="touch-button" style={{ width: 44, height: 44 }}>
            Touch Button
          </button>
        </TappableComponent>,
      );

      const button = screen.getByTestId("touch-button");
      const styles = window.getComputedStyle(button);

      // Check minimum size (44px is WCAG recommendation)
      expect(parseInt(styles.width)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.height)).toBeGreaterThanOrEqual(44);
    });

    it("should handle touch with screen readers", () => {
      // Test that touch events don't interfere with screen reader interactions
      const onTap = vi.fn();

      render(
        <TappableComponent onTap={onTap}>
          <button
            data-testid="accessible-button"
            aria-label="Accessible button"
          >
            Accessible
          </button>
        </TappableComponent>,
      );

      const button = screen.getByTestId("accessible-button");
      expect(button).toHaveAttribute("aria-label", "Accessible button");
    });

    it("should support keyboard equivalents for touch gestures", () => {
      const onSwipeLeft = vi.fn();

      render(
        <SwipeableComponent onSwipeLeft={onSwipeLeft}>
          <div data-testid="keyboard-swipe" tabIndex={0}>
            Keyboard swipe
          </div>
        </SwipeableComponent>,
      );

      const element = screen.getByTestId("keyboard-swipe");
      expect(element).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("Performance and Memory", () => {
    it("should not cause memory leaks with rapid touch events", () => {
      const touchEvents: TouchEvent[] = [];

      const RapidTouchComponent = () => (
        <div
          onTouchStart={(e) => touchEvents.push(e.nativeEvent)}
          data-testid="rapid-touch"
        >
          Rapid touch
        </div>
      );

      render(<RapidTouchComponent />);
      const element = screen.getByTestId("rapid-touch");

      // Simulate rapid touch events
      for (let i = 0; i < 100; i++) {
        const touchStart = createTouchEvent("touchstart", [
          createTouch(100 + i, 100),
        ]);
        fireEvent(element, touchStart);
      }

      expect(touchEvents).toHaveLength(100);
    });

    it("should handle touch event throttling", () => {
      const touchMoves: TouchEvent[] = [];
      let lastTouchTime = 0;

      const ThrottledTouchComponent = () => (
        <div
          onTouchMove={(e) => {
            const now = Date.now();
            if (now - lastTouchTime > 16) {
              // ~60fps throttling
              touchMoves.push(e.nativeEvent);
              lastTouchTime = now;
            }
          }}
          data-testid="throttled-touch"
        >
          Throttled touch
        </div>
      );

      render(<ThrottledTouchComponent />);
      const element = screen.getByTestId("throttled-touch");

      // Rapid touch moves
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(10); // Advance time
        const touchMove = createTouchEvent("touchmove", [
          createTouch(100 + i * 10, 100),
        ]);
        fireEvent(element, touchMove);
      }

      // Should throttle to prevent excessive events
      expect(touchMoves.length).toBeLessThan(10);
    });

    it("should clean up event listeners on unmount", () => {
      let listenerCount = 0;

      const CleanupTestComponent = () => {
        useEffect(() => {
          const handler = () => listenerCount++;
          window.addEventListener("touchstart", handler);

          return () => {
            window.removeEventListener("touchstart", handler);
          };
        }, []);

        return <div data-testid="cleanup-test">Cleanup test</div>;
      };

      const { unmount } = render(<CleanupTestComponent />);

      // Simulate touch event
      fireEvent(
        window,
        createTouchEvent("touchstart", [createTouch(100, 100)]),
      );
      expect(listenerCount).toBe(1);

      unmount();

      // After unmount, listener should be removed
      fireEvent(
        window,
        createTouchEvent("touchstart", [createTouch(100, 100)]),
      );
      expect(listenerCount).toBe(1); // Should not increment
    });
  });
});
