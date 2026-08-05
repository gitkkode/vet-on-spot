export function getFuelLevelClass(percent: number): 'high' | 'mid' | 'low' {
  if (percent >= 60) return 'high';
  if (percent >= 30) return 'mid';
  return 'low';
}
