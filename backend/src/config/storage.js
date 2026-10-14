const crypto = require('crypto');

async function uploadToSupabase(file, folder = 'uploads') {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET = 'uploads' } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectPath = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeName}`;
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': file.mimetype, 'x-upsert': 'true' },
    body: file.buffer
  });
  if (!response.ok) throw new Error(`Supabase Storage upload failed (${response.status})`);
  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${objectPath}`;
}

module.exports = { uploadToSupabase };
