'use client';

import { useState, useRef, useEffect } from 'react';
import { useWizardStore } from '@/store/wizard.store';
import { ContentCategory } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const GENRE_OPTIONS: Record<ContentCategory, string[]> = {
  book: ['Fiction', 'Non-Fiction', 'Thriller', 'Romance', 'Science Fiction', 'Historical Fiction', 'Biography', 'Self-Help'],
  screenplay: ['Action', 'Drama', 'Comedy', 'Horror', 'Thriller', 'Romance', 'Documentary', 'Animation'],
  thesis: ['Social Science', 'Natural Science', 'Engineering', 'Medicine', 'Law', 'Economics', 'Education', 'Humanities'],
  journal: ['Social Science', 'Natural Science', 'Engineering', 'Medicine', 'Law', 'Economics', 'Education', 'Humanities'],
  educational: ['Primary Education', 'Secondary Education', 'Tertiary Education', 'Professional Training', 'Corporate Learning'],
  article: ['News', 'Opinion / Editorial', 'How-To / Guide', 'Listicle', 'Interview', 'Review'],
  social_media: ['Promotional', 'Educational', 'Storytelling', 'Thought Leadership', 'Community Engagement'],
};

const TONE_OPTIONS: Record<ContentCategory, string[]> = {
  book: ['Serious', 'Humorous', 'Dark', 'Inspirational', 'Suspenseful', 'Romantic', 'Satirical', 'Poetic'],
  screenplay: ['Serious', 'Humorous', 'Dark', 'Inspirational', 'Suspenseful', 'Romantic', 'Satirical', 'Poetic'],
  thesis: ['Formal and Objective', 'Analytical', 'Critical', 'Exploratory', 'Persuasive'],
  journal: ['Formal and Objective', 'Analytical', 'Critical', 'Exploratory', 'Persuasive'],
  educational: ['Friendly and Encouraging', 'Authoritative', 'Socratic', 'Step-by-Step', 'Conversational'],
  article: ['Conversational', 'Informative', 'Opinionated', 'Witty', 'Professional', 'Inspirational'],
  social_media: ['Punchy', 'Engaging', 'Provocative', 'Authentic', 'Humorous', 'Professional'],
};

const LENGTH_OPTIONS: Record<ContentCategory, string[]> = {
  book: ['Short Story (< 10k words)', 'Novella (10-40k)', 'Novel (40-100k)', 'Epic Novel (100k+)'],
  screenplay: ['Short Film (< 30 pages)', 'Feature Film (90-120 pages)', 'TV Pilot (30-60 pages)'],
  thesis: ['Undergraduate (5-15k words)', 'Masters (15-40k)', 'PhD (40-100k)'],
  journal: ['Short Communication (2-4k)', 'Research Article (5-10k)', 'Review Article (8-15k)'],
  educational: ['Single Lesson', 'Module (3-5 lessons)', 'Full Course (10+ lessons)'],
  article: ['Short Post (< 500 words)', 'Standard Article (500-1500 words)', 'Long-form (1500+ words)'],
  social_media: ['Single Post', 'Short Thread (2-5 tweets)', 'Long Thread (6+ tweets)'],
};

const CONSTRAINTS_OPTIONS = [
  'APA Citations', 'MLA Citations', 'Chicago Style', 'Harvard Style', 
  'IEEE Format', 'No Citations Required', 'Include Statistical Analysis', 
  'Include Literature Review', 'Peer Review Ready', 'Original Research Only'
];

export function StepStructuredQuestions() {
  const { 
    category, 
    answers, 
    setAnswer, 
    setConstraint,
    brainstormHistory,
    addBrainstormMessage,
    isBrainstormReady,
    setBrainstormReady
  } = useWizardStore();
  
  const [showAdvancedScope, setShowAdvancedScope] = useState(false);
  const [showAcademicReqs, setShowAcademicReqs] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  if (!category) return null;

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [brainstormHistory]);

  const handleToneToggle = (tone: string) => {
    const currentTones = answers.tone ? answers.tone.split(', ').filter(Boolean) : [];
    if (currentTones.includes(tone)) {
      setAnswer('tone', currentTones.filter(t => t !== tone).join(', '));
    } else {
      setAnswer('tone', [...currentTones, tone].join(', '));
    }
  };

  const getSmartFollowUps = () => {
    if (!answers.title || !answers.genre || !answers.targetAudience) return [];
    
    // Using static followups as context context for the AI, not rendering them directly as inputs anymore
    // We can just define them to send to the backend
    const genre = answers.genre.toLowerCase();
    
    if (category === 'book') {
      if (genre.includes('thriller')) return ["Who is your protagonist and what do they want most?", "What is the central secret?"];
      if (genre.includes('romance')) return ["What keeps your two leads apart initially?", "Happy ending required?"];
      return ["What is the inciting incident?", "What is the emotional experience?"];
    }
    if (category === 'thesis') return ["What is your central research question?", "What research methodology are you using?"];
    if (category === 'journal') return ["What is your key finding in one sentence?", "What gap does this address?"];
    if (category === 'screenplay') return ["What is the logline?", "Tonal reference?"];
    if (category === 'educational') return ["Most important learning outcome?", "Prior knowledge assumed?"];
    if (category === 'article') return ["Core takeaway?", "Specific case studies to include?"];
    if (category === 'social_media') return ["Primary Call to Action?", "Emotion to evoke?"];
    return [];
  };

  const canStartBrainstorm = !!(answers.title && answers.genre && answers.targetAudience);

  const startOrContinueChat = async (userMessage?: string) => {
    if (!canStartBrainstorm || isChatLoading) return;
    
    setIsChatLoading(true);
    if (userMessage) {
      addBrainstormMessage({ role: 'user', content: userMessage });
      setChatInput('');
    }

    try {
      const res = await fetch('/api/wizard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          answers,
          history: userMessage 
            ? [...brainstormHistory, { role: 'user', content: userMessage }]
            : brainstormHistory,
          suggestedFollowUps: getSmartFollowUps()
        })
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();
      
      if (data.isReady) {
        setBrainstormReady(true);
        addBrainstormMessage({ 
          role: 'assistant', 
          content: "Perfect! I have enough context. You can click 'Continue' to generate the master prompt." 
        });
      } else {
        addBrainstormMessage({ role: 'assistant', content: data.reply });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 mb-6">
        <p className="text-sm text-indigo-200">
          <strong className="text-indigo-400">Pro Tip:</strong> The more details you provide, the better the final output will be. Let our AI help you brainstorm!
        </p>
      </div>

      {/* SECTION A */}
      <section>
        <h3 className="mb-4 font-sora text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          A. What are you creating?
        </h3>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Project Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={answers.title || ''}
              onChange={(e) => setAnswer('title', e.target.value)}
              placeholder={category === 'book' ? "e.g. The Lagos Conspiracy" : "e.g. Mobile Money and Financial Inclusion"}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Genre / Field <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              list="genre-options"
              value={answers.genre || ''}
              onChange={(e) => setAnswer('genre', e.target.value)}
              placeholder="Select or type a genre"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <datalist id="genre-options">
              {GENRE_OPTIONS[category].map(g => <option key={g} value={g} />)}
            </datalist>
          </div>
        </div>
      </section>

      {/* SECTION B */}
      <section>
        <h3 className="mb-4 font-sora text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          B. Who is it for?
        </h3>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Target Audience <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={answers.targetAudience || ''}
              onChange={(e) => setAnswer('targetAudience', e.target.value)}
              placeholder="e.g. First-year university students in Nigeria"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Be specific — knowing your audience shapes the vocabulary, complexity, and references used.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Age Group</label>
              <select
                value={answers.ageGroup || ''}
                onChange={(e) => setAnswer('ageGroup', e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select age group</option>
                <option value="Children (5-12)">Children (5-12)</option>
                <option value="Teenagers (13-17)">Teenagers (13-17)</option>
                <option value="Young Adults (18-25)">Young Adults (18-25)</option>
                <option value="Adults (26-45)">Adults (26-45)</option>
                <option value="Mature Adults (46+)">Mature Adults (46+)</option>
                <option value="All Ages">All Ages</option>
              </select>
            </div>

            {['thesis', 'journal', 'educational'].includes(category) && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Education Level</label>
                <select
                  value={answers.educationLevel || ''}
                  onChange={(e) => setAnswer('educationLevel', e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select education level</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Professional / Expert">Professional / Expert</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION C */}
      <section>
        <h3 className="mb-4 font-sora text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          C. How should it be written?
        </h3>
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Tone <span className="text-red-400">*</span> <span className="text-xs font-normal text-zinc-500">(select multiple)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS[category].map(tone => {
                const isSelected = answers.tone?.includes(tone);
                return (
                  <button
                    key={tone}
                    onClick={() => handleToneToggle(tone)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected 
                        ? "bg-indigo-500 text-white" 
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    )}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Writing Style / Voice
            </label>
            <input
              type="text"
              value={answers.style || ''}
              onChange={(e) => setAnswer('style', e.target.value)}
              placeholder="e.g. First person, past tense, literary prose"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Optional — leave blank and the AI will choose a style appropriate for your genre and audience.</p>
          </div>
        </div>
      </section>

      {/* SECTION D */}
      <section>
        <button 
          onClick={() => setShowAdvancedScope(!showAdvancedScope)}
          className="flex w-full items-center justify-between font-sora text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-2 hover:text-indigo-400 transition-colors"
        >
          <span>D. Scope and structure</span>
          {showAdvancedScope ? <ChevronUp className="h-5 w-5" /> : <span className="text-sm font-normal text-zinc-400 flex items-center gap-1">Show more options <ChevronDown className="h-4 w-4" /></span>}
        </button>
        
        {showAdvancedScope && (
          <div className="space-y-5 mt-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Scope / Length</label>
                <select
                  value={answers.length || ''}
                  onChange={(e) => setAnswer('length', e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select length</option>
                  {LENGTH_OPTIONS[category].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {['book', 'thesis', 'educational'].includes(category) && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Number of Chapters/Sections</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={answers.chapterCount || ''}
                    onChange={(e) => setAnswer('chapterCount', e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Content Depth</label>
                <select
                  value={answers.depth || ''}
                  onChange={(e) => setAnswer('depth', e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select depth</option>
                  <option value="Overview / Introductory">Overview / Introductory</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced / Expert">Advanced / Expert</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Output Language</label>
                <select
                  value={answers.language || ''}
                  onChange={(e) => setAnswer('language', e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Yoruba">Yoruba</option>
                  <option value="Igbo">Igbo</option>
                  <option value="Hausa">Hausa</option>
                  <option value="Swahili">Swahili</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Geographical or Cultural Context</label>
              <input
                type="text"
                value={answers.geographicalContext || ''}
                onChange={(e) => setAnswer('geographicalContext', e.target.value)}
                placeholder="e.g. Contemporary Nigeria, Pan-African context"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-zinc-500">Optional — helps the AI use relevant examples, names, and references.</p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION E - Conditional */}
      {['thesis', 'journal'].includes(category) && (
        <section>
          <button 
            onClick={() => setShowAcademicReqs(!showAcademicReqs)}
            className="flex w-full items-center justify-between font-sora text-lg font-semibold text-zinc-100 border-b border-zinc-800 pb-2 hover:text-indigo-400 transition-colors"
          >
            <span>E. Academic requirements</span>
            {showAcademicReqs ? <ChevronUp className="h-5 w-5" /> : <span className="text-sm font-normal text-zinc-400 flex items-center gap-1">Show more options <ChevronDown className="h-4 w-4" /></span>}
          </button>
          
          {showAcademicReqs && (
            <div className="space-y-5 mt-4 animate-in fade-in duration-200">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Formatting & Constraints
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONSTRAINTS_OPTIONS.map(constraint => {
                    const isSelected = answers.constraints.includes(constraint);
                    return (
                      <button
                        key={constraint}
                        onClick={() => setConstraint(constraint, !isSelected)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          isSelected 
                            ? "bg-indigo-500 text-white" 
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        )}
                      >
                        {constraint}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Additional Notes</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={answers.additionalNotes || ''}
                  onChange={(e) => setAnswer('additionalNotes', e.target.value)}
                  placeholder="Any other details the AI should know about your project..."
                  className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-right text-xs text-zinc-500">
                  {(answers.additionalNotes || '').length}/500
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* AI CO-PILOT BRAINSTORMING */}
      {canStartBrainstorm && (
        <section className="mt-8 rounded-lg border border-indigo-500/30 bg-zinc-950 p-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-sora text-lg font-semibold text-indigo-400 flex items-center gap-2">
                <span className="text-xl">✨</span> AI Brainstorming
              </h3>
              <p className="text-sm text-zinc-400 mt-1">Chat with me to flesh out your idea before generating the prompt.</p>
            </div>
            {brainstormHistory.length === 0 && (
              <button
                onClick={() => startOrContinueChat()}
                disabled={isChatLoading}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Start Chat
              </button>
            )}
          </div>
          
          {brainstormHistory.length > 0 && (
            <div className="flex flex-col gap-4">
              <div ref={chatContainerRef} className="max-h-[300px] overflow-y-auto space-y-4 rounded bg-zinc-900/50 p-4 border border-zinc-800">
                {brainstormHistory.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                      msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-200"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-start">
                    <div className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400">
                      Typing...
                    </div>
                  </div>
                )}
              </div>

              {!isBrainstormReady && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        e.preventDefault();
                        startOrContinueChat(chatInput);
                      }
                    }}
                    placeholder="Type your response... (or say 'I am done')"
                    className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) startOrContinueChat(chatInput);
                    }}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
