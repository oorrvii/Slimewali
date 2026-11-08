import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Notice } from '@/components/ui/Notice'
import { Toggle } from '@/components/ui/Toggle'
import { StoreMessage } from '@/components/product/StoreMessage'
import { deleteAddress, listAddresses, saveAddress, setDefaultAddress } from '@/data/addresses'
import {
  emptyAddressInput,
  validateAddress,
  type Address,
  type AddressErrors,
  type AddressInput,
} from '@/domain/address'
import { AddressFields } from '@/features/account/AddressFields'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

type Editing = { id: string | null; value: AddressInput }

function toInput(address: Address): AddressInput {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    isDefault: address.isDefault,
  }
}

export function AccountAddressesPage() {
  usePageTitle('Addresses')
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const addresses = useAsync(() => listAddresses(uid), [uid])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [errors, setErrors] = useState<AddressErrors>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null)
  const [deleting, setDeleting] = useState(false)

  const list = addresses.data ?? []

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    const found = validateAddress(editing.value)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setMessage(null)
    try {
      await saveAddress(uid, editing.id, editing.value, list)
      setEditing(null)
      setMessage({ tone: 'success', text: 'Address saved.' })
      addresses.reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not save the address. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  async function makeDefault(address: Address) {
    setMessage(null)
    try {
      await setDefaultAddress(uid, address.id, list)
      addresses.reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not change the default address.' })
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteAddress(uid, pendingDelete, list)
      setPendingDelete(null)
      setMessage({ tone: 'success', text: 'Address deleted.' })
      addresses.reload()
    } catch {
      setPendingDelete(null)
      setMessage({ tone: 'error', text: 'We could not delete the address. Please try again.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <p className="eyebrow">Addresses</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-lg">Saved addresses</h1>
        {!editing ? (
          <Button
            onClick={() => {
              setErrors({})
              setMessage(null)
              setEditing({ id: null, value: emptyAddressInput() })
            }}
          >
            New address
          </Button>
        ) : null}
      </div>

      {message ? (
        <div className="mt-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {editing ? (
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-8 rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6"
        >
          <h2 className="display-md mb-5">{editing.id ? 'Edit address' : 'New address'}</h2>
          <AddressFields
            value={editing.value}
            errors={errors}
            onChange={(value) => setEditing({ ...editing, value })}
          />
          <div className="mt-5">
            <Toggle
              label="Use as my default address"
              checked={editing.value.isDefault}
              onChange={(event) =>
                setEditing({ ...editing, value: { ...editing.value, isDefault: event.target.checked } })
              }
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" loading={saving}>
              Save address
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-8">
        {addresses.loading ? (
          <div className="h-32 animate-pulse rounded-[1.25rem] bg-char/10" role="status">
            <span className="sr-only">Loading addresses</span>
          </div>
        ) : addresses.error ? (
          <StoreMessage
            title="We could not load your addresses"
            body="Please check your connection and try again."
            action={<Button onClick={addresses.reload}>Try again</Button>}
          />
        ) : list.length === 0 && !editing ? (
          <StoreMessage
            title="No saved addresses"
            body="Save an address here to fill your details faster at checkout."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((address) => (
              <li key={address.id} className="rounded-[1.25rem] border-2 border-char bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-xl font-bold">{address.fullName}</p>
                  {address.isDefault ? <Badge>Default</Badge> : null}
                </div>
                <address className="mt-2 text-sm not-italic text-char-soft">
                  {address.line1}
                  {address.line2 ? <><br />{address.line2}</> : null}
                  {address.landmark ? <><br />Near {address.landmark}</> : null}
                  <br />
                  {address.city}, {address.state} {address.pinCode}
                  <br />
                  {address.phone}
                </address>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setErrors({})
                      setMessage(null)
                      setEditing({ id: address.id, value: toInput(address) })
                    }}
                  >
                    Edit
                  </Button>
                  {!address.isDefault ? (
                    <Button size="sm" variant="ghost" onClick={() => makeDefault(address)}>
                      Make default
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(address)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this address?"
        confirmLabel="Delete address"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        <p>This removes it from your saved addresses. Past orders are not affected.</p>
      </ConfirmDialog>
    </div>
  )
}
