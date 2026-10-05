#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { compareSchema } from './compare.mjs';
import { readJson, schemaFromJson, writeContract } from './schema.mjs';

function usage() {
  console.log('aortal snapshot <payload.json> --out <contract.json>');
  console.log('aortal check <payload.json> --contract <contract.json>');
}

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export function run(argv = process.argv.slice(2)) {
  const [command, input] = argv;
  if (!command || !input) {
    usage();
    return 1;
  }

  let payload;
  try {
    payload = readJson(input);
  } catch (error) {
    console.error(`error: ${error.message}`);
    return 1;
  }

  const schema = schemaFromJson(payload);

  if (command === 'snapshot') {
    const out = option(argv, '--out');
    if (!out) {
      console.error('error: --out is required');
      return 1;
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    writeContract(out, schema, path.basename(input));
    console.log(`saved contract: ${out}`);
    return 0;
  }

  if (command === 'check') {
    const contractPath = option(argv, '--contract');
    if (!contractPath) {
      console.error('error: --contract is required');
      return 1;
    }

    let contract;
    try {
      contract = readJson(contractPath);
    } catch (error) {
      console.error(`error: ${error.message}`);
      return 1;
    }

    if (contract.version !== 1 || !contract.schema) {
      console.error('error: unsupported or invalid contract');
      return 1;
    }

    const result = compareSchema(contract.schema, schema);
    console.log(`contract: ${contractPath}`);
    console.log(`payload:  ${input}\n`);

    if (result.breaking.length) {
      console.log('BREAKING');
      for (const item of result.breaking) console.log(`- ${item}`);
      console.log();
    }
    if (result.warnings.length) {
      console.log('WARNING');
      for (const item of result.warnings) console.log(`- ${item}`);
      console.log();
    }

    if (!result.breaking.length && !result.warnings.length) {
      console.log('OK — contract unchanged');
    } else if (!result.breaking.length) {
      console.log('OK — no breaking changes');
    }

    return result.breaking.length ? 2 : 0;
  }

  usage();
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = run();
}
