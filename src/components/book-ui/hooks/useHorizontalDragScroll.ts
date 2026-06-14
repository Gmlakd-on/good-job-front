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
const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, option, label, [role='button'], [role='radio']";

function isInteractiveTarget(eventTarget: EventTarget | null, container: HTMLElement) {
  if (!(eventTarget instanceof Element)) return false;

  const interactiveElement = eventTarget.closest(INTERACTIVE_SELECTOR);
  return Boolean(interactiveElement && container.contains(interactiveElement));
}

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

      // 표지 카드가 button(role=radio)이기 때문에, 여기서 포인터 캡처를 잡으면
      // 브라우저에 따라 카드의 onClick이 발생하지 않아 표지 선택이 막힌다.
      // 드래그 스크롤은 빈 선반 영역에서만 시작하고, 실제 선택 요소는 클릭을 그대로 통과시킨다.
      if (isInteractiveTarget(event.target, target)) return;

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
