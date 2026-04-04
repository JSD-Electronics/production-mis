// Centralized sticker field value resolution used by Product preview/export,
// Operator sticker preview/print, and the Simulator.
//
// Goal: keep behavior stable while supporting:
// - multi-field barcode / QR bindings
// - {slug} placeholder replacement
// - direct device keys (snake or camel)
// - nested matches inside customFields
export const resolveStickerValue = (field: any, device: any) => {
  let baseValue = field?.value ?? "";

  const toCamelCase = (str: string) => {
    return String(str || "")
      .split("_")
      .map((word, idx) =>
        idx === 0
          ? String(word).toLowerCase()
          : String(word).charAt(0).toUpperCase() + String(word).slice(1),
      )
      .join("");
  };

  const normalize = (s: any) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const normalizeSourceField = (entry: any) => {
    if (!entry) return null;
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      return trimmed ? { slug: trimmed, name: trimmed } : null;
    }

    const slug = String(entry?.slug || entry?.value || entry?.name || "").trim();
    const name = String(entry?.name || entry?.label || entry?.slug || entry?.value || "").trim();

    if (!slug && !name) return null;

    return {
      slug: slug || name,
      name: name || slug,
    };
  };

  const sourceFields = Array.isArray(field?.sourceFields)
    ? field.sourceFields
        .map((entry: any) => normalizeSourceField(entry))
        .filter(Boolean)
    : [];

  const isDynamic =
    field?.type === "barcode" ||
    field?.type === "qrcode" ||
    field?.type === "dynamic_url" ||
    sourceFields.length > 0 ||
    !!field?.slug ||
    (typeof baseValue === "string" && baseValue.includes("{"));

  if (!isDynamic) return baseValue;
  if (!device) return baseValue;

  const customFields =
    device?.customFields || device?.custom_fields || device?.customfields;
  let customFieldsObj: any = null;
  if (customFields) {
    customFieldsObj = customFields;
    if (typeof customFieldsObj === "string") {
      try {
        customFieldsObj = JSON.parse(customFieldsObj);
      } catch {
        customFieldsObj = null;
      }
    }
  }

  const findDeep = (obj: any, targetSlug: string, targetCamel: string): any => {
    if (!obj || typeof obj !== "object") return undefined;

    const keys = Object.keys(obj);
    const normTarget = normalize(targetSlug);
    const foundKey = keys.find(
      (k) => k === targetSlug || k === targetCamel || normalize(k) === normTarget,
    );

    if (foundKey && typeof obj[foundKey] !== "object") return obj[foundKey];

    for (const k of keys) {
      if (typeof obj[k] === "object" && obj[k] !== null) {
        const deepVal = findDeep(obj[k], targetSlug, targetCamel);
        if (deepVal !== undefined) return deepVal;
      }
    }
    return undefined;
  };

  const findLoose = (obj: any, targetSlug: string, targetCamel: string): any => {
    if (!obj || typeof obj !== "object") return undefined;
    const keys = Object.keys(obj);
    const normTarget = normalize(targetSlug);
    const foundKey = keys.find((k) => {
      const normKey = normalize(k);
      return (
        k === targetSlug ||
        k === targetCamel ||
        normKey === normTarget ||
        normKey.startsWith(normTarget) ||
        normTarget.startsWith(normKey) ||
        normKey.includes(normTarget) ||
        normTarget.includes(normKey)
      );
    });

    if (foundKey && typeof obj[foundKey] !== "object") return obj[foundKey];

    for (const k of keys) {
      if (typeof obj[k] === "object" && obj[k] !== null) {
        const deepVal = findLoose(obj[k], targetSlug, targetCamel);
        if (deepVal !== undefined) return deepVal;
      }
    }
    return undefined;
  };

  const lookupValue = (slugLike: any, nameLike?: any) => {
    const lookupSlug = String(slugLike || "").trim();
    const formattedKey = lookupSlug ? toCamelCase(lookupSlug) : "";
    const fallbackName = String(nameLike || "").trim();

    let fieldValue =
      formattedKey && device ? device?.[formattedKey] : undefined;

    if ((fieldValue === undefined || fieldValue === "") && lookupSlug && lookupSlug !== "serial_no" && customFieldsObj) {
      const v = findDeep(customFieldsObj, lookupSlug, formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }
    if ((fieldValue === undefined || fieldValue === "") && device && lookupSlug) {
      const v = findDeep(device, lookupSlug, formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }

    if (lookupSlug !== "serial_no" && (fieldValue === undefined || fieldValue === "") && customFieldsObj) {
      const v = findLoose(customFieldsObj, lookupSlug || "", formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }
    if ((fieldValue === undefined || fieldValue === "") && device && lookupSlug) {
      const v = findLoose(device, lookupSlug, formattedKey);
      if (v !== undefined && v !== "") fieldValue = v;
    }

    if ((fieldValue === undefined || fieldValue === "") && fallbackName && customFieldsObj) {
      let v = findDeep(customFieldsObj, fallbackName, toCamelCase(fallbackName));
      if (v === undefined || v === "") {
        v = findLoose(customFieldsObj, fallbackName, toCamelCase(fallbackName));
      }
      if (v !== undefined && v !== "") fieldValue = v;
    }

    return fieldValue;
  };

  if ((field?.type === "barcode" || field?.type === "qrcode") && sourceFields.length > 0) {
    const combined = sourceFields
      .map((entry: any) => lookupValue(entry?.slug, entry?.name))
      .filter((value: any) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value: any) => String(value).trim());

    if (combined.length > 0) {
      return combined.join(",");
    }
  }

  if (typeof baseValue === "string" && baseValue.includes("{")) {
    const slugs = baseValue.match(/{[^{}]+}/g) || [];
    slugs.forEach((slugBox: string) => {
      const slug = slugBox.slice(1, -1);
      const val = lookupValue(slug, slug);
      baseValue = baseValue.replace(
        slugBox,
        val !== undefined && val !== "" ? String(val) : "",
      );
    });
    if (field?.type === "dynamic_url") return baseValue;
  }

  const lookupSlug =
    field?.slug || (typeof field?.value === "string" ? field.value.trim() : "");
  const fieldValue = lookupValue(lookupSlug, field?.name);

  if (fieldValue === undefined && lookupSlug && baseValue === lookupSlug) {
    return "";
  }
  return fieldValue !== undefined ? String(fieldValue) : baseValue || "";
};