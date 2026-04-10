// Active public-facing dictionary.
//
// Mongolian is the only locale shipped today. English can be added
// later by:
//   1. Creating lib/i18n/en.ts mirroring the `Dictionary` shape.
//   2. Detecting the user's preferred locale from a cookie / header
//      / URL prefix at request time.
//   3. Re-exporting the selected dict from this file.
//
// For now, `t` is a static object so both server and client components
// can import it directly with zero runtime cost.

import { mn } from "./mn";

export const t = mn;

export type { Dictionary } from "./mn";
