"use client";

interface ChamiCareWidgetFrameProps {
  className?: string;
}

const CHAMI_WIDGET_SRC = "/widgets/chami-widget.html";

export default function ChamiCareWidgetFrame({ className = "" }: ChamiCareWidgetFrameProps) {
  return (
    <iframe
      src={CHAMI_WIDGET_SRC}
      title="참이 돌봄 게임 위젯"
      aria-label="참이 돌봄 게임 위젯"
      className={`chami-care-widget-frame ${className}`.trim()}
      loading="eager"
    />
  );
}
