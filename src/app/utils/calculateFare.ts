export const calculateFare = (hourRate: number, durationInSeconds: number): number => {
  const hours = durationInSeconds / 3600;
  return hours * hourRate;
};