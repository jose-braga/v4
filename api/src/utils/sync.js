export async function saveRow(conn, table, scopeCol, scopeId, row, cols) {
    const q = (c) => `\`${c}\``
    const vals = cols.map((c) => row[c])
    if (row.id !== undefined) {
        await conn.query(
            `UPDATE ${table} SET ${cols.map((c) => `${q(c)} = ?`).join(', ')} WHERE id = ? AND ${scopeCol} = ?`,
            [...vals, row.id, scopeId]
        )
        return row.id
    }
    const [r] = await conn.query(
        `INSERT INTO ${table} (${scopeCol}, ${cols.map(q).join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`,
        [scopeId, ...vals]
    )
    return r.insertId
}

export async function deleteMissing(conn, table, scopeCol, scopeId, keepIds) {
    if (keepIds.length) {
        await conn.query(`DELETE FROM ${table} WHERE ${scopeCol} = ? AND id NOT IN (?)`, [scopeId, keepIds])
    } else {
        await conn.query(`DELETE FROM ${table} WHERE ${scopeCol} = ?`, [scopeId])
    }
}
