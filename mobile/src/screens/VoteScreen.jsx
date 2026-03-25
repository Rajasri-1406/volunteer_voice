import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, TextInput, Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPollById, submitVote } from "../api";
import { COLORS, TAG_COLORS } from "../constants/colors";

// ⚠️ Replace with your actual Vercel frontend URL
const FRONTEND_URL = "https://volunteer-voice.vercel.app";

// Field definitions — same as CreatePollScreen for consistent display
const FIELD_META = {
  name:  { label: "Your Name",         emoji: "👤", placeholder: "Enter your name or leave blank", keyboardType: "default" },
  phone: { label: "Phone Number",      emoji: "📞", placeholder: "e.g. +91 98765 43210",          keyboardType: "phone-pad" },
  dob:   { label: "Date of Birth",     emoji: "🎂", placeholder: "DD/MM/YYYY",                    keyboardType: "default" },
  email: { label: "Email Address",     emoji: "✉️",  placeholder: "you@example.com",               keyboardType: "email-address" },
};

export default function VoteScreen({ navigation, route }) {
  const { pollId, role } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(null);

  // Dynamic voter field values keyed by field key
  const [voterInputs, setVoterInputs] = useState({ name: "", phone: "", dob: "", email: "" });

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

  const setInput = (key, val) => setVoterInputs((prev) => ({ ...prev, [key]: val }));

  // Derive the fields to show — fall back to ["name","phone"] for old polls
  const voterFields = poll?.voterFields?.length > 0 ? poll.voterFields : ["name", "phone"];

  const handleVote = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      const result = await submitVote(
        pollId,
        selected,
        voterInputs.name || "Anonymous",
        voterInputs.phone || "",
        voterInputs.dob || "",
        voterInputs.email || "",
      );
      const record = {
        optionIndex: selected,
        optionLabel: result.votedOption,
        voterName: voterInputs.name || "Anonymous",
        voterPhone: voterInputs.phone || "",
        voterDob: voterInputs.dob || "",
        voterEmail: voterInputs.email || "",
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

  const handleSharePoll = async () => {
    try {
      const voteUrl = `${FRONTEND_URL}/vote/${pollId}`;
      await Share.share({
        title: `Vote: ${poll.title}`,
        message: `🗳️ You're invited to vote!\n\n"${poll.title}"\nOrganized by: ${poll.organizerName}\n\nVote here 👉 ${voteUrl}`,
        url: voteUrl,
      });
    } catch (e) {
      Alert.alert("Error", "Could not share poll.");
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
  const deadline = poll.deadline ? new Date(poll.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const canSeeResults = isClosed || isExpired;

  // ── Already voted confirmation screen ─────────────────────────────────────
  if (alreadyVoted) {
    const votedOpt = poll.options[alreadyVoted.optionIndex];
    const tc = TAG_COLORS[votedOpt?.tag] || TAG_COLORS.Other;
    const topOption = poll.options.reduce((a, b) => (a.votes > b.votes ? a : b), poll.options[0]);
    const isWinning = votedOpt?.label === topOption.label && poll.totalVotes > 0;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Thank you banner */}
          <View style={styles.successBanner}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successPollName}>{poll.title}</Text>
            <Text style={styles.successSub}>
              Your vote has been recorded and saved successfully.
            </Text>
          </View>

          {/* What you voted for */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>YOUR CHOICE</Text>
            <View style={[styles.votedOptBox, { backgroundColor: tc.bg, borderColor: tc.bar + "80" }]}>
              <View style={[styles.votedCheck, { backgroundColor: tc.bar }]}>
                <Text style={styles.votedCheckText}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.votedOptLabel, { color: tc.text }]}>{votedOpt?.label}</Text>
                <Text style={[styles.votedOptTag, { color: tc.text }]}>{votedOpt?.tag}</Text>
              </View>
              {isWinning && canSeeResults && (
                <Text style={styles.winningBadge}>🏆 Leading</Text>
              )}
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Voted as</Text>
                <Text style={styles.metaValue}>{alreadyVoted.voterName}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Voted on</Text>
                <Text style={styles.metaValue}>
                  {new Date(alreadyVoted.votedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>Total Votes</Text>
                <Text style={styles.metaValue}>{poll.totalVotes}</Text>
              </View>
            </View>

            {/* Extra info the voter submitted */}
            {(alreadyVoted.voterPhone || alreadyVoted.voterDob || alreadyVoted.voterEmail) && (
              <View style={styles.submittedInfoBox}>
                <Text style={styles.submittedInfoTitle}>Info you submitted</Text>
                {alreadyVoted.voterPhone ? (
                  <Text style={styles.submittedInfoItem}>📞 {alreadyVoted.voterPhone}</Text>
                ) : null}
                {alreadyVoted.voterDob ? (
                  <Text style={styles.submittedInfoItem}>🎂 {alreadyVoted.voterDob}</Text>
                ) : null}
                {alreadyVoted.voterEmail ? (
                  <Text style={styles.submittedInfoItem}>✉️ {alreadyVoted.voterEmail}</Text>
                ) : null}
              </View>
            )}
          </View>

          {/* Poll info */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>POLL INFO</Text>
            <Text style={styles.pollTitle}>{poll.title}</Text>
            {poll.description ? (
              <Text style={styles.pollDesc}>{poll.description}</Text>
            ) : null}
            <Text style={styles.metaText}>👤 Organized by {poll.organizerName}</Text>
            {poll.organizerPhone ? (
              <Text style={styles.metaText}>📞 {poll.organizerPhone}</Text>
            ) : null}
          </View>

          {/* Results not yet available message */}
          {!canSeeResults && (
            <View style={styles.waitBox}>
              <Text style={styles.waitEmoji}>🔒</Text>
              <Text style={styles.waitTitle}>Results not available yet</Text>
              <Text style={styles.waitSub}>
                Results will be visible once the organizer closes the poll or the deadline passes.
              </Text>
            </View>
          )}

          {/* Share poll link */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleSharePoll}>
            <Text style={styles.shareBtnText}>🔗 Share this Poll</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
              <Text style={styles.btnSecondaryText}>← Back</Text>
            </TouchableOpacity>
            {canSeeResults && (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate("Results", { pollId, role })}
              >
                <Text style={styles.btnPrimaryText}>View Results →</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Closed poll ────────────────────────────────────────────────────────────
  if (isClosed || isExpired) {
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
          <View style={styles.pollHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pollTitle}>{poll.title}</Text>
              {poll.description ? <Text style={styles.pollDesc}>{poll.description}</Text> : null}
              <Text style={styles.metaText}>
                👤 {poll.organizerName} · 🗳 {poll.totalVotes} votes so far
              </Text>
              {poll.organizerPhone ? (
                <Text style={styles.metaText}>📞 {poll.organizerPhone}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.shareIconBtn} onPress={handleSharePoll}>
              <Text style={styles.shareIconText}>🔗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Dynamic voter info fields ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Info</Text>
          <Text style={styles.voterFieldsHint}>All fields are optional.</Text>
          {voterFields.map((key) => {
            const meta = FIELD_META[key];
            if (!meta) return null;
            return (
              <View key={key}>
                <Text style={styles.label}>{meta.emoji} {meta.label} (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder={meta.placeholder}
                  placeholderTextColor={COLORS.textLight}
                  value={voterInputs[key]}
                  onChangeText={(v) => setInput(key, v)}
                  keyboardType={meta.keyboardType}
                  autoCapitalize={key === "email" ? "none" : "words"}
                />
              </View>
            );
          })}
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
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  voterFieldsHint: { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textLight, letterSpacing: 1, marginBottom: 10 },
  pollHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  pollTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  pollDesc: { fontSize: 13, color: COLORS.textMid, marginBottom: 8, lineHeight: 18 },
  metaText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  shareIconBtn: { backgroundColor: "#eff6ff", width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  shareIconText: { fontSize: 18 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMid, marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: COLORS.white },
  optionBtnSelected: { borderColor: COLORS.primary, backgroundColor: "#f0fdf4" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.textDark },
  tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagPillText: { fontSize: 10, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 10 },
  btnPrimary: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  btnSecondary: { flex: 1, backgroundColor: "#f5f5f4", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.textDark, fontSize: 14, fontWeight: "700" },
  hintText: { color: COLORS.textLight, fontSize: 11, textAlign: "center" },
  successBanner: { backgroundColor: "#f0fdf4", borderRadius: 20, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#bbf7d0" },
  successEmoji: { fontSize: 52, marginBottom: 10 },
  successTitle: { fontSize: 28, fontWeight: "800", color: COLORS.primary, marginBottom: 4 },
  successPollName: { fontSize: 14, fontWeight: "700", color: COLORS.textMid, textAlign: "center", marginBottom: 6 },
  successSub: { fontSize: 13, color: "#16a34a", textAlign: "center", lineHeight: 20 },
  votedOptBox: { borderRadius: 14, padding: 14, borderWidth: 2, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  votedCheck: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  votedCheckText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  votedOptLabel: { fontSize: 16, fontWeight: "800" },
  votedOptTag: { fontSize: 12, fontWeight: "600", marginTop: 2, opacity: 0.8 },
  winningBadge: { fontSize: 11, fontWeight: "700", color: "#92400e", backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metaRow: { flexDirection: "row", gap: 8 },
  metaBox: { flex: 1, backgroundColor: "#f5f5f4", borderRadius: 10, padding: 10 },
  metaLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: "600", marginBottom: 2 },
  metaValue: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  submittedInfoBox: { backgroundColor: "#f0f9ff", borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#bae6fd" },
  submittedInfoTitle: { fontSize: 11, fontWeight: "700", color: "#0369a1", marginBottom: 6 },
  submittedInfoItem: { fontSize: 13, color: "#0369a1", marginBottom: 3 },
  waitBox: { backgroundColor: "#fef9c3", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#fde68a" },
  waitEmoji: { fontSize: 32, marginBottom: 8 },
  waitTitle: { fontSize: 16, fontWeight: "800", color: "#92400e", marginBottom: 6 },
  waitSub: { fontSize: 13, color: "#92400e", textAlign: "center", lineHeight: 20 },
  shareBtn: { backgroundColor: "#eff6ff", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#bfdbfe" },
  shareBtnText: { color: "#1d4ed8", fontSize: 14, fontWeight: "700" },
  loadingText: { color: COLORS.textMid, marginTop: 12 },
});