const { store } = require('../config/db');

/**
 * List all scholarship opportunities with optional status/search filters
 */
function getOpportunities(req, res) {
  try {
    const { status, search } = req.query;
    let list = [...store.opportunities];

    if (status && status !== 'All opportunities') {
      list = list.filter(o => o.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.sponsor.toLowerCase().includes(q) ||
        (o.criteria && o.criteria.some(c => c.toLowerCase().includes(q)))
      );
    }

    return res.json({ success: true, count: list.length, opportunities: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve opportunities.' });
  }
}

/**
 * Create a new scholarship opportunity
 */
function createOpportunity(req, res) {
  try {
    const { title, sponsor, amount, deadline, status, description, criteria } = req.body;

    if (!title || !sponsor || !amount) {
      return res.status(400).json({ success: false, message: 'Title, sponsor organization, and funding amount are required.' });
    }

    const newOpp = {
      id: Date.now(),
      title,
      sponsor,
      amount: Number(amount),
      deadline: deadline || '2026-09-30',
      status: status || 'Open',
      description: description || '',
      criteria: Array.isArray(criteria) ? criteria : (typeof criteria === 'string' ? criteria.split(',').map(s => s.trim()).filter(Boolean) : []),
      funded: 0
    };

    store.opportunities.unshift(newOpp);

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || sponsor,
      action: `Created opportunity: "${title}"`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Organization'
    });

    return res.status(201).json({
      success: true,
      message: 'Scholarship opportunity created successfully.',
      opportunity: newOpp
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create opportunity.' });
  }
}

/**
 * Update an existing scholarship opportunity
 */
function updateOpportunity(req, res) {
  try {
    const { id } = req.params;
    const opp = store.opportunities.find(o => o.id === Number(id));

    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    const { title, sponsor, amount, deadline, status, description, criteria, funded } = req.body;

    if (title) opp.title = title;
    if (sponsor) opp.sponsor = sponsor;
    if (amount !== undefined) opp.amount = Number(amount);
    if (deadline) opp.deadline = deadline;
    if (status) opp.status = status;
    if (description !== undefined) opp.description = description;
    if (criteria !== undefined) {
      opp.criteria = Array.isArray(criteria) ? criteria : criteria.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (funded !== undefined) opp.funded = Number(funded);

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || opp.sponsor,
      action: `Updated opportunity: "${opp.title}"`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Organization'
    });

    return res.json({ success: true, message: 'Opportunity updated successfully.', opportunity: opp });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update opportunity.' });
  }
}

/**
 * Get applicants for a specific opportunity
 */
function getApplicants(req, res) {
  try {
    const { id } = req.params;
    const opp = store.opportunities.find(o => o.id === Number(id));

    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    const applicants = store.candidates.filter(c => c.opportunity.toLowerCase() === opp.title.toLowerCase());
    return res.json({ success: true, opportunity: opp.title, count: applicants.length, applicants });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve applicants.' });
  }
}

/**
 * Select / Award beneficiary
 */
function selectBeneficiary(req, res) {
  try {
    const { candidateId, opportunityId } = req.body;
    const candidate = store.candidates.find(c => c.id === Number(candidateId));

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    candidate.status = 'Completed';
    candidate.recommendation = 'Recommend';

    const opp = store.opportunities.find(o => o.id === Number(opportunityId) || o.title === candidate.opportunity);
    if (opp) {
      opp.funded += 1;
    }

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || 'Sponsor',
      action: `Awarded scholarship to candidate ${candidate.name}`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Review'
    });

    return res.json({
      success: true,
      message: `Candidate ${candidate.name} awarded successfully.`,
      candidate
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to select beneficiary.' });
  }
}

/**
 * List funded learners
 */
function getFundedStudents(req, res) {
  try {
    const fundedList = store.candidates.filter(c => c.status === 'Completed' || c.recommendation === 'Recommend');
    return res.json({ success: true, count: fundedList.length, fundedStudents: fundedList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve funded learners.' });
  }
}

module.exports = {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  getApplicants,
  selectBeneficiary,
  getFundedStudents
};
