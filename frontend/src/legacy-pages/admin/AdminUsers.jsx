import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { STRINGS } from '../../constants';

import AdminUsersHeader from '../../components/admin/users/AdminUsersHeader';
import AdminUsersTable from '../../components/admin/users/AdminUsersTable';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { search, role: roleFilter, isActive: statusFilter, page }],
    queryFn: () =>
      adminAPI
        .getUsers({
          search: search || undefined,
          role: roleFilter || undefined,
          isActive: statusFilter || undefined,
          page,
          limit: 20,
        })
        .then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
    },
  });

  const handleToggleStatus = (user) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_TOGGLE_USER(user.isActive, user.firstName))) {
      updateMutation.mutate({ id: user._id, data: { isActive: !user.isActive } });
    }
  };

  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_CHANGE_ROLE(newRole === 'admin', user.firstName))) {
      updateMutation.mutate({ id: user._id, data: { role: newRole } });
    }
  };

  const handleDelete = (user) => {
    if (window.confirm(STRINGS.ADMIN.MESSAGES.CONFIRM_DELETE_USER(user.firstName))) {
      deleteMutation.mutate(user._id);
    }
  };

  return (
    <div className="space-y-6">
      <AdminUsersHeader
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <AdminUsersTable
        data={data}
        isLoading={isLoading}
        page={page}
        setPage={setPage}
        handleToggleRole={handleToggleRole}
        handleToggleStatus={handleToggleStatus}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default AdminUsers;
