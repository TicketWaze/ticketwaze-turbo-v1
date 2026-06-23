export interface UserCashoutRequest {
  cashoutRequestId: string
  userId: string
  moncashNumber: string
  amount: number
  status: "PENDING" | "SUCCESSFUL" | "FAILED"
  moncashTransactionId: string | null
  reference: string
  reason: string | null
  createdAt: string
  updatedAt: string
}
