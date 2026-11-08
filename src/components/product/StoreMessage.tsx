import type { ReactNode } from 'react'

export function StoreMessage({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-char bg-white/60 p-10 text-center">
      <h2 className="display-md">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-char-soft">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
