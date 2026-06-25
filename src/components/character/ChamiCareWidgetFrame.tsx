"use client";

interface ChamiCareWidgetFrameProps {
  className?: string;
}

export default function ChamiCareWidgetFrame({ className = "" }: ChamiCareWidgetFrameProps) {
  return (
    <iframe
      src="/widgets/chami-widget.html"
      title="참이 돌봄 게임 위젯"
      aria-label="참이 돌봄 게임 위젯"
      className={`chami-care-widget-frame ${className}`.trim()}
      loading="eager"
    />
  );
}
