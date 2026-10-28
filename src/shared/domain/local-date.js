export function toIsoDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

export function todayIsoDate() {
    return toIsoDate(new Date())
}

export function fromIsoDate(value) {
    return new Date(`${String(value).slice(0, 10)}T00:00:00`)
}
