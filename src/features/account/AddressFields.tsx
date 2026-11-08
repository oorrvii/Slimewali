import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { INDIAN_STATES, type AddressErrors, type AddressInput } from '@/domain/address'

export function AddressFields({
  value,
  errors,
  onChange,
}: {
  value: AddressInput
  errors: AddressErrors
  onChange: (next: AddressInput) => void
}) {
  const set = <K extends keyof AddressInput>(key: K, next: AddressInput[K]) =>
    onChange({ ...value, [key]: next })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Full name"
        autoComplete="name"
        value={value.fullName}
        error={errors.fullName}
        maxLength={100}
        onChange={(event) => set('fullName', event.target.value)}
      />
      <Input
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="10 digits, with or without +91"
        value={value.phone}
        error={errors.phone}
        onChange={(event) => set('phone', event.target.value)}
      />
      <div className="sm:col-span-2">
        <Input
          label="Address line 1"
          autoComplete="address-line1"
          hint="House or flat number, building, street"
          value={value.line1}
          error={errors.line1}
          maxLength={200}
          onChange={(event) => set('line1', event.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Address line 2 (optional)"
          autoComplete="address-line2"
          value={value.line2}
          error={errors.line2}
          maxLength={200}
          onChange={(event) => set('line2', event.target.value)}
        />
      </div>
      <Input
        label="Landmark (optional)"
        value={value.landmark}
        error={errors.landmark}
        maxLength={100}
        onChange={(event) => set('landmark', event.target.value)}
      />
      <Input
        label="City or town"
        autoComplete="address-level2"
        value={value.city}
        error={errors.city}
        maxLength={80}
        onChange={(event) => set('city', event.target.value)}
      />
      <Select
        label="State"
        autoComplete="address-level1"
        value={value.state}
        error={errors.state}
        onChange={(event) => set('state', event.target.value)}
      >
        <option value="">Choose a state</option>
        {INDIAN_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </Select>
      <Input
        label="PIN code"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={6}
        value={value.pinCode}
        error={errors.pinCode}
        onChange={(event) => set('pinCode', event.target.value.replace(/\D/g, ''))}
      />
      <Input label="Country" value="India" readOnly hint="We currently ship within India only." />
    </div>
  )
}
