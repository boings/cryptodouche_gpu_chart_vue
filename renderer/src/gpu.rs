use bytemuck::{Pod, Zeroable};
use once_cell::unsync::OnceCell;
use std::{num::NonZeroU64, rc::Rc};
use web_sys::HtmlCanvasElement;
use wgpu::{InstanceDescriptor, SurfaceTarget, util::DeviceExt};

const MAX_LINE_SERIES: usize = 8;

thread_local! {
    static RUNTIME: OnceCell<Rc<GpuRuntime>> = OnceCell::new();
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct Candle {
    pub t: f32,
    pub o: f32,
    pub h: f32,
    pub l: f32,
    pub c: f32,
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
pub struct LinePoint {
    pub x: f32,
    pub y: f32,
}

#[repr(C)]
#[derive(Clone, Copy, Pod, Zeroable)]
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
}

struct GpuRuntime {
    instance: wgpu::Instance,
    adapter: wgpu::Adapter,
    device: wgpu::Device,
    queue: wgpu::Queue,
    uniform_layout: wgpu::BindGroupLayout,
}

impl GpuRuntime {
    async fn shared() -> anyhow::Result<Rc<Self>> {
        if let Some(runtime) = RUNTIME.with(|cell| cell.get().cloned()) {
            return Ok(runtime);
        }

        let runtime = Rc::new(Self::new().await?);
        RUNTIME.with(|cell| {
            let _ = cell.set(runtime.clone());
        });
        Ok(runtime)
    }

    async fn new() -> anyhow::Result<Self> {
        let instance = wgpu::Instance::new(&InstanceDescriptor {
            backends: wgpu::Backends::all(),
            ..InstanceDescriptor::default()
        });

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: None,
                force_fallback_adapter: false,
            })
            .await
            .map_err(|error| anyhow::anyhow!("request_adapter failed: {error:?}"))?;

        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor {
                label: Some("cd_gpuchart_device"),
                required_features: wgpu::Features::empty(),
                required_limits: wgpu::Limits::downlevel_defaults(),
                memory_hints: wgpu::MemoryHints::Performance,
                trace: wgpu::Trace::Off,
            })
            .await?;

        let uniform_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("cd_gpuchart_uniform_layout"),
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::VERTEX_FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: NonZeroU64::new(std::mem::size_of::<Uniforms>() as u64),
                },
                count: None,
            }],
        });

        Ok(Self {
            instance,
            adapter,
            device,
            queue,
            uniform_layout,
        })
    }
}

struct LineSeries {
    buffer: wgpu::Buffer,
    uniform_buf: wgpu::Buffer,
    uniform_bind: wgpu::BindGroup,
    count: u32,
    capacity: u32,
    color: [f32; 4],
}

pub struct Renderer {
    canvas: HtmlCanvasElement,
    runtime: Rc<GpuRuntime>,
    surface: wgpu::Surface<'static>,
    config: wgpu::SurfaceConfiguration,
    pub clear_color: wgpu::Color,
    candle_buf: wgpu::Buffer,
    candle_capacity: u32,
    pub candle_count: u32,
    uniform_buf: wgpu::Buffer,
    uniform_cache: Uniforms,
    uniform_bind: wgpu::BindGroup,
    wick_pipeline: wgpu::RenderPipeline,
    body_pipeline: wgpu::RenderPipeline,
    line_pipeline: wgpu::RenderPipeline,
    line_series: Vec<Option<LineSeries>>,
}

impl Renderer {
    pub async fn new(canvas: HtmlCanvasElement) -> anyhow::Result<Self> {
        let runtime = GpuRuntime::shared().await?;
        let mut width = canvas.width();
        let mut height = canvas.height();
        if width == 0 || height == 0 {
            width = 800;
            height = 500;
            canvas.set_width(width);
            canvas.set_height(height);
        }

        let surface = runtime
            .instance
            .create_surface(SurfaceTarget::Canvas(canvas.clone()))?;
        let caps = surface.get_capabilities(&runtime.adapter);
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|format| format.is_srgb())
            .unwrap_or(caps.formats[0]);
        let alpha_mode = caps
            .alpha_modes
            .iter()
            .copied()
            .find(|mode| *mode == wgpu::CompositeAlphaMode::PreMultiplied)
            .unwrap_or(caps.alpha_modes[0]);

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            width,
            height,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode,
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&runtime.device, &config);

        let uniforms = Uniforms {
            scale_x: 1.0,
            scale_y: 1.0,
            translate_x: 0.0,
            translate_y: 0.0,
            px_per_unit_x: 1.0,
            px_per_unit_y: 1.0,
            candle_px: 4.0,
            wick_px: 1.0,
            line_r: 0.25,
            line_g: 0.65,
            line_b: 1.0,
            line_a: 1.0,
            bull_r: 0.32,
            bull_g: 0.85,
            bull_b: 0.52,
            bull_a: 1.0,
            bear_r: 0.85,
            bear_g: 0.32,
            bear_b: 0.32,
            bear_a: 1.0,
        };
        let (uniform_buf, uniform_bind) =
            Self::create_uniform_binding(runtime.as_ref(), uniforms, "cd_gpuchart_uniforms");

        let shader = runtime
            .device
            .create_shader_module(wgpu::ShaderModuleDescriptor {
                label: Some("cd_gpuchart_shaders"),
                source: wgpu::ShaderSource::Wgsl(include_str!("./shaders.wgsl").into()),
            });

        let candle_layout = wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<Candle>() as u64,
            step_mode: wgpu::VertexStepMode::Instance,
            attributes: &[
                wgpu::VertexAttribute {
                    offset: 0,
                    shader_location: 0,
                    format: wgpu::VertexFormat::Float32x4,
                },
                wgpu::VertexAttribute {
                    offset: 16,
                    shader_location: 1,
                    format: wgpu::VertexFormat::Float32,
                },
            ],
        };
        let line_layout = wgpu::VertexBufferLayout {
            array_stride: std::mem::size_of::<LinePoint>() as u64,
            step_mode: wgpu::VertexStepMode::Vertex,
            attributes: &[wgpu::VertexAttribute {
                offset: 0,
                shader_location: 0,
                format: wgpu::VertexFormat::Float32x2,
            }],
        };

        let pipeline_layout =
            runtime
                .device
                .create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                    label: Some("cd_gpuchart_pipeline_layout"),
                    bind_group_layouts: &[&runtime.uniform_layout],
                    push_constant_ranges: &[],
                });

        let body_pipeline =
            runtime
                .device
                .create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                    label: Some("cd_gpuchart_body_pipeline"),
                    layout: Some(&pipeline_layout),
                    cache: None,
                    vertex: wgpu::VertexState {
                        module: &shader,
                        entry_point: Some("vs_body"),
                        compilation_options: wgpu::PipelineCompilationOptions::default(),
                        buffers: &[candle_layout.clone()],
                    },
                    primitive: wgpu::PrimitiveState {
                        topology: wgpu::PrimitiveTopology::TriangleList,
                        ..Default::default()
                    },
                    depth_stencil: None,
                    multisample: wgpu::MultisampleState::default(),
                    fragment: Some(wgpu::FragmentState {
                        module: &shader,
                        entry_point: Some("fs_body"),
                        compilation_options: wgpu::PipelineCompilationOptions::default(),
                        targets: &[Some(wgpu::ColorTargetState {
                            format: config.format,
                            blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                            write_mask: wgpu::ColorWrites::ALL,
                        })],
                    }),
                    multiview: None,
                });

        let wick_pipeline =
            runtime
                .device
                .create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                    label: Some("cd_gpuchart_wick_pipeline"),
                    layout: Some(&pipeline_layout),
                    cache: None,
                    vertex: wgpu::VertexState {
                        module: &shader,
                        entry_point: Some("vs_wick"),
                        compilation_options: wgpu::PipelineCompilationOptions::default(),
                        buffers: &[candle_layout],
                    },
                    primitive: wgpu::PrimitiveState {
                        topology: wgpu::PrimitiveTopology::TriangleList,
                        ..Default::default()
                    },
                    depth_stencil: None,
                    multisample: wgpu::MultisampleState::default(),
                    fragment: Some(wgpu::FragmentState {
                        module: &shader,
                        entry_point: Some("fs_wick"),
                        compilation_options: wgpu::PipelineCompilationOptions::default(),
                        targets: &[Some(wgpu::ColorTargetState {
                            format: config.format,
                            blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                            write_mask: wgpu::ColorWrites::ALL,
                        })],
                    }),
                    multiview: None,
                });

        let line_pipeline =
            runtime
                .device
                .create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                    label: Some("cd_gpuchart_line_pipeline"),
                    layout: Some(&pipeline_layout),
                    cache: None,
                    vertex: wgpu::VertexState {
                        module: &shader,
                        entry_point: Some("vs_line"),
                        compilation_options: wgpu::PipelineCompilationOptions::default(),
                        buffers: &[line_layout],
                    },
                    primitive: wgpu::PrimitiveState {
                        topology: wgpu::PrimitiveTopology::LineStrip,
                        strip_index_format: None,
                        ..Default::default()
                    },
                    depth_stencil: None,
                    multisample: wgpu::MultisampleState::default(),
                    fragment: Some(wgpu::FragmentState {
                        module: &shader,
                        entry_point: Some("fs_line"),
                        compilation_options: wgpu::PipelineCompilationOptions::default(),
                        targets: &[Some(wgpu::ColorTargetState {
                            format: config.format,
                            blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                            write_mask: wgpu::ColorWrites::ALL,
                        })],
                    }),
                    multiview: None,
                });

        Ok(Self {
            canvas,
            runtime: runtime.clone(),
            surface,
            config,
            clear_color: wgpu::Color {
                r: 0.0,
                g: 0.0,
                b: 0.0,
                a: 0.0,
            },
            candle_buf: Self::empty_buffer(&runtime.device, "cd_gpuchart_candles"),
            candle_capacity: 0,
            candle_count: 0,
            uniform_buf,
            uniform_cache: uniforms,
            uniform_bind,
            wick_pipeline,
            body_pipeline,
            line_pipeline,
            line_series: (0..MAX_LINE_SERIES).map(|_| None).collect(),
        })
    }

    pub fn update_ohlc_from_bytes(&mut self, bytes: &[u8]) {
        let stride = std::mem::size_of::<Candle>();
        if bytes.is_empty() {
            self.candle_count = 0;
            return;
        }
        if bytes.len() % stride != 0 {
            return;
        }
        let count = (bytes.len() / stride) as u32;
        self.ensure_candle_capacity(count);
        self.candle_count = count;
        self.runtime.queue.write_buffer(&self.candle_buf, 0, bytes);
    }

    pub fn replace_at(&mut self, index: u32, bytes: &[u8]) {
        let stride = std::mem::size_of::<Candle>();
        if bytes.len() != stride || index >= self.candle_count {
            return;
        }
        self.runtime
            .queue
            .write_buffer(&self.candle_buf, (index as usize * stride) as u64, bytes);
    }

    pub fn append_at(&mut self, index: u32, bytes: &[u8]) {
        let stride = std::mem::size_of::<Candle>();
        if bytes.len() != stride {
            return;
        }
        let needed = index.saturating_add(1);
        self.ensure_candle_capacity(needed);
        self.candle_count = self.candle_count.max(needed);
        self.runtime
            .queue
            .write_buffer(&self.candle_buf, (index as usize * stride) as u64, bytes);
    }

    pub fn set_line_series(&mut self, slot: u32, bytes: &[u8], color: [f32; 4]) {
        let Some(slot) = self.slot_index(slot) else {
            return;
        };
        let stride = std::mem::size_of::<LinePoint>();
        if bytes.is_empty() {
            self.line_series[slot] = None;
            return;
        }
        if bytes.len() % stride != 0 {
            return;
        }

        let count = (bytes.len() / stride) as u32;
        let needs_new = self.line_series[slot]
            .as_ref()
            .map(|series| series.capacity < count)
            .unwrap_or(true);

        if needs_new {
            let line_uniforms = line_uniforms(self.uniform_cache, color);
            let (uniform_buf, uniform_bind) = Self::create_uniform_binding(
                self.runtime.as_ref(),
                line_uniforms,
                "cd_gpuchart_line_uniforms",
            );
            self.line_series[slot] = Some(LineSeries {
                buffer: self.create_vertex_buffer(count, stride, "cd_gpuchart_line_series"),
                uniform_buf,
                uniform_bind,
                count: 0,
                capacity: count,
                color,
            });
        }

        if let Some(series) = self.line_series[slot].as_mut() {
            series.count = count;
            series.color = color;
            self.runtime.queue.write_buffer(&series.buffer, 0, bytes);
        }
    }

    pub fn clear_line_series(&mut self, slot: u32) {
        if let Some(slot) = self.slot_index(slot) {
            self.line_series[slot] = None;
        }
    }

    pub fn resize(&mut self) {
        let width = self.canvas.width();
        let height = self.canvas.height();
        if width == 0 || height == 0 {
            return;
        }
        if width == self.config.width && height == self.config.height {
            return;
        }
        self.config.width = width;
        self.config.height = height;
        self.surface.configure(&self.runtime.device, &self.config);
    }

    pub fn frame(&mut self) {
        let Ok(frame) = self.surface.get_current_texture() else {
            self.surface.configure(&self.runtime.device, &self.config);
            return;
        };
        self.write_uniforms(self.uniform_cache);
        for series in self.line_series.iter().flatten() {
            let uniforms = line_uniforms(self.uniform_cache, series.color);
            self.runtime
                .queue
                .write_buffer(&series.uniform_buf, 0, bytemuck::bytes_of(&uniforms));
        }

        let view = frame
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder =
            self.runtime
                .device
                .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                    label: Some("cd_gpuchart_encoder"),
                });

        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("cd_gpuchart_render_pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(self.clear_color),
                        store: wgpu::StoreOp::Store,
                    },
                    depth_slice: None,
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
            });

            pass.set_bind_group(0, &self.uniform_bind, &[]);
            if self.candle_count > 0 {
                pass.set_vertex_buffer(0, self.candle_buf.slice(..));
                pass.set_pipeline(&self.body_pipeline);
                pass.draw(0..6, 0..self.candle_count);
                pass.set_pipeline(&self.wick_pipeline);
                pass.draw(0..6, 0..self.candle_count);
            }

            pass.set_pipeline(&self.line_pipeline);
            for series in self.line_series.iter().flatten() {
                if series.count < 2 {
                    continue;
                }
                pass.set_bind_group(0, &series.uniform_bind, &[]);
                pass.set_vertex_buffer(0, series.buffer.slice(..));
                pass.draw(0..series.count, 0..1);
            }
        }

        self.runtime.queue.submit(Some(encoder.finish()));
        frame.present();
    }

    pub fn set_view(&mut self, min_x: f32, max_x: f32, min_y: f32, max_y: f32) {
        if !min_x.is_finite() || !max_x.is_finite() || !min_y.is_finite() || !max_y.is_finite() {
            return;
        }
        let range_x = max_x - min_x;
        let range_y = max_y - min_y;
        if range_x <= 1e-6 || range_y <= 1e-6 {
            return;
        }

        let mut uniforms = self.uniform_cache;
        uniforms.scale_x = 2.0 / range_x;
        uniforms.scale_y = 2.0 / range_y;
        uniforms.translate_x = -1.0 - min_x * uniforms.scale_x;
        uniforms.translate_y = -1.0 - min_y * uniforms.scale_y;
        uniforms.px_per_unit_x = self.config.width.max(2) as f32 / range_x;
        uniforms.px_per_unit_y = self.config.height.max(2) as f32 / range_y;
        self.uniform_cache = uniforms;
        self.write_uniforms(uniforms);
    }

    pub fn set_style(&mut self, candle_px: f32, wick_px: f32) {
        let mut uniforms = self.uniform_cache;
        uniforms.candle_px = candle_px.max(0.5);
        uniforms.wick_px = wick_px.max(0.5);
        self.uniform_cache = uniforms;
        self.write_uniforms(uniforms);
    }

    pub fn set_candle_colors(&mut self, bull: [f32; 4], bear: [f32; 4]) {
        let mut uniforms = self.uniform_cache;
        uniforms.bull_r = bull[0].clamp(0.0, 1.0);
        uniforms.bull_g = bull[1].clamp(0.0, 1.0);
        uniforms.bull_b = bull[2].clamp(0.0, 1.0);
        uniforms.bull_a = bull[3].clamp(0.0, 1.0);
        uniforms.bear_r = bear[0].clamp(0.0, 1.0);
        uniforms.bear_g = bear[1].clamp(0.0, 1.0);
        uniforms.bear_b = bear[2].clamp(0.0, 1.0);
        uniforms.bear_a = bear[3].clamp(0.0, 1.0);
        self.uniform_cache = uniforms;
        self.write_uniforms(uniforms);
    }

    fn ensure_candle_capacity(&mut self, needed: u32) {
        if needed <= self.candle_capacity {
            return;
        }
        let capacity = needed.next_power_of_two().max(64);
        self.candle_buf = self.create_vertex_buffer(
            capacity,
            std::mem::size_of::<Candle>(),
            "cd_gpuchart_candles",
        );
        self.candle_capacity = capacity;
    }

    fn create_vertex_buffer(&self, count: u32, stride: usize, label: &str) -> wgpu::Buffer {
        let size = (count as usize * stride).max(4) as u64;
        self.runtime.device.create_buffer(&wgpu::BufferDescriptor {
            label: Some(label),
            size,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        })
    }

    fn empty_buffer(device: &wgpu::Device, label: &str) -> wgpu::Buffer {
        device.create_buffer(&wgpu::BufferDescriptor {
            label: Some(label),
            size: 4,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        })
    }

    fn create_uniform_binding(
        runtime: &GpuRuntime,
        uniforms: Uniforms,
        label: &'static str,
    ) -> (wgpu::Buffer, wgpu::BindGroup) {
        let uniform_buf = runtime
            .device
            .create_buffer_init(&wgpu::util::BufferInitDescriptor {
                label: Some(label),
                contents: bytemuck::bytes_of(&uniforms),
                usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
            });
        let uniform_bind = runtime
            .device
            .create_bind_group(&wgpu::BindGroupDescriptor {
                label: Some(label),
                layout: &runtime.uniform_layout,
                entries: &[wgpu::BindGroupEntry {
                    binding: 0,
                    resource: uniform_buf.as_entire_binding(),
                }],
            });
        (uniform_buf, uniform_bind)
    }

    fn write_uniforms(&self, uniforms: Uniforms) {
        self.runtime
            .queue
            .write_buffer(&self.uniform_buf, 0, bytemuck::bytes_of(&uniforms));
    }

    fn slot_index(&self, slot: u32) -> Option<usize> {
        let slot = slot as usize;
        (slot < MAX_LINE_SERIES).then_some(slot)
    }
}

fn line_uniforms(mut uniforms: Uniforms, color: [f32; 4]) -> Uniforms {
    uniforms.line_r = color[0];
    uniforms.line_g = color[1];
    uniforms.line_b = color[2];
    uniforms.line_a = color[3];
    uniforms
}
