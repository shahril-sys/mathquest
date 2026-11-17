import crypto from 'node:crypto';
import { AppError, tx } from '../db.js';

/**
 * Server-side points ledger. Every change to a student's balance goes through applyPoints():
 *  - atomic (BEGIN IMMEDIATE transaction, joins an outer one)
 *  - idempotent (unique idempotency_key: replaying the same key is a no-op returning the first result)
 *  - never negative (checked here and by a CHECK constraint)
 * balance_delta moves the redeemable balance, lifetime_delta moves lifetime points (leaderboards).
 */
export function applyPoints(db, { studentId, type, balanceDelta, lifetimeDelta = 0, key, refType = null, refId = null, reason = null, createdBy = null }) {
  if (!Number.isInteger(balanceDelta) || !Number.isInteger(lifetimeDelta)) throw new AppError(400, 'Nilai mata tidak sah.');
  if (!key) throw new AppError(500, 'Kunci idempotensi diperlukan.');
  return tx(db, () => {
    const dup = db.prepare('SELECT id, tx_uid, balance_delta, balance_after FROM point_transactions WHERE idempotency_key = ?').get(key);
    if (dup) return { applied: false, ...dup };
    const st = db.prepare('SELECT points_balance, points_lifetime FROM students WHERE user_id = ?').get(studentId);
    if (!st) throw new AppError(404, 'Murid tidak dijumpai.');
    const balanceAfter = st.points_balance + balanceDelta;
    const lifetimeAfter = st.points_lifetime + lifetimeDelta;
    if (balanceAfter < 0) throw new AppError(409, 'Baki mata tidak mencukupi.', 'mata_tidak_cukup');
    if (lifetimeAfter < 0) throw new AppError(409, 'Mata seumur hidup tidak boleh negatif.');
    const uid = `PT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const res = db.prepare(`INSERT INTO point_transactions(tx_uid, student_id, type, balance_delta, lifetime_delta, balance_after, lifetime_after, ref_type, ref_id, reason, idempotency_key, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(uid, studentId, type, balanceDelta, lifetimeDelta, balanceAfter, lifetimeAfter, refType, refId, reason, key, createdBy);
    db.prepare('UPDATE students SET points_balance = ?, points_lifetime = ? WHERE user_id = ?').run(balanceAfter, lifetimeAfter, studentId);
    return { applied: true, id: Number(res.lastInsertRowid), tx_uid: uid, balance_delta: balanceDelta, balance_after: balanceAfter };
  });
}

/** Points earned by gameplay: raise both balance and lifetime. */
export function earn(db, studentId, type, amount, key, refType, refId, reason) {
  if (amount <= 0) return { applied: false, balance_delta: 0 };
  return applyPoints(db, { studentId, type, balanceDelta: amount, lifetimeDelta: amount, key, refType, refId, reason });
}

/** Administrator correction: changes redeemable balance only, requires a reason. */
export function adjustBalance(db, admin, studentId, delta, reason) {
  const why = String(reason || '').trim();
  if (why.length < 5) throw new AppError(400, 'Sebab pelarasan mesti diisi (sekurang-kurangnya 5 aksara).');
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100000) throw new AppError(400, 'Jumlah pelarasan tidak sah.');
  return applyPoints(db, {
    studentId, type: 'adjustment', balanceDelta: delta, lifetimeDelta: 0,
    key: `adj:${studentId}:${crypto.randomUUID()}`, reason: why, createdBy: admin.id,
  });
}

export function ledger(db, studentId, limit = 100) {
  return db.prepare(`SELECT tx_uid, type, balance_delta, lifetime_delta, balance_after, reason, ref_type, ref_id, created_at
    FROM point_transactions WHERE student_id = ? ORDER BY id DESC LIMIT ?`).all(studentId, limit);
}
