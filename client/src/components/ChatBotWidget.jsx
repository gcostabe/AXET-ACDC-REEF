import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Minimize2, Maximize2, Send, Sparkles, Bot, 
  Database, RefreshCw, Trash2, ChevronDown, ChevronRight, BookOpen, 
  HelpCircle, CheckCircle2, FileCode, Layers, ShieldCheck, User
} from 'lucide-react';
import ChatMarkdownRenderer from './ChatMarkdownRenderer';

export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Olá! Sou o **ACDC Copilot**, seu assistente atuarial e técnico da plataforma ACDC Insurance.

Estou conectado diretamente ao banco **MongoDB** e ao **AI Gateway**. Posso tirar dúvidas sobre:
- **Motor de Tarifação (RTE)**: fórmulas atuariais, constantes e conceitos econômicos.
- **Seleção de Risco (DUP)**: regras de subscrição, margens de desconto e restrições.
- **Produtos & Coberturas**: ramos, pacotes e cálculo de risco.
- **Trilha de Auditoria (PECA)**: rastreabilidade de alterações e usuários.

Como posso ajudar você hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5.6-terra-high');
  const [expandedSources, setExpandedSources] = useState({});
  const [ragStatus, setRagStatus] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggestions for quick interaction
  const suggestions = [
    { label: 'O que é PRIMA_CEDIDA_RE_160?', query: 'Explique detalhadamente o que faz a fórmula PRIMA_CEDIDA_RE_160, qual a sua expressão matemática e constantes utilizadas.' },
    { label: 'O que é a constante PCT_MGS_160?', query: 'O que é a constante PCT_MGS_160, qual seu valor no MongoDB e qual seu significado atuarial?' },
    { label: 'Como funcionam as Regras de Subscrição?', query: 'Como funcionam as regras de subscrição e desconto cadastradas na coleção RULES do DUP?' },
    { label: 'O que é a trilha de auditoria PECA?', query: 'Explique como funciona a tela de Auditoria e a trilha de segurança PECA no sistema ACDC.' }
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // Fetch RAG status on mount or open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/chat/rag-status')
        .then(res => res.json())
        .then(data => setRagStatus(data))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      // Build conversation history excluding welcome greeting
      const history = messages
        .filter(m => m.id !== 'welcome_1')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: history,
          model: selectedModel
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Desculpe, ocorreu um erro ao consultar o assistente: ${err.message}. Verifique a conexão com o AI Gateway.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: 'Histórico limpo. Como posso apoiar você agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }
    ]);
  };

  const toggleSourceExpand = (msgId) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Helper to format basic markdown-like content (bold, code, lists)
  const renderFormattedContent = (content) => {
    return (
      <div className="chat-markdown-content" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
        {content}
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="chatbot-floating-button"
          title="Abrir ACDC Copilot (Assistente IA & Regras)"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '9999px',
            backgroundColor: '#0066FF',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0, 102, 255, 0.45)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.25s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 102, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 102, 255, 0.45)';
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="NTT DATA" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <span 
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px #10B981'
              }}
            />
          </div>
          <span>ACDC Copilot</span>
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
            letterSpacing: '0.5px'
          }}>
            IA RAG
          </span>
        </button>
      )}

      {/* Floating Chat Window / Drawer */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: isMinimized ? '340px' : '490px',
            height: isMinimized ? '56px' : '660px',
            maxHeight: 'calc(100vh - 48px)',
            maxWidth: 'calc(100vw - 48px)',
            backgroundColor: '#0C1220',
            border: '1px solid #182338',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(0, 102, 255, 0.2)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.25s ease, width 0.25s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#0E172A',
              borderBottom: '1px solid #182338',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isMinimized ? 'pointer' : 'default'
            }}
            onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 102, 255, 0.12)',
                  border: '1px solid rgba(0, 102, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3px'
                }}
              >
                <img src="/logo.png" alt="NTT DATA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#F1F5F9' }}>ACDC Copilot</span>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '1px 6px', 
                    borderRadius: '4px', 
                    backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                    color: '#10B981', 
                    fontWeight: 600 
                  }}>
                    ONLINE
                  </span>
                </div>
                {!isMinimized && (
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    IA Atuarial • MAPFRE & Tronador (NTT DATA)
                  </div>
                )}
              </div>
            </div>

            {/* Header controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!isMinimized && (
                <button
                  onClick={clearChat}
                  title="Limpar histórico da conversa"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    padding: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748B'}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Model & RAG Status Strip */}
              <div 
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#090D17',
                  borderBottom: '1px solid #141C2E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#64748B'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={13} style={{ color: '#0066FF' }} />
                  <span>
                    RAG MongoDB: {ragStatus?.documentCount ? `${ragStatus.documentCount} docs` : 'Ativo'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Modelo:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{
                      backgroundColor: '#0F172A',
                      color: '#93C5FD',
                      border: '1px solid #1E293B',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="gpt-5.6-terra-high">gpt-5.6-terra-high</option>
                    <option value="gpt-5.6-luna-high">gpt-5.6-luna-high</option>
                    <option value="gpt-4o">gpt-4o</option>
                  </select>
                </div>
              </div>

              {/* Messages Container */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  backgroundColor: '#070A12'
                }}
              >
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const hasSources = msg.sources && msg.sources.length > 0;
                  const isSourceExpanded = expandedSources[msg.id];

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '100%'
                      }}
                    >
                      {/* Message Bubble */}
                      <div
                        style={{
                          maxWidth: '90%',
                          padding: '12px 16px',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: isUser ? '#0066FF' : '#0F172A',
                          color: isUser ? '#FFFFFF' : '#E2E8F0',
                          border: isUser ? 'none' : '1px solid #1E293B',
                          fontSize: '13px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      >
                        {isUser ? (
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{msg.content}</div>
                        ) : (
                          <ChatMarkdownRenderer content={msg.content} />
                        )}

                        {/* Sources Section for Assistant Responses */}
                        {hasSources && (
                          <div 
                            style={{
                              marginTop: '12px',
                              paddingTop: '10px',
                              borderTop: '1px solid rgba(255,255,255,0.08)'
                            }}
                          >
                            <button
                              onClick={() => toggleSourceExpand(msg.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60A5FA',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: 0,
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              <BookOpen size={12} />
                              <span>{msg.sources.length} fontes consultadas no MongoDB</span>
                              {isSourceExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>

                            {isSourceExpanded && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {msg.sources.map((src, sIdx) => (
                                  <div
                                    key={sIdx}
                                    style={{
                                      fontSize: '10.5px',
                                      padding: '4px 8px',
                                      backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                      border: '1px solid rgba(0, 102, 255, 0.2)',
                                      borderRadius: '4px',
                                      color: '#93C5FD',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between'
                                    }}
                                  >
                                    <span style={{ fontWeight: 600 }}>{src.title}</span>
                                    <span style={{ color: '#64748B' }}>{src.sourceCollection}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          color: '#64748B', 
                          marginTop: '4px',
                          paddingLeft: isUser ? 0 : '4px',
                          paddingRight: isUser ? '4px' : 0
                        }}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0, 102, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0066FF'
                      }}
                    >
                      <Sparkles size={16} className="animate-spin" />
                    </div>
                    <div 
                      style={{
                        padding: '10px 14px',
                        borderRadius: '16px',
                        backgroundColor: '#0F172A',
                        border: '1px solid #1E293B',
                        fontSize: '12px',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Consultando base de conhecimento RAG...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions Chips (only if user hasn't sent many messages) */}
              {messages.length <= 2 && (
                <div 
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#090D17',
                    borderTop: '1px solid #141C2E',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}
                >
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sug.query)}
                      style={{
                        backgroundColor: '#111827',
                        border: '1px solid #1F2937',
                        color: '#93C5FD',
                        borderRadius: '12px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1E293B';
                        e.currentTarget.style.borderColor = '#0066FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#111827';
                        e.currentTarget.style.borderColor = '#1F2937';
                      }}
                    >
                      💡 {sug.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#0E172A',
                  borderTop: '1px solid #182338'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#070A12',
                    border: '1px solid #1E293B',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte sobre regras, fórmulas, constantes..."
                    rows={1}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: '13px',
                      resize: 'none',
                      outline: 'none',
                      maxHeight: '80px',
                      lineHeight: '1.4'
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || loading}
                    style={{
                      backgroundColor: inputText.trim() && !loading ? '#0066FF' : '#1E293B',
                      color: inputText.trim() && !loading ? '#FFFFFF' : '#64748B',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Send size={15} />
                  </button>
                </div>
                <div 
                  style={{ 
                    marginTop: '6px', 
                    fontSize: '10px', 
                    color: '#64748B', 
                    display: 'flex', 
                    justifyContent: 'space-between' 
                  }}
                >
                  <span>Pressione <b>Enter</b> para enviar, <b>Shift+Enter</b> para quebrar linha</span>
                  <span>NTT DATA • ACDC v2.4</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
