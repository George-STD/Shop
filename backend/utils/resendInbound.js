const { fetchWithTimeout } = require('./helpers');

const getResendApiKey = () => process.env.RESEND_API_KEY || process.env.SMTP_PASS;

/**
 * Fetch a single received email's full content (HTML and plain text) by Resend email_id
 * @param {string} emailId - Inbound email UUID from Resend
 * @returns {Promise<{ id: string, text: string, html: string } | null>}
 */
async function fetchReceivedEmailContent(emailId) {
  const apiKey = getResendApiKey();
  if (!apiKey || !emailId) return null;

  try {
    const res = await fetchWithTimeout(
      `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      8000
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`Resend receiving email fetch returned status ${res.status}: ${errText}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('Error fetching received email from Resend:', err.message);
    return null;
  }
}

/**
 * List received emails from Resend
 * @param {number} [limit=100]
 * @returns {Promise<Array<Object>>}
 */
async function listReceivedEmails(limit = 100) {
  const apiKey = getResendApiKey();
  if (!apiKey) return [];

  try {
    const res = await fetchWithTimeout(
      `https://api.resend.com/emails/receiving?limit=${encodeURIComponent(limit)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      10000
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`Resend receiving emails list returned status ${res.status}: ${errText}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('Error listing received emails from Resend:', err.message);
    return [];
  }
}

module.exports = {
  fetchReceivedEmailContent,
  listReceivedEmails,
};
