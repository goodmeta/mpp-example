# MPP Implementation Observations

Protocol: Machine Payments Protocol (MPP)  
Spec: github.com/tempoxyz/mpp-specs  
Maintainers: Tempo + Stripe  
Built: 2026-04-24

---

## 1. Accept-Payment Header Is Elegant Discovery

MPP uses the `Accept-Payment` HTTP header to advertise payment methods. The agent reads the header, sees what's available, and knows where to send money. No session setup, no capability negotiation. One GET request gives the agent everything it needs.

Compare to ACP (create session → check status → discover handlers) or UCP (create_checkout → read available_methods). MPP's approach is the most HTTP-native.

## 2. Charge Intent Is the Simplest Payment Flow

Two HTTP calls: discover payment methods, submit a charge. No session lifecycle, no Allowance negotiation, no delegate payment step. The agent decides to pay, and it pays.

The tradeoff: no protocol-level spending constraints. ACP has Allowance (per-session budget cap). MPP has nothing — the charge amount is whatever the agent sends.

## 3. Authorize Intent Separates Hold from Charge

MPP's authorize intent (on development branch, PR #226) introduces a two-phase flow: authorize → charge. This enables subscription-style payments and payment holds. It's the most flexible payment model of any protocol, but also the most complex.

The open question (from our MPP #211 comment): what's the aggregate committed exposure when an agent holds active authorize intents at multiple servers? The spec doesn't address cross-server composition.

## 4. No Cross-Merchant Budget Tracking

Same gap as every other protocol. An agent can submit charges to multiple merchants independently. Each charge succeeds or fails based on the agent's wallet balance, not a protocol-enforced budget. MPP has no budget concept.

## 5. MPP vs x402

Both are settlement protocols, but different models:
- **x402**: pay-per-request, stateless, ERC-20 permits, facilitator settles
- **MPP**: intent-based, can be stateful (authorize), Tempo settles, supports multiple intents (charge, authorize, subscription, stream)

x402 is simpler for API access. MPP is more flexible for complex payment flows.
