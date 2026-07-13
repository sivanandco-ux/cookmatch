'use client'

import { useEffect, useId, useState } from 'react'

const SEED_CITIES = ['Fremont', 'Newark', 'Union City', 'Milpitas']

// Supports two usage patterns:
// - Controlled: pass `value` + `onChange` (React state owns the value).
// - Uncontrolled: pass `name` (+ optional `defaultValue`) and read it from
//   FormData/form.elements on submit, same as a plain <input name="city">.
export default function CityInput({
  name,
  value,
  defaultValue,
  onChange,
  className,
  placeholder = 'Enter your city',
  required = false,
}: {
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  required?: boolean
}) {
  const [cities, setCities] = useState<string[]>(SEED_CITIES)
  const listId = useId()

  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data.cities)) setCities(data.cities) })
      .catch(() => {})
  }, [])

  const valueProps = onChange
    ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) }
    : { defaultValue }

  return (
    <>
      <input
        list={listId}
        name={name}
        className={className}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        {...valueProps}
      />
      <datalist id={listId}>
        {cities.map(c => <option key={c} value={c} />)}
      </datalist>
    </>
  )
}
