#!/usr/bin/env node
import { buildTrainerCorpus, CorpusBuildError } from "./trainer-corpus/builder.mjs";
import { parseCliOptions, usage } from "./trainer-corpus/options.mjs";

try {
  const options = await parseCliOptions(process.argv.slice(2));
  const result = await buildTrainerCorpus(options);
  process.stdout.write(`${JSON.stringify({
    corpusId: result.corpusId,
    cases: result.bundles.length,
    outputDir: options.outputDir,
    auditFingerprint: result.audit.auditFingerprint,
  })}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  if (error instanceof CorpusBuildError) process.stderr.write(`${JSON.stringify(error.issues)}\n`);
  process.stderr.write(`${usage()}\n`);
  process.exitCode = 1;
}
