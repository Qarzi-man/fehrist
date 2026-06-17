export type Lang = 'tg' | 'ru' | 'uz' | 'en'

export type DebtType = 'receivable' | 'payable'
export type DebtStatus = 'active' | 'overdue' | 'paid'

export interface Business {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Debt {
  id: string
  business_id: string
  client_name: string
  phone?: string
  amount: number
  paid_amount: number
  due_date: string
  note?: string
  debt_type: DebtType
  status: DebtStatus
  receipt_url?: string
  created_at: string
}

export interface Payment {
  id: string
  debt_id: string
  amount: number
  note?: string
  receipt_url?: string
  created_at: string
}

export interface UserProfile {
  id: string
  phone: string
  email?: string
  full_name?: string
  offer_accepted_at?: string
}
