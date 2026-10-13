const { store } = require('../config/db');

/**
 * Get student profile
 */
function getProfile(req, res) {
  try {
    const student = store.students[0] || {
      id: 'std-demo',
      name: 'Achieng O. Wanjala',
      school: 'Kisumu Girls High School',
      grade: 'Form 4 · STEM',
      guardian: 'Peter Wanjala',
      email: 'achieng.wanjala@demo.ikodi',
      county: 'Kisumu',
      studentIdCode: 'IK-2048',
      photoUrl: '/ikodi-logo.jpeg',
      idCardStatus: 'Verified'
    };

    return res.json({ success: true, profile: student });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve student profile.' });
  }
}

/**
 * Update student profile
 */
function updateProfile(req, res) {
  try {
    const { name, school, grade, guardian, email, county } = req.body;
    let student = store.students[0];

    if (!student) {
      student = { id: 'std-' + Date.now(), studentIdCode: 'IK-2048' };
      store.students.push(student);
    }

    if (name) student.name = name;
    if (school) student.school = school;
    if (grade) student.grade = grade;
    if (guardian) student.guardian = guardian;
    if (email) student.email = email;
    if (county) student.county = county;

    store.auditLogs.unshift({
      id: Date.now(),
      actor: name || 'Student',
      action: 'Updated learner profile details',
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Application'
    });

    return res.json({ success: true, message: 'Student profile updated successfully.', profile: student });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update student profile.' });
  }
}

/**
 * Upload academic results / supporting documents
 */
function uploadResults(req, res) {
  try {
    const fileName = req.file ? req.file.originalname : (req.body.fileName || 'Academic Result Slip.pdf');
    const docType = req.body.documentType || 'Result slip';

    const newDoc = {
      id: 'doc-' + Date.now(),
      name: `${fileName} · ${docType}`,
      type: docType,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : '/mock-result-slip.pdf',
      status: 'Received',
      uploadedAt: 'Just now'
    };

    store.documents.unshift(newDoc);

    store.auditLogs.unshift({
      id: Date.now(),
      actor: req.user?.fullName || 'Student',
      action: `Uploaded ${docType} (${fileName})`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Application'
    });

    return res.status(201).json({
      success: true,
      message: 'Result document uploaded and registered in review queue.',
      document: newDoc
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'File upload processing failed.' });
  }
}

/**
 * Upload student profile photo
 */
function uploadPhoto(req, res) {
  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.photoUrl || '/ikodi-logo.jpeg');
    if (store.students[0]) {
      store.students[0].photoUrl = photoUrl;
    }

    return res.json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      photoUrl
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Photo upload failed.' });
  }
}

/**
 * Get verified Student ID Card data
 */
function getIdCardData(req, res) {
  try {
    const student = store.students[0] || {};
    const cardData = {
      studentIdCode: student.studentIdCode || 'IK-2048',
      name: student.name || 'Achieng O. Wanjala',
      school: student.school || 'Kisumu Girls High School',
      grade: student.grade || 'Form 4 · STEM',
      county: student.county || 'Kisumu',
      photoUrl: student.photoUrl || '/ikodi-logo.jpeg',
      cardStatus: student.idCardStatus || 'Verified',
      validUntil: '31 Dec 2026',
      issuer: 'IKODI Secretariat',
      barcodeNumber: 'IK2048-2026-KENYA'
    };

    return res.json({ success: true, idCard: cardData });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ID card data.' });
  }
}

/**
 * Submit application to an opportunity
 */
function applyOpportunity(req, res) {
  try {
    const { opportunityId, notes } = req.body;
    const opp = store.opportunities.find(o => o.id === Number(opportunityId));

    if (!opp) {
      return res.status(404).json({ success: false, message: 'Opportunity not found.' });
    }

    const student = store.students[0] || {};
    const candidateId = Date.now();

    const newCandidate = {
      id: candidateId,
      name: req.user?.fullName || student.name || 'Achieng O. Wanjala',
      school: student.school || 'Kisumu Girls High School',
      grade: student.grade || 'Form 4 · STEM',
      opportunity: opp.title,
      submitted: 'Just now',
      status: 'Ready for review',
      score: 75,
      recommendation: 'Pending'
    };

    store.candidates.unshift(newCandidate);

    store.auditLogs.unshift({
      id: Date.now(),
      actor: newCandidate.name,
      action: `Submitted application for ${opp.title}`,
      time: 'Just now',
      device: req.ip || 'Local',
      type: 'Application'
    });

    return res.status(201).json({
      success: true,
      message: `Application submitted successfully for ${opp.title}.`,
      candidate: newCandidate
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Application submission failed.' });
  }
}

/**
 * Get student documents
 */
function getDocuments(req, res) {
  return res.json({ success: true, documents: store.documents });
}

module.exports = {
  getProfile,
  updateProfile,
  uploadResults,
  uploadPhoto,
  getIdCardData,
  applyOpportunity,
  getDocuments
};
