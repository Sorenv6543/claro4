# Phase Review: 01-01-PLAN.md

This document consolidates independent AI reviews of the Phase 01-01 implementation plan.

## Gemini Review
**Verdict**: FLAG 🚩

### Executive Summary
The plan identifies the core multi-tenant requirements but contains a critical security flaw regarding role management and a performance anti-pattern in the Row Level Security (RLS) implementation. Specifically, the policy allowing users to "update their own profile" without field-level restrictions allows for trivial privilege escalation to the `admin` role.

### Technical Critique
- **RLS Performance**: The proposed task uses subqueries in RLS (e.g., `WHERE tenant_id = (SELECT tenant_id FROM profiles...)`), which will significantly impact performance during row scans as the database grows.
- **Tenant Onboarding**: There is no explicit handling of the "Chicken and Egg" problem (how the first tenant record is created when a user signs up).
- **Type Generation**: Ensure the local Supabase environment is running before executing `gen types`.

### Security Audit
- **Privilege Escalation**: **CRITICAL RISK**. Users MUST be restricted from updating their own `role` or `tenant_id`. The current plan allows any user to grant themselves admin privileges.
- **Tenant Isolation**: `tenant_id` should be enforced via database triggers or immutable RLS checks to prevent users from inserting data into a different tenant's scope.

### Missing Considerations
- **Session Context**: Lack of a centralized mechanism (e.g., a session variable or cached function) to retrieve the current user's `tenant_id` without repeated subqueries.
- **Indexing**: All multi-tenant tables require B-tree indices on `tenant_id` for efficient filtering.

### Actionable Recommendations
1.  **Harden Profile Update Policy**: Implement column-level restrictions for the `UPDATE` policy on `profiles` (allow only `full_name`, block `role` and `tenant_id`).
2.  **Optimize RLS with Security Definer Functions**: Create a `get_my_tenant_id()` function with `SECURITY DEFINER` that caches the result for the session to improve performance.
3.  **Auto-populate tenant_id**: Implement a database trigger to automatically set `tenant_id` on all new records based on the user's profile, rather than relying on the client to provide it.
4.  **Add Indexes**: Explicitly include B-tree indexes for `tenant_id` on all multi-tenant tables.
