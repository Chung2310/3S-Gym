import { useEffect, useState } from 'react';
import CustomerJourney from '../../components/customer-portal/CustomerJourney';
import { useToast } from '../../components/ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage, type CustomerJourneyDto } from '../../types';

export default function CustomerPortalPage() {
  const toast = useToast(); const [journey, setJourney] = useState<CustomerJourneyDto | null>(null);
  useEffect(() => { api.get<CustomerJourneyDto>('/api/me/journey').then((result) => setJourney(result.data)).catch((error: unknown) => toast.error(errorMessage(error))); }, [toast]);
  if (!journey) return <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Đang tải hành trình...</div>;
  return <><header className="mb-6"><h1 className="font-oswald text-3xl font-bold uppercase text-primary">Hành trình của tôi</h1><p className="mt-2 text-sm text-slate-600">Lịch tập, kết quả từng buổi và toàn bộ tiến bộ của bạn.</p></header><CustomerJourney journey={journey} /></>;
}
