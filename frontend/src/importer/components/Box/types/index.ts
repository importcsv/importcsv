export type BoxVariant = "fluid" | "mid" | "wide" | "space-l" | "space-mid" | "space-none" | "bg-shade";

export type BoxProps = JSX.HTMLAttributes<HTMLDivElement> & {
    variants?: BoxVariant[];
};

export const boxVariants: BoxVariant[] = ["fluid", "mid", "wide", "space-l", "space-mid", "space-none", "bg-shade"];
