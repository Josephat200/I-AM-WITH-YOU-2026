const { store, query, isLiveDatabase } = require('../config/db');
async function getAssignedApplications(req, res) {
  try {
    const rows = isLiveDatabase() ? (await query(`SELECT a.id,u.full_name AS name,s.school,s.grade,o.title AS opportunity,a.submitted_at AS submitted,a.status,a.overall_score AS score,a.recommendation FROM applications a JOIN students s ON s.id=a.student_id JOIN users u ON u.id=s.user_id JOIN opportunities o ON o.id=a.opportunity_id ORDER BY a.submitted_at DESC`)).rows : store.candidates;
    return res.json({ success: true, count: rows.length, applications: rows });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' }); }
}
async function evaluateCandidate(req, res) {
  try {
    const { candidateId, academics = 0, need = 0, community = 0, readiness = 0, recommendation = 'Pending', notes = '' } = req.body;
    const scores = [academics, need, community, readiness].map(Number);
    if (scores.some(x => !Number.isInteger(x) || x < 0 || x > 25)) return res.status(400).json({ success: false, message: 'Each rubric score must be an integer from 0 to 25.' });
    if (isLiveDatabase()) { const a = await query(`UPDATE applications SET overall_score=$1,recommendation=$2,status='Completed',updated_at=NOW() WHERE id=$3 RETURNING *`, [scores.reduce((a,b) => a+b, 0), recommendation, candidateId]); if (!a.rows[0]) return res.status(404).json({ success: false, message: 'Candidate not found.' }); await query(`INSERT INTO reviews (application_id,reviewer_id,score_academics,score_need,score_community,score_readiness,recommendation,reviewer_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [candidateId, req.user.id, ...scores, recommendation, notes]); return res.json({ success: true, candidate: a.rows[0], evaluation: { academics: scores[0], need: scores[1], community: scores[2], readiness: scores[3], totalScore: scores.reduce((a,b) => a+b, 0), recommendation, notes } }); }
    const c = store.candidates.find(x => String(x.id) === String(candidateId)); if (!c) return res.status(404).json({ success: false, message: 'Candidate not found.' }); c.score = scores.reduce((a,b) => a+b, 0); c.recommendation = recommendation; c.status = 'Completed'; return res.json({ success: true, candidate: c, evaluation: { totalScore: c.score, recommendation, notes } });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to evaluate candidate.' }); }
}
module.exports = { getAssignedApplications, evaluateCandidate };
