function asTypes(type) {
  return Array.isArray(type) ? type : [type];
}

function typeCompatible(expected, current) {
  const expectedTypes = asTypes(expected);
  const currentTypes = asTypes(current);
  return currentTypes.every(
    (type) => expectedTypes.includes(type) || (expectedTypes.includes('number') && type === 'integer'),
  );
}

export function compareSchema(expected, current, path = '$') {
  const breaking = [];
  const warnings = [];

  if (!typeCompatible(expected.type, current.type)) {
    breaking.push(
      `${path}: type changed (${JSON.stringify(expected.type)} -> ${JSON.stringify(current.type)})`,
    );
    return { breaking, warnings };
  }

  if (expected.type === 'object' && current.type === 'object') {
    const expectedProps = expected.properties ?? {};
    const currentProps = current.properties ?? {};
    const required = expected.required ?? [];

    for (const key of required) {
      if (!(key in currentProps)) breaking.push(`${path}.${key}: required field missing`);
    }

    for (const [key, expectedChild] of Object.entries(expectedProps)) {
      if (!(key in currentProps)) continue;
      const child = compareSchema(expectedChild, currentProps[key], `${path}.${key}`);
      breaking.push(...child.breaking);
      warnings.push(...child.warnings);
    }

    for (const key of Object.keys(currentProps)) {
      if (!(key in expectedProps)) warnings.push(`${path}.${key}: new field`);
    }
  }

  if (expected.type === 'array' && current.type === 'array') {
    const child = compareSchema(
      expected.items ?? { type: 'unknown' },
      current.items ?? { type: 'unknown' },
      `${path}[]`,
    );
    breaking.push(...child.breaking);
    warnings.push(...child.warnings);
  }

  if (expected.nullable !== true && current.nullable === true) {
    warnings.push(`${path}: value became nullable`);
  }

  return { breaking, warnings };
}
