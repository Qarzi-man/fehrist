export const tg = {
  appName: 'Қарзи ман',

  // Auth
  auth: {
    phone: 'Рақами телефон',
    password: 'Парол',
    confirmPassword: 'Тасдиқи парол',
    otp: 'Рамзи тасдиқ',
    otpSent: 'Рамз ба {phone} фиристода шуд',
    sendOtp: 'Рамз фиристодан',
    resendOtp: 'Такроран фиристодан',
    verify: 'Тасдиқ кардан',
    login: 'Даромадан',
    register: 'Сабти ном',
    logout: 'Баромадан',
    forgotPassword: 'Паролро фаромӯш кардед?',
    noAccount: 'Аккаунт надоред?',
    hasAccount: 'Аккаунт доред?',
    googleLogin: 'Тавассути Google',
    orDivider: 'ё',
    fullName: 'Номи пурра',
    businessName: 'Номи тиҷорат',
    passwordMin: 'Парол ҳадди аққал 8 аломат',
    passwordMatch: 'Паролҳо мувофиқат намекунанд',
    phoneInvalid: 'Рақами нодуруст',
    otpInvalid: 'Рамзи нодуруст',
    loginError: 'Рақам ё парол нодуруст',
    registerSuccess: 'Сабти ном бомуваффақият',
  },

  // Common
  common: {
    save: 'Сабт кардан',
    cancel: 'Бекор кардан',
    delete: 'Нест кардан',
    edit: 'Таҳрир',
    add: 'Илова кардан',
    close: 'Пӯшидан',
    back: 'Бозгашт',
    search: 'Ҷустуҷӯ',
    loading: 'Боргузорӣ...',
    error: 'Хато рух дод',
    confirm: 'Тасдиқ',
    yes: 'Ҳа',
    no: 'Не',
    total: 'Ҷамъ',
    amount: 'Маблағ',
    date: 'Сана',
    note: 'Изоҳ',
    phone: 'Телефон',
    name: 'Ном',
    status: 'Ҳолат',
    all: 'Ҳама',
    noData: 'Маълумот нест',
    required: 'Майдони ҳатмӣ',
  },

  // Nav
  nav: {
    home: 'Хона',
    debts: 'Қарзҳо',
    history: 'Таърих',
    settings: 'Танзимот',
    admin: 'Идора',
  },

  // Dashboard
  dashboard: {
    title: 'Хулоса',
    receivable: 'Ба ман бояд',
    payable: 'Ман бояд',
    overdue: 'Мӯҳлатгузашта',
    paid: 'Пардохташуда',
    activeDebts: 'Қарзҳои фаъол',
  },

  // Debts
  debts: {
    title: 'Қарзҳо',
    add: 'Қарз илова кардан',
    edit: 'Таҳрири қарз',
    receivable: 'Ба ман бояд',
    payable: 'Ман бояд',
    clientName: 'Номи мизоҷ',
    dueDate: 'Санаи охирин',
    paid: 'Пардохташуда',
    active: 'Фаъол',
    overdue: 'Мӯҳлатгузашта',
    deleteConfirm: 'Шумо мутмаин ҳастед?',
    receipt: 'Чек',
    noDebts: 'Қарзе нест',
    paidAmount: 'Пардохташуда',
    remaining: 'Боқимонда',
  },

  // Payments
  payments: {
    title: 'Пардохтҳо',
    add: 'Пардохт илова кардан',
    history: 'Таърихи пардохтҳо',
    amount: 'Маблағи пардохт',
    receipt: 'Чек (ихтиёрӣ)',
    noPayments: 'Пардохте нест',
  },

  // Settings
  settings: {
    title: 'Танзимот',
    language: 'Забон',
    profile: 'Профил',
    changePassword: 'Иваз кардани парол',
    changePhone: 'Иваз кардани телефон',
    developer: 'Барномасоз',
    offer: 'Оферта',
    version: 'Версия',
    currentPassword: 'Пароли ҷорӣ',
    newPassword: 'Пароли нав',
  },

  // Business
  business: {
    switch: 'Иваз кардани тиҷорат',
    create: 'Тиҷорати нав',
    name: 'Номи тиҷорат',
  },

  // Offer
  offer: {
    title: 'Шартномаи оферта',
    accept: 'Қабул мекунам',
    mustAccept: 'Барои идома додан шартномаро қабул кунед',
  },

  // Overdue history
  overdueHistory: {
    title: 'Таърихи қарздорони мӯҳлатгузашта',
  },
}

export type Translations = typeof tg
