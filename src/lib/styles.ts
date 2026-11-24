// Shared class strings for the terminal-style form controls.

export const sliderClass =
  "w-full h-px bg-rule appearance-none cursor-pointer rounded-none " +
  "[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-rule " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
  "[&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-webkit-slider-thumb]:-mt-[7px] " +
  "[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-rule " +
  "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0";

export const inputClass =
  "w-full bg-transparent border-0 border-b border-rule rounded-none px-0 py-2 text-base font-mono-tabular text-primary " +
  "focus:outline-none focus:border-primary transition-colors placeholder:text-label";
