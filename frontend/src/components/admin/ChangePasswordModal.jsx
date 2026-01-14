import { useState } from 'react';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';
import { useToast } from '../common/Toast/ToastContext';

export default function ChangePasswordModal({ isOpen, onClose, user, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.post(`/admin/change-staff-password/${user._id}`, {
        newPassword,
        confirmPassword
      });

      if (res.data.success) {
        showSuccess("Password updated successfully");
        setNewPassword('');
        setConfirmPassword('');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Change password error:", error);
      showError(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={`Change Password for ${user.username}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg mb-4">
            <p className="text-sm text-amber-800">
                You are setting a permanent new password for this staff member. They will need to use this new password immediately.
            </p>
        </div>

        <div>
          <label className="block type-label mb-2 ml-1">New Password</label>
          <input
            type="password"
            required
            className="input-standard w-full"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block type-label mb-2 ml-1">Confirm New Password</label>
          <input
            type="password"
            required
            className="input-standard w-full"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 type-label hover:text-slate-700 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary bg-amber-600 hover:bg-amber-700 border-amber-600 min-w-[180px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                <span>Updating...</span>
              </>
            ) : "Change Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
