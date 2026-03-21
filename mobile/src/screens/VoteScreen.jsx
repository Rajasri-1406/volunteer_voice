import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPollById, submitVote } from "../api";
import { COLORS, TAG_COLORS } from "../constants/colors";

export default function VoteScreen({ navigation, route }) {
  const { pollId, role } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [voterName, setVoterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPollById(pollId);
        setPoll(data);
        const saved = await AsyncStorage.getItem(`voted_${pollId}`);
        if (saved) setAlreadyVoted(JSON.parse(saved));
      } catch (e) {
        Alert.alert("Error", e.message);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]);

  const handleVote = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      const result = await submitVote(pollId, selected, voterName || "Anonymous");
      const record = {
        optionIndex: selected,
        optionLabel: result.votedOption,
        voterName: voterName || "Anonymous",
        votedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`voted_${pollId}`, JSON.stringify(record));
      setAlreadyVoted(record);
      setPoll(result.poll);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading poll...</Text>
      </SafeAreaView>
    );
  }

  if (!poll) return null;

  const isClosed = poll.status === "closed";

  // ── Already voted ──────────────────────────────────────────────────────────
  if (alreadyVoted) {
    const votedOpt = poll.options[alreadyVoted.optionIndex];
    const tc = TAG_COLORS[votedOpt?.tag] || TAG_COLORS.Other;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.successBanner]}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Vote Recorded!</Text>
            <Text style={styles.successSub}>Your response has been saved.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Vote</Text>
            <View style={[styles.votedOptBox, { backgroundColor: tc.bg, borderColor: tc.bar + "60" }]}>
              <Text style={[styles.votedOptLabel, { color: tc.text }]}>{votedOpt?.label}</Text>
              <View style={[styles.tagPill, { backgroundColor: tc.bg }]}>
                <Text style={[styles.tagPillText, { color: tc.text }]}>{votedOpt?.tag}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Voted as</Text>
                <Text style={styles.metaValue}>{alreadyVoted.voterName}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Voted on</Text>
                <Text style={styles.metaValue}>
                  {new Date(alreadyVoted.votedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.reviewLabel}>POLL</Text>
            <Text style={styles.pollTitle}>{poll.title}</Text>
            <Text style={styles.metaText}>By {poll.organizerName} · {poll.totalVotes} total votes</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
              <Text style={styles.btnSecondaryText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate("Results", { pollId, role })}
            >
              <Text style={styles.btnPrimaryText}>View Results →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Closed ─────────────────────────────────────────────────────────────────
  if (isClosed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
          <Text style={styles.pollTitle}>This poll is closed</Text>
          <Text style={styles.metaText}>Voting is no longer available</Text>
          <View style={[styles.actionRow, { marginTop: 20 }]}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
              <Text style={styles.btnSecondaryText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate("Results", { pollId, role })}
            >
              <Text style={styles.btnPrimaryText}>View Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Active voting ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Poll header */}
        <View style={styles.card}>
          <Text style={styles.pollTitle}>{poll.title}</Text>
          {poll.description ? <Text style={styles.pollDesc}>{poll.description}</Text> : null}
          <Text style={styles.metaText}>
            👤 {poll.organizerName} · 🗳 {poll.totalVotes} votes so far
          </Text>
        </View>

        {/* Voter name */}
        <View style={styles.card}>
          <Text style={styles.label}>Your Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name or leave as Anonymous"
            placeholderTextColor={COLORS.textLight}
            value={voterName}
            onChangeText={setVoterName}
          />
        </View>

        {/* Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose your preference:</Text>
          {poll.options.map((opt, i) => {
            const tc = TAG_COLORS[opt.tag] || TAG_COLORS.Other;
            const isSelected = selected === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                onPress={() => setSelected(i)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionLabel, isSelected && { color: COLORS.primary }]}>
                  {opt.label}
                </Text>
                <View style={[styles.tagPill, { backgroundColor: tc.bg }]}>
                  <Text style={[styles.tagPillText, { color: tc.text }]}>{opt.tag}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
            <Text style={styles.btnSecondaryText}>← Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, (selected === null || submitting) && styles.btnDisabled]}
            disabled={selected === null || submitting}
            onPress={handleVote}
          >
            <Text style={styles.btnPrimaryText}>
              {submitting ? "Submitting..." : "Submit Vote ✓"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hintText}>Your vote will be saved permanently to the database</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginBottom: 14 },
  pollTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  pollDesc: { fontSize: 13, color: COLORS.textMid, marginBottom: 8, lineHeight: 18 },
  metaText: { fontSize: 12, color: COLORS.textLight },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMid, marginBottom: 8 },
  input: {
    backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: COLORS.textDark,
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 2, borderColor: COLORS.border, borderRadius: 14,
    padding: 14, marginBottom: 10, backgroundColor: COLORS.white,
  },
  optionBtnSelected: { borderColor: COLORS.primary, backgroundColor: "#f0fdf4" },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.textDark },
  tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagPillText: { fontSize: 10, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 10 },
  btnPrimary: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  btnSecondary: {
    flex: 1, backgroundColor: "#f5f5f4", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  btnSecondaryText: { color: COLORS.textDark, fontSize: 14, fontWeight: "700" },
  hintText: { color: COLORS.textLight, fontSize: 11, textAlign: "center" },
  successBanner: {
    backgroundColor: "#f0fdf4", borderRadius: 18, padding: 24,
    alignItems: "center", borderWidth: 1, borderColor: "#bbf7d0",
  },
  successEmoji: { fontSize: 44, marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  successSub: { fontSize: 13, color: "#16a34a", marginTop: 4 },
  votedOptBox: {
    borderRadius: 14, padding: 14, borderWidth: 2,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  votedOptLabel: { fontSize: 16, fontWeight: "800", flex: 1 },
  metaRow: { flexDirection: "row", gap: 10 },
  metaBox: { flex: 1, backgroundColor: "#f5f5f4", borderRadius: 10, padding: 10 },
  metaLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: "600", marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  reviewLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textLight, letterSpacing: 1, marginBottom: 4 },
  loadingText: { color: COLORS.textMid, marginTop: 12 },
});
