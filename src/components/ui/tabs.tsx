"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("font-inter:flex font-inter:flex-col font-inter:gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "font-inter:bg-muted font-inter:text-muted-foreground font-inter:inline-flex font-inter:h-9 font-inter:w-fit font-inter:items-center font-inter:justify-center font-inter:rounded-lg font-inter:p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "font-inter:data-[state=active]:bg-background font-inter:dark:data-[state=active]:text-foreground font-inter:focus-visible:border-ring font-inter:focus-visible:ring-ring/50 font-inter:focus-visible:outline-ring font-inter:dark:data-[state=active]:border-input font-inter:dark:data-[state=active]:bg-input/30 font-inter:text-foreground font-inter:dark:text-muted-foreground font-inter:inline-flex font-inter:h-[calc(100%-1px)] font-inter:flex-1 font-inter:items-center font-inter:justify-center font-inter:gap-1.5 font-inter:rounded-md font-inter:border font-inter:border-transparent font-inter:px-2 font-inter:py-1 font-inter:text-sm font-inter:font-medium font-inter:whitespace-nowrap font-inter:transition-[color,box-shadow] font-inter:focus-visible:ring-[3px] font-inter:focus-visible:outline-1 font-inter:disabled:pointer-events-none font-inter:disabled:opacity-50 font-inter:data-[state=active]:shadow-sm font-inter:[&_svg]:pointer-events-none font-inter:[&_svg]:shrink-0 font-inter:[&_svg:not([class*=size-])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("font-inter:flex-1 font-inter:outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
