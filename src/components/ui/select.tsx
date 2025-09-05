"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "font-inter:border-input font-inter:data-[placeholder]:text-muted-foreground font-inter:[&_svg:not([class*=text-])]:text-muted-foreground font-inter:focus-visible:border-ring font-inter:focus-visible:ring-ring/50 font-inter:aria-invalid:ring-destructive/20 font-inter:dark:aria-invalid:ring-destructive/40 font-inter:aria-invalid:border-destructive font-inter:dark:bg-input/30 font-inter:dark:hover:bg-input/50 font-inter:flex font-inter:w-fit font-inter:items-center font-inter:justify-between font-inter:gap-2 font-inter:rounded-md font-inter:border font-inter:bg-transparent font-inter:px-3 font-inter:py-2 font-inter:text-sm font-inter:whitespace-nowrap font-inter:shadow-xs font-inter:transition-[color,box-shadow] font-inter:outline-none font-inter:focus-visible:ring-[3px] font-inter:disabled:cursor-not-allowed font-inter:disabled:opacity-50 font-inter:data-[size=default]:h-9 font-inter:data-[size=sm]:h-8 font-inter:*:data-[slot=select-value]:line-clamp-1 font-inter:*:data-[slot=select-value]:flex font-inter:*:data-[slot=select-value]:items-center font-inter:*:data-[slot=select-value]:gap-2 font-inter:[&_svg]:pointer-events-none font-inter:[&_svg]:shrink-0 font-inter:[&_svg:not([class*=size-])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="font-inter:size-4 font-inter:opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "font-inter:bg-popover font-inter:text-popover-foreground font-inter:data-[state=open]:animate-in font-inter:data-[state=closed]:animate-out font-inter:data-[state=closed]:fade-out-0 font-inter:data-[state=open]:fade-in-0 font-inter:data-[state=closed]:zoom-out-95 font-inter:data-[state=open]:zoom-in-95 font-inter:data-[side=bottom]:slide-in-from-top-2 font-inter:data-[side=left]:slide-in-from-right-2 font-inter:data-[side=right]:slide-in-from-left-2 font-inter:data-[side=top]:slide-in-from-bottom-2 font-inter:relative font-inter:z-50 font-inter:max-h-(--radix-select-content-available-height) font-inter:min-w-[8rem] font-inter:origin-(--radix-select-content-transform-origin) font-inter:overflow-x-hidden font-inter:overflow-y-auto font-inter:rounded-md font-inter:border font-inter:shadow-md",
          position === "popper" &&
            "font-inter:data-[side=bottom]:translate-y-1 font-inter:data-[side=left]:-translate-x-1 font-inter:data-[side=right]:translate-x-1 font-inter:data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "font-inter:p-1",
            position === "popper" &&
              "font-inter:h-[var(--radix-select-trigger-height)] font-inter:w-full font-inter:min-w-[var(--radix-select-trigger-width)] font-inter:scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("font-inter:text-muted-foreground font-inter:px-2 font-inter:py-1.5 font-inter:text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "font-inter:focus:bg-accent font-inter:focus:text-accent-foreground font-inter:[&_svg:not([class*=text-])]:text-muted-foreground font-inter:relative font-inter:flex font-inter:w-full font-inter:cursor-default font-inter:items-center font-inter:gap-2 font-inter:rounded-sm font-inter:py-1.5 font-inter:pr-8 font-inter:pl-2 font-inter:text-sm font-inter:outline-hidden font-inter:select-none font-inter:data-[disabled]:pointer-events-none font-inter:data-[disabled]:opacity-50 font-inter:[&_svg]:pointer-events-none font-inter:[&_svg]:shrink-0 font-inter:[&_svg:not([class*=size-])]:size-4 font-inter:*:[span]:last:flex font-inter:*:[span]:last:items-center font-inter:*:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="font-inter:absolute font-inter:right-2 font-inter:flex font-inter:size-3.5 font-inter:items-center font-inter:justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="font-inter:size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("font-inter:bg-border font-inter:pointer-events-none font-inter:-mx-1 font-inter:my-1 font-inter:h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "font-inter:flex font-inter:cursor-default font-inter:items-center font-inter:justify-center font-inter:py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="font-inter:size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "font-inter:flex font-inter:cursor-default font-inter:items-center font-inter:justify-center font-inter:py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="font-inter:size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
