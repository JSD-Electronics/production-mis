type NormalizedSourceField = {
  slug: string;
  name: string;
};

const normalizeText = (value: any) => String(value || "").trim();

export const normalizeSourceFieldEntry = (
  entry: any,
): NormalizedSourceField | null => {
  if (!entry) return null;

  if (typeof entry === "string") {
    const trimmed = normalizeText(entry);
    return trimmed ? { slug: trimmed, name: trimmed } : null;
  }

  const slug = normalizeText(entry?.slug || entry?.value || entry?.name);
  const name = normalizeText(
    entry?.name || entry?.label || entry?.slug || entry?.value,
  );

  if (!slug && !name) return null;

  return {
    slug: slug || name,
    name: name || slug,
  };
};

export const normalizeSourceFields = (entries: any[] = []): NormalizedSourceField[] => {
  if (!Array.isArray(entries)) return [];

  const normalized: NormalizedSourceField[] = [];
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();

  entries.forEach((entry) => {
    const normalizedEntry = normalizeSourceFieldEntry(entry);
    if (!normalizedEntry) return;

    const slugKey = normalizedEntry.slug.toLowerCase();
    const nameKey = normalizedEntry.name.toLowerCase();

    if (seenSlugs.has(slugKey) || seenNames.has(nameKey)) return;

    seenSlugs.add(slugKey);
    seenNames.add(nameKey);
    normalized.push(normalizedEntry);
  });

  return normalized;
};

export const normalizeFieldSourceFieldsForEncoding = (
  field: any,
  options: { includeFallback?: boolean } = {},
) => {
  const explicit = normalizeSourceFields(
    Array.isArray(field?.sourceFields) ? field.sourceFields : [],
  );
  if (explicit.length > 0) return explicit;

  if (!options.includeFallback) return [];

  const fallback = normalizeSourceFieldEntry({
    slug: field?.slug,
    name: field?.name,
  });

  return fallback ? [fallback] : [];
};

export const normalizeStagesStickerSourceFields = (stages: any[] = []) => {
  if (!Array.isArray(stages)) return [];

  return stages.map((stage) => {
    if (!Array.isArray(stage?.subSteps)) return stage;

    return {
      ...stage,
      subSteps: stage.subSteps.map((subStep: any) => {
        if (!Array.isArray(subStep?.printerFields)) return subStep;

        return {
          ...subStep,
          printerFields: subStep.printerFields.map((printerField: any) => {
            if (!Array.isArray(printerField?.fields)) return printerField;

            return {
              ...printerField,
              fields: printerField.fields.map((field: any) => {
                const isScanFieldType =
                  field?.type === "barcode" || field?.type === "qrcode";
                const hasSourceFields = Array.isArray(field?.sourceFields);

                if (!isScanFieldType && !hasSourceFields) return field;

                const nextSourceFields = normalizeFieldSourceFieldsForEncoding(
                  field,
                  { includeFallback: isScanFieldType },
                );
                const nextSlug =
                  nextSourceFields.length > 0
                    ? nextSourceFields[0].slug
                    : field?.slug;

                return {
                  ...field,
                  sourceFields: nextSourceFields,
                  slug: nextSlug,
                };
              }),
            };
          }),
        };
      }),
    };
  });
};
