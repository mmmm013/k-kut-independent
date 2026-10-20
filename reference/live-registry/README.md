# Live registry snapshot — read-only

Verbatim copies of the live type registries in Supabase project
`vwlzubxshjjonabpeagd`, taken 2026-10-20 with read-only `SELECT`s. Nothing
here is applied anywhere. `lib/kf/meants/live-registry.ts` is generated from
`snapshot-2026-10-20.json`, and a test keeps the two equal.

| File key | Live table | Rows |
|---|---|---|
| `kut_types` | `slds_kut_type_registry` | 11 |
| `sk_forms` | `gpmc_sk_form_factor_ee` | 8 |
| `mk_forms` | `gpmc_mk_form_factor_ee` | 4 |

Re-take it with the same query when the live tables change; never hand-edit it.
