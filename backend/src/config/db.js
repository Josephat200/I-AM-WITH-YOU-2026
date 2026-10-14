const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let useDatabase = false;

// Check if a real DATABASE_URL is provided and non-empty
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
    useDatabase = true;
    console.log('[Database] Configured PostgreSQL pool with Supabase connection string.');
  } catch (err) {
    console.error('[Database] Failed to initialize PostgreSQL pool:', err.message);
    pool = null;
  }
} else {
  console.log('[Database] No DATABASE_URL provided. Operating in local demo fallback mode.');
}

// Resilient in-memory fallback store matching the Supabase schema
const fallbackStore = {
  users: [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      email: 'mercy@demo.ikodi',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Mercy W. Akinyi',
      role: 'Super Admin',
      phone: '+254 700 000 001',
      organization: 'IKODI Secretariat',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      email: 'daniel@demo.ikodi',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Daniel Kiplagat',
      role: 'Admin',
      phone: '+254 700 000 002',
      organization: 'IKODI Secretariat',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'a0000001-0000-0000-0000-000000000003',
      email: 'lilian@demo.ikodi',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Lilian Atieno',
      role: 'Secretary',
      phone: '+254 700 000 003',
      organization: 'IKODI Secretariat',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'a0000001-0000-0000-0000-000000000004',
      email: 'nadia@demo.ikodi',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Nadia Njoroge',
      role: 'Reviewer / Selection Committee',
      phone: '+254 700 000 004',
      organization: 'Kijani STEM Panel',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'a0000001-0000-0000-0000-000000000005',
      email: 'programmes@mwangaza.demo',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Mwangaza Education Trust',
      role: 'Sponsor / Funding Organization',
      phone: '+254 20 223 4567',
      organization: 'Mwangaza Education Trust',
      status: 'Verified',
      createdAt: new Date().toISOString()
    },
    {
      id: 'a0000001-0000-0000-0000-000000000006',
      email: 'achieng.wanjala@demo.ikodi',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Achieng O. Wanjala',
      role: 'Applicant / Beneficiary',
      phone: '+254 712 345 678',
      organization: 'Kisumu Girls High School',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'a0000001-0000-0000-0000-000000000007',
      email: 'p.wanjala@demo.ikodi',
      passwordHash: '$2a$10$FkKGe6xPvvvHcr9UcbEQyeVATxP66cVmQFMvogo/imtAnqdh1lKuK',
      fullName: 'Peter Wanjala',
      role: 'Parent / Guardian',
      phone: '+254 722 987 654',
      organization: 'Family Account',
      status: 'Active',
      createdAt: new Date().toISOString()
    }
  ],
  students: [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      userId: 'a0000001-0000-0000-0000-000000000006',
      studentIdCode: 'IK-2048',
      school: 'Kisumu Girls High School',
      grade: 'Form 4 · STEM',
      county: 'Kisumu',
      guardianName: 'Peter Wanjala',
      guardianPhone: '+254 722 987 654',
      guardianEmail: 'p.wanjala@demo.ikodi',
      photoUrl: '/ikodi-logo.jpeg',
      idCardStatus: 'Verified',
      idCardIssuedAt: new Date().toISOString()
    }
  ],
  opportunities: [
    {
      id: 101,
      title: 'Kijani STEM Futures Award',
      sponsor: 'Mwangaza Education Trust',
      amount: 85000,
      deadline: '2026-07-18',
      status: 'Open',
      description: 'Supporting ambitious learners entering science, technology, engineering and mathematics pathways across Kenya.',
      criteria: ['STEM pathway', 'KCSE mean grade B-', 'Demonstrated need'],
      funded: 18
    },
    {
      id: 102,
      title: 'Umoja Girls in Leadership',
      sponsor: 'Umoja Women’s Fund',
      amount: 62000,
      deadline: '2026-08-02',
      status: 'Open',
      description: 'A mentorship-backed award for young women building a future in leadership, public service and community enterprise.',
      criteria: ['Girls & young women', 'Leadership experience', 'Household need'],
      funded: 12
    },
    {
      id: 103,
      title: 'Coastal Community Bursary',
      sponsor: 'Pwani Community Foundation',
      amount: 48000,
      deadline: '2026-06-30',
      status: 'Closing soon',
      description: 'Tuition support for learners from coastal counties who are committed to returning value to their communities.',
      criteria: ['Coastal county resident', 'Secondary school', 'Financial need'],
      funded: 24
    },
    {
      id: 104,
      title: 'Maalim Academic Excellence',
      sponsor: 'Maalim Family Foundation',
      amount: 110000,
      deadline: '2026-09-10',
      status: 'Open',
      description: 'A renewable scholarship for consistent academic effort and strong potential in higher education.',
      criteria: ['University entry', 'Strong academic record', 'Renewable'],
      funded: 9
    },
    {
      id: 105,
      title: 'Digital Skills Access Grant',
      sponsor: 'Tawi Technology Partners',
      amount: 54000,
      deadline: '2026-08-22',
      status: 'Open',
      description: 'Removing barriers to digital learning through tuition, connectivity and essential learning resources.',
      criteria: ['Digital studies', 'Need-based', 'County school'],
      funded: 15
    },
    {
      id: 106,
      title: 'Community Health Scholars',
      sponsor: 'Afya Neighbourhood Network',
      amount: 76000,
      deadline: '2026-07-31',
      status: 'Draft',
      description: 'Investment in compassionate future health professionals from underserved communities.',
      criteria: ['Health sciences', 'Community service', 'Need-based'],
      funded: 0
    }
  ],
  candidates: [
    {
      id: 201,
      name: 'Achieng O. Wanjala',
      school: 'Kisumu Girls High School',
      grade: 'Form 4 · STEM',
      opportunity: 'Kijani STEM Futures Award',
      submitted: '12 Jun 2026',
      status: 'Ready for review',
      score: 86,
      recommendation: 'Shortlist'
    },
    {
      id: 202,
      name: 'Brian K. Mutua',
      school: 'Machakos School',
      grade: 'Form 4 · Sciences',
      opportunity: 'Kijani STEM Futures Award',
      submitted: '11 Jun 2026',
      status: 'Ready for review',
      score: 78,
      recommendation: 'Pending'
    },
    {
      id: 203,
      name: 'Faith N. Kiptoo',
      school: 'Eldoret National School',
      grade: 'Form 3 · Leadership',
      opportunity: 'Umoja Girls in Leadership',
      submitted: '10 Jun 2026',
      status: 'In review',
      score: 91,
      recommendation: 'Shortlist'
    },
    {
      id: 204,
      name: 'Kevin M. Barasa',
      school: 'Kakamega High School',
      grade: 'Form 4 · Arts',
      opportunity: 'Coastal Community Bursary',
      submitted: '09 Jun 2026',
      status: 'Ready for review',
      score: 68,
      recommendation: 'Pending'
    },
    {
      id: 205,
      name: 'Njeri W. Kamau',
      school: 'Alliance Girls High School',
      grade: 'Form 4 · Sciences',
      opportunity: 'Maalim Academic Excellence',
      submitted: '08 Jun 2026',
      status: 'Completed',
      score: 94,
      recommendation: 'Recommend'
    }
  ],
  messages: [
    {
      id: 1,
      subject: 'Application received',
      body: 'Your application for the Kijani STEM Futures Award is safely in the review queue.',
      audience: 'Achieng O. Wanjala · applicant',
      channel: 'In-app',
      date: 'Today, 9:42 am',
      status: 'Delivered',
      sender: 'IKODI team'
    },
    {
      id: 2,
      subject: 'Please upload your latest results',
      body: 'A clear, recent result slip will help the review committee assess your application.',
      audience: 'Brian K. Mutua · applicant & guardian',
      channel: 'Email',
      date: 'Yesterday, 3:18 pm',
      status: 'Delivered',
      sender: 'Nadia Njoroge'
    },
    {
      id: 3,
      subject: 'Committee review window opens Monday',
      body: 'Please complete your assigned candidate reviews before the committee meeting.',
      audience: 'Selection committee',
      channel: 'In-app',
      date: '10 Jun 2026',
      status: 'Read',
      sender: 'IKODI team'
    }
  ],
  auditLogs: [
    {
      id: 1,
      actor: 'Nadia Njoroge',
      action: 'Scored Achieng Wanjala’s application',
      time: 'Today, 9:36 am',
      device: 'Nairobi · Chrome',
      type: 'Review'
    },
    {
      id: 2,
      actor: 'Daniel Kiplagat',
      action: 'Verified Mwangaza Education Trust',
      time: 'Today, 8:58 am',
      device: 'Nairobi · Safari',
      type: 'Organization'
    },
    {
      id: 3,
      actor: 'Achieng O. Wanjala',
      action: 'Uploaded term results',
      time: 'Yesterday, 4:21 pm',
      device: 'Kisumu · Mobile',
      type: 'Application'
    },
    {
      id: 4,
      actor: 'Mercy W. Akinyi',
      action: 'Opened admin records',
      time: 'Yesterday, 2:05 pm',
      device: 'Nairobi · Chrome',
      type: 'Session'
    }
  ],
  sessions: [
    {
      id: 'sess-1',
      userId: 'a0000001-0000-0000-0000-000000000001',
      actor: 'Mercy W. Akinyi',
      role: 'Super Admin',
      loginTime: 'Today, 8:03 am',
      logoutTime: null,
      ipAddress: '197.232.61.12',
      device: 'Nairobi · Chrome · macOS',
      isActive: true
    },
    {
      id: 'sess-2',
      userId: 'a0000001-0000-0000-0000-000000000002',
      actor: 'Daniel Kiplagat',
      role: 'Admin',
      loginTime: 'Today, 10:04 am',
      logoutTime: null,
      ipAddress: '197.232.61.18',
      device: 'Nairobi · Safari · iOS',
      isActive: true
    }
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Term 1 results slip · PDF · 1.2 MB',
      type: 'Result slip',
      studentId: 'b0000001-0000-0000-0000-000000000001',
      status: 'Verified',
      uploadedAt: 'Yesterday, 4:21 pm'
    },
    {
      id: 'doc-2',
      name: 'School confirmation · PDF · 640 KB',
      type: 'School confirmation',
      studentId: 'b0000001-0000-0000-0000-000000000001',
      status: 'Received',
      uploadedAt: '12 Jun 2026, 11:15 am'
    }
  ]
};

async function query(text, params) {
  if (useDatabase && pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.error('[Database Query Error]:', err.message);
      throw err;
    }
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    throw new Error('DATABASE_URL is configured but PostgreSQL is unavailable');
  }
  return { rows: [] };
}

module.exports = {
  pool,
  query,
  store: fallbackStore,
  isLiveDatabase: () => useDatabase && pool !== null
};
