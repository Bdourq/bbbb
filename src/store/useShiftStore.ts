import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, getDoc, query, orderBy, where, limit, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { toEnglishNumbers } from '../lib/utils';
import { calculateShiftMetrics } from '../lib/shiftCalculations';

export type LineItem = {
  id: string;
  label: string;
  amount: number;
};

export type CustodyItem = {
  id: string;
  type: 'out' | 'in'; // 'out' = خروج عهدة / سحب, 'in' = إعادة عهدة / إرجاع
  personOrReason: string; // من هو الشخص أو البيان
  amount: number;
  time?: string;
  notes?: string;
};

export type ShiftDifferenceDetail = {
  cashierName: string;
  type: 'shortage' | 'surplus' | 'exact';
  amount: number;
  notes?: string;
};

export type ShiftDifferencesData = {
  morning?: ShiftDifferenceDetail;
  evening?: ShiftDifferenceDetail;
};

export type ShiftHandoverData = {
  morningCashier: string;
  eveningCashier: string;
  sales: number;
  actualCash: number;
  expectedCash: number;
  difference: number;
  timestamp: string;
};

export type ShiftData = {
  isClosed?: boolean;
  date: string;
  cashierName: string;
  shiftHandover?: ShiftHandoverData;
  shiftDifferences?: ShiftDifferencesData;
  custodyItems: CustodyItem[];
  purchases: LineItem[];
  addMerchantReceivables: LineItem[];
  payMerchantReceivables: LineItem[];
  otherExpenses: LineItem[];
  apartment: LineItem[];
  yahya: LineItem[];
  abuAbdullah: LineItem[];
  adminExpenses: LineItem[];
  spices: LineItem[];
  equipment: LineItem[];
  ewallet: LineItem[];
  addCashReceivables: LineItem[];
  addNewReceivables?: LineItem[];
  cashAndSales: {
    openingCash: number;
    addedReceivablesDesc: string;
    addedReceivables: number;
    paidOldReceivablesDesc?: string;
    paidOldReceivables: number;
    sales: number;
    otherSales: number;
  };
  kitchenConsumption: {
    skewer1: number;
    skewer2: number;
    supply: number;
    return: number;
    rice: number;
    almond: number;
    potato: number;
  };
  productionInventory: {
    broasted: number;
    tikka: number;
    zinger: number;
  };
  actualInventory: {
    actualCash: number;
    visa: number;
    rt: number;
    maestro: number;
    priceDifference: number;
    advances?: number | null;
    wallet: number;
    manualPurchases?: number;
    manualPayMerchant?: number;
    manualOtherExpenses?: number;
    manualApartment?: number;
    manualAdminExpenses?: number;
    manualYahya?: number;
    manualAbuAbdullah?: number;
    manualSpices?: number;
    manualEquipment?: number;
  };
  employeeAdvances: Array<{
    id: string;
    employeeName: string;
    amount: number;
    notes: string;
    startTime: string;
    endTime: string;
    hourlyRate: number;
  }>;
};

const defaultEmployees = [
  "ابو حبيش", "معتصم", "ابو لطفي", "مجاهد", "سامر", "ابو الوفا", "سعيد", "هياجنة", "بدور", "قتيبة",
  "امجد شحادات", "عبيدة", "سيف", "خالد ابو عرة", "قصي", "خالد", "عز الدين", "الحمصي", "قاسم", "حسن",
  "محمود الاشقر صالة", "زعبي / بسطه", "صالح", "علي نوفل", "عبد الله الحريري",
  "ابو مصعب (مياومة)", "عبد الله نوفل (مياومة)", "محمود نابلسي (مياومة)", "مهيب (مياومة)", "محمد طه (مياومة)", "زعبي / صاله (مياومة)"
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const START_DATE = '2026-09-05';
const DEFAULT_OPENING_CASH = 22;
const TODAY_DATE = format(new Date(), 'yyyy-MM-dd');

const defaultState: ShiftData = {
  isClosed: false,
  date: TODAY_DATE,
  cashierName: '',
  shiftDifferences: {
    morning: { cashierName: '', type: 'exact', amount: 0, notes: '' },
    evening: { cashierName: '', type: 'exact', amount: 0, notes: '' },
  },
  custodyItems: [],
  purchases: [],
  addMerchantReceivables: [],
  payMerchantReceivables: [],
  otherExpenses: [],
  apartment: [],
  yahya: [],
  abuAbdullah: [],
  adminExpenses: [],
  spices: [],
  equipment: [],
  ewallet: [],
  addCashReceivables: [{ id: 'ncr-1', label: '', amount: 0 }],
  addNewReceivables: [{ id: 'nr-1', label: '', amount: 0 }],
  cashAndSales: {
    openingCash: 0,
    addedReceivablesDesc: '',
    addedReceivables: 0,
    paidOldReceivablesDesc: '',
    paidOldReceivables: 0,
    sales: 0,
    otherSales: 0,
  },
  kitchenConsumption: {
    skewer1: 0,
    skewer2: 0,
    supply: 0,
    return: 0,
    rice: 0,
    almond: 0,
    potato: 0,
  },
  productionInventory: {
    broasted: 0,
    tikka: 0,
    zinger: 0,
  },
  actualInventory: {
    actualCash: 0,
    visa: 0,
    rt: 0,
    maestro: 0,
    priceDifference: 0,
    advances: null,
    wallet: 0,
  },
  employeeAdvances: defaultEmployees.map((name, index) => ({
    id: String(index + 1),
    employeeName: name,
    amount: 0,
    notes: '',
    startTime: '',
    endTime: '',
    hourlyRate: 0,
  })),
};

type StoreState = {
  data: ShiftData;
  isLoading: boolean;
  updateData: (path: (string | number)[], value: any) => void;
  addLineItem: (listName: keyof ShiftData) => void;
  removeLineItem: (listName: keyof ShiftData, id: string) => void;
  addEmployee: () => void;
  removeEmployee: (idOrIndex: string | number) => void;
  addCustodyItem: (type?: 'out' | 'in') => void;
  removeCustodyItem: (id: string) => void;
  syncFromRemote: (data: ShiftData) => void;
  initSync: () => () => void;
  savedDates: string[];
  fetchSavedDates: () => Promise<void>;
  deleteReport: (date: string) => Promise<void>;
  setShiftDate: (date: string) => void;
  monthlyShortage: number;
  fetchMonthlyShortage: (cashierName: string, date: string) => Promise<void>;
  previousDayActualCash: number;
  fetchPreviousDayCash: (targetDate: string) => Promise<number>;
  setMorningCashier: (morningName: string) => void;
  swapShiftCashiers: () => void;
  closeShift: () => void;
  reopenShift: () => void;
};

// High-performance immutable nested updater (O(depth) instead of O(N) JSON serialization)
const updateNestedState = (obj: any, path: (string | number)[], value: any): any => {
  const sanitizedValue = typeof value === 'string' ? toEnglishNumbers(value) : value;
  if (path.length === 0) return sanitizedValue;
  const [head, ...tail] = path;
  
  if (Array.isArray(obj)) {
    const index = Number(head);
    const newArr = [...obj];
    newArr[index] = tail.length > 0 ? updateNestedState(obj[index] ?? {}, tail, sanitizedValue) : sanitizedValue;
    return newArr;
  }
  
  const newObj = { ...obj };
  newObj[head] = tail.length > 0 ? updateNestedState(obj[head] ?? {}, tail, sanitizedValue) : sanitizedValue;
  return newObj;
};

export const cleanDataForFirestore = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanDataForFirestore) as unknown as T;
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = cleanDataForFirestore(v);
    }
  }
  return cleaned as T;
};

const safeSetDoc = async (docRef: any, data: any, options?: any) => {
  const payload = cleanDataForFirestore(data);
  return options ? setDoc(docRef, payload, options) : setDoc(docRef, payload);
};

let debounceTimeout: NodeJS.Timeout | null = null;
let lastLocalUpdate = 0;
let pendingDataToSync: ShiftData | null = null;

const syncToFirestore = (data: ShiftData) => {
  pendingDataToSync = data;
  if (debounceTimeout) clearTimeout(debounceTimeout);
  lastLocalUpdate = Date.now();
  debounceTimeout = setTimeout(async () => {
    debounceTimeout = null;
    pendingDataToSync = null;
    try {
      const shiftDoc = doc(db, 'shifts', data.date);
      await safeSetDoc(shiftDoc, data, { merge: true });
    } catch (error) {
      console.error('Error syncing to Firestore', error);
    }
  }, 1000);
};

// Ensure we don't lose data if the user refreshes/closes the tab before the debounce fires
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingDataToSync && debounceTimeout) {
      const shiftDoc = doc(db, 'shifts', pendingDataToSync.date);
      // Fire-and-forget sync before tab closes
      safeSetDoc(shiftDoc, pendingDataToSync, { merge: true });
    }
  });
}

export const useShiftStore = create<StoreState>((set, get) => ({
  data: { ...defaultState },
  isLoading: true,
  savedDates: [START_DATE],
  monthlyShortage: 0,
  previousDayActualCash: 0,

  fetchPreviousDayCash: async (targetDate: string) => {
    try {
      const q = query(
        collection(db, 'shifts'),
        where('date', '<', targetDate),
        orderBy('date', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const prevDocData = snapshot.docs[0].data() as ShiftData;
        const prevCash = Number(prevDocData.actualInventory?.actualCash) || 0;
        set({ previousDayActualCash: prevCash });
        return prevCash;
      }
    } catch (error) {
      console.error('Error fetching previous day cash:', error);
    }
    set({ previousDayActualCash: 0 });
    return 0;
  },

  fetchMonthlyShortage: async (cashierName: string, targetDate: string) => {
    if (!cashierName) {
      set({ monthlyShortage: 0 });
      return;
    }
    try {
      const monthPrefix = targetDate.substring(0, 7); // YYYY-MM
      const q = query(collection(db, 'shifts'));
      const snapshot = await getDocs(q);
      
      let totalShortage = 0;
      snapshot.forEach(doc => {
        const docData = doc.data() as ShiftData;
        if (docData.cashierName === cashierName && docData.date.startsWith(monthPrefix) && docData.date >= '2026-09-05') {
          const metrics = calculateShiftMetrics(docData);
          if (metrics.cashShortage > 0.01) {
            totalShortage += metrics.cashShortage;
          }
        }
      });
      set({ monthlyShortage: totalShortage });
    } catch (error) {
      console.error('Error fetching monthly shortage', error);
    }
  },

  fetchSavedDates: async () => {
    try {
      const q = query(collection(db, 'shifts'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      const activeDates: string[] = [];

      for (const docSnap of snapshot.docs) {
        const id = docSnap.id;
        // Do not auto-delete old reports; only manual deletion is allowed
        if (id >= START_DATE) {
          activeDates.push(id);
        }
      }

      if (!activeDates.includes(START_DATE)) {
        activeDates.push(START_DATE);
      }

      activeDates.sort().reverse();
      set({ savedDates: activeDates });
    } catch (error) {
      console.error('Error fetching dates', error);
      set({ savedDates: [START_DATE] });
    }
  },

  deleteReport: async (targetDate: string) => {
    try {
      await deleteDoc(doc(db, 'shifts', targetDate));
      const newDates = get().savedDates.filter(d => d !== targetDate);
      if (!newDates.includes(START_DATE)) {
        newDates.push(START_DATE);
      }
      newDates.sort().reverse();
      set({ savedDates: newDates });
      if (get().data.date === targetDate) {
        get().setShiftDate(newDates[0] || START_DATE);
      }
    } catch (error) {
      console.error('Error deleting report:', targetDate, error);
    }
  },

  setShiftDate: async (newDate: string) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const prevCash = await get().fetchPreviousDayCash(newDate);
    const initialCash = prevCash > 0 ? prevCash : (newDate === START_DATE ? DEFAULT_OPENING_CASH : 0);
    set({ 
      data: { 
        ...defaultState, 
        date: newDate,
        cashAndSales: {
          ...defaultState.cashAndSales,
          openingCash: initialCash
        }
      }, 
      isLoading: true 
    });
  },

  updateData: (path: (string | number)[], value: any) => {
    set((state) => {
      if (state.data.isClosed) return state; // Prevent updates if closed
      const newData = updateNestedState(state.data, path, value);
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  addLineItem: (listName: keyof ShiftData) => {
    set((state) => {
      if (state.data.isClosed) return state;
      const currentList = (state.data[listName] as LineItem[]) || [];
      const updatedList = [...currentList, { id: generateId(), label: '', amount: 0 }];
      const newData = { ...state.data, [listName]: updatedList };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  removeLineItem: (listName: keyof ShiftData, id: string) => {
    set((state) => {
      if (state.data.isClosed) return state;
      const currentList = (state.data[listName] as LineItem[]) || [];
      const updatedList = currentList.filter(item => item.id !== id);
      const newData = { ...state.data, [listName]: updatedList };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  addEmployee: () => {
    set((state) => {
      if (state.data.isClosed) return state;
      const updatedEmployees = [
        ...state.data.employeeAdvances,
        {
          id: generateId(),
          employeeName: '',
          amount: 0,
          notes: '',
          startTime: '',
          endTime: '',
          hourlyRate: 0
        }
      ];
      const newData = { ...state.data, employeeAdvances: updatedEmployees };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  removeEmployee: (idOrIndex: string | number) => {
    set((state) => {
      if (state.data.isClosed) return state;
      let updatedEmployees;
      if (typeof idOrIndex === 'number') {
        updatedEmployees = state.data.employeeAdvances.filter((_, idx) => idx !== idOrIndex);
      } else {
        const found = state.data.employeeAdvances.some(emp => emp.id === idOrIndex);
        if (found) {
          updatedEmployees = state.data.employeeAdvances.filter(emp => emp.id !== idOrIndex);
        } else {
          // If not matched by ID, try numeric index
          const numericIdx = parseInt(idOrIndex, 10);
          if (!isNaN(numericIdx) && numericIdx >= 0 && numericIdx < state.data.employeeAdvances.length) {
            updatedEmployees = state.data.employeeAdvances.filter((_, idx) => idx !== numericIdx);
          } else {
            updatedEmployees = state.data.employeeAdvances.filter(emp => emp.id !== idOrIndex);
          }
        }
      }
      const newData = { ...state.data, employeeAdvances: updatedEmployees };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  addCustodyItem: (type: 'out' | 'in' = 'out') => {
    set((state) => {
      if (state.data.isClosed) return state;
      const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const currentList = state.data.custodyItems || [];
      const updatedCustody = [
        ...currentList,
        {
          id: generateId(),
          type,
          personOrReason: '',
          amount: 0,
          time: currentTime,
          notes: ''
        }
      ];
      const newData = { ...state.data, custodyItems: updatedCustody };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  removeCustodyItem: (id: string) => {
    set((state) => {
      if (state.data.isClosed) return state;
      const currentList = state.data.custodyItems || [];
      const updatedCustody = currentList.filter((item: any) => item.id !== id);
      const newData = { ...state.data, custodyItems: updatedCustody };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  setMorningCashier: (morningName: string) => {
    set((state) => {
      if (state.data.isClosed) return state;
      const morning = morningName.trim();
      const isQusay = morning.includes('قصي');
      const evening = morning ? (isQusay ? 'أمجد شحادات' : 'قصي البدور') : '';

      const newShiftHandover = {
        ...(state.data.shiftHandover || {
          sales: 0,
          actualCash: 0,
          expectedCash: 0,
          difference: 0,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }),
        morningCashier: morning,
        eveningCashier: evening
      };

      const newShiftDifferences: ShiftDifferencesData = {
        morning: {
          ...(state.data.shiftDifferences?.morning || { type: 'exact', amount: 0, notes: 'صباحي' }),
          cashierName: morning,
          notes: 'صباحي'
        },
        evening: {
          ...(state.data.shiftDifferences?.evening || { type: 'exact', amount: 0, notes: 'مسائي' }),
          cashierName: evening,
          notes: 'مسائي'
        }
      };

      const newCashierName = morning && evening 
        ? `${morning} (صباحي) + ${evening} (مسائي)` 
        : (morning || evening || '');

      const newData: ShiftData = {
        ...state.data,
        cashierName: newCashierName,
        shiftHandover: newShiftHandover,
        shiftDifferences: newShiftDifferences
      };

      syncToFirestore(newData);
      return { data: newData };
    });
  },

  swapShiftCashiers: () => {
    set((state) => {
      if (state.data.isClosed) return state;
      const currentMorning = state.data.shiftDifferences?.morning?.cashierName || state.data.shiftHandover?.morningCashier || 'قصي البدور';
      const currentEvening = state.data.shiftDifferences?.evening?.cashierName || state.data.shiftHandover?.eveningCashier || 'أمجد شحادات';
      
      const newMorning = currentEvening;
      const newEvening = currentMorning;

      const newShiftHandover = {
        ...(state.data.shiftHandover || {
          sales: 0,
          actualCash: 0,
          expectedCash: 0,
          difference: 0,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }),
        morningCashier: newMorning,
        eveningCashier: newEvening
      };

      const newShiftDifferences: ShiftDifferencesData = {
        morning: {
          ...(state.data.shiftDifferences?.morning || { type: 'exact', amount: 0, notes: 'صباحي' }),
          cashierName: newMorning,
          notes: 'صباحي'
        },
        evening: {
          ...(state.data.shiftDifferences?.evening || { type: 'exact', amount: 0, notes: 'مسائي' }),
          cashierName: newEvening,
          notes: 'مسائي'
        }
      };

      const newCashierName = `${newMorning} (صباحي) + ${newEvening} (مسائي)`;

      const newData: ShiftData = {
        ...state.data,
        cashierName: newCashierName,
        shiftHandover: newShiftHandover,
        shiftDifferences: newShiftDifferences
      };

      syncToFirestore(newData);
      return { data: newData };
    });
  },

  closeShift: () => {
    set((state) => {
      const newData = { ...state.data, isClosed: true };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  reopenShift: () => {
    set((state) => {
      const newData = { ...state.data, isClosed: false };
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  syncFromRemote: (remoteData: ShiftData) => {
    // Migration for older documents
    if (!remoteData.addCashReceivables || remoteData.addCashReceivables.length === 0) {
      remoteData.addCashReceivables = [{
        id: generateId(),
        label: remoteData.cashAndSales?.addedReceivablesDesc || '',
        amount: remoteData.cashAndSales?.addedReceivables || 0
      }];
    }
    if (!remoteData.addNewReceivables || remoteData.addNewReceivables.length === 0) {
      remoteData.addNewReceivables = [{
        id: generateId(),
        label: remoteData.cashAndSales?.paidOldReceivablesDesc || '',
        amount: remoteData.cashAndSales?.paidOldReceivables || 0
      }];
    }
    if (!remoteData.custodyItems) {
      remoteData.custodyItems = [];
    }
    if (remoteData.employeeAdvances) {
      remoteData.employeeAdvances = remoteData.employeeAdvances.map((emp, idx) => ({
        ...emp,
        id: emp.id || generateId() || `emp-${idx}`
      }));
    }
    set({ data: remoteData, isLoading: false });
  },

  initSync: () => {
    const date = get().data.date;
    get().fetchPreviousDayCash(date);
    const shiftDoc = doc(db, 'shifts', date);
    
    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(shiftDoc, async (docSnap) => {
      // Ignore incoming remote data if the user has typed/updated within the last 2 seconds
      // OR if there are pending writes. This prevents overwriting user input during active editing.
      if (docSnap.metadata.hasPendingWrites || Date.now() - lastLocalUpdate < 2000) {
        return;
      }

      if (docSnap.exists()) {
        const remoteData = docSnap.data() as ShiftData;
        if (!remoteData.cashAndSales?.openingCash || remoteData.cashAndSales.openingCash === 0) {
          const prevCash = await get().fetchPreviousDayCash(date);
          const initialCash = prevCash > 0 ? prevCash : (date === START_DATE ? DEFAULT_OPENING_CASH : 0);
          if (initialCash > 0) {
            remoteData.cashAndSales = remoteData.cashAndSales || {
              openingCash: 0,
              addedReceivablesDesc: '',
              addedReceivables: 0,
              paidOldReceivables: 0,
              sales: 0,
              otherSales: 0
            };
            remoteData.cashAndSales.openingCash = initialCash;
            safeSetDoc(shiftDoc, remoteData, { merge: true });
          }
        }
        get().syncFromRemote(remoteData);
      } else {
        // Doc doesn't exist, create it clean with zeroed tables and previous day cash
        const prevCash = await get().fetchPreviousDayCash(date);
        const initialCash = prevCash > 0 ? prevCash : (date === START_DATE ? DEFAULT_OPENING_CASH : 0);
        const currentData: ShiftData = {
          ...defaultState,
          date,
          addCashReceivables: [{ id: generateId(), label: '', amount: 0 }],
          addNewReceivables: [{ id: generateId(), label: '', amount: 0 }],
          cashAndSales: {
            ...defaultState.cashAndSales,
            openingCash: initialCash
          }
        };
        safeSetDoc(shiftDoc, currentData);
        set({ data: currentData, isLoading: false });
      }
    });

    return unsubscribe;
  },
}));
