// MPP (Machine Payments Protocol) types
// Spec: github.com/tempoxyz/mpp-specs
// Intents: charge, authorize (dev branch), subscription, stream

export type ChargeStatus = "pending" | "completed" | "failed"

export type ChargeRequest = {
  intent: "charge"
  amount: number       // minor currency units (cents)
  currency: string     // e.g. "USDC"
  recipient: string    // merchant wallet address
  memo?: string
  metadata?: Record<string, string>
}

export type ChargeResponse = {
  id: string
  intent: "charge"
  status: ChargeStatus
  amount: number
  currency: string
  recipient: string
  transactionHash?: string
  createdAt: string
}

export type PaymentMethod = {
  type: "tempo"
  currency: string     // token contract address (e.g. USDC on Base)
  recipient: string    // merchant wallet
}

// Accept-Payment header (MPP's discovery mechanism)
export type AcceptPayment = {
  methods: PaymentMethod[]
  description?: string
}
