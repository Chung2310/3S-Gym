import { useCallback, useEffect, useState, useRef, type FormEvent } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  User,
  Lightbulb,
  CheckSquare,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import CustomerSelect from '../../components/ui/CustomerSelect';
import { errorMessage } from '../../types';

// Components
import SuggestionReview, { type Suggestion } from '../../components/assistant/SuggestionReview';
import { ASSISTANT_TOPICS, type AssistantTopic } from '../../components/assistant/assistantConstants';

export interface AssistantMessage {
  role: string;
  content: string;
  suggestionId?: string;
  citations?: Array<{ documentId: string; title: string }>;
  reviewStatus?: string;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  title: string;
  customerId?: string;
  updatedAt?: string;
  messages?: AssistantMessage[];
}

export default function PtAssistantPage() {
  const toast = useToast();

  // === STATE ===
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<AssistantTopic>(ASSISTANT_TOPICS[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showCustomerPicker, setShowCustomerPicker] = useState<boolean>(false);

  // Input & Chat State
  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('GENERAL');
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, generating]);

  // === DATA FETCHING ===
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, s] = await Promise.all([
        api.get<Conversation[]>('/api/assistant/conversations?page=1&limit=20'),
        api.get<Suggestion[]>('/api/assistant/suggestions?page=1&limit=20'),
      ]);
      setConversations(c.data);
      setSuggestions(s.data);

      if (c.data.length > 0 && !activeConversation) {
        setActiveConversation(c.data[0]);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [activeConversation, toast]);

  useEffect(() => {
    void load();
  }, []);

  // === HANDLERS ===
  const handleSelectPrompt = (promptText: string, reqType = 'GENERAL') => {
    setPromptInput(promptText);
    setSelectedRequestType(reqType);
  };

  const handleStartNewChat = () => {
    setActiveConversation(null);
    setPromptInput('');
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = promptInput.trim();
    if (!textToSend || generating) return;

    setPromptInput('');
    setGenerating(true);

    try {
      if (activeConversation?._id) {
        const result = await api.post<Conversation>(
          `/api/assistant/conversations/${activeConversation._id}/messages`,
          {
            content: textToSend,
            requestType: selectedRequestType || 'GENERAL',
          }
        );
        setActiveConversation(result.data);
        setConversations((prev) =>
          prev.map((c) => (c._id === result.data._id ? result.data : c))
        );
      } else {
        const title = textToSend.slice(0, 40) + '...';
        const newConv = await api.post<Conversation>('/api/assistant/conversations', {
          customerId: selectedCustomerId || undefined,
          title,
        });

        const withMsg = await api.post<Conversation>(
          `/api/assistant/conversations/${newConv.data._id}/messages`,
          {
            content: textToSend,
            requestType: selectedRequestType || 'GENERAL',
          }
        );

        setActiveConversation(withMsg.data);
        setConversations((prev) => [withMsg.data, ...prev]);
      }

      // Refresh suggestions
      const s = await api.get<Suggestion[]>('/api/assistant/suggestions?page=1&limit=20');
      setSuggestions(s.data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const pendingCount = suggestions.filter((s) => s.reviewStatus === 'PT_REVIEW_REQUIRED').length;

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* 1. Header Đơn Giản */}
      <div
        className="section-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #003b70 0%, #00a4e4 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 750, color: '#003b70' }}>
              PT Assistant & Trợ lý Chuyên môn
            </h1>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Hỏi đáp nhanh mọi kiến thức Gym, Dinh dưỡng, InBody, Kỹ thuật bài tập & Kịch bản tư vấn
            </p>
          </div>
        </div>

        {/* Nút Thao tác */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleStartNewChat}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <Plus size={15} /> Cuộc hội thoại mới
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => void load()}
            disabled={loading}
            title="Làm mới"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} color="#003b70" />
          </button>
        </div>
      </div>

      {/* 2. Dải 10 Chủ đề Chuyên môn (Interactive Chips) */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '10px',
          scrollbarWidth: 'none',
        }}
      >
        {ASSISTANT_TOPICS.map((topic) => {
          const isSelected = selectedTopic.id === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                border: isSelected ? `1.5px solid ${topic.color}` : '1px solid #e2e8f0',
                background: isSelected ? `${topic.color}15` : '#ffffff',
                color: isSelected ? topic.color : '#475569',
                fontWeight: isSelected ? 750 : 600,
                fontSize: '0.82rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <span>{topic.icon}</span>
              <span>{topic.name}</span>
            </button>
          );
        })}
      </div>

      {/* Gợi ý câu hỏi nhanh theo chủ đề đang chọn */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
        }}
      >
        <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <Lightbulb size={14} color="#f59e0b" /> Gợi ý nhanh:
        </span>
        {selectedTopic.prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectPrompt(p.scenario, p.requestType)}
            style={{
              padding: '5px 12px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#1e293b',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f9ff';
              e.currentTarget.style.borderColor = '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* 3. KHUNG CHAT TRUNG TÂM LUÔN HIỂN THỊ TRỰC TIẾP */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 59, 112, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '480px',
          marginBottom: '20px',
        }}
      >
        {/* Header phụ: Tùy chọn liên kết học viên nếu muốn */}
        <div
          style={{
            padding: '10px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowCustomerPicker(!showCustomerPicker)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: selectedCustomerId ? '#0284c7' : '#64748b',
                fontSize: '0.78rem',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: 0,
              }}
            >
              <User size={14} />
              {selectedCustomerId ? 'Đang liên kết học viên (nhấn để đổi)' : '+ Liên kết học viên cụ thể (Tùy chọn)'}
            </button>
          </div>

          {activeConversation?.title && (
            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              Hội thoại: {activeConversation.title}
            </span>
          )}
        </div>

        {/* Selector học viên mở rộng nếu PT muốn */}
        {showCustomerPicker && (
          <div style={{ padding: '12px 16px', background: '#f0f9ff', borderBottom: '1px solid #e0f2fe' }}>
            <CustomerSelect
              label=""
              name="chatCustomer"
              value={selectedCustomerId}
              onChange={(id) => {
                setSelectedCustomerId(id);
                if (id) setShowCustomerPicker(false);
              }}
              placeholder="Tìm và chọn học viên để AI cá nhân hóa câu trả lời..."
            />
          </div>
        )}

        {/* Vùng Tin Nhắn Chat */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            maxHeight: '520px',
            minHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {activeConversation?.messages && activeConversation.messages.length > 0 ? (
            activeConversation.messages.map((msg, index) => {
              const isUser = msg.role === 'USER';
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '3px',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                    {isUser ? 'Huấn luyện viên' : '3S AI Assistant'}
                  </span>
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '12px 16px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      background: isUser ? '#003b70' : '#f1f5f9',
                      color: isUser ? '#ffffff' : '#1e293b',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>

                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Nguồn:</span>
                      {msg.citations.map((c) => (
                        <a
                          key={c.documentId}
                          href={`/pt/knowledge-search?q=${c.documentId}`}
                          style={{ fontSize: '0.72rem', color: '#0284c7', textDecoration: 'underline' }}
                        >
                          {c.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Empty Greeting */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto 0',
                padding: '30px 20px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <Sparkles size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 750, color: '#003b70' }}>
                PT muốn tìm hiểu hoặc hỏi về kiến thức gì hôm nay?
              </h3>
              <p style={{ margin: '6px 0 0', maxWidth: '480px', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Gõ câu hỏi vào ô bên dưới hoặc bấm vào các gợi ý ở trên. Trợ lý AI 3S-Gym sẽ trả lời ngay tức thì!
              </p>
            </div>
          )}

          {generating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontSize: '0.82rem', fontStyle: 'italic' }}>
              <Sparkles size={14} className="animate-spin" /> 3S AI Assistant đang suy nghĩ và trả lời...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Ô Nhập Câu Hỏi Dưới Cùng */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '10px',
          }}
        >
          <textarea
            placeholder="Nhập câu hỏi chuyên môn, tình huống chăm sóc khách hoặc yêu cầu kịch bản..."
            rows={2}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage();
              }
            }}
            disabled={generating}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.88rem',
              lineHeight: 1.45,
              resize: 'none',
              fontFamily: 'inherit',
              color: '#1e293b',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            className="button button-primary"
            disabled={generating || !promptInput.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              background: '#003b70',
            }}
          >
            <Send size={16} /> Gửi câu hỏi
          </button>
        </form>
      </div>

      {/* 4. Danh Sách Đề Xuất Chuyên Môn (Nếu có đề xuất cần duyệt) */}
      {suggestions.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <CheckSquare size={16} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#003b70' }}>
              Đề xuất chuyên môn đã tạo ({pendingCount} đề xuất chờ duyệt)
            </h3>
          </div>
          {suggestions.map((item) => (
            <SuggestionReview
              key={item._id}
              initial={item}
              onUpdated={(updated) =>
                setSuggestions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
