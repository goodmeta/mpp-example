// MPP Merchant Server -TicketShop
// Implements the Machine Payments Protocol (MPP) charge intent
// Spec: github.com/tempoxyz/mpp-specs
//
// MPP is HTTP-native: the server advertises payment methods via the
// Accept-Payment header, and charges are submitted as POST requests.
// No session, no cart -just: pay this amount for this resource.
//
// Endpoints:
//   GET  /ticket            -returns ticket info + Accept-Payment header
//   POST /ticket/charge     -submit a charge intent

import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { logger } from "hono/logger"
import type { ChargeRequest, ChargeResponse, AcceptPayment } from "./types.js"

const PORT = Number(process.env.PORT ?? 3000)
const MERCHANT_WALLET = "0x1234567890abcdef1234567890abcdef12345678"
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base

// Product catalog (same TicketShop as ACP/UCP examples)
const TICKET = {
  id: "token2049-vip",
  title: "TOKEN2049 Singapore VIP Pass",
  price_cents: 29900, // $299.00
  tax_cents: 2691,    // 9% GST
  total_cents: 32591, // $325.91
  currency: "USDC",
}

// In-memory charge ledger
const charges = new Map<string, ChargeResponse>()

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
}

const app = new Hono()
app.use(logger())

// GET /ticket -ticket info + payment discovery via Accept-Payment header
app.get("/ticket", (c) => {
  const acceptPayment: AcceptPayment = {
    methods: [
      {
        type: "tempo",
        currency: USDC_CONTRACT,
        recipient: MERCHANT_WALLET,
      },
    ],
    description: `${TICKET.title} -$${(TICKET.total_cents / 100).toFixed(2)} ${TICKET.currency}`,
  }

  // MPP's discovery mechanism: the Accept-Payment header tells agents
  // what payment methods are available and where to send money.
  c.header("Accept-Payment", JSON.stringify(acceptPayment))

  return c.json({
    ticket: {
      id: TICKET.id,
      title: TICKET.title,
      price: TICKET.price_cents,
      tax: TICKET.tax_cents,
      total: TICKET.total_cents,
      currency: TICKET.currency,
    },
    payment: acceptPayment,
  })
})

// POST /ticket/charge -submit a charge intent
app.post("/ticket/charge", async (c) => {
  const body = await c.req.json<ChargeRequest>()

  if (body.intent !== "charge") {
    return c.json({ error: `Unsupported intent: ${body.intent}. Only "charge" is supported.` }, 400)
  }

  if (!body.amount || !body.currency || !body.recipient) {
    return c.json({ error: "Missing required fields: amount, currency, recipient" }, 400)
  }

  if (body.amount < TICKET.total_cents) {
    return c.json({
      error: `Insufficient amount: ${body.amount} < ${TICKET.total_cents} (${TICKET.currency})`,
    }, 400)
  }

  if (body.recipient !== MERCHANT_WALLET) {
    return c.json({ error: `Wrong recipient. Expected: ${MERCHANT_WALLET}` }, 400)
  }

  // In production, this would verify an on-chain transaction via Tempo.
  // Here we simulate the charge and return a receipt.
  const charge: ChargeResponse = {
    id: generateId("chg"),
    intent: "charge",
    status: "completed",
    amount: body.amount,
    currency: body.currency,
    recipient: body.recipient,
    transactionHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString(),
  }

  charges.set(charge.id, charge)
  console.log(`[MPP] Charge completed: ${charge.id} -$${(charge.amount / 100).toFixed(2)} ${charge.currency}`)

  return c.json(charge, 201)
})

// GET /ticket/charge/:id -lookup a charge
app.get("/ticket/charge/:id", (c) => {
  const charge = charges.get(c.req.param("id"))
  if (!charge) return c.json({ error: "Charge not found" }, 404)
  return c.json(charge)
})

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[MPP] TicketShop merchant server running on http://localhost:${PORT}`)
  console.log(`[MPP] Product: ${TICKET.title} -$${(TICKET.total_cents / 100).toFixed(2)}`)
  console.log(`[MPP] Payment: Tempo charge intent, ${TICKET.currency} on Base`)
})
