import React, { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';
import type { KnowledgeDocument } from '../../types/knowledge';

interface KnowledgeDocModalProps {
  isOpen: boolean;
  editingDoc: KnowledgeDocument | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const KnowledgeDocModal: React.FC<KnowledgeDocModalProps> = ({
  isOpen,
  editingDoc,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('DINH DƯỠNG');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingDoc) {
      setTitle(editingDoc.title);
      setTopic(editingDoc.topic);
      setContent(editingDoc.content);
    } else {
      setTitle('');
      setTopic('DINH DƯỠNG');
      setContent('');
    }
  }, [editingDoc, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung tài liệu.');
      return;
    }

    try {
      setSaving(true);
      if (editingDoc) {
        await api.patch(`/api/knowledge/${editingDoc._id}`, {
          title: title.trim(),
          topic,
          content: content.trim(),
        });
        toast.success('Cập nhật tài liệu tri thức thành công!');
      } else {
        await api.post('/api/knowledge', {
          title: title.trim(),
          topic,
          content: content.trim(),
        });
        toast.success('Tạo tài liệu tri thức mới thành công!');
      }
      onClose();
      onSuccess();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-sky-600" />
            <h3 className="m-0 text-base font-extrabold text-slate-900">
              {editingDoc ? 'Chỉnh Sửa Tài Liệu Tri Thức' : 'Tạo Tài Liệu Tri Thức Mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề tài liệu:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Quy chuẩn tính Macro thể hình, Hướng dẫn bù nước..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="mb-3.5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chủ đề phân loại:
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 text-[13px] outline-none focus:border-sky-500 bg-white"
            >
              <option value="DINH DƯỠNG">DINH DƯỠNG (Dinh dưỡng & Thực đơn)</option>
              <option value="TẬP LUYỆN">TẬP LUYỆN (Giáo án & Kỹ thuật)</option>
              <option value="PHỤC HỒI">PHỤC HỒI (Giấc ngủ & Thư giãn cơ)</option>
              <option value="CHĂM SÓC">CHĂM SÓC (Chăm sóc & Hội viên)</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nội dung tri thức:
            </label>
            <textarea
              rows={6}
              placeholder="Nhập nội dung quy chuẩn tri thức chuyên môn chi tiết..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 text-xs outline-none focus:border-sky-500 leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : 'Lưu Tài Liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
