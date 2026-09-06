import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, getDoc, query, orderBy, where, limit, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';

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
    advances: number;
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
    advances: 0,
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
  removeEmployee: (id: string) => void;
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
  closeShift: () => void;
  reopenShift: () => void;
};

// High-performance immutable nested updater (O(depth) instead of O(N) JSON serialization)
const updateNestedState = (obj: any, path: (string | number)[], value: any): any => {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  
  if (Array.isArray(obj)) {
    const index = Number(head);
    const newArr = [...obj];
    newArr[index] = tail.length > 0 ? updateNestedState(obj[index] ?? {}, tail, value) : value;
    return newArr;
  }
  
  const newObj = { ...obj };
  newObj[head] = tail.length > 0 ? updateNestedState(obj[head] ?? {}, tail, value) : value;
  return newObj;
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
      await setDoc(shiftDoc, data, { merge: true });
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
      setDoc(shiftDoc, pendingDataToSync, { merge: true });
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
          const totalInventory = (docData.actualInventory?.actualCash || 0) + (docData.actualInventory?.visa || 0) + (docData.actualInventory?.rt || 0) + (docData.actualInventory?.maestro || 0) + (docData.actualInventory?.priceDifference || 0) + (docData.actualInventory?.advances || 0) + ((docData.ewallet || []).reduce((sum, item) => sum + (item.amount || 0), 0)) +
            (docData.purchases || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.otherExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.abuAbdullah || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.equipment || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.apartment || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.adminExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.ewallet || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.payMerchantReceivables || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.yahya || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.spices || []).reduce((sum, item) => sum + (item.amount || 0), 0);
          
          const cashInfo = docData.cashAndSales;
          const addedReceivablesTotal = docData.addCashReceivables 
            ? docData.addCashReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
            : (cashInfo?.paidOldReceivables || 0);

          const newReceivablesTotal = docData.addNewReceivables
            ? docData.addNewReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
            : (cashInfo?.addedReceivables || 0);

          const totalExpectedCash = (cashInfo?.openingCash || 0) + (cashInfo?.sales || 0) + (cashInfo?.otherSales || 0) + newReceivablesTotal - addedReceivablesTotal;
          const shortage = totalExpectedCash - totalInventory;
          if (shortage > 0.01) {
            totalShortage += shortage;
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
        // Purge old reports prior to system start date (2026-09-04)
        if (id < START_DATE) {
          try {
            await deleteDoc(doc(db, 'shifts', id));
          } catch (e) {
            console.error('Error auto-cleaning report:', id, e);
          }
        } else {
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

  removeEmployee: (id: string) => {
    set((state) => {
      if (state.data.isClosed) return state;
      const updatedEmployees = state.data.employeeAdvances.filter((emp: any) => emp.id !== id);
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
            setDoc(shiftDoc, remoteData, { merge: true });
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
        setDoc(shiftDoc, currentData);
        set({ data: currentData, isLoading: false });
      }
    });

    return unsubscribe;
  },
}));
