import { useShiftStore } from '../store/useShiftStore';
import { calculateShiftMetrics, ShiftCalculationsResult } from '../lib/shiftCalculations';

export const useCalculations = (): ShiftCalculationsResult => {
  const data = useShiftStore(state => state.data);
  return calculateShiftMetrics(data);
};

export { calculateShiftMetrics } from '../lib/shiftCalculations';
export type { ShiftCalculationsResult } from '../lib/shiftCalculations';

