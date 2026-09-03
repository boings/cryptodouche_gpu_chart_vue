import type { ExecutionEvent, ExecutionResult, ExecutionSession } from "./execution";
import { REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION } from "./replay";
import type { ReplayOutcomeEnvelope, ReplaySession } from "./replaySession";
import { canonicalHash, immutableJsonClone } from "./serialization";

export const EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION = "execution-reveal-envelope.1" as const;

export interface ExecutionRevealEnvelope {
  schemaVersion: typeof EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION;
  id: string;
  replaySessionId: string;
  replayOutcomeEnvelopeId: string;
  executionSessionId: string;
  revealedAt: number;
  caseOutcomeEnvelope: ReplayOutcomeEnvelope;
  executionResult: ExecutionResult;
  executionEvents: ExecutionEvent[];
}

export function revealExecutionOutcome(input: {
  replaySession: ReplaySession;
  replayOutcomeEnvelope: ReplayOutcomeEnvelope;
  executionSession: ExecutionSession;
  revealedAt: number;
}): ExecutionRevealEnvelope {
  const { replaySession, replayOutcomeEnvelope, executionSession } = input;
  const { id: _outcomeId, ...outcomeDefinition } = replayOutcomeEnvelope;
  if (
    replayOutcomeEnvelope.schemaVersion !== REPLAY_OUTCOME_ENVELOPE_SCHEMA_VERSION ||
    replayOutcomeEnvelope.id !== `replay-outcome:${canonicalHash(outcomeDefinition).slice("fnv1a64:".length)}` ||
    replaySession.state !== "Revealed" ||
    replaySession.revealedOutcomeEnvelopeId == null ||
    replaySession.revealedOutcomeEnvelopeId !== replayOutcomeEnvelope.id ||
    replayOutcomeEnvelope.sessionId !== replaySession.id
  ) throw new Error("Execution outcome requires the replay session's explicit reveal boundary");
  if (
    executionSession.replaySessionId !== replaySession.id ||
    executionSession.result == null ||
    !["Closed", "EntryExpired", "OpenAtHorizon", "Ambiguous", "Failed"].includes(executionSession.state)
  ) throw new Error("Execution outcome is missing or belongs to another replay session");
  if (executionSession.result.executionSessionId !== executionSession.id) {
    throw new Error("Execution result identity mismatch");
  }
  if (!Number.isFinite(input.revealedAt) || input.revealedAt < 0) {
    throw new RangeError("Execution reveal time must be a valid timestamp");
  }
  const definition = {
    schemaVersion: EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION,
    replaySessionId: replaySession.id,
    replayOutcomeEnvelopeId: replayOutcomeEnvelope.id,
    executionSessionId: executionSession.id,
    revealedAt: input.revealedAt,
    caseOutcomeEnvelope: replayOutcomeEnvelope,
    executionResult: executionSession.result,
    executionEvents: executionSession.executionEvents,
  };
  return immutableJsonClone({
    ...definition,
    id: `execution-reveal:${canonicalHash(definition).slice("fnv1a64:".length)}`,
  });
}
