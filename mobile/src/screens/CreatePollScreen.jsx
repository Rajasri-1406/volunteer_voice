import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createPoll } from "../api";
import { COLORS, TAG_OPTIONS } from "../constants/colors";

const QUICK_OPTIONS = [
  { label: "Tree Planting", tag: "Environment" },
  { label: "Food Donation Drive", tag: "Food" },
  { label: "Community Clean-up", tag: "Community" },
  { label: "Health Camp", tag: "Health" },
];

export default function CreatePollScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", description: "",
    organizerName: "", organizerEmail: "", organizerPhone: "",
    pollType: "activity", deadline: "",
  });
  const [options, setOptions] = useState([
    { label: "", tag: "Environment" },
    { label: "", tag: "Environment" },
  ]);
  const [loading, setLoading] = useState(false);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const validOptions = options.filter((o) => o.label.trim());
  const canGoStep2 = form.title.trim() && form.organizerName.trim();
  const canSubmit = canGoStep2 && validOptions.length >= 2;

  const updateOption = (i, key, val) =>
    setOptions((o) => o.map((opt, idx) => (idx === i ? { ...opt, [key]: val } : opt)));
  const addOption = () => setOptions((o) => [...o, { label: "", tag: "Other" }]);
  const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createPoll({ ...form, options: validOptions, deadline: form.deadline || null });
      Alert.alert("Success!", "Poll created successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.screenTitle}>Create a Poll</Text>
          <Text style={styles.stepText}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressBar, s <= step && styles.progressBarActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Poll Details</Text>

            <Text style={styles.label}>Poll Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. March Volunteer Activity Vote"
              placeholderTextColor={COLORS.textLight}
              value={form.title}
              onChangeText={(v) => setField("title", v)}
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Help volunteers understand what they're voting for..."
              placeholderTextColor={COLORS.textLight}
              value={form.description}
              onChangeText={(v) => setField("description", v)}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Organizer name"
              placeholderTextColor={COLORS.textLight}
              value={form.organizerName}
              onChangeText={(v) => setField("organizerName", v)}
            />

            <Text style={styles.label}>Phone Number (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={COLORS.textLight}
              value={form.organizerPhone}
              onChangeText={(v) => setField("organizerPhone", v)}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="organizer@ngo.org"
              placeholderTextColor={COLORS.textLight}
              value={form.organizerEmail}
              onChangeText={(v) => setField("organizerEmail", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Deadline (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-03-31"
              placeholderTextColor={COLORS.textLight}
              value={form.deadline}
              onChangeText={(v) => setField("deadline", v)}
            />

            <TouchableOpacity
              style={[styles.btnPrimary, !canGoStep2 && styles.btnDisabled]}
              disabled={!canGoStep2}
              onPress={() => setStep(2)}
            >
              <Text style={styles.btnPrimaryText}>Next: Add Options →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Poll Options</Text>
              <TouchableOpacity
                style={styles.quickFillBtn}
                onPress={() => setOptions(QUICK_OPTIONS.map((o) => ({ ...o })))}
              >
                <Text style={styles.quickFillText}>✨ Quick fill</Text>
              </TouchableOpacity>
            </View>

            {options.map((opt, i) => (
              <View key={i} style={styles.optionBlock}>
                <TextInput
                  style={styles.input}
                  placeholder={`Option ${i + 1}`}
                  placeholderTextColor={COLORS.textLight}
                  value={opt.label}
                  onChangeText={(v) => updateOption(i, "label", v)}
                />
                {/* Tag selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
                  {TAG_OPTIONS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tagBtn, opt.tag === t && styles.tagBtnActive]}
                      onPress={() => updateOption(i, "tag", t)}
                    >
                      <Text style={[styles.tagBtnText, opt.tag === t && styles.tagBtnTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {options.length > 2 && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeOption(i)}>
                    <Text style={styles.removeBtnText}>✕ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
              <Text style={styles.addOptionText}>+ Add Option</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>
              Minimum 2 options · {validOptions.length} valid
            </Text>

            <TouchableOpacity
              style={[styles.btnPrimary, validOptions.length < 2 && styles.btnDisabled]}
              disabled={validOptions.length < 2}
              onPress={() => setStep(3)}
            >
              <Text style={styles.btnPrimaryText}>Next: Review →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review Your Poll</Text>

            <View style={styles.reviewBlock}>
              <Text style={styles.reviewLabel}>TITLE</Text>
              <Text style={styles.reviewValue}>{form.title}</Text>
              {form.description ? (
                <Text style={styles.reviewSub}>{form.description}</Text>
              ) : null}
            </View>

            <View style={styles.reviewRow}>
              <View style={[styles.reviewBlock, { flex: 1 }]}>
                <Text style={styles.reviewLabel}>ORGANIZER</Text>
                <Text style={styles.reviewValue}>{form.organizerName}</Text>
                {form.organizerPhone ? <Text style={styles.reviewSub}>{form.organizerPhone}</Text> : null}
                {form.organizerEmail ? <Text style={styles.reviewSub}>{form.organizerEmail}</Text> : null}
              </View>
              <View style={[styles.reviewBlock, { flex: 1 }]}>
                <Text style={styles.reviewLabel}>DEADLINE</Text>
                <Text style={styles.reviewSub}>{form.deadline || "No deadline"}</Text>
              </View>
            </View>

            <Text style={styles.reviewLabel}>OPTIONS ({validOptions.length})</Text>
            {validOptions.map((opt, i) => (
              <View key={i} style={styles.reviewOption}>
                <View style={styles.reviewOptionNum}>
                  <Text style={styles.reviewOptionNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.reviewOptionLabel}>{opt.label}</Text>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{opt.tag}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.btnPrimary, (!canSubmit || loading) && styles.btnDisabled]}
              disabled={!canSubmit || loading}
              onPress={handleSubmit}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? "Creating Poll..." : "🚀 Create Poll"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center",
  },
  backText: { fontSize: 18, color: COLORS.textDark },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  stepText: { fontSize: 12, color: COLORS.textMid },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, marginBottom: 16 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressBarActive: { backgroundColor: COLORS.primary },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMid, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: COLORS.textDark,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  quickFillBtn: { backgroundColor: "#dcfce7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quickFillText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  optionBlock: { marginBottom: 14 },
  tagRow: { marginTop: 8 },
  tagBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: COLORS.border, marginRight: 6,
  },
  tagBtnActive: { backgroundColor: COLORS.primary },
  tagBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textMid },
  tagBtnTextActive: { color: COLORS.white },
  removeBtn: { marginTop: 6 },
  removeBtnText: { color: COLORS.error, fontSize: 12, fontWeight: "600" },
  addOptionBtn: {
    borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 4,
  },
  addOptionText: { color: COLORS.textMid, fontSize: 13, fontWeight: "600" },
  hintText: { color: COLORS.textLight, fontSize: 11, marginTop: 8, marginBottom: 4 },
  reviewBlock: {
    backgroundColor: "#f5f5f4", borderRadius: 12, padding: 12, marginBottom: 10,
  },
  reviewRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  reviewLabel: {
    fontSize: 10, fontWeight: "700", color: COLORS.textLight,
    letterSpacing: 1, marginBottom: 4,
  },
  reviewValue: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  reviewSub: { fontSize: 12, color: COLORS.textMid, marginTop: 2 },
  reviewOption: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f5f5f4", borderRadius: 10, padding: 10, marginBottom: 6,
  },
  reviewOptionNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center",
  },
  reviewOptionNumText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  reviewOptionLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  tagPill: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagPillText: { fontSize: 10, fontWeight: "700", color: COLORS.textMid },
});
