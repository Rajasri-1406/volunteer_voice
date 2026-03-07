import { useState, useEffect } from "react";
import { getPollById, closePoll } from "../api";
import { TAG_COLORS, STATUS_COLORS } from "../data/polls";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

// Custom tooltip for bar chart
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-bark-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-bold text-bark-900">{payload[0].payload.label}</p>
        <p className="text-forest-600 font-semibold">{payload[0].value} votes</p>
        <p className="text-bark-500">{payload[0].payload.pct}% of total</p>
      </div>
    );
  }
  return null;
}

export default function ResultsScreen({ pollId, navigate, role }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartType, setChartType] = useState("bar"); // "bar" | "pie"
  const [closing, setClosing] = useState(false);
  const [showVoteLog, setShowVoteLog] = useState(false);

  useEffect(() => {
    if (!pollId) { navigate("home"); return; }
    getPollById(pollId)
      .then(setPoll)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [pollId]);

  const handleClose = async () => {
    setClosing(true);
    try {
      const result = await closePoll(pollId);
      setPoll(result.poll);
    } catch (e) {
      alert(e.message);
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="text-5xl mb-4 animate-bounce">📊</div>
        <p className="text-bark-500">Loading results...</p>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-semibold">{error || "Poll not found"}</p>
        <button onClick={() => navigate("home")} className="btn-primary mt-5">Back</button>
      </div>
    );
  }

  // ── Data prep ───────────────────────────────────────────────────────────────
  const total = poll.totalVotes;
  const sortedOptions = [...poll.options]
    .map((opt, i) => ({
      ...opt,
      originalIndex: i,
      pct: total > 0 ? Math.round((opt.votes / total) * 100) : 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const winner = sortedOptions[0];
  const winnerColor = TAG_COLORS[winner?.tag] || TAG_COLORS.Other;

  const chartData = poll.options.map((opt) => ({
    label: opt.label.length > 18 ? opt.label.slice(0, 16) + "…" : opt.label,
    fullLabel: opt.label,
    votes: opt.votes,
    pct: total > 0 ? Math.round((opt.votes / total) * 100) : 0,
    color: (TAG_COLORS[opt.tag] || TAG_COLORS.Other).bar,
  }));

  const status = STATUS_COLORS[poll.status];
  const deadline = poll.deadline ? new Date(poll.deadline) : null;
  const createdAt = new Date(poll.createdAt);

  // Vote log grouped by date
  const voteLog = poll.voteLog || [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("home")}
          className="w-10 h-10 rounded-xl bg-white border border-bark-200 flex items-center justify-center hover:bg-bark-50 transition-colors shrink-0"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-display font-bold text-bark-900 truncate">
            {poll.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`tag-pill text-xs ${status.bg} ${status.text}`}>
              ● {status.label}
            </span>
            <span className="text-bark-400 text-xs">by {poll.organizerName}</span>
          </div>
        </div>
        {role === "organizer" && poll.status === "active" && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="shrink-0 py-2 px-4 text-sm bg-earth-100 hover:bg-earth-200 text-earth-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {closing ? "Closing..." : "Close Poll"}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Votes", value: total, emoji: "🗳️" },
          { label: "Options", value: poll.options.length, emoji: "📋" },
          {
            label: "Created",
            value: createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            emoji: "📅",
          },
        ].map((s) => (
          <div key={s.label} className="card text-center py-3">
            <div className="text-xl mb-0.5">{s.emoji}</div>
            <div className="font-display font-bold text-bark-900 text-lg">{s.value}</div>
            <div className="text-xs text-bark-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Winner card */}
      {total > 0 && (
        <div
          className="card mb-5 border-2 animate-pop"
          style={{ borderColor: winnerColor.bar + "80", background: winnerColor.bar + "0a" }}
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">🏆</div>
            <div>
              <p className="text-xs font-semibold text-bark-500 uppercase tracking-wide mb-0.5">
                Leading Choice
              </p>
              <p className="font-display font-bold text-bark-900 text-xl">
                {winner.label}
              </p>
              <p className={`text-sm font-semibold ${winnerColor.text}`}>
                {winner.votes} votes · {winner.pct}% of total
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart toggle + chart */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-bark-800">Vote Distribution</h2>
          <div className="flex gap-1 bg-bark-100 rounded-lg p-1">
            {["bar", "pie"].map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  chartType === t
                    ? "bg-white text-bark-800 shadow-sm"
                    : "text-bark-500 hover:text-bark-700"
                }`}
              >
                {t === "bar" ? "📊 Bar" : "🥧 Pie"}
              </button>
            ))}
          </div>
        </div>

        {total === 0 ? (
          <div className="text-center py-10 text-bark-400">
            <p className="text-3xl mb-2">📭</p>
            <p>No votes yet</p>
          </div>
        ) : chartType === "bar" ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#78716c" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="votes"
                nameKey="label"
                cx="50%"
                cy="45%"
                outerRadius={85}
                innerRadius={40}
                paddingAngle={3}
                label={({ label, pct }) => `${pct}%`}
                labelLine={false}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-bark-700">{value}</span>
                )}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Option breakdown */}
      <div className="card mb-5">
        <h2 className="font-display font-bold text-bark-800 mb-4">Option Breakdown</h2>
        <div className="space-y-3">
          {sortedOptions.map((opt, rank) => {
            const tc = TAG_COLORS[opt.tag] || TAG_COLORS.Other;
            return (
              <div key={opt.originalIndex}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      rank === 0 ? "bg-earth-200 text-earth-700" : "bg-bark-100 text-bark-500"
                    }`}>
                      {rank + 1}
                    </span>
                    <span className={`tag-pill text-xs shrink-0 ${tc.bg} ${tc.text}`}>{opt.tag}</span>
                    <span className="text-bark-800 font-semibold text-sm truncate">{opt.label}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-bark-900 font-bold text-sm">{opt.votes}</span>
                    <span className="text-bark-400 text-xs ml-1">({opt.pct}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-bark-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${opt.pct}%`, backgroundColor: tc.bar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vote Log (organizer only or toggle) */}
      {(role === "organizer" || voteLog.length > 0) && (
        <div className="card mb-5">
          <button
            onClick={() => setShowVoteLog((v) => !v)}
            className="w-full flex items-center justify-between font-display font-bold text-bark-800 text-base"
          >
            <span>🧾 Vote Log ({voteLog.length})</span>
            <span className="text-bark-400 text-sm">{showVoteLog ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {showVoteLog && (
            <div className="mt-4 space-y-2 animate-slide-up">
              {voteLog.length === 0 ? (
                <p className="text-bark-400 text-sm text-center py-4">No votes logged yet</p>
              ) : (
                voteLog
                  .slice()
                  .reverse()
                  .map((v, i) => {
                    const opt = poll.options[v.optionIndex];
                    const tc = TAG_COLORS[opt?.tag] || TAG_COLORS.Other;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-bark-50 rounded-xl px-3 py-2.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-sm font-bold text-forest-700 shrink-0">
                          {(v.voterName || "A")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-bark-800 text-sm truncate">
                            {v.voterName || "Anonymous"}
                          </p>
                          <p className="text-bark-500 text-xs truncate">
                            voted for:{" "}
                            <span className={`font-semibold ${tc.text}`}>
                              {opt?.label || "Unknown"}
                            </span>
                          </p>
                        </div>
                        <p className="text-bark-400 text-xs shrink-0">
                          {new Date(v.votedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      )}

      {/* Insight summary */}
      {total > 0 && (
        <div className="card mb-5 bg-gradient-to-br from-forest-50 to-earth-50 border-forest-100">
          <h2 className="font-display font-bold text-forest-800 mb-2">💡 Quick Insight</h2>
          <p className="text-forest-700 text-sm leading-relaxed">
            <strong>{winner.label}</strong> is the top choice with{" "}
            <strong>{winner.pct}%</strong> of votes ({winner.votes} out of {total}).{" "}
            {winner.pct >= 50
              ? "This is a clear majority — a strong signal for planning!"
              : "No single option has majority. Consider narrowing options or discussing further."}
            {poll.status === "active"
              ? " The poll is still active — more votes may change the outcome."
              : " The poll is closed — this is the final result."}
          </p>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate("home")} className="btn-secondary flex-1">
          ← Back
        </button>
        {role === "volunteer" && poll.status === "active" && (
          <button onClick={() => navigate("vote", pollId)} className="btn-primary flex-1">
            Vote on this poll
          </button>
        )}
      </div>
    </div>
  );
}