type RenderCallback = () => void;

const dirty = new Set<RenderCallback>();
let frame = 0;

export function scheduleGpuRender(callback: RenderCallback) {
  dirty.add(callback);
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const callbacks = Array.from(dirty);
    dirty.clear();
    for (const render of callbacks) render();
  });
}

export function cancelScheduledGpuRender(callback: RenderCallback) {
  dirty.delete(callback);
}
