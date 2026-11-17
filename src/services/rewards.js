import crypto from 'node:crypto';
import { AppError, tx, audit } from '../db.js';
import { applyPoints } from './points.js';
import { getStudent } from './game.js';

export const STATUS_LABEL = {
  menunggu: 'Menunggu Kelulusan', diluluskan: 'Diluluskan', sedia: 'Sedia Dituntut',
  dituntut: 'Telah Dituntut', ditolak: 'Ditolak', dibatalkan: 'Dibatalkan',
};
const ACTIVE_STATUSES = ['menunggu', 'diluluskan', 'sedia', 'dituntut']; // statuses that still "use up" a prize

/** Eligibility of one reward for one student (pure read). */
function eligibility(db, student, r) {
  const available = r.stock - r.reserved;
  if (!r.active) return { ok: false, reason: 'Hadiah tidak tersedia buat masa ini.' };
  if (student.year < r.min_year) return { ok: false, reason: `Untuk murid Tahun ${r.min_year} ke atas.` };
  if (r.limit_per_student) {
    const used = db.prepare(`SELECT COUNT(*) c FROM reward_redemptions WHERE student_id = ? AND reward_id = ? AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`).get(student.user_id, r.id, ...ACTIVE_STATUSES).c;
    if (used >= r.limit_per_student) return { ok: false, reason: `Had tebusan (${r.limit_per_student}) telah dicapai.` };
  }
  if (available <= 0) return { ok: false, reason: 'Stok habis.' };
  if (student.points_balance < r.points_cost) return { ok: false, reason: `Kurang ${r.points_cost - student.points_balance} mata.` };
  return { ok: true, reason: 'Layak ditebus' };
}

export function listRewards(db, studentId) {
  const student = getStudent(db, studentId);
  const rows = db.prepare(`SELECT c.*, i.stock, i.reserved FROM reward_catalog c JOIN reward_inventory i ON i.reward_id = c.id
    WHERE c.active = 1 AND c.school_id = ? ORDER BY c.points_cost`).all(student.school_id);
  return rows.map((r) => {
    const e = eligibility(db, student, r);
    return { id: r.id, name: r.name, description: r.description, emoji: r.emoji, image: r.image_path ? `/uploads/${r.image_path}` : null, points_cost: r.points_cost, available: r.stock - r.reserved, min_year: r.min_year, limit_per_student: r.limit_per_student, eligible: e.ok, eligibility: e.reason };
  });
}

export function redeem(db, studentId, rewardId, requestId) {
  if (typeof requestId !== 'string' || requestId.length < 8 || requestId.length > 64) throw new AppError(400, 'ID permintaan tidak sah.');
  return tx(db, () => {
    const dup = db.prepare('SELECT * FROM reward_redemptions WHERE request_id = ?').get(requestId);
    if (dup) {
      if (dup.student_id !== studentId) throw new AppError(409, 'ID permintaan tidak sah.');
      return { ...publicRedemption(db, dup.id), duplicate: true };
    }
    const student = getStudent(db, studentId);
    if (!student.active) throw new AppError(403, 'Akaun tidak aktif.');
    const r = db.prepare(`SELECT c.*, i.stock, i.reserved FROM reward_catalog c JOIN reward_inventory i ON i.reward_id = c.id WHERE c.id = ? AND c.school_id = ?`).get(rewardId, student.school_id);
    if (!r) throw new AppError(404, 'Hadiah tidak dijumpai.');
    const e = eligibility(db, student, r);
    if (!e.ok) throw new AppError(409, e.reason, 'tidak_layak');
    const ref = `MQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const ins = db.prepare(`INSERT INTO reward_redemptions(reference_no, request_id, student_id, reward_id, points_spent, status) VALUES (?,?,?,?,?, 'menunggu')`).run(ref, requestId, studentId, rewardId, r.points_cost);
    const id = Number(ins.lastInsertRowid);
    db.prepare('UPDATE reward_inventory SET reserved = reserved + 1 WHERE reward_id = ?').run(rewardId);
    applyPoints(db, { studentId, type: 'redeem', balanceDelta: -r.points_cost, lifetimeDelta: 0, key: `redeem:${id}`, refType: 'redemption', refId: id, reason: `Tebus ${r.name} (${ref})` });
    return publicRedemption(db, id);
  });
}

export function publicRedemption(db, id) {
  const r = db.prepare(`SELECT d.id, d.reference_no, d.status, d.points_spent, d.note, d.created_at, d.updated_at, c.name AS reward_name, c.emoji, c.image_path
    FROM reward_redemptions d JOIN reward_catalog c ON c.id = d.reward_id WHERE d.id = ?`).get(id);
  return { ...r, status_label: STATUS_LABEL[r.status], image: r.image_path ? `/uploads/${r.image_path}` : null };
}

export function studentRedemptions(db, studentId) {
  return db.prepare('SELECT id FROM reward_redemptions WHERE student_id = ? ORDER BY id DESC').all(studentId).map((x) => publicRedemption(db, x.id));
}

const TRANSITIONS = {
  approve: { from: ['menunggu'], to: 'diluluskan' },
  ready: { from: ['diluluskan'], to: 'sedia' },
  collect: { from: ['sedia'], to: 'dituntut' },
  reject: { from: ['menunggu', 'diluluskan', 'sedia'], to: 'ditolak', refund: true },
  cancel: { from: ['menunggu', 'diluluskan', 'sedia'], to: 'dibatalkan', refund: true },
};

/** Move a redemption through its lifecycle. actor = admin user, or {id, role:'murid'} for self-cancel. */
export function transitionRedemption(db, actor, redemptionId, action, note) {
  const t = TRANSITIONS[action];
  if (!t) throw new AppError(400, 'Tindakan tidak sah.');
  return tx(db, () => {
    const d = db.prepare('SELECT * FROM reward_redemptions WHERE id = ?').get(redemptionId);
    if (!d) throw new AppError(404, 'Tebusan tidak dijumpai.');
    if (actor.role === 'murid') {
      if (d.student_id !== actor.id || action !== 'cancel' || d.status !== 'menunggu') throw new AppError(403, 'Anda hanya boleh membatalkan permintaan yang masih menunggu kelulusan.');
    } else if (actor.role !== 'pentadbir') throw new AppError(403, 'Tidak dibenarkan.');
    if (!t.from.includes(d.status)) throw new AppError(409, `Status semasa "${STATUS_LABEL[d.status]}" tidak membenarkan tindakan ini.`, 'status_tidak_sah');
    if (['reject', 'cancel'].includes(action) && actor.role === 'pentadbir' && !String(note || '').trim()) throw new AppError(400, 'Sila nyatakan sebab.');
    const res = db.prepare(`UPDATE reward_redemptions SET status = ?, note = COALESCE(?, note), decided_by = ?, updated_at = datetime('now') WHERE id = ? AND status = ?`)
      .run(t.to, note ? String(note).slice(0, 300) : null, actor.role === 'pentadbir' ? actor.id : d.decided_by, redemptionId, d.status);
    if (res.changes !== 1) throw new AppError(409, 'Status telah berubah. Sila muat semula.');
    if (t.refund) {
      db.prepare('UPDATE reward_inventory SET reserved = reserved - 1 WHERE reward_id = ?').run(d.reward_id);
      applyPoints(db, { studentId: d.student_id, type: 'refund', balanceDelta: d.points_spent, lifetimeDelta: 0, key: `refund:${redemptionId}`, refType: 'redemption', refId: redemptionId, reason: `Bayaran balik ${d.reference_no}: ${t.to}` });
    }
    if (action === 'collect') db.prepare('UPDATE reward_inventory SET stock = stock - 1, reserved = reserved - 1 WHERE reward_id = ?').run(d.reward_id);
    audit(db, actor, `redemption.${action}`, d.reference_no, { note: note || null });
    return publicRedemption(db, redemptionId);
  });
}

export function setStock(db, admin, rewardId, stock) {
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) throw new AppError(400, 'Kuantiti tidak sah.');
  return tx(db, () => {
    const inv = db.prepare('SELECT * FROM reward_inventory WHERE reward_id = ?').get(rewardId);
    if (!inv) throw new AppError(404, 'Hadiah tidak dijumpai.');
    if (stock < inv.reserved) throw new AppError(409, `Stok tidak boleh kurang daripada kuantiti yang ditempah (${inv.reserved}).`);
    db.prepare('UPDATE reward_inventory SET stock = ? WHERE reward_id = ?').run(stock, rewardId);
    audit(db, admin, 'reward.stock', rewardId, { from: inv.stock, to: stock });
    return { stock, reserved: inv.reserved };
  });
}
