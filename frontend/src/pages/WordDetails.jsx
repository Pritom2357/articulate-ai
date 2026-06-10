import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWord } from '../api/curriculum.js';

export default function WordDetails() {
    const { id } = useParams();
    const [word, setWord] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadWord() {
            try {
                const result = await getWord(id);
                setWord(result);
            } catch (err) {
                setError(err.payload?.error || err.message || 'Unable to load word details');
            }
        }

        loadWord();
    }, [id]);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Word details</h1>
                    <p className="page-subtitle">Review vocabulary details and pronunciations.</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {word ? (
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="card-card space-y-4">
                        <div>
                            <h2 className="text-3xl font-semibold">{word.word || `Word ${id}`}</h2>
                            <p className="text-slate-400">{word.bangla_meaning || word.definition || 'No translation available.'}</p>
                        </div>

                        <div className="space-y-3 text-sm text-slate-300">
                            <div>
                                <strong>Phonetic</strong>
                                <p>{word.ipa || 'N/A'}</p>
                            </div>
                            <div>
                                <strong>Syllables</strong>
                                <p>{word.syllables || 'N/A'}</p>
                            </div>
                            <div>
                                <strong>Difficulty</strong>
                                <p>{word.difficulty_level || 'N/A'}</p>
                            </div>
                            <div>
                                <strong>Frequency rank</strong>
                                <p>{word.frequency_rank ?? 'N/A'}</p>
                            </div>
                        </div>

                        {word.audio_url && (
                            <div>
                                <strong>Pronunciation</strong>
                                <audio controls src={word.audio_url} className="w-full mt-2" />
                            </div>
                        )}
                    </div>

                    <div className="card-card">
                        <h3 className="card-title">Actions</h3>
                        <Link to="/curriculum" className="secondary-button block text-center">
                            Back to curriculum
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="empty-state">Loading word details…</div>
            )}
        </div>
    );
}
