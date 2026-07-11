import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { STRINGS } from '../../constants';

import AdminEmailList from '../../components/admin/emails/AdminEmailList';
import AdminEmailDetail from '../../components/admin/emails/AdminEmailDetail';

const AdminEmails = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-emails', page],
    queryFn: () => adminAPI.getEmails({ page, limit: 20 }).then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-emails']);
      setSelectedEmail(null);
    },
  });

  const viewEmail = async (email) => {
    if (!email.isRead) {
      // Fetch full email to mark as read
      const res = await adminAPI.getEmail(email._id);
      queryClient.invalidateQueries(['admin-emails']);
      setSelectedEmail(res.data.data);
    } else {
      setSelectedEmail(email);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_DELETE_EMAIL)) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (selectedEmail) {
    return (
      <AdminEmailDetail
        selectedEmail={selectedEmail}
        setSelectedEmail={setSelectedEmail}
        handleDelete={handleDelete}
        formatDate={formatDate}
      />
    );
  }

  return (
    <AdminEmailList
      data={data}
      isLoading={isLoading}
      page={page}
      setPage={setPage}
      viewEmail={viewEmail}
      handleDelete={handleDelete}
      formatDate={formatDate}
    />
  );
};

export default AdminEmails;
