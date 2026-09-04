import { type ExecutionLoadedCase, type ExecutionSession } from "./execution";
export declare function createExecutionSession(loaded: ExecutionLoadedCase): ExecutionSession;
export declare function advanceExecutionTo(session: ExecutionSession, loaded: ExecutionLoadedCase, targetAsOf: number): ExecutionSession;
export declare function finalizeExecutionAtHorizon(session: ExecutionSession, loaded: ExecutionLoadedCase): ExecutionSession;
export declare function simulateExecutionToHorizon(loaded: ExecutionLoadedCase): ExecutionSession;
export declare function validateExecutionSessionIntegrity(session: ExecutionSession): void;
export declare function reconstructExecutionSessionFromEvents(session: ExecutionSession): ExecutionSession;
export declare function serializeExecutionSession(session: ExecutionSession): string;
export declare function deserializeExecutionSession(serialized: string): ExecutionSession;
