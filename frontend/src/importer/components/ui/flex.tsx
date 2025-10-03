import { h, JSX } from 'preact';
import { forwardRef } from 'preact/compat'
import { cn } from "../../../utils/cn"

interface FlexProps extends JSX.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  wrap?: boolean
  gap?: number | string
}

const FlexComponent = forwardRef<HTMLDivElement, FlexProps>(
  ({ className, direction = "row", align, justify, wrap, gap, style, ...props }, ref): JSX.Element => {
    const flexClasses = cn(
      "flex",
      {
        "flex-row": direction === "row",
        "flex-col": direction === "column",
        "flex-row-reverse": direction === "row-reverse",
        "flex-col-reverse": direction === "column-reverse",
        "items-start": align === "start",
        "items-center": align === "center",
        "items-end": align === "end",
        "items-stretch": align === "stretch",
        "items-baseline": align === "baseline",
        "justify-start": justify === "start",
        "justify-center": justify === "center",
        "justify-end": justify === "end",
        "justify-between": justify === "between",
        "justify-around": justify === "around",
        "justify-evenly": justify === "evenly",
        "flex-wrap": wrap,
      },
      className
    )

    const gapStyle = gap ? { gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap } : {}
    const combinedStyle = { ...gapStyle, ...((style as object) || {}) } as JSX.CSSProperties

    return (
      <div
        ref={ref}
        className={flexClasses}
        style={combinedStyle}
        {...props}
      />
    )
  }
)
FlexComponent.displayName = "Flex"

const Flex = FlexComponent as unknown as (props: FlexProps & { ref?: any }) => JSX.Element

const BoxComponent = forwardRef<HTMLDivElement, JSX.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref): JSX.Element => {
    return <div ref={ref} className={cn(className)} {...props} />
  }
)
BoxComponent.displayName = "Box"

const Box = BoxComponent as unknown as (props: JSX.HTMLAttributes<HTMLDivElement> & { ref?: any }) => JSX.Element

const HStackComponent = forwardRef<HTMLDivElement, Omit<FlexProps, "direction">>(
  ({ align = "center", ...props }, ref): JSX.Element => (
    <div ref={ref}>
      <Flex direction="row" align={align} {...props} />
    </div>
  )
)
HStackComponent.displayName = "HStack"

const HStack = HStackComponent as unknown as (props: Omit<FlexProps, "direction"> & { ref?: any }) => JSX.Element

const VStackComponent = forwardRef<HTMLDivElement, Omit<FlexProps, "direction">>(
  (props, ref): JSX.Element => (
    <div ref={ref}>
      <Flex direction="column" {...props} />
    </div>
  )
)
VStackComponent.displayName = "VStack"

const VStack = VStackComponent as unknown as (props: Omit<FlexProps, "direction"> & { ref?: any }) => JSX.Element

const TextComponent = forwardRef<HTMLDivElement, JSX.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref): JSX.Element => {
    return <div ref={ref} className={cn(className)} {...props} />
  }
)
TextComponent.displayName = "Text"

const Text = TextComponent as unknown as (props: JSX.HTMLAttributes<HTMLDivElement> & { ref?: any }) => JSX.Element

export { Flex, Box, HStack, VStack, Text }
