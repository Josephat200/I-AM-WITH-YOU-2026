const { store, query, isLiveDatabase } = require('../config/db');
const { uploadToSupabase } = require('../config/storage');
const fs = require('fs');

function profileShape(row) {
  return {
    id: row.id, userId: row.user_id, studentIdCode: row.student_id_code,
    name: row.name, email: row.email, school: row.school, grade: row.grade,
    county: row.county, guardian: row.guardian_name,
    guardianPhone: row.guardian_phone, guardianEmail: row.guardian_email,
    photoUrl: row.photo_url, idCardStatus: row.id_card_status,
    idCardIssuedAt: row.id_card_issued_at
  };
}

/**
 * Get student profile
 */
async function getProfile(req, res) {
  try {
    if (isLiveDatabase()) {
      const result = await query(`SELECT s.*,u.full_name AS name,u.email,u.role,u.phone,u.organization
        FROM users u LEFT JOIN students s ON s.user_id=u.id
        WHERE u.id=$1`, [req.user.id]);
      const row = result.rows[0];
      if (!row) return res.status(404).json({ success: false, message: 'User profile not found.' });
      if (row.role === 'Parent / Guardian') {
        const children = await query(`SELECT s.*,u.full_name AS name,u.email
          FROM students s JOIN users u ON u.id=s.user_id
          WHERE lower(s.guardian_email)=lower($1) ORDER BY s.created_at`, [row.email]);
        return res.json({ success: true, profile: {
          id: row.id, userId: row.id, name: row.name, email: row.email,
          role: row.role, phone: row.phone, organization: row.organization,
          children: children.rows.map(profileShape)
        } });
      }
      if (!row.student_id_code) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      return res.json({ success: true, profile: profileShape(row) });
    }
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
async function updateProfile(req, res) {
  try {
    const { name, school, grade, guardian, email, county } = req.body;
    if (isLiveDatabase()) {
      const result = await query(`UPDATE students SET school=COALESCE($1,school),grade=COALESCE($2,grade),guardian_name=COALESCE($3,guardian_name),county=COALESCE($4,county),updated_at=NOW() WHERE user_id=$5 RETURNING *`, [school || null, grade || null, guardian || null, county || null, req.user.id]);
      if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      return res.json({ success: true, message: 'Student profile updated successfully.', profile: result.rows[0] });
    }
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
async function uploadResults(req, res) {
  try {
    const fileName = req.file ? req.file.originalname : (req.body.fileName || 'Academic Result Slip.pdf');
    const docType = req.body.documentType || 'Result slip';

    let remoteUrl = null;
    if (req.file && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      remoteUrl = await uploadToSupabase({ ...req.file, buffer: fs.readFileSync(req.file.path) }, 'documents');
    }
    const newDoc = {
      id: 'doc-' + Date.now(),
      name: `${fileName} · ${docType}`,
      type: docType,
      fileUrl: remoteUrl || (req.file ? `/uploads/${req.file.filename}` : '/mock-result-slip.pdf'),
      status: 'Received',
      uploadedAt: 'Just now'
    };

    if (isLiveDatabase()) {
      const result = await query(`INSERT INTO student_documents (student_id,document_type,file_name,file_url,file_size_bytes) SELECT id,$1,$2,$3,$4 FROM students WHERE user_id=$5 RETURNING *`, [docType, fileName, newDoc.fileUrl, req.file?.size || null, req.user.id]);
      if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      return res.status(201).json({ success: true, message: 'Result document uploaded and registered in review queue.', document: result.rows[0] });
    }
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
async function uploadPhoto(req, res) {
  try {
    let remoteUrl = null;
    if (req.file && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      remoteUrl = await uploadToSupabase({ ...req.file, buffer: fs.readFileSync(req.file.path) }, 'photos');
    }
    const photoUrl = remoteUrl || (req.file ? `/uploads/${req.file.filename}` : (req.body.photoUrl || '/ikodi-logo.jpeg'));
    if (isLiveDatabase()) {
      const result = await query(`UPDATE students SET photo_url=$1,updated_at=NOW()
        WHERE user_id=$2 RETURNING *`, [photoUrl, req.user.id]);
      if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    } else if (store.students[0]) {
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
async function getIdCardData(req, res) {
  try {
    let student;
    if (isLiveDatabase()) {
      const result = await query(`SELECT s.*,u.full_name AS name
        FROM students s JOIN users u ON u.id=s.user_id WHERE s.user_id=$1`, [req.user.id]);
      student = result.rows[0];
      if (!student) return res.status(404).json({ success: false, message: 'Student ID card not found.' });
    } else {
      student = store.students[0] || {};
    }
    const cardData = {
      studentIdCode: student.student_id_code || student.studentIdCode || 'IK-2048',
      name: student.name || 'Achieng O. Wanjala',
      school: student.school || 'Kisumu Girls High School',
      grade: student.grade || 'Form 4 · STEM',
      county: student.county || 'Kisumu',
      photoUrl: student.photo_url || student.photoUrl || '/ikodi-logo.jpeg',
      cardStatus: student.id_card_status || student.idCardStatus || 'Verified',
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
async function applyOpportunity(req, res) {
  try {
    const { opportunityId, notes } = req.body;
    if (isLiveDatabase()) {
      const result = await query(`INSERT INTO applications (opportunity_id,student_id,award_notes)
        SELECT o.id,s.id,$2 FROM opportunities o CROSS JOIN students s
        WHERE o.id=$1 AND s.user_id=$3
        RETURNING id,opportunity_id,student_id,submitted_at,status,overall_score,recommendation,award_notes`, [opportunityId, notes || null, req.user.id]);
      if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Opportunity or student profile not found.' });
      const row = result.rows[0];
      return res.status(201).json({
        success: true, message: 'Application submitted successfully.',
        candidate: { id: row.id, status: row.status, score: Number(row.overall_score), recommendation: row.recommendation,
          submitted: row.submitted_at, opportunityId: row.opportunity_id, studentId: row.student_id }
      });
    }
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
async function getDocuments(req, res) {
  if (isLiveDatabase()) {
    const result = await query(`SELECT d.* FROM student_documents d JOIN students s ON s.id=d.student_id WHERE s.user_id=$1 ORDER BY d.uploaded_at DESC`, [req.user.id]);
    return res.json({ success: true, documents: result.rows });
  }
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
