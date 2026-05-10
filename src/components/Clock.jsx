import { useState, useEffect } from 'react'

export default function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const p = n => String(n).padStart(2, '0')
  return (
    <>{t.getDate()}/{p(t.getMonth()+1)}/{String(t.getFullYear()).slice(2)}.{p(t.getHours())}.{p(t.getMinutes())}.{p(t.getSeconds())}</>
  )
}
