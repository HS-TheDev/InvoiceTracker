function escapeCsv(value) {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

export function exportToCsv(filename, rows, columns) {
    if (!rows || rows.length === 0) return

    const header = columns.map((c) => escapeCsv(c.label)).join(',')
    const body = rows
        .map((row) =>
            columns
                .map((c) => escapeCsv(typeof c.value === 'function' ? c.value(row) : row[c.value]))
                .join(',')
        )
        .join('\n')

    const csv = `${header}\n${body}`
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
