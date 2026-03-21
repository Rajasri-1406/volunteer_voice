import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
   TextInput, ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAllPolls, deletePoll, closePoll } from "../api";
import { COLORS, TAG_COLORS } from "../constants/colors";

function PollCard({ poll, role, onVote, onResults, onDelete, onClose }) {
  const topOption = poll.options.reduce((a, b) => (a.votes > b.votes ? a : b), poll.options[0]);
  const deadline = poll.deadline ? new Date(poll.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <View style={styles.card}>
      {/* Status + Title */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge,
          { backgroundColor: poll.status === "active" ? COLORS.primaryLight : "#f5f5f4" }]}>
          <Text style={[styles.statusText,
            { color: poll.status === "active" ? COLORS.primary : COLORS.textMid }]}>
            ● {poll.status === "active" ? "Active" : "Closed"}
          </Text>
        </View>
      </View>

      <Text style={styles.pollTitle}>{poll.title}</Text>
      {poll.description ? (
        <Text style={styles.pollDesc} numberOfLines={2}>{poll.description}</Text>
      ) : null}

      {/* Options preview */}
      <View style={styles.optionsPreview}>
        {poll.options.slice(0, 3).map((opt, i) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const tc = TAG_COLORS[opt.tag] || TAG_COLORS.Other;
          return (
            <View key={i} style={styles.optionRow}>
              <View style={styles.optionLabelRow}>
                <View style={[styles.tagPill, { backgroundColor: tc.bg }]}>
                  <Text style={[styles.tagText, { color: tc.text }]}>{opt.tag}</Text>
                </View>
                <Text style={styles.optionLabel} numberOfLines={1}>{opt.label}</Text>
              </View>
              <Text style={styles.optionPct}>{opt.votes}v · {pct}%</Text>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.metaText}>👤 {poll.organizerName}</Text>
          <Text style={styles.metaText}>
            🗳 {poll.totalVotes} votes
            {deadline ? (isExpired ? "  ⏰ Expired" : `  ⏳ ${daysLeft}d left`) : ""}
          </Text>
        </View>
        <View style={styles.actionRow}>
          {role === "volunteer" && poll.status === "active" && (
            <TouchableOpacity style={styles.btnPrimary} onPress={onVote}>
              <Text style={styles.btnPrimaryText}>Vote</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnSecondary} onPress={onResults}>
            <Text style={styles.btnSecondaryText}>Results</Text>
          </TouchableOpacity>
          {role === "organizer" && (
            <>
              {poll.status === "active" && (
                <TouchableOpacity style={styles.btnWarning} onPress={onClose}>
                  <Text style={styles.btnWarningText}>Close</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnDanger} onPress={onDelete}>
                <Text style={styles.btnDangerText}>Del</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation, route }) {
  const { role } = route.params;
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchPolls = useCallback(async () => {
    try {
      const data = await getAllPolls();
      setPolls(data);
      setError("");
    } catch (e) {
      setError("Could not connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // Refresh when coming back to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchPolls);
    return unsubscribe;
  }, [navigation, fetchPolls]);

  const handleDelete = (id) => {
    Alert.alert("Delete Poll", "This will permanently delete the poll.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deletePoll(id);
          setPolls((prev) => prev.filter((p) => p._id !== id));
        },
      },
    ]);
  };

  const handleClose = async (id) => {
    const result = await closePoll(id);
    setPolls((prev) => prev.map((p) => (p._id === id ? result.poll : p)));
  };

  const filtered = polls.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.organizerName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const activeCount = polls.filter((p) => p.status === "active").length;
  const totalVotes = polls.reduce((sum, p) => sum + p.totalVotes, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>
            {role === "organizer" ? "📋 Dashboard" : "🙋 Volunteer Hub"}
          </Text>
          <Text style={styles.screenSubtitle}>
            {role === "organizer" ? "Manage your polls" : "Browse and vote on polls"}
          </Text>
        </View>
        <View style={[styles.roleBadge,
          { backgroundColor: role === "organizer" ? COLORS.primaryLight : "#dbeafe" }]}>
          <Text style={[styles.roleText,
            { color: role === "organizer" ? COLORS.primary : "#1d4ed8" }]}>
            {role === "organizer" ? "Organizer" : "Volunteer"}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Total", value: polls.length, emoji: "📊" },
          { label: "Active", value: activeCount, emoji: "🟢" },
          { label: "Votes", value: totalVotes, emoji: "🗳️" },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search polls..."
        placeholderTextColor={COLORS.textLight}
        value={search}
        onChangeText={setSearch}
      />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {["all", "active", "closed"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        {role === "organizer" && (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreatePoll")}
          >
            <Text style={styles.createBtnText}>+ New Poll</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading polls...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPolls}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>🗳️</Text>
          <Text style={styles.emptyTitle}>No polls found</Text>
          {role === "organizer" && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.navigate("CreatePoll")}
            >
              <Text style={styles.retryText}>Create Poll</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PollCard
              poll={item}
              role={role}
              onVote={() => navigation.navigate("Vote", { pollId: item._id, role })}
              onResults={() => navigation.navigate("Results", { pollId: item._id, role })}
              onDelete={() => handleDelete(item._id)}
              onClose={() => handleClose(item._id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchPolls(); }}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },
  screenTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark },
  screenSubtitle: { fontSize: 13, color: COLORS.textMid, marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: "700" },
  statsRow: {
    flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 14,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.border,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  statLabel: { fontSize: 11, color: COLORS.textMid, marginTop: 1 },
  searchInput: {
    marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    borderWidth: 1, borderColor: COLORS.border, color: COLORS.textDark, marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: "wrap",
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: COLORS.textMid, textTransform: "capitalize" },
  filterTextActive: { color: COLORS.white },
  createBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  createBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 30, gap: 12 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: "row", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  pollTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  pollDesc: { fontSize: 13, color: COLORS.textMid, marginBottom: 10, lineHeight: 18 },
  optionsPreview: { gap: 6, marginBottom: 12 },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  tagPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: "700" },
  optionLabel: { fontSize: 13, color: COLORS.textDark, fontWeight: "500", flex: 1 },
  optionPct: { fontSize: 11, color: COLORS.textMid, fontWeight: "600" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 4 },
  metaText: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  actionRow: { flexDirection: "row", gap: 6 },
  btnPrimary: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  btnPrimaryText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  btnSecondary: { backgroundColor: "#f5f5f4", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  btnSecondaryText: { color: COLORS.textDark, fontSize: 12, fontWeight: "700" },
  btnWarning: { backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  btnWarningText: { color: "#92400e", fontSize: 12, fontWeight: "700" },
  btnDanger: { backgroundColor: "#fee2e2", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  btnDangerText: { color: "#dc2626", fontSize: 12, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
  loadingText: { color: COLORS.textMid, marginTop: 12, fontSize: 14 },
  errorEmoji: { fontSize: 44, marginBottom: 10 },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: "center", paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textMid, marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
  retryText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
});
