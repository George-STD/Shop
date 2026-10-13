const ReceivedEmail = require('../../models/ReceivedEmail');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, buildPaginationMeta } = require('../../utils/helpers');
const { fetchReceivedEmailContent, listReceivedEmails } = require('../../utils/resendInbound');

/**
 * ReDoS-Safe bounded plain-text extractor
 */
const htmlToPlainText = (html = '') => {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/?[a-z][^>]{0,200}>/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

/**
 * Extract clean email address from string (e.g. "Name <user@domain.com>" -> "user@domain.com")
 */
const extractEmailAddress = (str) => {
  const match = String(str || '').match(/<([^>]+)>/);
  return (match ? match[1] : str || '').toLowerCase().trim();
};

// =====================================================
// RECEIVED EMAILS
// =====================================================
exports.getEmails = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [emails, total] = await Promise.all([
    ReceivedEmail.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ReceivedEmail.countDocuments(),
  ]);

  res.json({
    success: true,
    data: emails,
    pagination: buildPaginationMeta({ page, limit, total })
  });
}, 'حدث خطأ أثناء جلب الرسائل');

exports.getEmailById = asyncHandler(async (req, res) => {
  const email = await ReceivedEmail.findById(req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });

  // If email has no text body, attempt to fetch it from Resend
  if (!email.text) {
    try {
      let emailId = email.emailId;

      // If emailId is missing (e.g. historical email), find it by sender in Resend
      if (!emailId) {
        const resendList = await listReceivedEmails(50);
        const emailFromAddr = extractEmailAddress(email.from);
        const matched = resendList.find((item) => {
          const itemFromAddr = extractEmailAddress(item.from);
          return itemFromAddr && itemFromAddr === emailFromAddr;
        });
        if (matched?.id) {
          emailId = matched.id;
          email.emailId = emailId;
        }
      }

      if (emailId) {
        const full = await fetchReceivedEmailContent(emailId);
        if (full) {
          const plainText = String(full.text || '').trim() || htmlToPlainText(full.html || '');
          if (plainText) {
            email.text = plainText;
          }
        }
      }
    } catch (err) {
      console.warn('Could not auto-fetch email content from Resend:', err.message);
    }
  }

  if (!email.isRead) {
    email.isRead = true;
  }
  await email.save();

  res.json({ success: true, data: email });
}, 'حدث خطأ أثناء جلب الرسالة');

exports.deleteEmail = asyncHandler(async (req, res) => {
  const email = await ReceivedEmail.findByIdAndDelete(req.params.id);
  if (!email) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
  res.json({ success: true, message: 'تم حذف الرسالة' });
}, 'حدث خطأ أثناء حذف الرسالة');

/**
 * Sync / backfill received emails directly from Resend Inbound API
 */
exports.syncEmailsFromResend = asyncHandler(async (req, res) => {
  const resendList = await listReceivedEmails(100);
  if (!resendList.length) {
    return res.json({
      success: true,
      message: 'لم يتم العثور على رسائل في Resend أو تعذر الاتصال بـ Resend API',
      syncedCount: 0,
    });
  }

  let updatedCount = 0;
  let createdCount = 0;

  for (const item of resendList) {
    const emailId = item.id;
    if (!emailId) continue;

    const fromStr = Array.isArray(item.from) ? item.from.join(', ') : String(item.from || '');
    const toStr = Array.isArray(item.to) ? item.to.join(', ') : String(item.to || '');
    const fromAddr = extractEmailAddress(fromStr);

    // 1. Try to find by emailId
    let dbEmail = await ReceivedEmail.findOne({ emailId });

    // 2. If not found by emailId, match against legacy emails without emailId
    if (!dbEmail) {
      const candidates = await ReceivedEmail.find({
        $or: [{ emailId: '' }, { emailId: { $exists: false } }],
      });
      dbEmail = candidates.find((c) => {
        const cAddr = extractEmailAddress(c.from);
        return cAddr && cAddr === fromAddr;
      });
    }

    if (dbEmail) {
      // If it exists but has no text, fetch body and update
      if (!dbEmail.text || !dbEmail.emailId) {
        const full = await fetchReceivedEmailContent(emailId);
        if (full) {
          const plainText = String(full.text || '').trim() || htmlToPlainText(full.html || '');
          if (plainText) dbEmail.text = plainText;
        }
        dbEmail.emailId = emailId;
        await dbEmail.save();
        updatedCount++;
      }
    } else {
      // New email that was never persisted via webhook
      const full = await fetchReceivedEmailContent(emailId);
      const plainText = full
        ? (String(full.text || '').trim() || htmlToPlainText(full.html || ''))
        : '';

      await ReceivedEmail.create({
        emailId,
        from: fromStr,
        to: toStr || 'support@foryo.me',
        subject: item.subject || '(بدون عنوان)',
        html: '',
        text: plainText,
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      });
      createdCount++;
    }
  }

  res.json({
    success: true,
    message: `تمت مزامنة الرسائل بنجاح (تم تحديث ${updatedCount} رسالة، وإضافة ${createdCount} رسالة جديدة)`,
    updatedCount,
    createdCount,
  });
}, 'حدث خطأ أثناء مزامنة الرسائل');
