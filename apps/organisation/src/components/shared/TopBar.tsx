import React from 'react'

export default function TopBar({ title, children }: { title: string, children?: React.ReactNode }) {
    return (
        <div className='flex items-center justify-between'>
            <span className='text-[2.6rem] font-medium font-primary leading-12 text-black'>{title}</span>
            <div className='flex items-center gap-4'>{children}</div>
        </div>
    )
}
