export function stripUndefined<T>(obj: T): T {
  if (obj == null) return obj;
  if (Array.isArray(obj))
    return obj.map((v) =>
      v === undefined ? null : stripUndefined(v as any)
    ) as any;
  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v as any);
    }
    return out;
  }
  return obj;
}
