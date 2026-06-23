import type { Lang } from '../store/langStore'

export interface LegalSection { title: string; text: string }
export interface LegalDoc { title: string; updated: string; sections: LegalSection[] }

export const oferta: Record<Lang, LegalDoc> = {
  ru: {
    title: 'Публичная оферта',
    updated: 'Последнее обновление: 23 июня 2026 г.',
    sections: [
      {
        title: '1. Предмет договора',
        text: 'Настоящая публичная оферта является официальным предложением ИП Исмонов Ғафур Фарҳодович (далее — Исполнитель) о заключении договора на использование сервиса учёта долгов Daftarcha (далее — Сервис). Акцептом настоящей оферты является факт регистрации в Сервисе. С момента регистрации Пользователь считается принявшим условия настоящего Договора.',
      },
      {
        title: '2. Стороны',
        text: 'Исполнитель: ИП Исмонов Ғафур Фарҳодович, ЕИН 0331564805, Республика Таджикистан, сайт: daftarcha.tj, email: niyatorzuzoda@gmail.com.\n\nПользователь: физическое или юридическое лицо, прошедшее регистрацию в Сервисе и принявшее условия настоящей оферты.',
      },
      {
        title: '3. Услуги',
        text: 'Исполнитель предоставляет Пользователю доступ к веб-сервису Daftarcha, который включает:\n— учёт дебиторской и кредиторской задолженности;\n— ведение базы клиентов и контрагентов;\n— аналитику и отчёты по долгам;\n— управление несколькими бизнесами в одном аккаунте;\n— доступ для сотрудников с ограниченными правами.',
      },
      {
        title: '4. Оплата',
        text: 'Базовый тариф Сервиса предоставляется бесплатно. Дополнительные платные функции могут быть введены с предварительным уведомлением Пользователей не менее чем за 14 дней. Продолжение использования Сервиса после введения платных тарифов означает согласие с новыми условиями.',
      },
      {
        title: '5. Ответственность',
        text: 'Исполнитель прилагает все усилия для обеспечения бесперебойной работы Сервиса, однако не гарантирует его непрерывную доступность. Исполнитель не несёт ответственности за косвенные убытки, возникшие в результате использования или невозможности использования Сервиса. Сервис предоставляется «как есть». Пользователь самостоятельно несёт ответственность за достоверность вводимых данных.',
      },
      {
        title: '6. Реквизиты',
        text: 'ИП Исмонов Ғафур Фарҳодович\nЕИН: 0331564805\nEmail: niyatorzuzoda@gmail.com\nСайт: daftarcha.tj\nРеспублика Таджикистан',
      },
    ],
  },

  tj: {
    title: 'Офертаи ҷамъиятӣ',
    updated: 'Нав карда шуд: 23 июни 2026',
    sections: [
      {
        title: '1. Мавзӯи шартнома',
        text: 'Офертаи ҷамъиятии мазкур пешниҳоди расмии ЯФ Исмонов Ғафур Фарҳодович (минбаъд — Иҷрокунанда) барои бастани шартнома оид ба истифодаи хизматрасонии ҳисобдории қарзҳои Daftarcha (минбаъд — Хизматрасонӣ) мебошад. Ба унвони қабули оферта сабти ном дар Хизматрасонӣ ҳисоб карда мешавад.',
      },
      {
        title: '2. Тарафҳо',
        text: 'Иҷрокунанда: ЯФ Исмонов Ғафур Фарҳодович, РМС 0331564805, Ҷумҳурии Тоҷикистон, сомона: daftarcha.tj, email: niyatorzuzoda@gmail.com.\n\nКорбар: шахси воқеӣ ё ҳуқуқӣ, ки дар Хизматрасонӣ ба қайд гирифта шудааст.',
      },
      {
        title: '3. Хизматҳо',
        text: 'Иҷрокунанда ба Корбар дастрасиро ба хизматрасонии Daftarcha фароҳам меорад, ки дар бар мегирад:\n— ҳисобдории дебиторӣ ва кредиторӣ;\n— нигоҳдории пойгоҳи муштариён;\n— таҳлил ва ҳисоботҳо оид ба қарзҳо;\n— идоракунии якчанд тиҷоратҳо дар як аккаунт.',
      },
      {
        title: '4. Пардохт',
        text: 'Тарифи асосии Хизматрасонӣ ройгон пешниҳод карда мешавад. Функсияҳои иловагии пулакӣ метавонанд бо огоҳкунии пешакии на камтар аз 14 рӯз ҷорӣ карда шаванд.',
      },
      {
        title: '5. Масъулият',
        text: 'Иҷрокунанда барои зараровариҳои ғайримустақим, ки дар натиҷаи истифода ё ғайриимкон будани истифодаи Хизматрасонӣ ба миён омадаанд, масъул нест. Хизматрасонӣ «чунон ки ҳаст» пешниҳод карда мешавад.',
      },
      {
        title: '6. Маълумоти тамос',
        text: 'ЯФ Исмонов Ғафур Фарҳодович\nРМС: 0331564805\nEmail: niyatorzuzoda@gmail.com\nСомона: daftarcha.tj\nҶумҳурии Тоҷикистон',
      },
    ],
  },

  uz: {
    title: 'Ommaviy oferta',
    updated: 'Yangilangan: 23 iyun 2026',
    sections: [
      {
        title: '1. Shartnoma mavzusi',
        text: 'Ushbu ommaviy oferta YaTT Ismonov G\'afur Farhodoviching (keyingi o\'rinlarda — Ijrochi) Daftarcha qarz hisobi xizmatidan (keyingi o\'rinlarda — Xizmat) foydalanish bo\'yicha shartnoma tuzish to\'g\'risidagi rasmiy taklifidir. Xizmatda ro\'yxatdan o\'tish ofertani qabul qilish hisoblanadi.',
      },
      {
        title: '2. Tomonlar',
        text: 'Ijrochi: YaTT Ismonov G\'afur Farhodovich, STIR 0331564805, Tojikiston Respublikasi, sayt: daftarcha.tj, email: niyatorzuzoda@gmail.com.\n\nFoydalanuvchi: Xizmatda ro\'yxatdan o\'tgan jismoniy yoki yuridik shaxs.',
      },
      {
        title: '3. Xizmatlar',
        text: 'Ijrochi Foydalanuvchiga Daftarcha veb-xizmatiga kirish imkonini beradi, bu quyidagilarni o\'z ichiga oladi:\n— debitorlik va kreditorlik qarzlarini hisobga olish;\n— mijozlar bazasini yuritish;\n— qarzlar bo\'yicha tahlil va hisobotlar;\n— bitta akkauntda bir nechta bizneslarni boshqarish.',
      },
      {
        title: '4. To\'lov',
        text: 'Xizmatning asosiy tarifi bepul taqdim etiladi. Qo\'shimcha pullik funksiyalar kamida 14 kun oldin foydalanuvchilarni oldindan xabardor qilgan holda kiritilishi mumkin.',
      },
      {
        title: '5. Javobgarlik',
        text: 'Ijrochi Xizmatdan foydalanish yoki undan foydalanib bo\'lmasligi natijasida kelib chiqqan bilvosita zararlar uchun javobgar emas. Xizmat "bor holida" taqdim etiladi.',
      },
      {
        title: '6. Rekvizitlar',
        text: 'YaTT Ismonov G\'afur Farhodovich\nSTIR: 0331564805\nEmail: niyatorzuzoda@gmail.com\nSayt: daftarcha.tj\nTojikiston Respublikasi',
      },
    ],
  },

  en: {
    title: 'Public Offer Agreement',
    updated: 'Last updated: June 23, 2026',
    sections: [
      {
        title: '1. Subject of Agreement',
        text: 'This Public Offer Agreement is an official proposal by IE Ismonov Ghafur Farhodovich (hereinafter — Provider) to enter into an agreement for use of the Daftarcha debt tracking service (hereinafter — Service). Registration in the Service constitutes acceptance of this offer.',
      },
      {
        title: '2. Parties',
        text: 'Provider: IE Ismonov Ghafur Farhodovich, TIN 0331564805, Republic of Tajikistan, website: daftarcha.tj, email: niyatorzuzoda@gmail.com.\n\nUser: any individual or legal entity who has registered in the Service and accepted the terms of this offer.',
      },
      {
        title: '3. Services',
        text: 'The Provider grants the User access to the Daftarcha web service, which includes:\n— tracking receivables and payables;\n— client and counterparty database;\n— debt analytics and reports;\n— managing multiple businesses under one account;\n— employee access with limited permissions.',
      },
      {
        title: '4. Payment',
        text: 'The basic tier of the Service is provided free of charge. Additional paid features may be introduced with at least 14 days\' prior notice to Users. Continued use of the Service after the introduction of paid tiers constitutes acceptance of the new terms.',
      },
      {
        title: '5. Liability',
        text: 'The Provider makes best efforts to ensure uninterrupted operation of the Service but does not guarantee continuous availability. The Provider is not liable for indirect damages arising from use or inability to use the Service. The Service is provided "as is". Users are solely responsible for the accuracy of data entered.',
      },
      {
        title: '6. Details',
        text: 'IE Ismonov Ghafur Farhodovich\nTIN: 0331564805\nEmail: niyatorzuzoda@gmail.com\nWebsite: daftarcha.tj\nRepublic of Tajikistan',
      },
    ],
  },
}

export const privacy: Record<Lang, LegalDoc> = {
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Последнее обновление: 23 июня 2026 г.',
    sections: [
      {
        title: '1. Какие данные мы собираем',
        text: 'При использовании Сервиса Daftarcha мы можем собирать следующие данные:\n— номер телефона (обязательно);\n— имя и фамилия (по желанию);\n— адрес электронной почты (по желанию);\n— данные о бизнесах, клиентах и долгах, которые вы вводите в Сервис;\n— технические данные: IP-адрес, тип браузера, время сессий.',
      },
      {
        title: '2. Как мы используем данные',
        text: 'Собранные данные используются исключительно для:\n— идентификации пользователя и обеспечения безопасного входа;\n— обеспечения работы функций Сервиса (учёт долгов, клиенты, аналитика);\n— отправки SMS-уведомлений (коды OTP, уведомления о приглашениях);\n— улучшения качества и функциональности Сервиса.',
      },
      {
        title: '3. Передача данных третьим лицам',
        text: 'Мы не продаём, не передаём и не раскрываем ваши персональные данные третьим лицам, за исключением следующих случаев:\n— поставщик SMS-услуг Payomchi (получает только номер телефона и текст сообщения для доставки SMS);\n— случаи, прямо предусмотренные законодательством Республики Таджикистан.',
      },
      {
        title: '4. SMS-уведомления (Payomchi)',
        text: 'Для отправки SMS-сообщений Сервис использует провайдера Payomchi (api.payomchi.tj). При отправке SMS Payomchi получает номер телефона получателя и текст сообщения. Хранение и обработка этих данных осуществляется в соответствии с политикой конфиденциальности Payomchi. Мы используем Payomchi для:\n— отправки кодов подтверждения (OTP) при регистрации;\n— уведомлений о приглашениях в бизнес.',
      },
      {
        title: '5. Хранение данных',
        text: 'Ваши данные хранятся на защищённых серверах платформы Railway (США). Все передачи данных между вашим устройством и Сервисом защищены протоколом TLS/SSL. Мы храним ваши данные в течение всего срока действия вашего аккаунта. При удалении аккаунта данные удаляются в течение 30 дней.',
      },
      {
        title: '6. Контакты',
        text: 'По вопросам конфиденциальности и защиты данных обращайтесь:\nEmail: niyatorzuzoda@gmail.com\nСайт: daftarcha.tj\nИП Исмонов Ғафур Фарҳодович, Республика Таджикистан',
      },
    ],
  },

  tj: {
    title: 'Сиёсати махфият',
    updated: 'Нав карда шуд: 23 июни 2026',
    sections: [
      {
        title: '1. Кадом маълумотҳоро ҷамъоварӣ мекунем',
        text: 'Ҳангоми истифодаи Хизматрасонии Daftarcha мо метавонем маълумоти зеринро ҷамъоварӣ кунем:\n— рақами телефон (ҳатмӣ);\n— ном ва насаб (ихтиёрӣ);\n— суроғаи почтаи электронӣ (ихтиёрӣ);\n— маълумот дар бораи тиҷоратҳо, муштариён ва қарзҳое, ки шумо ворид мекунед.',
      },
      {
        title: '2. Чӣ тавр маълумотро истифода мебарем',
        text: 'Маълумоти ҷамъоваришуда танҳо барои:\n— муайян кардани корбар ва таъмини вуруди бехатар;\n— таъмини кори функсияҳои Хизматрасонӣ;\n— фиристодани SMS-огоҳиҳо (рамзҳои OTP, огоҳиҳо дар бораи даъватномаҳо);\n— беҳтар кардани сифат ва функсионалии Хизматрасонӣ истифода бурда мешавад.',
      },
      {
        title: '3. Интиқоли маълумот ба ашхоси сеюм',
        text: 'Мо маълумоти шахсии шуморо ба ашхоси сеюм намефурӯшем ва намедиҳем, ба ғайр аз:\n— провайдери SMS Payomchi (танҳо рақами телефон ва матни паём мегирад);\n— ҳолатҳое, ки бевосита аз ҷониби қонунгузории Ҷумҳурии Тоҷикистон пешбинӣ шудааст.',
      },
      {
        title: '4. SMS-огоҳиҳо (Payomchi)',
        text: 'Барои фиристодани SMS Хизматрасонӣ провайдери Payomchi (api.payomchi.tj)-ро истифода мебарад. Ҳангоми фиристодани SMS Payomchi рақами телефони гиранда ва матни паёмро мегирад. Мо Payomchi-ро барои фиристодани рамзҳои тасдиқ (OTP) ва огоҳиҳо дар бораи даъватномаҳо истифода мебарем.',
      },
      {
        title: '5. Нигоҳдории маълумот',
        text: 'Маълумоти шумо дар серверҳои ҳифзшудаи платформаи Railway (ИМА) нигоҳ дошта мешавад. Ҳамаи интиқоли маълумот бо протоколи TLS/SSL ҳифз карда мешавад. Мо маълумоти шуморо то вақте ки аккаунти шумо фаъол аст нигоҳ медорем.',
      },
      {
        title: '6. Тамос',
        text: 'Оид ба масъалаҳои махфият муроҷиат кунед:\nEmail: niyatorzuzoda@gmail.com\nСомона: daftarcha.tj\nЯФ Исмонов Ғафур Фарҳодович, Ҷумҳурии Тоҷикистон',
      },
    ],
  },

  uz: {
    title: 'Maxfiylik siyosati',
    updated: 'Yangilangan: 23 iyun 2026',
    sections: [
      {
        title: '1. Qanday ma\'lumotlar yig\'amiz',
        text: 'Daftarcha xizmatidan foydalanishda biz quyidagi ma\'lumotlarni yig\'ishimiz mumkin:\n— telefon raqami (majburiy);\n— ism va familiya (ixtiyoriy);\n— elektron pochta manzili (ixtiyoriy);\n— siz kiritgan bizneslar, mijozlar va qarzlar to\'g\'risidagi ma\'lumotlar.',
      },
      {
        title: '2. Ma\'lumotlardan qanday foydalanamiz',
        text: 'Yig\'ilgan ma\'lumotlar faqat quyidagi maqsadlarda ishlatiladi:\n— foydalanuvchini aniqlash va xavfsiz kirishni ta\'minlash;\n— xizmat funksiyalarini ta\'minlash;\n— SMS xabarnomalarini yuborish (OTP kodlari, taklif xabarnomalari);\n— xizmat sifatini yaxshilash.',
      },
      {
        title: '3. Uchinchi shaxslarga ma\'lumot uzatish',
        text: 'Biz shaxsiy ma\'lumotlaringizni uchinchi shaxslarga sotmaymiz yoki bermaymiz, quyidagilardan tashqari:\n— SMS provayderi Payomchi (faqat telefon raqami va xabar matnini oladi);\n— Tojikiston Respublikasi qonunchiligida bevosita ko\'zda tutilgan holatlar.',
      },
      {
        title: '4. SMS xabarnomalar (Payomchi)',
        text: 'SMS yuborish uchun xizmat Payomchi provayderidan (api.payomchi.tj) foydalanadi. SMS yuborishda Payomchi faqat qabul qiluvchining telefon raqami va xabar matnini oladi. Biz Payomchidan tasdiqlash kodlarini (OTP) va taklif xabarnomalarini yuborish uchun foydalanamiz.',
      },
      {
        title: '5. Ma\'lumotlarni saqlash',
        text: 'Sizning ma\'lumotlaringiz Railway platformasining (AQSh) himoyalangan serverlarida saqlanadi. Barcha ma\'lumot uzatishlari TLS/SSL protokoli bilan himoyalangan. Biz ma\'lumotlaringizni akkauntingiz faol bo\'lgan davr ichida saqlaymiz.',
      },
      {
        title: '6. Aloqa',
        text: 'Maxfiylik masalalari bo\'yicha murojaat qiling:\nEmail: niyatorzuzoda@gmail.com\nSayt: daftarcha.tj\nYaTT Ismonov G\'afur Farhodovich, Tojikiston Respublikasi',
      },
    ],
  },

  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: June 23, 2026',
    sections: [
      {
        title: '1. What Data We Collect',
        text: 'When using the Daftarcha Service, we may collect the following data:\n— phone number (required);\n— full name (optional);\n— email address (optional);\n— data about businesses, clients, and debts you enter into the Service;\n— technical data: IP address, browser type, session timestamps.',
      },
      {
        title: '2. How We Use Data',
        text: 'Collected data is used exclusively for:\n— user identification and secure authentication;\n— providing Service features (debt tracking, clients, analytics);\n— sending SMS notifications (OTP codes, invitation notifications);\n— improving Service quality and functionality.',
      },
      {
        title: '3. Sharing with Third Parties',
        text: 'We do not sell, transfer, or disclose your personal data to third parties, except:\n— SMS service provider Payomchi (receives only the phone number and message text for delivery);\n— cases expressly required by the laws of the Republic of Tajikistan.',
      },
      {
        title: '4. SMS Notifications (Payomchi)',
        text: 'The Service uses Payomchi (api.payomchi.tj) to deliver SMS messages. When sending SMS, Payomchi receives the recipient\'s phone number and message text. Storage and processing of this data is governed by Payomchi\'s own privacy policy. We use Payomchi for:\n— sending OTP verification codes during registration;\n— business invitation notifications.',
      },
      {
        title: '5. Data Storage',
        text: 'Your data is stored on secured servers of the Railway platform (USA). All data transmissions between your device and the Service are protected by TLS/SSL. We retain your data for as long as your account is active. Upon account deletion, data is removed within 30 days.',
      },
      {
        title: '6. Contact',
        text: 'For privacy and data protection inquiries:\nEmail: niyatorzuzoda@gmail.com\nWebsite: daftarcha.tj\nIE Ismonov Ghafur Farhodovich, Republic of Tajikistan',
      },
    ],
  },
}
