import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

export type LineItem = {
  id: string;
  label: string;
  amount: number;
};

export type ShiftData = {
  isClosed?: boolean;
  date: string;
  cashierName: string;
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
  cashAndSales: {
    openingCash: number;
    addedReceivablesDesc: string;
    addedReceivables: number;
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
  "محمود الاشقر صالة", "محمد حريري", "ابو مصعب", "عبد الله نوفل", "علي نوفل", "محمود نابلسي", "عبد الله الحريري", "محمد طه"
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultState: ShiftData = {
  isClosed: false,
  date: format(new Date(), 'yyyy-MM-dd'),
  cashierName: '',
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
  addCashReceivables: [],
  cashAndSales: {
    openingCash: 0,
    addedReceivablesDesc: '',
    addedReceivables: 0,
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
  syncFromRemote: (data: ShiftData) => void;
  initSync: () => () => void;
  savedDates: string[];
  fetchSavedDates: () => Promise<void>;
  setShiftDate: (date: string) => void;
  monthlyShortage: number;
  fetchMonthlyShortage: (cashierName: string, date: string) => Promise<void>;
  closeShift: () => void;
};

// Helper to set nested object properties
const setNestedProperty = (obj: any, path: (string | number)[], value: any) => {
  const lastKey = path[path.length - 1];
  const target = path.slice(0, -1).reduce((acc, key) => acc[key], obj);
  target[lastKey] = value;
};

let debounceTimeout: NodeJS.Timeout | null = null;

const syncToFirestore = (data: ShiftData) => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(async () => {
    try {
      const shiftDoc = doc(db, 'shifts', data.date);
      await setDoc(shiftDoc, data, { merge: true });
    } catch (error) {
      console.error('Error syncing to Firestore', error);
    }
  }, 1000);
};

export const useShiftStore = create<StoreState>((set, get) => ({
  data: defaultState,
  isLoading: true,
  savedDates: [],
  monthlyShortage: 0,

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
        if (docData.cashierName === cashierName && docData.date.startsWith(monthPrefix)) {
          // Calculate shortage for this shift
          // totalInventory = actualCash + visa + rt + maestro + priceDifference + advances + wallet +
          // purchases + otherExpenses + abuAbdullah + equipment + addMerchantReceivables + apartment + adminExpenses + ewallet + payMerchantReceivables + yahya + spices
          // totalCash = openingCash + addedReceivables - paidOldReceivables + sales + otherSales
          // shortage = totalCash - totalInventory
          const totalInventory = (docData.actualInventory.actualCash || 0) + (docData.actualInventory.visa || 0) + (docData.actualInventory.rt || 0) + (docData.actualInventory.maestro || 0) + (docData.actualInventory.priceDifference || 0) + (docData.actualInventory.advances || 0) + (docData.actualInventory.wallet || 0) +
            docData.purchases.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.otherExpenses.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.abuAbdullah.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.equipment.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.addMerchantReceivables.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.apartment.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.adminExpenses.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.ewallet.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.payMerchantReceivables.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.yahya.reduce((sum, item) => sum + (item.amount || 0), 0) +
            docData.spices.reduce((sum, item) => sum + (item.amount || 0), 0);
          
          const cashInfo = docData.cashAndSales;
          const addedReceivablesTotal = docData.addCashReceivables 
            ? docData.addCashReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
            : (cashInfo.addedReceivables || 0);

          const totalExpectedCash = (cashInfo.openingCash || 0) + addedReceivablesTotal + (cashInfo.paidOldReceivables || 0) + (cashInfo.sales || 0) + (cashInfo.otherSales || 0);
          const shortage = totalExpectedCash - totalInventory;
          if (shortage > 0) {
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
      const dates = snapshot.docs.map(doc => doc.id);
      set({ savedDates: dates });
    } catch (error) {
      console.error('Error fetching dates', error);
    }
  },

  setShiftDate: (newDate: string) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    set({ 
      data: { ...defaultState, date: newDate }, 
      isLoading: true 
    });
  },

  updateData: (path: (string | number)[], value: any) => {
    set((state) => {
      if (state.data.isClosed) return state; // Prevent updates if closed
      const newData = JSON.parse(JSON.stringify(state.data)); // Deep clone
      setNestedProperty(newData, path, value);
      
      // Compute dynamically derived values here if needed
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  addLineItem: (listName: keyof ShiftData) => {
    set((state) => {
      const newData = JSON.parse(JSON.stringify(state.data));
      (newData[listName] as LineItem[]).push({ id: generateId(), label: '', amount: 0 });
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  removeLineItem: (listName: keyof ShiftData, id: string) => {
    set((state) => {
      const newData = JSON.parse(JSON.stringify(state.data));
      newData[listName] = (newData[listName] as LineItem[]).filter(item => item.id !== id);
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  addEmployee: () => {
    set((state) => {
      const newData = JSON.parse(JSON.stringify(state.data));
      newData.employeeAdvances.push({
        id: generateId(),
        employeeName: '',
        amount: 0,
        notes: '',
        startTime: '',
        endTime: '',
        hourlyRate: 0
      });
      syncToFirestore(newData);
      return { data: newData };
    });
  },

  removeEmployee: (id: string) => {
    set((state) => {
      if (state.data.isClosed) return state;
      const newData = JSON.parse(JSON.stringify(state.data));
      newData.employeeAdvances = newData.employeeAdvances.filter((emp: any) => emp.id !== id);
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

  syncFromRemote: (remoteData: ShiftData) => {
    // Migration for older documents
    if (!remoteData.addCashReceivables) {
      remoteData.addCashReceivables = [{
        id: generateId(),
        label: remoteData.cashAndSales?.addedReceivablesDesc || '',
        amount: remoteData.cashAndSales?.addedReceivables || 0
      }];
    }
    set({ data: remoteData, isLoading: false });
  },

  initSync: () => {
    const date = get().data.date;
    const shiftDoc = doc(db, 'shifts', date);
    
    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(shiftDoc, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as ShiftData;
        // Basic check to avoid overwriting local un-debounced changes perfectly
        // (In a perfect world we would compare timestamps, but for prototype this is fine)
        get().syncFromRemote(remoteData);
      } else {
        // Doc doesn't exist, we should create it
        setDoc(shiftDoc, get().data);
        set({ isLoading: false });
      }
    });

    return unsubscribe;
  },
}));
