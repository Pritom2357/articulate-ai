import { useEffect, useState } from 'react';
import { getDueFlashcards, reviewFlashcard } from '../api/progress.js';

export default function Flashcards() {
  const [cards, setCards] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCards() {
      try {
        const dueCards = await getDueFlashcards();
        setCards(dueCards || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Unable to load flashcards');
      }
    }

    loadCards();
  }, []);

  async function handleReview(score) {
    const card = cards[selectedIndex];
    if (!card) return;

    try {
      await reviewFlashcard({ wordId: card.word_id || card.id, score });
      setFeedback('Review submitted successfully.');
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex < cards.length ? nextIndex : 0);
    } catch (err) {
      setError(err.payload?.error || err.message || 'Review failed');
    }
  }

  const currentCard = cards[selectedIndex];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards</h1>
          <p className="page-subtitle">Practice due words using spaced repetition.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {currentCard ? (
        <div className="card-card space-y-4">
          <div className="flashcard-box">
            <div className="flashcard-side">{currentCard.front || currentCard.question || currentCard.word}</div>
            <div className="flashcard-side text-slate-600">{currentCard.back || currentCard.answer || currentCard.definition}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="secondary-button" type="button" onClick={() => handleReview(90)}>Easy</button>
            <button className="form-button" type="button" onClick={() => handleReview(70)}>Good</button>
            <button className="secondary-button" type="button" onClick={() => handleReview(50)}>Hard</button>
          </div>
          <div className="text-sm text-slate-500">Card {selectedIndex + 1} of {cards.length}</div>
          {feedback && <div className="alert alert-success">{feedback}</div>}
        </div>
      ) : (
        <div className="empty-state">No due flashcards available. Come back later!</div>
      )}
    </div>
  );
}
