import { useState, useEffect } from "react";
import { getAllPolls, deletePoll, closePoll } from "../api";
import { TAG_COLORS, STATUS_COLORS, POLL_TYPE_LABELS } from "../data/polls";

function PollCard({ poll, role, onVote, onResults, onDelete, onClose }) {
  const status = STATUS_COLORS[poll.status];
  const topOption = poll.options.reduce((a, b) => (a.votes > b.votes ? a : b), poll.options[0]);
  const deadline = poll.deadline ? new Date(poll.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="card hover:shadow-md transition-all duration-300 animate-slide-up group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`tag-pill ${status.bg} ${status.text}`}>
              ● {status.label}
            </span>
            <span className="tag-pill bg-bark-100 text-bark-600">
              {POLL_TYPE_LABELS[poll.pollType] || "General"}
            </span>
          </div>
          <h3 className="font-display font-bold text-bark-900 text-lg leading-snug truncate">
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-bark-500 text-sm mt-0.5 line-clamp-2">{poll.description}</p>
          )}
        </div>
      </div>

      {/* Options preview */}
      <div className="space-y-2 mb-4">
        {poll.options.slice(0, 3).map((opt, i) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const tc = TAG_COLORS[opt.tag] || TAG_COLORS.Other;
          const isTop = opt.votes === topOption.votes && poll.totalVotes > 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isTop && poll.totalVotes > 0 && <span className="text-earth-500">★</span>}
                  <span className={`tag-pill text-xs ${tc.bg} ${tc.text}`}>{opt.tag}</span>
                  <span className="text-bark-700 font-medium truncate">{opt.label}</span>
                </div>
                <span className="text-bark-500 text-xs font-semibold shrink-0 ml-2">
                  {opt.votes}v · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-bark-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: tc.bar }}
                />
              </div>
            </div>
          );
        })}
        {poll.options.length > 3 && (
          <p className="text-bark-400 text-xs">+{poll.options.length - 3} more options</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-bark-100">
        <div className="text-xs text-bark-400 space-y-0.5">
          <div>👤 {poll.organizerName}</div>
          <div>
            🗳 {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
            {deadline && (
              <span className={`ml-2 ${isExpired ? "text-red-400" : "text-earth-600"}`}>
                {isExpired ? "⏰ Expired" : `⏳ ${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {role === "volunteer" && poll.status === "active" && (
            <button onClick={onVote} className="btn-primary py-2 px-4 text-sm">
              Vote
            </button>
          )}
          <button onClick={onResults} className="btn-secondary py-2 px-4 text-sm">
            Results
          </button>
          {role === "organizer" && (
            <>
              {poll.status === "active" && (
                <button
                  onClick={onClose}
                  className="py-2 px-4 text-sm bg-earth-100 hover:bg-earth-200 text-earth-700 font-semibold rounded-xl transition-all duration-200 active:scale-95"
                >
                  Close
                </button>
              )}
              <button
                onClick={onDelete}
                className="py-2 px-4 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all duration-200 active:scale-95"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ role, navigate }) {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "active" | "closed"
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await getAllPolls();
      setPolls(data);
    } catch (e) {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolls(); }, []);

  const handleDelete = async (id) => {
    try {
      await deletePoll(id);
      setPolls((prev) => prev.filter((p) => p._id !== id));
      setConfirmDelete(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleClose = async (id) => {
    try {
      const updated = await closePoll(id);
      setPolls((prev) => prev.map((p) => (p._id === id ? updated.poll : p)));
    } catch (e) {
      alert(e.message);
    }
  };

  const filtered = polls.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.organizerName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const activeCount = polls.filter((p) => p.status === "active").length;
  const totalVotes = polls.reduce((sum, p) => sum + p.totalVotes, 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-bark-900">
          {role === "organizer" ? "📋 Organizer Dashboard" : "🙋 Volunteer Hub"}
        </h1>
        <p className="text-bark-500 mt-1 font-body">
          {role === "organizer"
            ? "Manage your polls and track volunteer preferences"
            : "Browse active polls and make your voice heard"}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Polls", value: polls.length, emoji: "📊" },
          { label: "Active", value: activeCount, emoji: "🟢" },
          { label: "Total Votes", value: totalVotes, emoji: "🗳️" },
        ].map((stat) => (
          <div key={stat.label} className="card text-center py-4">
            <div className="text-2xl mb-1">{stat.emoji}</div>
            <div className="text-2xl font-display font-bold text-bark-900">{stat.value}</div>
            <div className="text-xs text-bark-500 font-body">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search polls..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <div className="flex gap-2">
          {["all", "active", "closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-forest-600 text-white shadow-sm"
                  : "bg-white border border-bark-200 text-bark-600 hover:bg-bark-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {role === "organizer" && (
          <button
            onClick={() => navigate("create")}
            className="btn-primary whitespace-nowrap"
          >
            + New Poll
          </button>
        )}
      </div>

      {/* Poll list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 animate-bounce">🤝</div>
          <p className="text-bark-500 font-body">Loading polls...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-10 border-red-100 bg-red-50">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={fetchPolls} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-5xl mb-4">🗳️</div>
          <p className="text-bark-600 font-semibold text-lg">No polls found</p>
          <p className="text-bark-400 text-sm mt-1">
            {role === "organizer" ? "Create your first poll to get started" : "Check back later for active polls"}
          </p>
          {role === "organizer" && (
            <button onClick={() => navigate("create")} className="btn-primary mt-5">
              Create Poll
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((poll) => (
            <PollCard
              key={poll._id}
              poll={poll}
              role={role}
              onVote={() => navigate("vote", poll._id)}
              onResults={() => navigate("results", poll._id)}
              onDelete={() => setConfirmDelete(poll._id)}
              onClose={() => handleClose(poll._id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-pop">
            <h3 className="font-display font-bold text-lg text-bark-900 mb-2">Delete Poll?</h3>
            <p className="text-bark-500 text-sm mb-5">
              This will permanently delete the poll and all its votes. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}