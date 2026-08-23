# Deferred Work

## Deferred from: code review (2026-08-22)

- **Universal RLS Policy Bypass** [supabase/schema.sql:153-240] — Pre-existing database migration defining open RLS policies (USING (true) / WITH CHECK (true)). Needs dedicated Supabase Auth multi-tenant RLS migration.
- **Plaintext Password Storage for Team Members** [supabase/schema.sql:105, src/services/userService.js:74, src/context/AuthContext.jsx:125-138] — Passwords for non-gestor staff (COZINHA, CAIXA) stored in plaintext in usuarios_restaurante. Requires backend migration to use Supabase Auth identities or cryptographic hashing (bcrypt/argon2).
- **Client-Side Pricing Trust** [src/services/pedidoService.js:32-60, src/context/CartContext.jsx] — criarPedido relies on client-provided prices. Requires backend PostgreSQL trigger or Edge Function RPC to recalculate totals against authoritative produtos table.
- **Concurrency Gap During Checkout** [src/pages/CaixaPOS.jsx:203-240, src/services/comandaService.js:275-315] — Checkouts operate on client snapshot without pessimistic/optimistic concurrency lock on open orders.
- **Synthetic Gestor Fallback on Public Restaurant Query** [src/context/AuthContext.jsx:42-62] — Fallback in AuthContext grants in-memory GESTOR profile on email match against estaurantes.
