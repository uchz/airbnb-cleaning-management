import Input from './Input'

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length === 0) return ''

  // (DD)
  if (digits.length <= 2) return `(${digits}`

  // (DD) XXXXX ou (DD) XXXX
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  // (DD) XXXXX-XXXX (celular, 11 dígitos) ou (DD) XXXX-XXXX (fixo, 10 dígitos)
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function PhoneInput({ value, onChange, ...props }) {
  const handleChange = (e) => {
    // Remove qualquer caractere que não seja número, mantém a máscara
    const formatted = formatPhone(e.target.value)
    onChange({ ...e, target: { ...e.target, value: formatted } })
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      inputMode="numeric"
      autoComplete="tel"
      placeholder="(00) 00000-0000"
      maxLength={15}
      {...props}
    />
  )
}