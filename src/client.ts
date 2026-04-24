// MPP Agent Client — buys a conference ticket via MPP charge intent
//
// Flow:
//   1. GET /ticket — discover payment methods via Accept-Payment header
//   2. POST /ticket/charge — submit charge intent with amount + recipient
//
// MPP is the simplest commerce protocol for direct payments.
// No session, no cart, no Allowance. Just: pay and get a receipt.

const BASE_URL = `http://localhost:${process.env.PORT ?? 3000}`

function log(step: string, data: unknown) {
  console.log(`\n${"─".repeat(60)}`)
  console.log(`STEP: ${step}`)
  console.log("─".repeat(60))
  console.log(JSON.stringify(data, null, 2))
}

async function buyTicket() {
  console.log("MPP Agent — Buying TOKEN2049 VIP Pass")
  console.log("Protocol: Machine Payments Protocol (MPP)")
  console.log("Intent: charge\n")

  // ── Step 1: Discover payment methods ──────────────────────────────────
  const ticketRes = await fetch(`${BASE_URL}/ticket`)
  const acceptPaymentHeader = ticketRes.headers.get("Accept-Payment")
  const ticketData = await ticketRes.json() as Record<string, unknown>

  log("1. GET /ticket (discover payment)", {
    ticket: ticketData["ticket"],
    "Accept-Payment header": acceptPaymentHeader ? JSON.parse(acceptPaymentHeader) : null,
  })

  const ticket = ticketData["ticket"] as { total: number; currency: string }
  const payment = ticketData["payment"] as { methods: Array<{ recipient: string; currency: string }> }

  // OBSERVATION: MPP uses the Accept-Payment header for payment discovery.
  // The agent reads the header, sees what methods are available, and knows
  // exactly where to send money. No session setup, no capability negotiation.
  // Compare to ACP (session + Allowance) or UCP (MCP tool calls).

  // ── Step 2: Submit charge intent ──────────────────────────────────────
  const chargeRes = await fetch(`${BASE_URL}/ticket/charge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "charge",
      amount: ticket.total,
      currency: ticket.currency,
      recipient: payment.methods[0].recipient,
      memo: "TOKEN2049 Singapore VIP Pass",
      metadata: {
        buyer: "alice@example.com",
        product: "token2049-vip",
      },
    }),
  })
  const charge = await chargeRes.json() as Record<string, unknown>

  log("2. POST /ticket/charge (submit charge intent)", charge)

  // OBSERVATION: MPP charge is a single request. No session to create,
  // no fulfillment to update, no delegate payment step.
  // The tradeoff: no per-transaction spending constraints (no Allowance).
  // The agent decides to pay, and it pays. Budget enforcement must come
  // from outside the protocol.

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60))
  console.log("CHARGE COMPLETE (MPP)")
  console.log("═".repeat(60))
  console.log(`Charge ID:  ${charge["id"]}`)
  console.log(`Amount:     $${((charge["amount"] as number) / 100).toFixed(2)} ${charge["currency"]}`)
  console.log(`Status:     ${charge["status"]}`)
  console.log(`Tx Hash:    ${charge["transactionHash"]}`)
  console.log("\nSee OBSERVATIONS.md for implementation notes.")
}

buyTicket().catch((err) => {
  console.error("Agent failed:", err)
  process.exit(1)
})
