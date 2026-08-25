import { type GpuChartAppearance } from "./appearance";
type __VLS_Props = {
    modelValue: GpuChartAppearance;
};
declare const _default: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    reset: () => any;
    "update:modelValue": (value: GpuChartAppearance) => any;
    save: () => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    onReset?: (() => any) | undefined;
    "onUpdate:modelValue"?: ((value: GpuChartAppearance) => any) | undefined;
    onSave?: (() => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
