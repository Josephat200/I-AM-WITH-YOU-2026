const { store } = require('../config/db');

/**
 * Get assigned applications for evaluation queue
 */
function getAssignedApplications(req, res) {
  try {
    const { status, search } = req.query;
    let list = [...store.candidates];

    if (status && status !== 'All assignments') {
      list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.school.toLowerCase().includes(q) ||
        c.opportunity.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: list.length, applications: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
}

/**
 * Score candidate using rubric and submit recommendation
 */
function evaluateCandidate(req, res) {
  try {
    const { candidateId, academics, need, community, readiness, recommendation, notes } = req.body;
    const candidate = store.candidates.find(c => c.id === Number(candidateId));

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    const sAcademics = Number(academics || 0);
    const sNeed = Number(need || 0);
    const sCommunity = Number(community || 0);
    const sReadiness = Number(readiness || 0);
    const totalScore = sAcademics + sNeed + sCommunity + sReadiness;

    candidate.score = totalScore;
    candidate.recommendation = recommendation || 'Pending';
    candidate.status = 'Completed';

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || 'Selection Committee',
      action: `Evaluated ${candidate.name} (Score: ${totalScore}/100, Recommendation: ${candidate.recommendation})`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Review'
    });

    return res.json({
      success: true,
      message: `Evaluation submitted. Total score: ${totalScore}/100.`,
      candidate,
      evaluation: {
        academics: sAcademics,
        need: sNeed,
        community: sCommunity,
        readiness: sReadiness,
        totalScore,
        recommendation: candidate.recommendation,
        notes: notes || ''
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to evaluate candidate.' });
  }
}

module.exports = {
  getAssignedApplications,
  evaluateCandidate
};
