import { useState, useEffect } from 'react';

interface ApplyPopupProps {
  projectId: string;
  onClose: () => void;
  onSubmit: (answers: string[]) => Promise<void>;
}

export default function ApplyPopup({ projectId, onClose, onSubmit }: ApplyPopupProps) {
  const [answers, setAnswers] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scrolling when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (answers.some(answer => !answer.trim())) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(answers);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 isolate">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]"
        onClick={onClose}
      />
      
      {/* Popup content */}
      <div className="fixed inset-0 z-[10000] overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 text-[#f5efdb] hover:text-[#f5efdb99] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div 
              className="rounded-xl bg-[#2a2a28] border border-[#f5efdb1a] p-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-display text-[#f5efdb] mb-6">Submit Application</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error message */}
                {error && (
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {/* Text fields */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="answer1" className="block text-sm text-[#f5efdb] mb-2">
                      Why are you interested in this project?
                    </label>
                    <textarea
                      id="answer1"
                      value={answers[0]}
                      onChange={(e) => setAnswers([e.target.value, answers[1]])}
                      className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] min-h-[100px] resize-none"
                      placeholder="Enter your answer..."
                    />
                  </div>
                  <div>
                    <label htmlFor="answer2" className="block text-sm text-[#f5efdb] mb-2">
                      What relevant experience do you have?
                    </label>
                    <textarea
                      id="answer2"
                      value={answers[1]}
                      onChange={(e) => setAnswers([answers[0], e.target.value])}
                      className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] min-h-[100px] resize-none"
                      placeholder="Enter your answer..."
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                    loading
                      ? 'bg-[#f5efdb33] text-[#f5efdb99] cursor-not-allowed'
                      : 'bg-[#f5efdb] text-[#2a2a28] hover:opacity-90'
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 