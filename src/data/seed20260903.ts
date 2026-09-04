import { ShiftData } from '../store/useShiftStore';

export const seededShiftData20260903: ShiftData = {
  isClosed: false,
  date: "2026-09-03",
  cashierName: "امجد شحادات",
  custodyItems: [],
  
  // 1. المشتريات
  purchases: [
    { id: "p1", label: "ابو احمد", amount: 247.75 },
    { id: "p2", label: "غاز", amount: 7.00 },
    { id: "p3", label: "مواد تنظيف", amount: 47.00 },
    { id: "p4", label: "الهزاعمة", amount: 106.00 },
    { id: "p5", label: "نوافله اللحام", amount: 53.50 },
    { id: "p6", label: "حبيبه", amount: 37.15 },
    { id: "p7", label: "عهده / سيف", amount: 2.00 },
    { id: "p8", label: "فاين", amount: 15.80 },
    { id: "p9", label: "مخيمرا", amount: 145.60 },
    { id: "p10", label: "رياحنه", amount: 232.00 },
    { id: "p11", label: "مسلخ", amount: 26.00 },
    { id: "p12", label: "أكرم الله", amount: 2.00 },
    { id: "p13", label: "نوافله", amount: 2.00 },
    { id: "p14", label: "مياه", amount: 5.00 },
    { id: "p15", label: "بيض", amount: 26.00 },
    { id: "p16", label: "خبز كلابجي", amount: 24.30 },
    { id: "p17", label: "الشيخ / خبز", amount: 41.00 },
    { id: "p18", label: "خضار", amount: 21.50 },
    { id: "p19", label: "خبز بروستد", amount: 12.50 }
  ],

  // 2. مصاريف أخرى
  otherExpenses: [
    { id: "oe1", label: "يحيى / خالد", amount: 10.00 }
  ],

  // 3. أبو عبدالله
  abuAbdullah: [],

  // 4. معدات وصيانة
  equipment: [],

  // 5. إضافة ذمم تجار
  addMerchantReceivables: [
    { id: "amr1", label: "ابو خليل", amount: 40.00 },
    { id: "amr2", label: "نوافله", amount: 75.00 }
  ],

  // 6. الشقة
  apartment: [
    { id: "apt1", label: "اوردر", amount: 24.00 },
    { id: "apt2", label: "اوردر", amount: 25.75 }
  ],

  // 7. مصاريف إدارية
  adminExpenses: [
    { id: "adm1", label: "ضمان", amount: 30.00 },
    { id: "adm2", label: "تصاريح", amount: 7.00 }
  ],

  // 8. المحفظة الإلكترونية
  ewallet: [],

  // 9. سداد ذمم تجار
  payMerchantReceivables: [
    { id: "pmr1", label: "عهده / ابو الوفا", amount: 5.00 },
    { id: "pmr2", label: "ابو خليل", amount: 75.00 },
    { id: "pmr3", label: "عهده الاشقر", amount: 5.25 }
  ],

  // 10. يحيى
  yahya: [
    { id: "yh1", label: "ابو احمد", amount: 38.00 },
    { id: "yh2", label: "فتح", amount: 7.00 }
  ],

  // 11. بهارات
  spices: [],

  // 12. إضافة ذمم كاش
  addCashReceivables: [
    { id: "acr1", label: "فيزا", amount: 3.00 }
  ],

  // بيانات الكاش والمبيعات
  cashAndSales: {
    openingCash: 68.30,
    addedReceivablesDesc: "فيزا",
    addedReceivables: 3.00,
    paidOldReceivables: 0,
    sales: 1915.55,
    otherSales: 0
  },

  // استهلاك المطبخ
  kitchenConsumption: {
    skewer1: 65,
    skewer2: 40,
    supply: 0,
    return: 0,
    rice: 0,
    almond: 0.4,
    potato: 26
  },

  // جرد الإنتاج
  productionInventory: {
    broasted: 64,
    tikka: 53,
    zinger: 35.5
  },

  // الجرد الفعلي (الكاش المعدود والفيزا)
  actualInventory: {
    actualCash: 25.04,
    visa: 297.50,
    rt: 25.70,
    maestro: 4.00,
    priceDifference: 0.15,
    advances: 381.60,
    wallet: 0
  },

  // سجل حضور وسلف الموظفين (طبقاً للأصل مع تمييز OFF)
  employeeAdvances: [
    {
      id: "1",
      employeeName: "أبو جيش",
      startTime: "11:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 40.00,
      notes: "توقيع أبو جيش"
    },
    {
      id: "2",
      employeeName: "معتصم",
      startTime: "12:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 0,
      notes: "مواصلات"
    },
    {
      id: "3",
      employeeName: "أبو لطفي",
      startTime: "02:00",
      endTime: "08:00",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "4",
      employeeName: "محاميد",
      startTime: "08:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 25.00,
      notes: "توقيع محاميد"
    },
    {
      id: "5",
      employeeName: "سامر",
      startTime: "12:45",
      endTime: "07:30",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "6",
      employeeName: "أبو الوفا",
      startTime: "02:15",
      endTime: "07:30",
      hourlyRate: 0,
      amount: 15.00,
      notes: ""
    },
    {
      id: "7",
      employeeName: "سعد",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 6.00,
      notes: "عطلة (OFF)"
    },
    {
      id: "8",
      employeeName: "هياجنة",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 0,
      notes: "عطلة (OFF)"
    },
    {
      id: "9",
      employeeName: "قتيبة",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 0,
      notes: "عطلة (OFF)"
    },
    {
      id: "10",
      employeeName: "بدور",
      startTime: "11:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 100.00,
      notes: ""
    },
    {
      id: "11",
      employeeName: "امجد شحادات",
      startTime: "07:00",
      endTime: "03:30",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "12",
      employeeName: "عبيدة",
      startTime: "07:00",
      endTime: "03:30",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "13",
      employeeName: "سيف",
      startTime: "07:00",
      endTime: "03:30",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "14",
      employeeName: "خالد أبو عرة",
      startTime: "08:00",
      endTime: "04:30",
      hourlyRate: 0,
      amount: 30.00,
      notes: "توقيع خالد أبو عرة"
    },
    {
      id: "15",
      employeeName: "قصي",
      startTime: "03:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 20.00,
      notes: ""
    },
    {
      id: "16",
      employeeName: "خالد",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 0,
      notes: "عطلة (OFF)"
    },
    {
      id: "17",
      employeeName: "عز الدين",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 0,
      notes: "عطلة (OFF)"
    },
    {
      id: "18",
      employeeName: "الحمصي",
      startTime: "12:00",
      endTime: "06:30",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "19",
      employeeName: "قاسم",
      startTime: "03:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 3.00,
      notes: ""
    },
    {
      id: "20",
      employeeName: "حسن",
      startTime: "04:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 3.00,
      notes: ""
    },
    {
      id: "21",
      employeeName: "محمود الاشقر صالة",
      startTime: "05:00",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 6.00,
      notes: "خصم 5 مسلم 4"
    },
    {
      id: "22",
      employeeName: "محمد حريري",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 5.75,
      notes: "سلفة 5 و 75 قرش"
    },
    {
      id: "23",
      employeeName: "أبو مصعب",
      startTime: "09:00",
      endTime: "02:00",
      hourlyRate: 0,
      amount: 16.00,
      notes: "8 + 8 (من قبل العمل)"
    },
    {
      id: "24",
      employeeName: "علي نوفل",
      startTime: "09:00",
      endTime: "02:00",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    },
    {
      id: "25",
      employeeName: "عبد الله نوفل",
      startTime: "09:00",
      endTime: "02:00",
      hourlyRate: 0,
      amount: 7.40,
      notes: "سلفة 7.40"
    },
    {
      id: "26",
      employeeName: "محمود نابلسي",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 0,
      notes: "عطلة (OFF)"
    },
    {
      id: "27",
      employeeName: "عبد الله الحريري",
      startTime: "",
      endTime: "",
      hourlyRate: 0,
      amount: 0,
      notes: "عطلة (OFF)"
    },
    {
      id: "28",
      employeeName: "محمد طه",
      startTime: "05:20",
      endTime: "07:30",
      hourlyRate: 0,
      amount: 13.25,
      notes: "سلفة 13.25"
    },
    {
      id: "29",
      employeeName: "صالح مهيب",
      startTime: "09:20",
      endTime: "07:00",
      hourlyRate: 0,
      amount: 7.00,
      notes: "سلفة 7 د.أ"
    },
    {
      id: "30",
      employeeName: "أحمد سليم",
      startTime: "01:00",
      endTime: "07:30",
      hourlyRate: 0,
      amount: 0,
      notes: ""
    }
  ]
};
