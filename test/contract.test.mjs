import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSchema } from '../src/compare.mjs';
import { schemaFromJson } from '../src/schema.mjs';

test('array samples infer required object fields', () => {
  const schema = schemaFromJson([
    { id: 1, name: 'A', email: 'a@example.com' },
    { id: 2, name: 'B', email: 'b@example.com' },
  ]);
  assert.deepEqual(schema.required, ['email', 'id', 'name']);
  assert.equal(schema.properties.id.type, 'integer');
});

test('missing required field is breaking', () => {
  const expected = schemaFromJson([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  const current = schemaFromJson([{ id: 3 }, { id: 4 }]);
  const result = compareSchema(expected, current);
  assert.ok(result.breaking.some((item) => item.includes('$.name: required field missing')));
});

test('new field is warning, not breaking', () => {
  const expected = schemaFromJson([{ id: 1 }]);
  const current = schemaFromJson([{ id: 2, plan: 'pro' }]);
  const result = compareSchema(expected, current);
  assert.equal(result.breaking.length, 0);
  assert.ok(result.warnings.includes('$.plan: new field'));
});

test('integer to string is breaking', () => {
  const expected = schemaFromJson([{ id: 1 }]);
  const current = schemaFromJson([{ id: '1' }]);
  const result = compareSchema(expected, current);
  assert.ok(result.breaking.some((item) => item.includes('$.id: type changed')));
});
