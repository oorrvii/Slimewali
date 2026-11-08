import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  danger,
  busy,
  confirmDisabled,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean
  title: string
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[min(92vw,30rem)] rounded-[1.25rem] border-2 border-char bg-white p-0 text-char shadow-pop-lg backdrop:bg-char/50"
    >
      <div className="p-6">
        <h2 className="display-md">{title}</h2>
        <div className="mt-3 space-y-3 text-sm">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'accent' : 'primary'}
            onClick={onConfirm}
            loading={busy}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
