import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { STRINGS } from '../../constants';
import toast from 'react-hot-toast';

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
      queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
      setSelectedEmail(null);
      toast.success('تم حذف الرسالة بنجاح');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشل حذف الرسالة');
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => adminAPI.syncEmails(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
      toast.success(res.data?.message || 'تمت مزامنة الرسائل بنجاح');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'فشلت مزامنة الرسائل من Resend');
    },
  });

  const viewEmail = async (email) => {
    // If unread or body is empty, call backend getEmail to mark as read and auto-recover body from Resend
    if (!email.isRead || !email.text) {
      try {
        const res = await adminAPI.getEmail(email._id);
        queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
        setSelectedEmail(res.data.data);
        return;
      } catch (err) {
        console.error('Failed to fetch full email details:', err);
      }
    }
    setSelectedEmail(email);
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
      handleSync={() => syncMutation.mutate()}
      isSyncing={syncMutation.isPending}
    />
  );
};

export default AdminEmails;
