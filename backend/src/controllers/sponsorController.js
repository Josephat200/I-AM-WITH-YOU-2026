const { store, query, isLiveDatabase } = require('../config/db');

async function getOpportunities(req, res) {
  try {
    const { status, search } = req.query;
    let rows = isLiveDatabase() ? (await query(`SELECT id,title,sponsor_name AS sponsor,amount,deadline,status,description,criteria,funded_count AS funded FROM opportunities WHERE ($1::text IS NULL OR status=$1) AND ($2::text IS NULL OR title ILIKE '%'||$2||'%' OR sponsor_name ILIKE '%'||$2||'%') ORDER BY created_at DESC`, [status && status !== 'All opportunities' ? status : null, search || null])).rows : store.opportunities;
    return res.json({ success: true, count: rows.length, opportunities: rows });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Failed to retrieve opportunities.' }); }
}
async function createOpportunity(req, res) {
  try {
    const { title, sponsor, amount, deadline, status = 'Open', description = '', criteria = [] } = req.body;
    if (!title || !sponsor || !amount || !deadline) return res.status(400).json({ success: false, message: 'Title, sponsor, amount, and deadline are required.' });
    const parsed = Array.isArray(criteria) ? criteria : String(criteria).split(',').map(x => x.trim()).filter(Boolean);
    if (isLiveDatabase()) {
      const r = await query(`INSERT INTO opportunities (title,sponsor_name,amount,deadline,status,description,criteria) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,title,sponsor_name AS sponsor,amount,deadline,status,description,criteria,funded_count AS funded`, [title, sponsor, amount, deadline, status, description, JSON.stringify(parsed)]);
      return res.status(201).json({ success: true, message: 'Scholarship opportunity created successfully.', opportunity: r.rows[0] });
    }
    const opportunity = { id: Date.now(), title, sponsor, amount: Number(amount), deadline, status, description, criteria: parsed, funded: 0 }; store.opportunities.unshift(opportunity);
    return res.status(201).json({ success: true, message: 'Scholarship opportunity created successfully.', opportunity });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Failed to create opportunity.' }); }
}
async function updateOpportunity(req, res) {
  try {
    const fields = ['title','sponsor_name','amount','deadline','status','description','criteria','funded_count'];
    const map = { sponsor: 'sponsor_name', funded: 'funded_count' };
    const keys = Object.keys(req.body).filter(k => fields.includes(k) || map[k]);
    if (!keys.length) return res.status(400).json({ success: false, message: 'No changes supplied.' });
    if (isLiveDatabase()) {
      const sets = keys.map((k, i) => `${map[k] || k}=$${i + 1}`);
      const vals = keys.map(k => k === 'criteria' && !Array.isArray(req.body[k]) ? String(req.body[k]).split(',').map(x => x.trim()) : req.body[k]);
      const r = await query(`UPDATE opportunities SET ${sets.join(',')},updated_at=NOW() WHERE id=$${keys.length + 1} RETURNING id,title,sponsor_name AS sponsor,amount,deadline,status,description,criteria,funded_count AS funded`, [...vals, req.params.id]);
      if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
      return res.json({ success: true, opportunity: r.rows[0] });
    }
    const o = store.opportunities.find(x => String(x.id) === req.params.id); if (!o) return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    keys.forEach(k => { const target = map[k] || k; o[target === 'sponsor_name' ? 'sponsor' : target === 'funded_count' ? 'funded' : target] = req.body[k]; }); return res.json({ success: true, opportunity: o });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Failed to update opportunity.' }); }
}
async function getApplicants(req, res) {
  try {
    if (isLiveDatabase()) {
      const r = await query(`SELECT a.id,u.full_name AS name,s.school,s.grade,o.title AS opportunity,a.submitted_at AS submitted,a.status,a.overall_score AS score,a.recommendation FROM applications a JOIN students s ON s.id=a.student_id JOIN users u ON u.id=s.user_id JOIN opportunities o ON o.id=a.opportunity_id WHERE o.id=$1 ORDER BY a.submitted_at DESC`, [req.params.id]);
      return res.json({ success: true, count: r.rows.length, applicants: r.rows });
    }
    const o = store.opportunities.find(x => String(x.id) === req.params.id); if (!o) return res.status(404).json({ success: false, message: 'Opportunity not found.' }); const a = store.candidates.filter(x => x.opportunity === o.title); return res.json({ success: true, count: a.length, applicants: a });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to retrieve applicants.' }); }
}
async function selectBeneficiary(req, res) {
  try {
    if (isLiveDatabase()) {
      const r = await query(`UPDATE applications SET status='Awarded',recommendation='Recommend',updated_at=NOW() WHERE id=$1 RETURNING *`, [req.body.candidateId]); if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Candidate not found.' }); await query('UPDATE opportunities SET funded_count=funded_count+1 WHERE id=$1', [req.body.opportunityId]); return res.json({ success: true, candidate: r.rows[0] });
    }
    const c = store.candidates.find(x => String(x.id) === String(req.body.candidateId)); if (!c) return res.status(404).json({ success: false, message: 'Candidate not found.' }); c.status = 'Completed'; c.recommendation = 'Recommend'; return res.json({ success: true, candidate: c });
  } catch (err) { return res.status(500).json({ success: false, message: 'Failed to select beneficiary.' }); }
}
async function getFundedStudents(req, res) {
  try { const rows = isLiveDatabase() ? (await query(`SELECT a.*,u.full_name AS name,s.school,s.grade,o.title AS opportunity FROM applications a JOIN students s ON s.id=a.student_id JOIN users u ON u.id=s.user_id JOIN opportunities o ON o.id=a.opportunity_id WHERE a.status='Awarded'`)).rows : store.candidates.filter(x => x.status === 'Completed' || x.recommendation === 'Recommend'); return res.json({ success: true, count: rows.length, fundedStudents: rows }); } catch (err) { return res.status(500).json({ success: false, message: 'Failed to retrieve funded learners.' }); }
}
module.exports = { getOpportunities, createOpportunity, updateOpportunity, getApplicants, selectBeneficiary, getFundedStudents };
