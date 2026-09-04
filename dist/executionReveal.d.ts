import type { ExecutionEvent, ExecutionResult, ExecutionSession } from "./execution";
import type { ReplayOutcomeEnvelope, ReplaySession } from "./replaySession";
export declare const EXECUTION_REVEAL_ENVELOPE_SCHEMA_VERSION: "execution-reveal-envelope.1";
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
export declare function revealExecutionOutcome(input: {
    replaySession: ReplaySession;
    replayOutcomeEnvelope: ReplayOutcomeEnvelope;
    executionSession: ExecutionSession;
    revealedAt: number;
}): ExecutionRevealEnvelope;
