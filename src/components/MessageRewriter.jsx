// src/components/MessageRewriter.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed
import { rewriteMessage } from '../services/rewriteService';

export default function MessageRewriter() {
  const { user } = useAuth();
  const [message, setMessage] = useState("I'd like to request time off next week");
  const [rewrittenMessage, setRewrittenMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rewriteCount, setRewriteCount] = useState(0);

  const tones = ['Formal', 'Friendly', 'Assertive', 'Apologetic'];

  const handleRewrite = async (tone) => {
    if (!message.trim()) {
      setError('Please enter a message to rewrite');
      return;
    }

    setIsLoading(true);
    setError('');
    setSelectedTone(tone);

    try {
      const result = await rewriteMessage(
        message,
        tone.toLowerCase(),
        user?.id
      );

      if (result.success) {
        setRewrittenMessage(result.rewritten);
        setRewriteCount(prev => prev + 1);
      } else {
        setError(result.error);
        if (result.upgradeUrl) {
          // Handle upgrade prompt
          setTimeout(() => {
            if (window.confirm('You\'ve reached your daily limit. Would you like to upgrade?')) {
              window.location.href = result.upgradeUrl;
            }
          }, 100);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Rewrite error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rewrittenMessage || message);
    // You can add a toast notification here
  };

  const handleDownload = () => {
    const text = rewrittenMessage || message;
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'rewritten-message.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="message-rewriter">
      <div className="stats-bar">
        <p>Signed in as {user?.email || 'Guest'}</p>
        <p>~{rewriteCount} rewrites today</p>
      </div>

      <div className="tone-buttons">
        {tones.map((tone) => (
          <button
            key={tone}
            className={`tone-btn ${selectedTone === tone ? 'active' : ''}`}
            onClick={() => handleRewrite(tone)}
            disabled={isLoading}
          >
            {tone}
          </button>
        ))}
      </div>

      <div className="message-container">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          rows={4}
          disabled={isLoading}
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            Rewriting message...
          </div>
        )}

        {rewrittenMessage && !isLoading && (
          <div className="rewritten-section">
            <h3>Rewrite Message</h3>
            <div className="rewritten-text">
              {rewrittenMessage}
              {selectedTone && (
                <span className="tone-indicator">
                  (rewritten in {selectedTone.toLowerCase()} tone)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button onClick={handleCopy} disabled={!message && !rewrittenMessage}>
          📋 Copy
        </button>
        <button onClick={handleDownload} disabled={!message && !rewrittenMessage}>
          📥 Download
        </button>
      </div>
    </div>
  );
}