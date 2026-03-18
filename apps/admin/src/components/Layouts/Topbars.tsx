import React from 'react'

export function SimpleTopbar({ title }: { title: string }) {
    return (
        <header>
            <span className='font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black'>{title}</span>
        </header>
    )
}

export function TopBar({ title, children }: { title: string, children? : React.ReactNode }) {
    return (
        <header className='w-full flex items-center justify-between'>
            <span className='font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black'>{title}</span>
            {children}
        </header>
    )
}
