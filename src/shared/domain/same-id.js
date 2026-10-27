export function sameId(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) return false
    return String(a) === String(b)
}
