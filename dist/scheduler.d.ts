type RenderCallback = () => void;
export declare function scheduleGpuRender(callback: RenderCallback): void;
export declare function cancelScheduledGpuRender(callback: RenderCallback): void;
export {};
