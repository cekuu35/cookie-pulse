# Cookie Pulse

Cookie Pulse is a small open-source cApp submission candidate for the Cookie Chain bounty. It demonstrates wallet connection, Cookie Chain RPC reads, a user-signed memo transaction, confirmation handling, and reproducible transaction evidence.

## Run locally

Serve this directory with any static server, for example:

```bash
python -m http.server 4173
```

Open `http://localhost:4173`. A Nightly-compatible Solana wallet is required for the signing demo. The app does not custody keys and does not send a transaction without a user signature.

## Submission status

This is an MVP draft. It has not been deployed, submitted, or claimed as a winner. Before submission, verify the Cookie Chain RPC, wallet adapter compatibility, deployment URL, and the bounty's current deadline and channel.
