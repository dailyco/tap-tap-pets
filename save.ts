import { loadFrom, type Loaded } from "./state";

// The save file: rows in a SQLite database beside the user's other app data, through raea's native calls. Read
// once when the game loads; written by the view when the state asks for a save (live play only, never in a render).

type NativeCall = (name: string, json: string) => string | undefined;
const native = (globalThis as { __raea_call?: NativeCall }).__raea_call;

function call(name: string, args: unknown): unknown {
  if (typeof native !== "function") return null;
  try {
    const out = native(name, JSON.stringify(args));
    return out === undefined ? null : JSON.parse(out);
  } catch {
    return null;
  }
}

/** where the save lives: the file TAP_TAP_PETS_SAVE names (a separate game, sh play.sh NAME), else beside the user's
 *  other app data; null where the host has neither (a sandbox) */
export function savePathFrom(custom: unknown, home: unknown): string | null {
  if (typeof custom === "string" && custom) return custom;
  return typeof home === "string" && home ? `${home}/Library/Application Support/pixel-pet-save.db` : null;
}
export const SAVE_PATH = savePathFrom(call("host.env", { name: "TAP_TAP_PETS_SAVE" }), call("host.env", { name: "HOME" }));

interface Sql { sets?: { rows: unknown[][] }[]; error?: string | null }
const sql = (q: string) => (SAVE_PATH ? (call("sqlite.exec", { path: SAVE_PATH, sql: q }) as Sql | null) : null);

/** the rows kept: the old single save ("main", read only, kept as a backup), the account, the settings, three slots */
export type SaveKey = "main" | "account" | "settings" | "slot1" | "slot2" | "slot3";

/** what a row holds as it was written (unchecked), or null when there's none */
export function readSlot(key: SaveKey): unknown {
  const made = sql("CREATE TABLE IF NOT EXISTS save (slot TEXT PRIMARY KEY, data TEXT NOT NULL, at INTEGER NOT NULL)");
  if (!made || made.error) return null;
  const got = sql(`SELECT data FROM save WHERE slot = '${key}'`);
  const text = got?.sets?.[0]?.rows?.[0]?.[0];
  if (typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** a row's data, kept */
export function writeSlot(key: SaveKey, value: unknown) {
  const data = JSON.stringify(value).replace(/'/g, "''");
  sql(`INSERT INTO save (slot, data, at) VALUES ('${key}', '${data}', ${Date.now()}) ON CONFLICT(slot) DO UPDATE SET data = excluded.data, at = excluded.at`);
}

/** a row, gone */
export function deleteSlot(key: SaveKey) {
  sql(`DELETE FROM save WHERE slot = '${key}'`);
}

/** everything kept, checked (and the old single save moved into slot 1 when no slot has anything yet) */
export const readAll = (): Loaded => loadFrom(readSlot);
