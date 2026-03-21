import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart } from "react-native-chart-kit";
import { getPollById, closePoll } from "../api";
import { COLORS, TAG_COLORS } from "../constants/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ResultsScreen({ navigation, route }) {
  const { pollId, role } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    getPollById(pollId)
      .then(setPoll)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);

  const handleClose = async () => {
    setClosing(true);
    try {
      const result = await closePoll(pollId);
      setPoll(result.poll);
    } catch (e) {
      setError(e.message);
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  if (error || !poll) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ fontSize: 44, marginBottom: 10 }}>⚠️</Text>
        <Text style={styles.errorText}>{error || "Poll not found"}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()}>
          <Text style={styles.btnPrimaryText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
  const voteLog = poll.voteLog || [];

  // Chart data
  const chartData = {
    labels: poll.options.map((o) =>
      o.label.length > 8 ? o.label.slice(0, 7) + "…" : o.label
    ),
    datasets: [{ data: poll.options.map((o) => o.votes || 0) }],
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.screenTitle} numberOfLines={1}>{poll.title}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge,
              { backgroundColor: poll.status === "active" ? COLORS.primaryLight : "#f5f5f4" }]}>
              <Text style={[styles.statusText,
                { color: poll.status === "active" ? COLORS.primary : COLORS.textMid }]}>
                ● {poll.status === "active" ? "Active" : "Closed"}
              </Text>
            </View>
            <Text style={styles.metaText}>by {poll.organizerName}</Text>
          </View>
        </View>
        {role === "organizer" && poll.status === "active" && (
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={closing}>
            <Text style={styles.closeBtnText}>{closing ? "..." : "Close"}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Total Votes", value: total, emoji: "🗳️" },
            { label: "Options", value: poll.options.length, emoji: "📋" },
            { label: "Created", value: new Date(poll.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), emoji: "📅" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Winner */}
        {total > 0 && (
          <View style={[styles.card, { borderColor: winnerColor.bar + "80", borderWidth: 2 }]}>
            <View style={styles.winnerRow}>
              <Text style={{ fontSize: 36 }}>🏆</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.winnerLabel}>Leading Choice</Text>
                <Text style={styles.winnerTitle}>{winner.label}</Text>
                <Text style={[styles.winnerSub, { color: winnerColor.text }]}>
                  {winner.votes} votes · {winner.pct}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bar Chart */}
        {total > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vote Distribution</Text>
            <BarChart
              data={chartData}
              width={SCREEN_WIDTH - 64}
              height={200}
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: () => COLORS.primary,
                labelColor: () => COLORS.textMid,
                style: { borderRadius: 12 },
                barPercentage: 0.6,
              }}
              style={{ borderRadius: 12, marginTop: 8 }}
            />
          </View>
        )}

        {/* Option Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Option Breakdown</Text>
          {sortedOptions.map((opt, rank) => {
            const tc = TAG_COLORS[opt.tag] || TAG_COLORS.Other;
            return (
              <View key={opt.originalIndex} style={styles.optionRow}>
                <View style={[styles.rankBadge,
                  { backgroundColor: rank === 0 ? "#fef3c7" : "#f5f5f4" }]}>
                  <Text style={[styles.rankText,
                    { color: rank === 0 ? "#92400e" : COLORS.textMid }]}>
                    {rank + 1}
                  </Text>
                </View>
                <View style={[styles.tagPill, { backgroundColor: tc.bg }]}>
                  <Text style={[styles.tagPillText, { color: tc.text }]}>{opt.tag}</Text>
                </View>
                <Text style={styles.optionLabel} numberOfLines={1}>{opt.label}</Text>
                <Text style={styles.optionStat}>{opt.votes} ({opt.pct}%)</Text>
              </View>
            );
          })}
        </View>

        {/* Vote Log */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.logToggle}
            onPress={() => setShowLog((v) => !v)}
          >
            <Text style={styles.cardTitle}>🧾 Vote Log ({voteLog.length})</Text>
            <Text style={styles.toggleText}>{showLog ? "▲ Hide" : "▼ Show"}</Text>
          </TouchableOpacity>

          {showLog && (
            <View style={{ marginTop: 12, gap: 8 }}>
              {voteLog.length === 0 ? (
                <Text style={styles.emptyText}>No votes logged yet</Text>
              ) : (
                [...voteLog].reverse().map((v, i) => {
                  const opt = poll.options[v.optionIndex];
                  const tc = TAG_COLORS[opt?.tag] || TAG_COLORS.Other;
                  return (
                    <View key={i} style={styles.logRow}>
                      <View style={styles.logAvatar}>
                        <Text style={styles.logAvatarText}>
                          {(v.voterName || "A")[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logName}>{v.voterName || "Anonymous"}</Text>
                        <Text style={styles.logVoted}>
                          voted:{" "}
                          <Text style={{ color: tc.text, fontWeight: "700" }}>
                            {opt?.label || "Unknown"}
                          </Text>
                        </Text>
                      </View>
                      <Text style={styles.logTime}>
                        {new Date(v.votedAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short",
                        })}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Insight */}
        {total > 0 && (
          <View style={[styles.card, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
            <Text style={styles.insightTitle}>💡 Quick Insight</Text>
            <Text style={styles.insightText}>
              <Text style={{ fontWeight: "700" }}>{winner.label}</Text> is the top choice with{" "}
              <Text style={{ fontWeight: "700" }}>{winner.pct}%</Text> of votes ({winner.votes} out of {total}).{" "}
              {winner.pct >= 50
                ? "This is a clear majority — a strong signal for planning!"
                : "No single option has majority. Consider discussing further."}
              {poll.status === "active"
                ? " Poll is still active."
                : " Poll is closed — final result."}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnSecondaryText}>← Back</Text>
          </TouchableOpacity>
          {role === "volunteer" && poll.status === "active" && (
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate("Vote", { pollId, role })}
            >
              <Text style={styles.btnPrimaryText}>Vote on this poll</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  backText: { fontSize: 18, color: COLORS.textDark },
  screenTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textDark },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "700" },
  metaText: { fontSize: 11, color: COLORS.textLight },
  closeBtn: {
    backgroundColor: "#fef3c7", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, marginLeft: 8,
  },
  closeBtnText: { color: "#92400e", fontSize: 12, fontWeight: "700" },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.border,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  statLabel: { fontSize: 10, color: COLORS.textMid },
  card: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  winnerRow: { flexDirection: "row", alignItems: "center" },
  winnerLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: "600", letterSpacing: 0.5 },
  winnerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark, marginTop: 2 },
  winnerSub: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rankBadge: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center",
  },
  rankText: { fontSize: 11, fontWeight: "800" },
  tagPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  tagPillText: { fontSize: 10, fontWeight: "700" },
  optionLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  optionStat: { fontSize: 12, color: COLORS.textMid, fontWeight: "600" },
  logToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleText: { fontSize: 12, color: COLORS.textMid },
  logRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#f5f5f4", borderRadius: 12, padding: 10,
  },
  logAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center",
  },
  logAvatarText: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  logName: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  logVoted: { fontSize: 12, color: COLORS.textMid },
  logTime: { fontSize: 11, color: COLORS.textLight },
  emptyText: { color: COLORS.textLight, fontSize: 13, textAlign: "center", padding: 10 },
  insightTitle: { fontSize: 15, fontWeight: "800", color: "#15803d", marginBottom: 8 },
  insightText: { fontSize: 13, color: "#166534", lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10 },
  btnPrimary: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  btnSecondary: {
    flex: 1, backgroundColor: "#f5f5f4", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  btnSecondaryText: { color: COLORS.textDark, fontSize: 14, fontWeight: "700" },
  loadingText: { color: COLORS.textMid, marginTop: 12 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: "center", marginBottom: 16 },
});
