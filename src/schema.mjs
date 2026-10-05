import fs from 'node:fs';

export function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function mergePrimitiveTypes(types) {
  const unique = [...new Set(types)];
  if (unique.length === 1) return unique[0];
  if (unique.every((type) => type === 'integer' || type === 'number')) return 'number';
  return unique.sort();
}

function inferObjectRows(rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
  const properties = {};
  const required = [];

  for (const key of keys) {
    const present = rows.filter((row) => Object.hasOwn(row, key));
    if (present.length === rows.length) required.push(key);
    properties[key] = inferSchema(present.map((row) => row[key]));
  }

  return { type: 'object', required, properties };
}

export function inferSchema(samples) {
  const values = Array.isArray(samples) ? samples : [samples];
  if (values.length === 0) return { type: 'unknown' };

  const nonNull = values.filter((value) => value !== null);
  const nullable = nonNull.length !== values.length;
  if (nonNull.length === 0) return { type: 'null' };

  const types = nonNull.map(valueType);
  const firstType = types[0];
  const sameType = types.every((type) => type === firstType);

  let schema;
  if (sameType && firstType === 'object') {
    schema = inferObjectRows(nonNull);
  } else if (sameType && firstType === 'array') {
    const items = nonNull.flat();
    schema = { type: 'array', items: inferSchema(items) };
  } else if (sameType) {
    schema = { type: firstType };
  } else {
    schema = { type: mergePrimitiveTypes(types) };
  }

  if (nullable) schema.nullable = true;
  return schema;
}

export function schemaFromJson(value) {
  if (
    Array.isArray(value)
    && value.every((item) => item && typeof item === 'object' && !Array.isArray(item))
  ) {
    return inferSchema(value);
  }
  return inferSchema([value]);
}

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function writeContract(path, schema, source) {
  fs.writeFileSync(path, JSON.stringify({ version: 1, source, schema }, null, 2) + '\n');
}
