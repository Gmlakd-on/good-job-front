export function getDailyGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "늦은 밤이에요. 오늘 하루는 어땠나요?";
  if (hour < 12) return "좋은 아침이에요. 오늘도 기록해볼까요?";
  if (hour < 18) return "오후의 마음은 어떤가요?";
  if (hour < 22) return "하루가 저물어가요. 오늘을 남겨볼까요?";
  return "늦은 밤이에요. 오늘 하루는 어땠나요?";
}
