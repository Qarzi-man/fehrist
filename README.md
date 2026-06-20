# Daftarcha — учёт долгов

**Домен:** daftarcha.tj  
**Деплой:** Railway  
**Языки:** TJ / RU / UZ / EN

## Структура

```
frontend/   React + Vite + Tailwind
backend/    Node.js + Express + PostgreSQL
```

## Backend

```bash
cd backend
cp .env.example .env   # заполни переменные
npm install
npm run dev
```

### API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/send-otp | Отправить OTP |
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET  | /api/auth/me | Текущий пользователь |
| GET  | /api/clients | Список клиентов |
| POST | /api/clients | Создать клиента |
| PUT  | /api/clients/:id | Обновить клиента |
| DELETE | /api/clients/:id | Удалить клиента |
| GET  | /api/debts | Список долгов |
| POST | /api/debts | Создать долг |
| PUT  | /api/debts/:id | Обновить долг |
| DELETE | /api/debts/:id | Удалить долг |
| GET  | /api/debts/:id/repayments | Выплаты по долгу |
| POST | /api/debts/:id/repayments | Добавить выплату |
