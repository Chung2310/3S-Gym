import { useCallback, useEffect, useState } from 'react';
import { Zap, SlidersHorizontal } from 'lucide-react';
import FeatureFlagModal, { type FeatureFlagItem } from '../../components/ui/FeatureFlagModal';
import RoleBadge from '../../components/ui/RoleBadge';
import { useToast } from '../../components/ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage, type UserRole } from '../../types';

const defaultFeatureDefinitions: Record<string, { name: string; description: string }> = {
  OCR_INBODY: {
    name: 'Quét InBody bằng AI / OCR',
    description: 'Tự động nhận diện và trích xuất các chỉ số InBody từ ảnh chụp của học viên.',
  },
  NUTRITION_AI: {
    name: 'Dinh dưỡng & Thực đơn AI',
    description: 'Tính toán calories, macros và gợi ý kế hoạch bữa ăn cá nhân hóa.',
  },
  ROADMAP: {
    name: 'Lộ trình Huấn luyện (Roadmap)',
    description: 'Thiết kế các giai đoạn tập luyện mục tiêu có cấu trúc tuần tự.',
  },
  CARE: {
    name: 'Chăm sóc & Cảnh báo (Care)',
    description: 'Quản lý tác vụ chăm sóc khách hàng, nhắc nhở và hàng đợi Today.',
  },
  KNOWLEDGE_BASE: {
    name: 'Kho Tri thức & RAG',
    description: 'Tìm kiếm tài liệu bài tập, dinh dưỡng và trợ lý tra cứu thông minh.',
  },
  PT_ASSISTANT: {
    name: 'Trợ lý PT Thông minh',
    description: 'Hỗ trợ gợi ý giáo án, giải đáp thắc mắc chuyên môn trong quá trình huấn luyện.',
  },
  PROGRESS: {
    name: 'Theo dõi Tiến độ Tập luyện',
    description: 'Ghi nhận buổi tập, lịch sử check-in và biểu đồ tiến bộ hình thể.',
  },
  DASHBOARD: {
    name: 'Bảng Điều khiển Vận hành',
    description: 'Tổng quan các chỉ số hoạt động, gói tập và cảnh báo hệ thống.',
  },
};

export default function FeatureFlagsView() {
  const toast = useToast();
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagItem | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFlags = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.get<Record<string, boolean>>('/api/features/me');
      const keys = Object.keys(defaultFeatureDefinitions);
      const items: FeatureFlagItem[] = keys.map((key) => {
        const def = defaultFeatureDefinitions[key] || { name: key, description: '' };
        return {
          key,
          name: def.name,
          description: def.description,
          enabled: Boolean(result.data?.[key as keyof typeof result.data]),
          roles: ['ADMIN', 'PT'],
          pilotUserIds: [],
        };
      });
      setFlags(items);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleToggle = async (flag: FeatureFlagItem, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const nextState = !flag.enabled;
      await api.patch(`/api/features/${flag.key}`, {
        enabled: nextState,
        roles: flag.roles,
      });
      setFlags((current) =>
        current.map((f) => (f.key === flag.key ? { ...f, enabled: nextState } : f))
      );
      toast.success(`Đã ${nextState ? 'bật' : 'tắt'} tính năng ${flag.name || flag.key}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="feature-flags-view">
      <div className="section-header">
        <div>
          <h2>Quản lý Tính năng Hệ thống (Feature Flags)</h2>
          <p>Bật/tắt các module chức năng, phân quyền truy cập theo vai trò và kiểm thử Pilot.</p>
        </div>
      </div>

      <div className="feature-flag-grid">
        {flags.map((flag) => (
          <article className="feature-flag-card" key={flag.key}>
            <div>
              <div className="feature-flag-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} color={flag.enabled ? '#00a4e4' : '#94a3b8'} />
                  <h3 className="feature-flag-title">{flag.name}</h3>
                </div>
                <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={() => {}}
                    onClick={(e) => handleToggle(flag, e)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <p className="feature-flag-desc">{flag.description}</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Mã:</span>
                <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#003b70' }}>
                  {flag.key}
                </code>
              </div>
            </div>

            <div className="feature-flag-footer">
              <div style={{ display: 'flex', gap: '4px' }}>
                {flag.roles.map((role) => (
                  <RoleBadge key={role} role={role as UserRole} />
                ))}
              </div>
              <button
                type="button"
                className="text-button"
                onClick={() => setSelectedFlag(flag)}
                style={{ fontSize: '0.85rem', fontWeight: 700 }}
              >
                <SlidersHorizontal size={15} /> Cấu hình
              </button>
            </div>
          </article>
        ))}
      </div>

      <FeatureFlagModal
        open={Boolean(selectedFlag)}
        feature={selectedFlag}
        onClose={() => setSelectedFlag(null)}
        onSaved={() => {
          setSelectedFlag(null);
          loadFlags();
        }}
      />
    </div>
  );
}
