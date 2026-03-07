import { useState, useEffect } from "react";
import { getPollById, submitVote } from "../api";
import { TAG_COLORS } from "../data/polls";

export default function VoteScreen({ pollId, navigate, role }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [voterName, setVoterName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Voted state: store in localStorage per poll
  const storageKey = `voted_${pollId}`;
  const [alreadyVoted, setAlreadyVoted] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
    // { optionIndex, voterName, votedAt }
  });

  useEffect(() => {
    if (!pollId) { navigate("home"); return; }
    getPollById(pollId)
      .then(setPoll)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);

  const handleVote = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      const result = await submitVote(pollId, selected, voterName || "Anonymous");
      const voteRecord = {
        optionIndex: selected,
        optionLabel: result.votedOption,
        voterName: voterName || "Anonymous",
        votedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(voteRecord));
      setAlreadyVoted(voteRecord);
      setPoll(result.poll);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="text-5xl mb-4 animate-bounce">🗳️</div>
        <p className="text-bark-500">Loading poll...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-semibold">{error}</p>
        <button onClick={() => navigate("home")} className="btn-primary mt-5">
          Back to Home
        </button>
      </div>
    );
  }

  if (!poll) return null;

  const isClosed = poll.status === "closed";
  const deadline = poll.deadline ? new Date(poll.deadline) : null;
  const isExpired = deadline && deadline < new Date();

  // ── Already voted: show confirmation ──────────────────────────────────────
  if (alreadyVoted) {
    const votedOpt = poll.options[alreadyVoted.optionIndex];
    const tc = TAG_COLORS[votedOpt?.tag] || TAG_COLORS.Other;

    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Success banner */}
        <div className="card bg-forest-50 border-forest-200 text-center py-8 mb-5">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="font-display font-bold text-forest-800 text-2xl mb-1">
            Vote Recorded!
          </h2>
          <p className="text-forest-600 text-sm">
            Your response has been saved to the database.
          </p>
        </div>

        {/* What you voted for */}
        <div className="card mb-4">
          <h3 className="font-display font-bold text-bark-800 mb-3">Your Vote</h3>
          <div className={`rounded-xl p-4 border-2 ${tc.bg} border-opacity-50`}
            style={{ borderColor: tc.bar + "60" }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tc.bg}`}>
                ✓
              </div>
              <div>
                <p className="font-bold text-bark-900">{votedOpt?.label}</p>
                <p className={`text-xs font-semibold ${tc.text}`}>{votedOpt?.tag}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-bark-50 rounded-lg p-3">
              <p className="text-bark-500 text-xs mb-0.5">Voted as</p>
              <p className="font-semibold text-bark-800">{alreadyVoted.voterName}</p>
            </div>
            <div className="bg-bark-50 rounded-lg p-3">
              <p className="text-bark-500 text-xs mb-0.5">Voted on</p>
              <p className="font-semibold text-bark-800">
                {new Date(alreadyVoted.votedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Poll info */}
        <div className="card mb-5">
          <p className="text-xs text-bark-500 font-semibold uppercase tracking-wide mb-1">Poll</p>
          <p className="font-display font-bold text-bark-900">{poll.title}</p>
          <p className="text-bark-500 text-sm mt-1">By {poll.organizerName} · {poll.totalVotes} total votes</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate("home")} className="btn-secondary flex-1">
            ← Back
          </button>
          <button onClick={() => navigate("results", pollId)} className="btn-primary flex-1">
            View Results →
          </button>
        </div>
      </div>
    );
  }

  // ── Poll is closed ─────────────────────────────────────────────────────────
  if (isClosed || isExpired) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="card text-center py-10 mb-4 bg-bark-50">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="font-display font-bold text-bark-700 text-xl">This poll is closed</h2>
          <p className="text-bark-500 text-sm mt-1">Voting is no longer available</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("home")} className="btn-secondary flex-1">← Back</button>
          <button onClick={() => navigate("results", pollId)} className="btn-primary flex-1">
            View Results
          </button>
        </div>
      </div>
    );
  }

  // ── Active voting form ─────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Poll header */}
      <div className="card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🗳️
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-bark-900 text-xl leading-tight">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="text-bark-500 text-sm mt-1">{poll.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-bark-400">
              <span>👤 {poll.organizerName}</span>
              <span>·</span>
              <span>🗳 {poll.totalVotes} votes so far</span>
              {deadline && (
                <>
                  <span>·</span>
                  <span className="text-earth-600">
                    ⏳ Closes {deadline.toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Voter name */}
      <div className="card mb-4">
        <label className="block text-sm font-semibold text-bark-700 mb-2">
          Your Name (optional)
        </label>
        <input
          className="input-field"
          placeholder="Enter your name or leave as Anonymous"
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
        />
      </div>

      {/* Options */}
      <div className="card mb-4">
        <h2 className="font-display font-bold text-bark-800 mb-4">
          Choose your preference:
        </h2>
        <div className="space-y-3">
          {poll.options.map((opt, i) => {
            const tc = TAG_COLORS[opt.tag] || TAG_COLORS.Other;
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full text-left rounded-xl p-4 border-2 transition-all duration-200 active:scale-98 ${
                  isSelected
                    ? "border-forest-500 bg-forest-50 shadow-sm"
                    : "border-bark-200 bg-white hover:border-forest-300 hover:bg-bark-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio circle */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? "border-forest-500 bg-forest-500" : "border-bark-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Option label */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isSelected ? "text-forest-800" : "text-bark-800"}`}>
                      {opt.label}
                    </p>
                  </div>

                  {/* Tag pill */}
                  <span className={`tag-pill shrink-0 ${tc.bg} ${tc.text}`}>
                    {opt.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate("home")} className="btn-secondary flex-1">
          ← Cancel
        </button>
        <button
          onClick={handleVote}
          disabled={selected === null || submitting}
          className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Vote ✓"}
        </button>
      </div>

      <p className="text-center text-xs text-bark-400 mt-4">
        Your vote will be saved permanently to the database
      </p>
    </div>
  );
}