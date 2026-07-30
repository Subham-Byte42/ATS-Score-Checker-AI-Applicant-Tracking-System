import React, { useState, useEffect, useRef } from 'react';
import { ResumeRecord } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Search, 
  Check, 
  Copy, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  HelpCircle,
  Briefcase,
  Zap
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AiChatbotModuleProps {
  resumes: ResumeRecord[];
  user: { name: string; email: string };
  onSelectResume?: (resume: ResumeRecord) => void;
  onNavigateToUpload?: () => void;
}

export const AiChatbotModule: React.FC<AiChatbotModuleProps> = ({
  resumes = [],
  user,
  onSelectResume,
  onNavigateToUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showContextDetails, setShowContextDetails] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter resumes by search term
  const filteredResumes = resumes.filter((r) => {
    const term = searchTerm.toLowerCase();
    const candidate = (r.candidateName || '').toLowerCase();
    const fileName = (r.fileName || '').toLowerCase();
    const role = (r.targetRole || '').toLowerCase();
    return candidate.includes(term) || fileName.includes(term) || role.includes(term);
  });

  // Set default selected resume when resumes list updates
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];

  // Get current chat messages for the selected resume
  const currentMessages: ChatMessage[] = selectedResumeId
    ? chatHistories[selectedResumeId] || []
    : [];

  // Scroll to bottom when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  // Initial welcome message if chat history for selected resume is empty
  useEffect(() => {
    if (selectedResume && selectedResumeId && !chatHistories[selectedResumeId]) {
      const candidate = selectedResume.candidateName || user.name || 'Candidate';
      const role = selectedResume.targetRole || 'Software Engineer';
      const score = selectedResume.atsScore || 0;

      const welcomeText = `Hello **${candidate}**! 👋 I'm your **AI Resume & Career Advisor**.

I've analyzed your resume for **${role}** (ATS Score: **${score}%**).

How can I help you optimize your resume today? You can pick a quick prompt below or ask me anything about:
• 🎯 **ATS Score Optimization** & Keyword Density
• ⚠️ **Missing Skills & Tech Stack Gaps**
• ✍️ **Rewriting Bullet Points** with Action Verbs & Metrics
• 🎤 **Technical & Behavioral Interview Prep**
• 💼 **Alternative Career Pathways & Job Roles**`;

      const initialMsg: ChatMessage = {
        id: `welcome_${selectedResumeId}`,
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedResumeId]: [initialMsg],
      }));
    }
  }, [selectedResumeId, selectedResume, user.name, chatHistories]);

  // Handle sending message
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isLoading) return;

    if (!selectedResume) {
      alert('Please upload or select a resume from your history to chat about.');
      return;
    }

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update state with user message immediately
    const updatedHistory = [...(chatHistories[selectedResume.id] || []), userMsg];
    setChatHistories((prev) => ({
      ...prev,
      [selectedResume.id]: updatedHistory,
    }));

    if (!textToSend) {
      setInputMessage('');
    }

    setIsLoading(true);

    try {
      // Prepare API payload
      const payload = {
        resumeContext: {
          candidateName: selectedResume.candidateName || user.name,
          targetRole: selectedResume.targetRole || 'Software Engineer',
          atsScore: selectedResume.atsScore,
          skillsFound: selectedResume.matchedKeywords || [],
          missingSkills: selectedResume.missingSkills || [],
          strengths: selectedResume.strengths || [],
          weaknesses: selectedResume.weaknesses || [],
          suggestions: selectedResume.suggestions || [],
        },
        message: messageText,
        history: updatedHistory.slice(-6).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        })),
      };

      const res = await fetch('/api/resumes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let aiReplyText = '';

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.reply) {
          aiReplyText = json.reply;
        }
      }

      if (!aiReplyText) {
        // Fallback intelligent response generator if backend route is unavailable
        aiReplyText = generateFallbackReply(messageText, selectedResume);
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedResume.id]: [...(prev[selectedResume.id] || []), botMsg],
      }));
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackText = generateFallbackReply(messageText, selectedResume);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistories((prev) => ({
        ...prev,
        [selectedResume.id]: [...(prev[selectedResume.id] || []), botMsg],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side fallback response generator when offline or API timeout
  const generateFallbackReply = (prompt: string, resume: ResumeRecord): string => {
    const role = resume.targetRole || 'Software Engineer';
    const score = resume.atsScore || 75;
    const missing = (resume.missingSkills || []).slice(0, 4).join(', ');
    const found = (resume.matchedKeywords || []).slice(0, 5).join(', ');

    const lower = prompt.toLowerCase();

    if (lower.includes('ats') || lower.includes('score') || lower.includes('increase') || lower.includes('improve')) {
      return `To boost your ATS Score for **${role}** (Currently at **${score}%**):

1. **Incorporate Missing Keywords**: Add high-demand industry keywords like ${missing || 'Docker, Kubernetes, CI/CD'} directly into your skills matrix.
2. **Action Verb Standardization**: Begin every work experience bullet with active verbs (e.g., *Engineered, Spearheaded, Optimized, Delivered*).
3. **Quantified Impact**: Add metrics to at least 70% of your experience entries (e.g. *"Boosted app speed by 35% across 50,000 active users"*).
4. **ATS Parser Friendly Layout**: Avoid multi-column text tables or nested graphics that ATS systems like Workday or Greenhouse cannot parse correctly.`;
    }

    if (lower.includes('missing') || lower.includes('skill') || lower.includes('keyword') || lower.includes('gap')) {
      return `Based on your resume analysis for **${role}**, here are key skill gaps to address:

• **Primary Missing Keywords**: ${missing || 'Docker, Kubernetes, AWS, GraphQL'}
• **Recommended Next Step**: Create a "Technical Competencies" section split into **Languages**, **Frameworks**, and **Cloud/DevOps Tools**.
• **Project Proof**: Build a small showcase repository highlighting asynchronous queues, microservices, or cloud deployments.`;
    }

    if (lower.includes('bullet') || lower.includes('rewrite') || lower.includes('experience') || lower.includes('project')) {
      return `Here are **3 high-impact bullet point templates** tailored for **${role}**:

• 🚀 **Performance Optimization**: *"Engineered and refactored core backend services using ${found || 'TypeScript & Node.js'}, reducing API latency by 42% and handling 10k+ daily queries."*
• 🛠️ **System Architecture**: *"Architected scalable RESTful endpoints and database schemas, improving data fetch speeds and eliminating redundant server requests."*
• 📈 **Team & Product Growth**: *"Spearheaded modern frontend state management, resulting in a 25% improvement in user onboarding conversion rates."*`;
    }

    if (lower.includes('interview') || lower.includes('question') || lower.includes('prep')) {
      return `Here are **4 key interview questions** to prepare for **${role}**:

1. **System Design**: *"How would you architect a scalable REST API handling thousands of concurrent requests while maintaining low database latency?"*
2. **Technical Deep Dive**: *"Can you walk me through how you optimized a slow rendering component or database query in a previous project?"*
3. **Behavioral (STAR Method)**: *"Tell me about a time you identified technical debt or a critical production bug. How did you resolve it?"*
4. **Tooling**: *"How do you approach writing clean unit tests and setting up CI/CD pipelines for deployment?"*`;
    }

    return `Thanks for your question regarding **${resume.candidateName || 'your resume'}** for the **${role}** role!

Here is a quick summary based on your profile:
• **Current ATS Match**: **${score}%**
• **Core Strengths**: Strong core skills listed in ${found || 'web technologies'}.
• **Optimization Tip**: Focus on incorporating missing technical keywords like **${missing || 'cloud tools'}** and quantifying your project achievements.

What specific area would you like to dive deeper into? (e.g., bullet point rewrites, missing skills, or interview prep!)`;
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearHistory = () => {
    if (!selectedResumeId) return;
    if (confirm('Clear chat history for this resume?')) {
      setChatHistories((prev) => ({
        ...prev,
        [selectedResumeId]: [],
      }));
    }
  };

  // Quick Prompt Suggestions
  const quickPrompts = [
    { label: '🎯 How to increase my ATS score?', prompt: 'How can I increase my ATS score for this target role?' },
    { label: '⚠️ What missing skills should I learn?', prompt: 'What critical missing skills and technologies should I add to my resume?' },
    { label: '✍️ Give me 3 bullet point rewrites', prompt: 'Give me 3 high-impact bullet point rewrites with metrics for my experience section.' },
    { label: '🎤 Technical interview prep questions', prompt: 'Generate 4 practice technical interview questions based on this resume.' },
    { label: '💼 What alternative roles fit my profile?', prompt: 'What alternative or aligned job titles best match my current skill set?' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Page Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl space-y-2 shadow-lg border border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Interactive Gemini AI Career Assistant</span>
          </div>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 font-semibold text-[11px] rounded-full border border-blue-400/30">
            Real-Time Contextual Chat
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          AI Resume Chatbot & Career Coach
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Select any scanned resume from your history to discuss ATS optimizations, skill gap analyses, custom bullet point rewrites, or technical interview prep with Gemini AI.
        </p>
      </div>

      {/* Main Container: Sidebar + Chat Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px]">
        {/* Left Column: Resumes History Selector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between h-[620px]">
          <div className="space-y-4 min-h-0 flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1877f2]" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Scan History Context
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1877f2] font-bold text-[11px] rounded-full">
                {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates or roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {filteredResumes.length > 0 ? (
                filteredResumes.map((r) => {
                  const isSelected = r.id === selectedResumeId;
                  const candidate = r.candidateName || 'Candidate';
                  const role = r.targetRole || 'Software Engineer';
                  const score = r.atsScore || 0;

                  let scoreBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (score < 60) {
                    scoreBg = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else if (score < 75) {
                    scoreBg = 'bg-blue-50 text-blue-700 border-blue-200';
                  }

                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedResumeId(r.id);
                        if (onSelectResume) onSelectResume(r);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-[#1877f2] shadow-xs ring-2 ring-blue-500/20'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{candidate}</h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1877f2] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{role}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{r.fileName}</p>
                      </div>

                      <div className="flex flex-col items-end shrink-0 space-y-1">
                        <span className={`px-2 py-0.5 font-extrabold text-[10px] rounded-full border ${scoreBg}`}>
                          {score}% ATS
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{r.uploadDate || 'Recent'}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">No History Records Found</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Upload a new resume to start chatting with AI about ATS scores and career suggestions.
                    </p>
                  </div>
                  {onNavigateToUpload && (
                    <button
                      onClick={onNavigateToUpload}
                      className="px-3.5 py-1.5 bg-[#1877f2] hover:bg-[#0866ff] text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Resume</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Upload New Button */}
          {onNavigateToUpload && resumes.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={onNavigateToUpload}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Scan Another Resume</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Chat Area (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col h-[620px] overflow-hidden">
          {/* Chat Top Banner: Current Selected Resume Context */}
          {selectedResume ? (
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-white truncate">
                      {selectedResume.candidateName || user.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-extrabold text-[10px] rounded-full border border-blue-400/30">
                      {selectedResume.atsScore || 0}% ATS Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Target Role: <strong className="text-slate-200">{selectedResume.targetRole || 'Software Engineer'}</strong> • File: {selectedResume.fileName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowContextDetails(!showContextDetails)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
                  title="Toggle Resume Summary Context"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{showContextDetails ? 'Hide Details' : 'View Context'}</span>
                </button>

                <button
                  onClick={handleClearHistory}
                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Clear conversation history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">No Resume Context Selected</span>
            </div>
          )}

          {/* Quick Context Details Dropdown Drawer */}
          {showContextDetails && selectedResume && (
            <div className="p-4 bg-slate-800 text-slate-200 border-b border-slate-700 text-xs space-y-2.5 animate-in slide-in-from-top duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider block">Found Skills:</span>
                  <p className="text-slate-300 text-[11px]">
                    {(selectedResume.matchedKeywords || []).join(', ') || 'Standard tech stack listed'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-rose-400 text-[11px] uppercase tracking-wider block">Missing Keywords:</span>
                  <p className="text-slate-300 text-[11px]">
                    {(selectedResume.missingSkills || []).join(', ') || 'None critical'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-slate-50/50">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                        isUser
                          ? 'bg-[#1877f2] text-white font-bold text-xs'
                          : 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                    </div>

                    {/* Message Content Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 shadow-2xs relative group ${
                        isUser
                          ? 'bg-[#1877f2] text-white rounded-tr-none'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-xs'
                      }`}
                    >
                      {/* Formatted Markdown Content */}
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.text}
                      </div>

                      {/* Footer Actions & Timestamp */}
                      <div
                        className={`flex items-center justify-between gap-4 pt-1 text-[10px] ${
                          isUser ? 'text-blue-100' : 'text-slate-400 border-t border-slate-100'
                        }`}
                      >
                        <span>{msg.timestamp}</span>

                        {!isUser && (
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                            title="Copy response"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 bg-blue-50 text-[#1877f2] rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Start Conversation with AI Advisor</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ask questions about how to improve ATS matching, add missing skills, or prepare for technical interviews.
                </p>
              </div>
            )}

            {/* AI Generation Loading State */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 space-y-2 shadow-xs flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="font-medium text-slate-500">Gemini AI is analyzing resume & preparing response...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Pills Section */}
          <div className="p-3 bg-white border-t border-slate-100 space-y-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1877f2] border border-slate-200/80 hover:border-blue-200 font-semibold text-[11px] rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Message Input Bar */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  selectedResume
                    ? `Ask anything about ${selectedResume.candidateName || 'this resume'}, ATS scores, or skill gaps...`
                    : 'Select a resume from history to start chatting...'
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading || !selectedResume}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || !selectedResume}
                className="px-4 py-2.5 sm:py-3 bg-[#1877f2] hover:bg-[#0866ff] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:cursor-not-allowed"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
