struct Uniforms {
  scale_x: f32,
  scale_y: f32,
  translate_x: f32,
  translate_y: f32,
  px_per_unit_x: f32,
  px_per_unit_y: f32,
  candle_px: f32,
  wick_px: f32,
  line_r: f32,
  line_g: f32,
  line_b: f32,
  line_a: f32,
  bull_r: f32,
  bull_g: f32,
  bull_b: f32,
  bull_a: f32,
  bear_r: f32,
  bear_g: f32,
  bear_b: f32,
  bear_a: f32,
};

@group(0) @binding(0) var<uniform> U: Uniforms;

struct CandleIn {
  @location(0) tohl: vec4<f32>,
  @location(1) c: f32,
  @builtin(vertex_index) vid: u32,
};

struct PointIn {
  @location(0) xy: vec2<f32>,
};

struct VsOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) up: f32,
};

struct LineOut {
  @builtin(position) pos: vec4<f32>,
};

fn data_to_ndc(x: f32, y: f32) -> vec4<f32> {
  let nx = x * U.scale_x + U.translate_x;
  let ny = y * U.scale_y + U.translate_y;
  return vec4<f32>(nx, ny, 0.0, 1.0);
}

@vertex
fn vs_wick(input: CandleIn) -> VsOut {
  let t = input.tohl.x;
  let high = input.tohl.z;
  let low = input.tohl.w;
  let slot_px = max(U.px_per_unit_x, 1e-6);
  let target_wick_px = slot_px * clamp(U.wick_px / 18.0, 0.04, 0.18);
  let max_wick_px = min(slot_px * 0.5, 18.0);
  let min_wick_px = min(max(U.wick_px, 0.5), max_wick_px);
  let wick_px = min(max(target_wick_px, min_wick_px), max_wick_px);
  let half = min((wick_px * 0.5) / slot_px, 0.25);

  let is_right = (input.vid == 1u) || (input.vid == 2u) || (input.vid == 4u);
  let is_top = (input.vid == 2u) || (input.vid == 4u) || (input.vid == 5u);
  let x = select(t - half, t + half, is_right);
  let y = select(low, high, is_top);

  var out: VsOut;
  out.pos = data_to_ndc(x, y);
  out.up = select(0.0, 1.0, input.c >= input.tohl.y);
  return out;
}

@fragment
fn fs_wick(in: VsOut) -> @location(0) vec4<f32> {
  let bull = vec4<f32>(U.bull_r, U.bull_g, U.bull_b, U.bull_a);
  let bear = vec4<f32>(U.bear_r, U.bear_g, U.bear_b, U.bear_a);
  return select(bear, bull, in.up >= 0.5);
}

@vertex
fn vs_body(input: CandleIn) -> VsOut {
  let t = input.tohl.x;
  let o = input.tohl.y;
  let c = input.c;
  let slot_px = max(U.px_per_unit_x, 1e-6);
  let fill_ratio = clamp(U.candle_px / 6.0, 0.18, 0.92);
  let target_body_px = slot_px * fill_ratio;
  let max_body_px = min(slot_px * 0.92, 96.0);
  let min_body_px = min(max(U.candle_px, 1.0), max_body_px);
  let body_px = min(max(target_body_px, min_body_px), max_body_px);
  var half = (body_px * 0.5) / slot_px;
  half = min(half, 0.49);

  let is_right = (input.vid & 1u) == 1u;
  let x = select(t - half, t + half, is_right);
  let is_c = (input.vid == 2u) || (input.vid == 4u) || (input.vid == 5u);
  let y = select(o, c, is_c);

  var out: VsOut;
  out.pos = data_to_ndc(x, y);
  out.up = select(0.0, 1.0, c >= o);
  return out;
}

@fragment
fn fs_body(in: VsOut) -> @location(0) vec4<f32> {
  let bull = vec4<f32>(U.bull_r, U.bull_g, U.bull_b, U.bull_a);
  let bear = vec4<f32>(U.bear_r, U.bear_g, U.bear_b, U.bear_a);
  return select(bear, bull, in.up >= 0.5);
}

@vertex
fn vs_line(input: PointIn) -> LineOut {
  var out: LineOut;
  out.pos = data_to_ndc(input.xy.x, input.xy.y);
  return out;
}

@fragment
fn fs_line(_in: LineOut) -> @location(0) vec4<f32> {
  return vec4<f32>(U.line_r, U.line_g, U.line_b, U.line_a);
}
