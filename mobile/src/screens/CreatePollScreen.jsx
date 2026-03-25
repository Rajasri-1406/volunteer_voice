import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createPoll } from "../api";
import { COLORS, TAG_OPTIONS } from "../constants/colors";

const QUICK_OPTIONS = [
  { label: "Tree Planting", tag: "Environment" },
  { label: "Food Donation Drive", tag: "Food" },
  { label: "Community Clean-up", tag: "Community" },
  { label: "Health Camp", tag: "Health" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];
const AMPM = ["AM", "PM"];

// ─── All possible voter fields the organizer can enable ───────────────────
const ALL_VOTER_FIELDS = [
  { key: "name",  label: "Name",         emoji: "👤", hint: "Voter's full name" },
  { key: "phone", label: "Phone Number", emoji: "📞", hint: "Mobile / WhatsApp number" },
  { key: "dob",   label: "Date of Birth",emoji: "🎂", hint: "DD/MM/YYYY format" },
  { key: "email", label: "Email",        emoji: "✉️",  hint: "Voter's email address" },
];

function CalendarPicker({ visible, onClose, onSelect }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const fullMonthNames = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isPast = (d) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={cal.overlay}>
        <View style={cal.container}>
          <Text style={cal.title}>Select Date</Text>
          <View style={cal.navRow}>
            <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
              <Text style={cal.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={cal.monthLabel}>{fullMonthNames[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
              <Text style={cal.navText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={cal.weekRow}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <Text key={d} style={cal.weekDay}>{d}</Text>
            ))}
          </View>
          <View style={cal.grid}>
            {cells.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  cal.cell,
                  d && selected === d && cal.cellSelected,
                  d && isToday(d) && !selected && cal.cellToday,
                  d && isPast(d) && cal.cellPast,
                ]}
                disabled={!d || isPast(d)}
                onPress={() => setSelected(d)}
              >
                <Text style={[
                  cal.cellText,
                  d && selected === d && cal.cellTextSelected,
                  d && isPast(d) && cal.cellTextPast,
                ]}>
                  {d || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={cal.actions}>
            <TouchableOpacity style={cal.cancelBtn} onPress={onClose}>
              <Text style={cal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cal.confirmBtn, !selected && { opacity: 0.4 }]}
              disabled={!selected}
              onPress={() => {
                const month = String(viewMonth + 1).padStart(2, "0");
                const day = String(selected).padStart(2, "0");
                onSelect(`${viewYear}-${month}-${day}`);
                onClose();
              }}
            >
              <Text style={cal.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimePicker({ visible, onClose, onSelect }) {
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={cal.overlay}>
        <View style={cal.container}>
          <Text style={cal.title}>Select Time</Text>
          <View style={tp.row}>
            <View style={tp.col}>
              <Text style={tp.label}>Hour</Text>
              <ScrollView style={tp.scroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={[tp.item, hour === h && tp.itemSelected]} onPress={() => setHour(h)}>
                    <Text style={[tp.itemText, hour === h && tp.itemTextSelected]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={tp.col}>
              <Text style={tp.label}>Min</Text>
              <ScrollView style={tp.scroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity key={m} style={[tp.item, minute === m && tp.itemSelected]} onPress={() => setMinute(m)}>
                    <Text style={[tp.itemText, minute === m && tp.itemTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={tp.col}>
              <Text style={tp.label}>AM/PM</Text>
              <View style={tp.scroll}>
                {AMPM.map(a => (
                  <TouchableOpacity key={a} style={[tp.item, ampm === a && tp.itemSelected]} onPress={() => setAmpm(a)}>
                    <Text style={[tp.itemText, ampm === a && tp.itemTextSelected]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={cal.actions}>
            <TouchableOpacity style={cal.cancelBtn} onPress={onClose}>
              <Text style={cal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cal.confirmBtn} onPress={() => { onSelect(`${hour}:${minute} ${ampm}`); onClose(); }}>
              <Text style={cal.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // ── Voter fields config (Step 2b) ────────────────────────────────────────
  // null = not chosen yet, true = custom, false = default (name + phone)
  const [customVoterFields, setCustomVoterFields] = useState(null);
  const [selectedVoterFields, setSelectedVoterFields] = useState(["name", "phone"]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const validOptions = options.filter((o) => o.label.trim());
  const canGoStep2 = form.title.trim() && form.organizerName.trim();
  const canSubmit = canGoStep2 && validOptions.length >= 2;

  const updateOption = (i, key, val) =>
    setOptions((o) => o.map((opt, idx) => (idx === i ? { ...opt, [key]: val } : opt)));
  const addOption = () => setOptions((o) => [...o, { label: "", tag: "Other" }]);
  const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const time = selectedTime || "09:00 AM";
    setField("deadline", `${date} ${time}`);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (selectedDate) setField("deadline", `${selectedDate} ${time}`);
  };

  const toggleVoterField = (key) => {
    setSelectedVoterFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const saveMyPollId = async (id) => {
    try {
      const existing = await AsyncStorage.getItem("myPollIds");
      const ids = existing ? JSON.parse(existing) : [];
      ids.push(id);
      await AsyncStorage.setItem("myPollIds", JSON.stringify(ids));
    } catch (e) {
      console.warn("Could not save poll ID locally:", e);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // finalVoterFields: use selected if custom mode, else default ["name","phone"]
    const finalVoterFields = customVoterFields ? selectedVoterFields : ["name", "phone"];
    try {
      const result = await createPoll({
        ...form,
        options: validOptions,
        deadline: form.deadline || null,
        voterFields: finalVoterFields,
      });
      if (result && result.poll && result.poll._id) {
        await saveMyPollId(result.poll._id);
      }
      Alert.alert("Success!", "Poll created successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Total steps = 4 (details → options → voter fields → review)
  const TOTAL_STEPS = 4;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.screenTitle}>Create a Poll</Text>
          <Text style={styles.stepText}>Step {step} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressRow}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={[styles.progressBar, s <= step && styles.progressBarActive]} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 1: Poll Details ── */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Poll Details</Text>

              <Text style={styles.label}>Poll Title *</Text>
              <TextInput style={styles.input} placeholder="e.g. March Volunteer Activity Vote"
                placeholderTextColor={COLORS.textLight} value={form.title}
                onChangeText={(v) => setField("title", v)} returnKeyType="next" />

              <Text style={styles.label}>Description (optional)</Text>
              <TextInput style={[styles.input, styles.textarea]}
                placeholder="Help volunteers understand what they're voting for..."
                placeholderTextColor={COLORS.textLight} value={form.description}
                onChangeText={(v) => setField("description", v)} multiline numberOfLines={3} textAlignVertical="top" />

              <Text style={styles.label}>Your Name *</Text>
              <TextInput style={styles.input} placeholder="Organizer name"
                placeholderTextColor={COLORS.textLight} value={form.organizerName}
                onChangeText={(v) => setField("organizerName", v)} returnKeyType="next" />

              <Text style={styles.label}>Phone Number (optional)</Text>
              <TextInput style={styles.input} placeholder="+91 98765 43210"
                placeholderTextColor={COLORS.textLight} value={form.organizerPhone}
                onChangeText={(v) => setField("organizerPhone", v)} keyboardType="phone-pad" />

              <Text style={styles.label}>Email (optional)</Text>
              <TextInput style={styles.input} placeholder="organizer@ngo.org"
                placeholderTextColor={COLORS.textLight} value={form.organizerEmail}
                onChangeText={(v) => setField("organizerEmail", v)}
                keyboardType="email-address" autoCapitalize="none" returnKeyType="next" />

              <Text style={styles.label}>Deadline Date (optional)</Text>
              <TouchableOpacity style={[styles.input, styles.pickerBtn]} onPress={() => setShowCalendar(true)}>
                <Text style={selectedDate ? styles.pickerText : styles.pickerPlaceholder}>
                  {selectedDate || "Tap to select date 📅"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Deadline Time (optional)</Text>
              <TouchableOpacity style={[styles.input, styles.pickerBtn]} onPress={() => setShowTimePicker(true)}>
                <Text style={selectedTime ? styles.pickerText : styles.pickerPlaceholder}>
                  {selectedTime || "Tap to select time 🕐"}
                </Text>
              </TouchableOpacity>

              {(selectedDate || selectedTime) && (
                <View style={styles.deadlineBadge}>
                  <Text style={styles.deadlineBadgeText}>⏰ {selectedDate} {selectedTime}</Text>
                  <TouchableOpacity onPress={() => { setSelectedDate(""); setSelectedTime(""); setField("deadline", ""); }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.btnPrimary, !canGoStep2 && styles.btnDisabled]}
                disabled={!canGoStep2} onPress={() => setStep(2)}
              >
                <Text style={styles.btnPrimaryText}>Next: Add Options →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Poll Options ── */}
          {step === 2 && (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Poll Options</Text>
                <TouchableOpacity style={styles.quickFillBtn}
                  onPress={() => setOptions(QUICK_OPTIONS.map((o) => ({ ...o })))}>
                  <Text style={styles.quickFillText}>✨ Quick fill</Text>
                </TouchableOpacity>
              </View>
              {options.map((opt, i) => (
                <View key={i} style={styles.optionBlock}>
                  <TextInput style={styles.input} placeholder={`Option ${i + 1}`}
                    placeholderTextColor={COLORS.textLight} value={opt.label}
                    onChangeText={(v) => updateOption(i, "label", v)} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
                    {TAG_OPTIONS.map((t) => (
                      <TouchableOpacity key={t} style={[styles.tagBtn, opt.tag === t && styles.tagBtnActive]}
                        onPress={() => updateOption(i, "tag", t)}>
                        <Text style={[styles.tagBtnText, opt.tag === t && styles.tagBtnTextActive]}>{t}</Text>
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
              <Text style={styles.hintText}>Minimum 2 options · {validOptions.length} valid</Text>
              <TouchableOpacity
                style={[styles.btnPrimary, validOptions.length < 2 && styles.btnDisabled]}
                disabled={validOptions.length < 2} onPress={() => setStep(3)}>
                <Text style={styles.btnPrimaryText}>Next: Voter Info →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: Voter Fields ── */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Voter Info to Collect</Text>
              <Text style={styles.stepHint}>
                Choose what details voters must fill in before submitting their vote.
                All fields are optional for the voter.
              </Text>

              {/* Yes / No toggle */}
              <Text style={styles.label}>Do you want to collect custom voter info?</Text>
              <View style={styles.yesNoRow}>
                <TouchableOpacity
                  style={[styles.yesNoBtn, customVoterFields === true && styles.yesNoBtnActive]}
                  onPress={() => {
                    setCustomVoterFields(true);
                    setSelectedVoterFields(["name", "phone"]); // reset to defaults pre-checked
                  }}
                >
                  <Text style={[styles.yesNoBtnText, customVoterFields === true && styles.yesNoBtnTextActive]}>
                    ✅  Yes, I'll choose
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.yesNoBtn, customVoterFields === false && styles.yesNoBtnActive]}
                  onPress={() => {
                    setCustomVoterFields(false);
                    setSelectedVoterFields(["name", "phone"]);
                  }}
                >
                  <Text style={[styles.yesNoBtnText, customVoterFields === false && styles.yesNoBtnTextActive]}>
                    🚫  No, use default
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Default info box */}
              {customVoterFields === false && (
                <View style={styles.defaultBox}>
                  <Text style={styles.defaultBoxTitle}>Default fields:</Text>
                  <Text style={styles.defaultBoxItem}>👤  Name (optional)</Text>
                  <Text style={styles.defaultBoxItem}>📞  Phone Number (optional)</Text>
                </View>
              )}

              {/* Custom field picker */}
              {customVoterFields === true && (
                <View>
                  <Text style={[styles.label, { marginTop: 16 }]}>Select fields to show voters:</Text>
                  <Text style={styles.hintText}>All selected fields will be optional for the voter.</Text>
                  {ALL_VOTER_FIELDS.map((f) => {
                    const isOn = selectedVoterFields.includes(f.key);
                    return (
                      <TouchableOpacity
                        key={f.key}
                        style={[styles.fieldToggleRow, isOn && styles.fieldToggleRowActive]}
                        onPress={() => toggleVoterField(f.key)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.fieldCheckbox, isOn && styles.fieldCheckboxActive]}>
                          {isOn && <Text style={styles.fieldCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.fieldEmoji}>{f.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, isOn && { color: COLORS.primary }]}>{f.label}</Text>
                          <Text style={styles.fieldHint}>{f.hint}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {selectedVoterFields.length === 0 && (
                    <Text style={styles.warnText}>⚠️ Select at least one field, or switch to default.</Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  (customVoterFields === null || (customVoterFields === true && selectedVoterFields.length === 0)) && styles.btnDisabled,
                ]}
                disabled={customVoterFields === null || (customVoterFields === true && selectedVoterFields.length === 0)}
                onPress={() => setStep(4)}
              >
                <Text style={styles.btnPrimaryText}>Next: Review →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Review Your Poll</Text>
              <View style={styles.reviewBlock}>
                <Text style={styles.reviewLabel}>TITLE</Text>
                <Text style={styles.reviewValue}>{form.title}</Text>
                {form.description ? <Text style={styles.reviewSub}>{form.description}</Text> : null}
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

              {/* Voter fields summary */}
              <View style={[styles.reviewBlock, { marginTop: 12 }]}>
                <Text style={styles.reviewLabel}>VOTER INFO FIELDS</Text>
                {(customVoterFields ? selectedVoterFields : ["name", "phone"]).map((key) => {
                  const f = ALL_VOTER_FIELDS.find((x) => x.key === key);
                  return f ? (
                    <Text key={key} style={styles.reviewSub}>{f.emoji} {f.label} (optional)</Text>
                  ) : null;
                })}
              </View>

              <TouchableOpacity
                style={[styles.btnPrimary, (!canSubmit || loading) && styles.btnDisabled]}
                disabled={!canSubmit || loading} onPress={handleSubmit}>
                <Text style={styles.btnPrimaryText}>{loading ? "Creating Poll..." : "🚀 Create Poll"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarPicker visible={showCalendar} onClose={() => setShowCalendar(false)} onSelect={handleDateSelect} />
      <TimePicker visible={showTimePicker} onClose={() => setShowTimePicker(false)} onSelect={handleTimeSelect} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 18, color: COLORS.textDark },
  screenTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  stepText: { fontSize: 12, color: COLORS.textMid },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 16, marginBottom: 16 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressBarActive: { backgroundColor: COLORS.primary },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMid, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border },
  textarea: { height: 80 },
  pickerBtn: { justifyContent: "center" },
  pickerText: { fontSize: 14, color: COLORS.textDark },
  pickerPlaceholder: { fontSize: 14, color: COLORS.textLight },
  deadlineBadge: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 10, marginTop: 10 },
  deadlineBadgeText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  clearText: { fontSize: 12, color: COLORS.error, fontWeight: "700" },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  quickFillBtn: { backgroundColor: "#dcfce7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  quickFillText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  optionBlock: { marginBottom: 14 },
  tagRow: { marginTop: 8 },
  tagBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.border, marginRight: 6 },
  tagBtnActive: { backgroundColor: COLORS.primary },
  tagBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textMid },
  tagBtnTextActive: { color: COLORS.white },
  removeBtn: { marginTop: 6 },
  removeBtnText: { color: COLORS.error, fontSize: 12, fontWeight: "600" },
  addOptionBtn: { borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  addOptionText: { color: COLORS.textMid, fontSize: 13, fontWeight: "600" },
  hintText: { color: COLORS.textLight, fontSize: 11, marginTop: 8, marginBottom: 4 },
  reviewBlock: { backgroundColor: "#f5f5f4", borderRadius: 12, padding: 12, marginBottom: 10 },
  reviewRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  reviewLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textLight, letterSpacing: 1, marginBottom: 4 },
  reviewValue: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  reviewSub: { fontSize: 12, color: COLORS.textMid, marginTop: 2 },
  reviewOption: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f5f5f4", borderRadius: 10, padding: 10, marginBottom: 6 },
  reviewOptionNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center" },
  reviewOptionNumText: { fontSize: 11, fontWeight: "800", color: COLORS.primary },
  reviewOptionLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.textDark },
  tagPill: { backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagPillText: { fontSize: 10, fontWeight: "700", color: COLORS.textMid },
  // ── Step 3 styles ────────────────────────────────────────────────────────
  stepHint: { fontSize: 13, color: COLORS.textMid, lineHeight: 18, marginBottom: 12 },
  yesNoRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  yesNoBtn: { flex: 1, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 13, alignItems: "center", backgroundColor: COLORS.white },
  yesNoBtnActive: { borderColor: COLORS.primary, backgroundColor: "#f0fdf4" },
  yesNoBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.textMid },
  yesNoBtnTextActive: { color: COLORS.primary },
  defaultBox: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, marginTop: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  defaultBoxTitle: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 6 },
  defaultBoxItem: { fontSize: 13, color: COLORS.textDark, marginBottom: 4 },
  fieldToggleRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: COLORS.white },
  fieldToggleRowActive: { borderColor: COLORS.primary, backgroundColor: "#f0fdf4" },
  fieldCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  fieldCheckboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  fieldCheckmark: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  fieldEmoji: { fontSize: 20 },
  fieldLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  fieldHint: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  warnText: { fontSize: 12, color: COLORS.error, fontWeight: "600", marginTop: 4 },
});

const cal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textDark, textAlign: "center", marginBottom: 16 },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f5f5f4", alignItems: "center", justifyContent: "center" },
  navText: { fontSize: 22, color: COLORS.textDark, fontWeight: "700" },
  monthLabel: { fontSize: 16, fontWeight: "700", color: COLORS.textDark },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700", color: COLORS.textMid },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  cellSelected: { backgroundColor: COLORS.primary },
  cellToday: { backgroundColor: COLORS.primaryLight },
  cellPast: { opacity: 0.3 },
  cellText: { fontSize: 14, color: COLORS.textDark, fontWeight: "500" },
  cellTextSelected: { color: COLORS.white, fontWeight: "800" },
  cellTextPast: { color: COLORS.textLight },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: "#f5f5f4", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  cancelText: { fontSize: 14, fontWeight: "700", color: COLORS.textMid },
  confirmBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  confirmText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});

const tp = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1, alignItems: "center" },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.textMid, marginBottom: 8 },
  scroll: { height: 150, width: "100%" },
  item: { paddingVertical: 10, alignItems: "center", borderRadius: 8, marginBottom: 4 },
  itemSelected: { backgroundColor: COLORS.primary },
  itemText: { fontSize: 16, fontWeight: "600", color: COLORS.textDark },
  itemTextSelected: { color: COLORS.white, fontWeight: "800" },
});