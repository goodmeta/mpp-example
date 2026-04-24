# MPP Example

Minimal implementation of the [Machine Payments Protocol (MPP)](https://github.com/tempoxyz/mpp-specs) charge intent.

Built to understand MPP from the inside. Implements both sides: a merchant server and an agent client.

## What's here

- `src/server.ts` — MPP merchant (TicketShop), selling TOKEN2049 VIP passes via charge intent
- `src/client.ts` — AI agent that discovers payment methods and submits a charge
- `src/types.ts` — MPP types (ChargeRequest, AcceptPayment, etc.)
- `OBSERVATIONS.md` — What we learned implementing this from scratch

## Run it

```bash
npm install

# Terminal 1: start the merchant server
npm run server

# Terminal 2: run the agent
npm run client
```

## Key observations

See [OBSERVATIONS.md](./OBSERVATIONS.md) for the full findings. The most important:

**MPP is the simplest direct payment protocol.** Two HTTP calls: discover payment methods (Accept-Payment header), submit a charge intent. No session, no cart, no Allowance. The tradeoff: no per-transaction spending constraints at the protocol level.

**The cross-merchant budget gap persists.** MPP has no budget enforcement mechanism. An agent with a charge intent can pay any amount to any recipient. Budget tracking is entirely external to the protocol.

## Protocol

MPP defines payment intents (charge, authorize, subscription, stream) over HTTP. This implementation covers the charge intent — the simplest: pay and get a receipt.

Compare with [acp-example](https://github.com/goodmeta/acp-example) (REST checkout), [ucp-example](https://github.com/goodmeta/ucp-example) (MCP checkout), [ap2-example](https://github.com/goodmeta/ap2-example) (authorization), and [x402-example](https://github.com/goodmeta/x402-example) (pay-per-request).
