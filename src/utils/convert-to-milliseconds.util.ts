export function convertToMilliseconds(timeString: string): number {
  const timeValue = parseInt(timeString);
  const timeUnit = timeString.slice(-1);

  switch (timeUnit) {
    case 's':
      return timeValue * 1000;
    case 'm':
      return timeValue * 60 * 1000;
    case 'h':
      return timeValue * 60 * 60 * 1000;
    case 'd':
      return timeValue * 24 * 60 * 60 * 1000;
    case 'w':
      return timeValue * 7 * 24 * 60 * 60 * 1000;
    default:
      // If no unit is specified, assume seconds
      return timeValue * 1000;
  }
}
