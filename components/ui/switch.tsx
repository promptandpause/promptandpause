'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <>
      {/* Mobile: ON/OFF Toggle with enhanced animations */}
      <SwitchPrimitive.Root
        data-slot="switch"
        className={cn(
          'md:hidden relative w-[70px]',
          'focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'outline-none',
          'active:scale-95 transition-transform duration-150',
          className,
        )}
        {...props}
      >
        <div className="block overflow-hidden cursor-pointer border border-[#999999] rounded-[16px] shadow-sm">
          <div className={cn(
            'w-[200%] transition-[margin] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            'data-[state=checked]:ml-0 data-[state=unchecked]:ml-[-100%]',
          )}
          data-state={props.checked ? 'checked' : 'unchecked'}>
            <div className="float-left w-1/2 h-[24px] leading-[24px] text-[11px] text-white font-bold box-border pl-[8px] bg-[#34C759]">
              ON
            </div>
            <div className="float-left w-1/2 h-[24px] leading-[24px] text-[11px] text-[#999999] font-bold box-border pr-[8px] bg-[#eeeeee] text-right">
              OFF
            </div>
          </div>
        </div>
        <SwitchPrimitive.Thumb
          className={cn(
            'w-[10px] h-[18px] mx-[4px] bg-white border border-[#271616] rounded-[12px]',
            'absolute top-1/2 -translate-y-1/2',
            'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            'data-[state=checked]:right-0 data-[state=checked]:scale-110',
            'data-[state=unchecked]:right-[48px] data-[state=unchecked]:scale-100',
            'shadow-md',
          )}
        />
      </SwitchPrimitive.Root>

      {/* Desktop: Simple Toggle with spring animation */}
      <SwitchPrimitive.Root
        data-slot="switch"
        className={cn(
          'hidden md:inline-flex peer cursor-pointer relative items-center',
          'w-[66px] h-[28px]',
          'p-[2px]',
          'rounded-full',
          'transition-all duration-200 ease-out',
          'data-[state=unchecked]:bg-[#aaa]',
          'data-[state=checked]:bg-[#34C759]',
          'focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'outline-none',
          'active:scale-[0.98] hover:shadow-md',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block rounded-full bg-white',
            'w-[24px] h-[24px]',
            'shadow-[0_2px_4px_rgba(0,0,0,0.2)]',
            'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            'data-[state=checked]:translate-x-[38px] data-[state=checked]:scale-105',
            'data-[state=unchecked]:translate-x-0 data-[state=unchecked]:scale-100',
            'hover:shadow-lg',
          )}
        />
      </SwitchPrimitive.Root>
    </>
  )
}

export { Switch }
