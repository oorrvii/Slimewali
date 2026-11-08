export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const

export type AddressInput = {
  fullName: string
  phone: string
  line1: string
  line2: string
  landmark: string
  city: string
  state: string
  pinCode: string
  isDefault: boolean
}

export type Address = AddressInput & { id: string; country: 'India' }

export type AddressErrors = Partial<Record<keyof AddressInput, string>>

export function emptyAddressInput(): AddressInput {
  return {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pinCode: '',
    isDefault: false,
  }
}

export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[\s-]/g, '')
  let digits = compact
  if (digits.startsWith('+91')) digits = digits.slice(3)
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2)
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1)
  return /^[6-9][0-9]{9}$/.test(digits) ? `+91${digits}` : null
}

export function isValidPin(input: string): boolean {
  return /^[1-9][0-9]{5}$/.test(input.trim())
}

export function validateAddress(input: AddressInput): AddressErrors {
  const errors: AddressErrors = {}
  if (!input.fullName.trim()) errors.fullName = 'Enter the full name.'
  else if (input.fullName.trim().length > 100) errors.fullName = 'Keep the name under 100 characters.'
  if (!input.phone.trim()) errors.phone = 'Enter a mobile number.'
  else if (!normalizePhone(input.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number, with or without +91.'
  }
  if (!input.line1.trim()) errors.line1 = 'Enter the house, flat or street.'
  else if (input.line1.trim().length > 200) errors.line1 = 'Keep this under 200 characters.'
  if (input.line2.trim().length > 200) errors.line2 = 'Keep this under 200 characters.'
  if (input.landmark.trim().length > 100) errors.landmark = 'Keep this under 100 characters.'
  if (!input.city.trim()) errors.city = 'Enter the city or town.'
  else if (input.city.trim().length > 80) errors.city = 'Keep this under 80 characters.'
  if (!input.state) errors.state = 'Choose a state.'
  else if (!(INDIAN_STATES as readonly string[]).includes(input.state)) errors.state = 'Choose a state from the list.'
  if (!input.pinCode.trim()) errors.pinCode = 'Enter the PIN code.'
  else if (!isValidPin(input.pinCode)) errors.pinCode = 'Enter a valid 6-digit PIN code.'
  return errors
}

export function cleanAddress(input: AddressInput): AddressInput {
  return {
    fullName: input.fullName.trim(),
    phone: normalizePhone(input.phone) ?? input.phone.trim(),
    line1: input.line1.trim(),
    line2: input.line2.trim(),
    landmark: input.landmark.trim(),
    city: input.city.trim(),
    state: input.state,
    pinCode: input.pinCode.trim(),
    isDefault: input.isDefault,
  }
}

export const NOTE_MAX = 500

export function normalizeInstagram(input: string): string | null {
  let value = input.trim()
  if (!value) return ''
  value = value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '')
  value = value.replace(/^@/, '')
  return /^[A-Za-z0-9._]{1,30}$/.test(value) ? value : null
}

export const INSTAGRAM_ERROR = 'Enter just your Instagram username, like slimewali.official'
