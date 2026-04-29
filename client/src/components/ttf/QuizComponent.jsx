import React, { useState } from 'react';

export default function QuizComponent({ quiz, onPass }) {
  const [answers, setAnswers]       = useState({});
  const [submitted, setSubmitted]   = useState(false);
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const questions = quiz?.questions || [];
  const passingScore = quiz?.passingScore || 80;

  const handleSelect = (questionId, value) => {
    if (submitted && results?.passed) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = questions.filter(q => answers[q.questionId] === undefined);
    if (missing.length > 0) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Calculate score locally for immediate feedback
      let correct = 0;
      const qResults = questions.map(q => {
        const userAnswer = answers[q.questionId];
        const isCorrect  = userAnswer === q.correctAnswer;
        if (isCorrect) correct++;
        return { questionId: q.questionId, correct: isCorrect, correctAnswer: q.correctAnswer, userAnswer, explanation: q.explanation };
      });
      const score  = Math.round((correct / questions.length) * 100);
      const passed = score >= passingScore;
      const res    = { score, passed, passingScore, results: qResults };
      setResults(res);
      setSubmitted(true);
      if (passed && onPass) onPass(res);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setError('');
  };

  const resultFor = (questionId) => results?.results?.find(r => r.questionId === questionId);

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Score banner */}
      {submitted && results && (
        <div
          style={{
            padding: 16, borderRadius: 10, marginBottom: 24,
            background: results.passed ? '#d1fae5' : '#fee2e2',
            border:     `1px solid ${results.passed ? '#6ee7b7' : '#fca5a5'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, color: results.passed ? '#059669' : '#dc2626' }}>
                {results.passed ? '🎉 Passed!' : '❌ Not quite yet'}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: results.passed ? '#065f46' : '#991b1b' }}>
                Score: <strong>{results.score}%</strong> (passing: {results.passingScore}%)
              </p>
            </div>
            {!results.passed && (
              <button
                onClick={handleRetake}
                style={{
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {questions.map((q, idx) => {
          const res    = resultFor(q.questionId);
          const chosen = answers[q.questionId];
          return (
            <div
              key={q.questionId}
              style={{
                marginBottom: 28,
                padding: 16,
                borderRadius: 10,
                background:  submitted ? (res?.correct ? '#f0fdf4' : '#fff1f2') : '#f9fafb',
                border:      submitted ? `1px solid ${res?.correct ? '#bbf7d0' : '#fecaca'}` : '1px solid #e5e7eb',
              }}
            >
              <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 15, color: '#1f2937' }}>
                <span style={{ color: '#6b7280', marginRight: 6 }}>{idx + 1}.</span>
                {q.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.answerType === 'multiple-choice' || q.answerType === 'true-false') &&
                  (q.options.length > 0 ? q.options : ['True', 'False']).map(opt => {
                    const isChosen  = chosen === opt;
                    const isCorrect = submitted && opt === q.correctAnswer;
                    const isWrong   = submitted && isChosen && !isCorrect;

                    return (
                      <label
                        key={opt}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 8, cursor: (submitted && results?.passed) ? 'default' : 'pointer',
                          background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : isChosen ? '#ede9fe' : '#fff',
                          border: `1px solid ${isCorrect ? '#86efac' : isWrong ? '#fca5a5' : isChosen ? '#a78bfa' : '#e5e7eb'}`,
                          fontWeight: isChosen ? 600 : 400,
                          fontSize: 14,
                        }}
                      >
                        <input
                          type="radio"
                          name={q.questionId}
                          value={opt}
                          checked={isChosen}
                          onChange={() => handleSelect(q.questionId, opt)}
                          disabled={submitted && results?.passed}
                          style={{ accentColor: '#4f46e5' }}
                        />
                        {opt}
                        {isCorrect && ' ✓'}
                        {isWrong  && ' ✗'}
                      </label>
                    );
                  })
                }
              </div>

              {/* Explanation */}
              {submitted && res?.explanation && (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 6,
                  background: '#f0f9ff', fontSize: 13, color: '#0369a1',
                  border: '1px solid #bae6fd',
                }}>
                  <strong>Explanation:</strong> {res.explanation}
                </div>
              )}
            </div>
          );
        })}

        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {(!submitted || (submitted && !results?.passed)) && (
          <button
            type="submit"
            disabled={loading || (submitted && results?.passed)}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px 28px',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Checking…' : submitted ? 'Retake Quiz' : 'Submit Answers'}
          </button>
        )}
      </form>
    </div>
  );
}
