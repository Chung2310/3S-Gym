import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { errorMessage } from '../../types';

// Components (mảnh UI)
import ConversationList, { type Conversation } from '../../components/assistant/ConversationList';
import SuggestionReview, { type Suggestion } from '../../components/assistant/SuggestionReview';

export default function PtAssistantPage() {
  const toast = useToast();

  // === STATE ===
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // === DATA FETCHING ===
  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([
        api.get<Conversation[]>('/api/assistant/conversations?page=1&limit=20'),
        api.get<Suggestion[]>('/api/assistant/suggestions?page=1&limit=20'),
      ]);
      setConversations(c.data);
      setSuggestions(s.data);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  // === LẮP RÁP COMPONENTS ===
  return (
    <section>
      <div className="section-header">
        <div>
          <h1>PT Assistant</h1>
          <p>Mọi đề xuất phải được PT review trước khi sử dụng.</p>
        </div>
      </div>

      <ConversationList items={conversations} onSelect={() => undefined} />

      {suggestions.map((item) => (
        <SuggestionReview key={item._id} initial={item} />
      ))}
    </section>
  );
}
