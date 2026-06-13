"use client";

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

interface DragState {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  isDragging: boolean;
}

interface UseHorizontalDragScrollOptions<T extends HTMLElement> {
  scrollRef: RefObject<T | null>;
  onDragMove?: () => void;
  onDragEnd?: (didDrag: boolean) => void;
}

const DRAG_THRESHOLD_PX = 6;

export function useHorizontalDragScroll<T extends HTMLElement>({
  scrollRef,
  onDragMove,
  onDragEnd,
}: UseHorizontalDragScrollOptions<T>) {
  const dragStateRef = useRef<DragState | null>(null);

  const finishDrag = useCallback(
    (event: ReactPointerEvent<T>, didCancel = false) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;

      const target = scrollRef.current;
      if (
        target &&
        typeof target.hasPointerCapture === "function" &&
        target.hasPointerCapture(event.pointerId)
      ) {
        target.releasePointerCapture(event.pointerId);
      }

      dragStateRef.current = null;
      if (target) target.style.cursor = "grab";
      target?.classList.remove("is-dragging");
      onDragEnd?.(!didCancel && state.isDragging);
    },
    [onDragEnd, scrollRef]
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<T>) => {
      const target = scrollRef.current;
      if (!target) return;
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: target.scrollLeft,
        isDragging: false,
      };

      if (typeof target.setPointerCapture === "function") {
        target.setPointerCapture(event.pointerId);
      }
    },
    [scrollRef]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<T>) => {
      const state = dragStateRef.current;
      const target = scrollRef.current;
      if (!state || !target || state.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - state.startX;

      if (!state.isDragging) {
        if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

        state.isDragging = true;
        target.style.cursor = "grabbing";
        target.classList.add("is-dragging");
      }

      event.preventDefault();
      target.scrollLeft = state.startScrollLeft - deltaX;
      onDragMove?.();
    },
    [onDragMove, scrollRef]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<T>) => {
      finishDrag(event);
    },
    [finishDrag]
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<T>) => {
      finishDrag(event, true);
    },
    [finishDrag]
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
