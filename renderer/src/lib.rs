use wasm_bindgen::prelude::*;
use web_sys::HtmlCanvasElement;

mod gpu;

use gpu::Renderer;

#[wasm_bindgen(start)]
pub fn wasm_bootstrap() {
    console_error_panic_hook::set_once();
    let _ = wasm_logger::init(wasm_logger::Config::default());
}

#[wasm_bindgen]
pub struct GpuChart {
    renderer: Option<Renderer>,
}

#[wasm_bindgen]
pub async fn create_chart(canvas: HtmlCanvasElement) -> Result<GpuChart, JsValue> {
    let renderer = Renderer::new(canvas).await.map_err(err_js)?;
    Ok(GpuChart {
        renderer: Some(renderer),
    })
}

#[wasm_bindgen]
impl GpuChart {
    pub fn push_ohlc(&mut self, bytes: &[u8]) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.update_ohlc_from_bytes(bytes);
        }
    }

    pub fn replace_at(&mut self, index: u32, bytes: &[u8]) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.replace_at(index, bytes);
        }
    }

    pub fn append_at(&mut self, index: u32, bytes: &[u8]) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.append_at(index, bytes);
        }
    }

    pub fn set_view(&mut self, min_x: f32, max_x: f32, min_y: f32, max_y: f32) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.set_view(min_x, max_x, min_y, max_y);
        }
    }

    pub fn resize(&mut self) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.resize();
        }
    }

    pub fn render(&mut self) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.frame();
        }
    }

    pub fn set_clear(&mut self, r: f32, g: f32, b: f32, a: f32) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.clear_color = wgpu::Color {
                r: r.into(),
                g: g.into(),
                b: b.into(),
                a: a.into(),
            };
        }
    }

    pub fn set_style(&mut self, candle_px: f32, wick_px: f32) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.set_style(candle_px, wick_px);
        }
    }

    pub fn set_candle_colors(
        &mut self,
        bull_r: f32,
        bull_g: f32,
        bull_b: f32,
        bull_a: f32,
        bear_r: f32,
        bear_g: f32,
        bear_b: f32,
        bear_a: f32,
    ) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.set_candle_colors(
                [bull_r, bull_g, bull_b, bull_a],
                [bear_r, bear_g, bear_b, bear_a],
            );
        }
    }

    pub fn set_line_series(&mut self, slot: u32, bytes: &[u8], r: f32, g: f32, b: f32, a: f32) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.set_line_series(slot, bytes, [r, g, b, a]);
        }
    }

    pub fn clear_line_series(&mut self, slot: u32) {
        if let Some(renderer) = self.renderer.as_mut() {
            renderer.clear_line_series(slot);
        }
    }

    pub fn debug_counts(&self) -> u32 {
        self.renderer
            .as_ref()
            .map(|renderer| renderer.candle_count)
            .unwrap_or(0)
    }
}

impl Drop for GpuChart {
    fn drop(&mut self) {
        self.renderer.take();
    }
}

fn err_js<E: std::fmt::Display>(error: E) -> JsValue {
    JsValue::from_str(&format!("{error}"))
}
