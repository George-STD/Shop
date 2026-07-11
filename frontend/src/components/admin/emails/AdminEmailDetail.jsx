import React from 'react';
import { FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { STRINGS } from '../../../constants';

const htmlToPlainText = (html = '') => {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const AdminEmailDetail = ({ selectedEmail, setSelectedEmail, handleDelete, formatDate }) => {
  if (!selectedEmail) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <button
            onClick={() => setSelectedEmail(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FiChevronRight />
            {STRINGS.ADMIN.EMAILS.BACK}
          </button>
          <button
            onClick={() => handleDelete(selectedEmail._id)}
            className="text-red-500 hover:text-red-700 p-2"
            title={STRINGS.ADMIN.TABLE.DELETE}
          >
            <FiTrash2 size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              <strong>{STRINGS.ADMIN.EMAILS.FROM}</strong> {selectedEmail.from}
            </span>
            <span>
              <strong>{STRINGS.ADMIN.EMAILS.TO}</strong> {selectedEmail.to}
            </span>
            <span>{formatDate(selectedEmail.createdAt)}</span>
          </div>

          <hr />

          <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
            {selectedEmail.text || htmlToPlainText(selectedEmail.html || '') || STRINGS.ADMIN.EMAILS.NO_CONTENT}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailDetail;
