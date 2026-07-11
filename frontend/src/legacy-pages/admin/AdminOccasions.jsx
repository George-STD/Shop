import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { STRINGS } from '../../constants';

import AdminOccasionsGrid from '../../components/admin/occasions/AdminOccasionsGrid';
import OccasionFormModal from '../../components/admin/occasions/OccasionFormModal';

const AdminOccasions = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🎉',
    color: 'from-purple-400 to-purple-600',
    isActive: true,
    order: 0,
  });

  const { data: occasions, isLoading } = useQuery({
    queryKey: ['admin-occasions'],
    queryFn: () => adminAPI.getOccasions().then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createOccasion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-occasions'] });
      toast.success(STRINGS.ADMIN.NOTIFICATIONS.OCCASION_CREATED);
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || STRINGS.ADMIN.NOTIFICATIONS.ERROR_OCCURRED);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateOccasion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-occasions'] });
      toast.success(STRINGS.ADMIN.NOTIFICATIONS.OCCASION_UPDATED);
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || STRINGS.ADMIN.NOTIFICATIONS.ERROR_OCCURRED);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteOccasion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-occasions'] });
      toast.success(STRINGS.ADMIN.NOTIFICATIONS.OCCASION_DELETED);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || STRINGS.ADMIN.NOTIFICATIONS.ERROR_OCCURRED);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({
      name: '',
      icon: '🎉',
      color: 'from-purple-400 to-purple-600',
      isActive: true,
      order: 0,
    });
  };

  const openEdit = (occasion) => {
    setEditing(occasion);
    setFormData({
      name: occasion.name,
      icon: occasion.icon,
      color: occasion.color,
      isActive: occasion.isActive,
      order: occasion.order || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (occasion) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_DELETE_OCCASION(occasion.name))) {
      deleteMutation.mutate(occasion._id);
    }
  };

  const toggleActive = (occasion) => {
    updateMutation.mutate({
      id: occasion._id,
      data: { isActive: !occasion.isActive },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{STRINGS.ADMIN.PAGES.MANAGE_OCCASIONS}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          <FiPlus />
          {STRINGS.ADMIN.OCCASIONS.ADD_OCCASION}
        </button>
      </div>

      <AdminOccasionsGrid
        occasions={occasions}
        isLoading={isLoading}
        toggleActive={toggleActive}
        openEdit={openEdit}
        handleDelete={handleDelete}
        setShowModal={setShowModal}
      />

      <OccasionFormModal
        showModal={showModal}
        editing={editing}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        closeModal={closeModal}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AdminOccasions;
