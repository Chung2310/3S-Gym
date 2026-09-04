import React from 'react';
import { Plus, Zap, RefreshCw, FileText, Trash2 } from 'lucide-react';
import type { KnowledgeDocument } from '../../types/knowledge';

interface KnowledgeDocListProps {
  docs: KnowledgeDocument[];
  loading: boolean;
  onOpenDocModal: (doc?: KnowledgeDocument) => void;
  onTogglePublishDoc: (doc: KnowledgeDocument) => void;
  onDeleteDoc: (id: string, title: string) => void;
  onSeedDocs: () => void;
}

export const KnowledgeDocList: React.FC<KnowledgeDocListProps> = ({
  docs,
  loading,
  onOpenDocModal,
  onTogglePublishDoc,
  onDeleteDoc,
  onSeedDocs,
}) => {
  return (
    <>
      <div className="bg-white rounded-xl p-3.5 sm:p-4.5 border border-slate-200 mb-5 flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="font-extrabold text-sm text-slate-900">
            Danh Sách Tài Liệu Chuẩn Hóa 3S Gym
          </div>
          <div className="text-xs text-slate-500">
            Các quy chuẩn dinh dưỡng, bài tập, phục hồi dùng làm căn cứ chuyên môn
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSeedDocs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs cursor-pointer hover:bg-emerald-100 transition-colors"
          >
            <Zap size={14} /> Nạp 4 Tài Liệu Chuẩn 3S
          </button>

          <button
            type="button"
            onClick={() => onOpenDocModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
          >
            <Plus size={15} /> Thêm Tài Liệu Mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-sky-600" />
          <div>Đang tải tài liệu tri thức...</div>
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <FileText size={44} className="text-slate-400 mx-auto mb-3" />
          <div className="font-bold text-base text-slate-800">
            Chưa có tài liệu tri thức nào
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto my-2 mb-4">
            Bấm "Nạp 4 Tài Liệu Chuẩn 3S" để nạp ngay các tài liệu quy chuẩn dinh dưỡng và phục hồi thể thao.
          </p>
          <button
            type="button"
            onClick={onSeedDocs}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            <Zap size={14} /> Nạp 4 Tài Liệu Mẫu Ngay
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex justify-between items-start gap-4 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-sm ${
                      doc.topic === 'DINH DƯỠNG'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {doc.topic}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                      doc.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {doc.status === 'PUBLISHED' ? '✓ Đã xuất bản' : 'Bản nháp'}
                  </span>
                  <span className="text-[11px] text-slate-400">v{doc.version || 1}</span>
                </div>

                <h3 className="my-2 text-sm font-extrabold text-slate-900">
                  {doc.title}
                </h3>
                <p className="m-0 text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {doc.content}
                </p>
              </div>

              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onTogglePublishDoc(doc)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-bold border cursor-pointer transition-colors ${
                    doc.status === 'PUBLISHED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {doc.status === 'PUBLISHED' ? 'Thu hồi' : 'Xuất bản'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDocModal(doc)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-slate-50 text-slate-700 border border-slate-300 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDoc(doc._id, doc.title)}
                  className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border-none cursor-pointer transition-colors"
                  title="Xóa tài liệu"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
