import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus } from 'react-icons/fi';
import { adminAPI, categoriesAPI } from '../../services/api';
import { STRINGS } from '../../constants';

import AdminCategoriesGrid from '../../components/admin/categories/AdminCategoriesGrid';
import CategoryFormModal from '../../components/admin/categories/CategoryFormModal';

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    icon: '',
    order: 0,
    isActive: true,
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      alert(error.response?.data?.message || STRINGS.ADMIN.NOTIFICATIONS.DELETE_CATEGORY_ERROR);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      icon: '',
      order: 0,
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '',
      order: category.order || 0,
      isActive: category.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, order: Number(formData.order) };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (category) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_DELETE_CATEGORY(category.name))) {
      deleteMutation.mutate(category._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{STRINGS.ADMIN.PAGES.CATEGORIES_TITLE} ({categories?.length || 0})</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600"
        >
          <FiPlus />
          {STRINGS.ADMIN.CATEGORIES.ADD_NEW_CATEGORY}
        </button>
      </div>

      <AdminCategoriesGrid
        categories={categories}
        isLoading={isLoading}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <CategoryFormModal
        showModal={showModal}
        editingCategory={editingCategory}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        setShowModal={setShowModal}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AdminCategories;
