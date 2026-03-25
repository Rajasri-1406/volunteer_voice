import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, Share, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllPolls, deletePoll, closePoll, duplicatePoll, addComment, editPoll } from "../api";
import { COLORS, TAG_COLORS, TAG_OPTIONS } from "../constants/colors";

const FRONTEND_URL = "https://volunteer-voice.vercel.app";

// ─── Demo poll shown to new organizers ────────────────────────────────────
const DEMO_POLL = {
  _id: "demo",
  title: "🌱 March Volunteer Activity Vote (Sample)",
  description: "This is a sample poll to show you how VolunteerPoll works. Create your own poll using the '+ New' button!",
  organizerName: "VolunteerPoll Team",
  status: "active",
  totalVotes: 12,
  options: [
    { label: "Tree Planting", tag: "Environment", votes: 5 },
    { label: "Food Donation Drive", tag: "Food", votes: 4 },
    { label: "Community Clean-up", tag: "Community", votes: 3 },
  ],
  comments: [],
  deadline: null,
  isDemo: true,
};

// ─── Comment Section ───────────────────────────────────────────────────────
function CommentSection({ pollId, comments: initialComments, isDemo }) {
  const [comments, setComments] = useState(initialComments || []);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!name.trim() || !text.trim()) {
      Alert.alert("Required", "Please enter your name and comment.");
      return;
    }
    if (isDemo) {
      Alert.alert("Demo Poll", "This is a sample poll. Create your own poll to enable comments!");
      return;
    }
    setPosting(true);
    try {
      const result = await addComment(pollId, name.trim(), text.trim());
      setComments(result.comments);
      setText("");
    } catch (e) {
      Alert.alert("Error", "Could not post comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={cs.container}>
      <TouchableOpacity style={cs.toggleRow} onPress={() => setExpanded(!expanded)}>
        <Text style={cs.toggleText}>💬 Comments ({comments.length})</Text>
        <Text style={cs.toggleChevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View>
          {comments.length === 0 ? (
            <Text style={cs.emptyText}>No comments yet. Be the first!</Text>
          ) : (
            comments.map((c, i) => (
              <View key={i} style={cs.commentCard}>
                <Text style={cs.commentName}>{c.commenterName}</Text>
                <Text style={cs.commentText}>{c.text}</Text>
                <Text style={cs.commentTime}>
                  {new Date(c.commentedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            ))
          )}

          <View style={cs.inputRow}>
            <TextInput
              style={cs.nameInput}
              placeholder="Your name"
              placeholderTextColor={COLORS.textLight}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={cs.textInput}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.textLight}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={[cs.postBtn, (!name.trim() || !text.trim() || posting) && cs.postBtnDisabled]}
              onPress={handlePost}
              disabled={posting}
            >
              <Text style={cs.postBtnText}>{posting ? "Posting..." : "Post"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Edit Poll Modal ───────────────────────────────────────────────────────
function EditPollModal({ poll, visible, onClose, onSaved }) {
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || "");
  const [options, setOptions] = useState(poll.options.map((o) => ({ label: o.label, tag: o.tag })));
  const [saving, setSaving] = useState(false);

  const updateOption = (i, key, val) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [key]: val } : o)));
  const addOption = () => setOptions((prev) => [...prev, { label: "", tag: "Other" }]);
  const removeOption = (i) => {
    if (options.length <= 2) { Alert.alert("Minimum 2 options required."); return; }
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Title is required."); return; }
    const valid = options.filter((o) => o.label.trim());
    if (valid.length < 2) { Alert.alert("At least 2 options required."); return; }
    setSaving(true);
    try {
      const result = await editPoll(poll._id, { title, description, options: valid });
      onSaved(result.poll);
      onClose();
    } catch (e) {
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={em.overlay}>
        <View style={em.container}>
          <View style={em.header}>
            <Text style={em.title}>Edit Poll</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={em.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={em.label}>Poll Title *</Text>
            <TextInput style={em.input} value={title} onChangeText={setTitle} placeholder="Poll title" placeholderTextColor={COLORS.textLight} />

            <Text style={em.label}>Description</Text>
            <TextInput style={[em.input, { height: 70 }]} value={description} onChangeText={setDescription}
              placeholder="Description (optional)" placeholderTextColor={COLORS.textLight} multiline textAlignVertical="top" />

            <Text style={em.label}>Options (votes are preserved)</Text>
            {options.map((opt, i) => (
              <View key={i} style={em.optionRow}>
                <TextInput
                  style={em.optionInput}
                  value={opt.label}
                  onChangeText={(v) => updateOption(i, "label", v)}
                  placeholder={`Option ${i + 1}`}
                  placeholderTextColor={COLORS.textLight}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={em.tagScroll}>
                  {TAG_OPTIONS.map((t) => (
                    <TouchableOpacity key={t}
                      style={[em.tagBtn, opt.tag === t && em.tagBtnActive]}
                      onPress={() => updateOption(i, "tag", t)}>
                      <Text style={[em.tagText, opt.tag === t && em.tagTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {options.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(i)}>
                    <Text style={em.removeText}>✕ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={em.addOptionBtn} onPress={addOption}>
              <Text style={em.addOptionText}>+ Add Option</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[em.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={em.saveBtnText}>{saving ? "Saving..." : "💾 Save Changes"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Poll Card ─────────────────────────────────────────────────────────────
function PollCard({ poll, role, onVote, onResults, onDelete, onClose, onShare, onDuplicate, onEdit, hasVoted, isMyPoll }) {
  const deadline = poll.deadline ? new Date(poll.deadline) : null;
  const isExpired = deadline && deadline < new Date();
  const daysLeft = deadline
    ? Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const isClosed = poll.status === "closed" || isExpired;
  const canSeeResults = isClosed;

  return (
    <View style={[styles.card, poll.isDemo && styles.demoCard]}>
      {/* Demo banner */}
      {poll.isDemo && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>👋 Sample Poll — See how it works!</Text>
        </View>
      )}

      {/* Status row */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge,
          { backgroundColor: poll.status === "active" ? COLORS.primaryLight : "#f5f5f4" }]}>
          <Text style={[styles.statusText,
            { color: poll.status === "active" ? COLORS.primary : COLORS.textMid }]}>
            ● {poll.status === "active" ? "Active" : "Closed"}
          </Text>
        </View>
        {hasVoted && (
          <View style={styles.votedBadge}>
            <Text style={styles.votedBadgeText}>✓ Voted</Text>
          </View>
        )}
        {isExpired && poll.status === "active" && (
          <View style={[styles.votedBadge, { backgroundColor: "#fee2e2" }]}>
            <Text style={[styles.votedBadgeText, { color: "#dc2626" }]}>⏰ Expired</Text>
          </View>
        )}
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
              {canSeeResults && (
                <Text style={styles.optionPct}>{opt.votes}v · {pct}%</Text>
              )}
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
            {deadline && !isExpired ? `  ⏳ ${daysLeft}d left` : ""}
          </Text>
        </View>
        <View style={styles.actionCol}>
          <View style={styles.actionRow}>
            {role === "volunteer" && poll.status === "active" && !hasVoted && !isExpired && !poll.isDemo && (
              <TouchableOpacity style={styles.btnPrimary} onPress={onVote}>
                <Text style={styles.btnPrimaryText}>Vote</Text>
              </TouchableOpacity>
            )}
            {(role === "organizer" || canSeeResults) && !poll.isDemo && (
              <TouchableOpacity style={styles.btnSecondary} onPress={onResults}>
                <Text style={styles.btnSecondaryText}>Results</Text>
              </TouchableOpacity>
            )}
            {!poll.isDemo && (
              <TouchableOpacity style={styles.btnShare} onPress={onShare}>
                <Text style={styles.btnShareText}>🔗 Share</Text>
              </TouchableOpacity>
            )}
          </View>

          {role === "organizer" && (
            <View style={[styles.actionRow, { marginTop: 6 }]}>
              {/* Copy only for organizer's own polls */}
              {isMyPoll && !poll.isDemo && (
                <TouchableOpacity style={styles.btnDuplicate} onPress={onDuplicate}>
                  <Text style={styles.btnDuplicateText}>⎘ Copy</Text>
                </TouchableOpacity>
              )}
              {/* Edit only for organizer's own polls */}
              {isMyPoll && !poll.isDemo && (
                <TouchableOpacity style={styles.btnEdit} onPress={onEdit}>
                  <Text style={styles.btnEditText}>✏️ Edit</Text>
                </TouchableOpacity>
              )}
              {poll.status === "active" && !poll.isDemo && (
                <TouchableOpacity style={styles.btnWarning} onPress={onClose}>
                  <Text style={styles.btnWarningText}>Close</Text>
                </TouchableOpacity>
              )}
              {!poll.isDemo && (
                <TouchableOpacity style={styles.btnDanger} onPress={onDelete}>
                  <Text style={styles.btnDangerText}>Del</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {role === "volunteer" && poll.status === "active" && !isExpired && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>🔒 Results will be visible after the poll closes</Text>
        </View>
      )}

      {/* Demo instructions */}
      {poll.isDemo && (
        <View style={styles.demoInstructions}>
          <Text style={styles.demoInstructTitle}>📖 How to create your poll:</Text>
          <Text style={styles.demoInstructStep}>1. Tap <Text style={styles.bold}>+ New</Text> button above</Text>
          <Text style={styles.demoInstructStep}>2. Fill in poll title and your name</Text>
          <Text style={styles.demoInstructStep}>3. Add at least 2 options with tags</Text>
          <Text style={styles.demoInstructStep}>4. Review and tap <Text style={styles.bold}>🚀 Create Poll</Text></Text>
          <Text style={styles.demoInstructStep}>5. Share the link with volunteers!</Text>
        </View>
      )}

      {/* Comments */}
      <CommentSection pollId={poll._id} comments={poll.comments || []} isDemo={poll.isDemo} />
    </View>
  );
}

// ─── Main HomeScreen ───────────────────────────────────────────────────────
export default function HomeScreen({ navigation, route }) {
  const { role } = route.params;
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [votedPollIds, setVotedPollIds] = useState([]);
  const [myPollIds, setMyPollIds] = useState([]);
  const myPollIdsRef = useRef([]);
  const [editingPoll, setEditingPoll] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [demoDismissed, setDemoDismissed] = useState(false);

  // Check if new organizer (first time opening)
  useEffect(() => {
    if (role !== "organizer") return;
    AsyncStorage.getItem("welcomeSeen").then((val) => {
      if (!val) setShowWelcome(true);
    });
    AsyncStorage.getItem("demoDismissed").then((val) => {
      if (val === "true") setDemoDismissed(true);
    });
  }, [role]);

  const dismissWelcome = async () => {
    await AsyncStorage.setItem("welcomeSeen", "true");
    setShowWelcome(false);
  };

  const dismissDemo = async () => {
    Alert.alert(
      "Thank you! 🎉",
      "Thank you for experiencing VolunteerPoll! Now you can create your own poll and coordinate your NGO activities easily.",
      [{ text: "Let's Go!", onPress: async () => {
        await AsyncStorage.setItem("demoDismissed", "true");
        setDemoDismissed(true);
      }}]
    );
  };

  const loadMyPollIds = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("myPollIds");
      const ids = stored ? JSON.parse(stored) : [];
      myPollIdsRef.current = ids;
      setMyPollIds(ids);
    } catch (e) {
      myPollIdsRef.current = [];
      setMyPollIds([]);
    }
  }, []);

  const fetchPolls = useCallback(async (retryCount = 0) => {
    try {
      const data = await getAllPolls();
      setPolls(data);
      setError("");
      const keys = await AsyncStorage.getAllKeys();
      const votedKeys = keys.filter((k) => k.startsWith("voted_"));
      setVotedPollIds(votedKeys.map((k) => k.replace("voted_", "")));
    } catch (e) {
      if (retryCount < 2) {
        setTimeout(() => fetchPolls(retryCount + 1), 3000);
      } else {
        setError("Could not connect to server. Make sure backend is running.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => { await loadMyPollIds(); fetchPolls(); };
    init();
  }, [fetchPolls, loadMyPollIds]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await loadMyPollIds();
      fetchPolls();
    });
    return unsubscribe;
  }, [navigation, fetchPolls, loadMyPollIds]);

  const handleDelete = (id) => {
    Alert.alert("Delete Poll", "This will permanently delete the poll.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deletePoll(id);
          setPolls((prev) => prev.filter((p) => p._id !== id));
          const updated = myPollIds.filter((pid) => pid !== id);
          myPollIdsRef.current = updated;
          setMyPollIds(updated);
          await AsyncStorage.setItem("myPollIds", JSON.stringify(updated));
        },
      },
    ]);
  };

  const handleClose = async (id) => {
    const result = await closePoll(id);
    setPolls((prev) => prev.map((p) => (p._id === id ? result.poll : p)));
  };

  const handleShare = async (poll) => {
    try {
      const voteUrl = `${FRONTEND_URL}/vote/${poll._id}`;
      await Share.share({
        title: `Vote: ${poll.title}`,
        message: `🗳️ You're invited to vote!\n\n"${poll.title}"\nOrganized by: ${poll.organizerName}\n\nVote here 👉 ${voteUrl}`,
        url: voteUrl,
      });
    } catch (e) {
      Alert.alert("Error", "Could not share poll.");
    }
  };

  const handleDuplicate = async (pollId) => {
    Alert.alert("Duplicate Poll", "This will create a copy of this poll with votes reset.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Duplicate",
        onPress: async () => {
          try {
            const result = await duplicatePoll(pollId);
            // Save duplicated poll ID to myPollIds
            const updated = [...myPollIdsRef.current, result.poll._id];
            myPollIdsRef.current = updated;
            setMyPollIds(updated);
            await AsyncStorage.setItem("myPollIds", JSON.stringify(updated));
            setPolls((prev) => [result.poll, ...prev]);
            Alert.alert("Done!", "Poll duplicated successfully.");
          } catch (e) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleEditSaved = (updatedPoll) => {
    setPolls((prev) => prev.map((p) => (p._id === updatedPoll._id ? updatedPoll : p)));
  };

  // Build filtered list
  const realFiltered = polls.filter((p) => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.organizerName.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    if (activeTab === "active") return matchSearch && p.status === "active";
    if (activeTab === "closed") return matchSearch && p.status === "closed";
    if (activeTab === "my") return matchSearch && myPollIdsRef.current.includes(p._id);
    if (activeTab === "voted") return matchSearch && votedPollIds.includes(p._id);
    return matchSearch;
  });

  // Show demo poll only on "my" tab, only if organizer has never created a real poll, and hasn't dismissed it
  const hasCreatedRealPoll = myPollIdsRef.current.length > 0;
  const showDemoPoll = role === "organizer" && !demoDismissed && !hasCreatedRealPoll && activeTab === "my";
  const filtered = showDemoPoll ? [DEMO_POLL, ...realFiltered] : realFiltered;

  const activeCount = polls.filter((p) => p.status === "active").length;
  const myPollsCount = myPollIdsRef.current.filter((id) => polls.some((p) => p._id === id)).length;
  const votedCount = votedPollIds.length;

  const statsData = role === "organizer" ? [
    { label: "Total", value: polls.length, emoji: "📊" },
    { label: "Active", value: activeCount, emoji: "🟢" },
    { label: "My Polls", value: myPollsCount, emoji: "🗂️" },
  ] : [
    { label: "Total", value: polls.length, emoji: "📊" },
    { label: "Active", value: activeCount, emoji: "🟢" },
    { label: "Voted", value: votedCount, emoji: "✅" },
  ];

  return (
    <SafeAreaView style={styles.container}>

      {/* Welcome Modal for new organizers */}
      <Modal visible={showWelcome} transparent animationType="fade">
        <View style={wm.overlay}>
          <View style={wm.box}>
            <Text style={wm.emoji}>👋</Text>
            <Text style={wm.title}>Welcome to VolunteerPoll!</Text>
            <Text style={wm.body}>
              You're signed in as an <Text style={wm.bold}>Organizer</Text>.{"\n\n"}
              A sample poll has been added below to show you how everything works.{"\n\n"}
              👉 Tap <Text style={wm.bold}>+ New</Text> to create your first poll{"\n"}
              👉 Share the link with volunteers{"\n"}
              👉 Watch the votes come in live!
            </Text>
            <TouchableOpacity style={wm.btn} onPress={dismissWelcome}>
              <Text style={wm.btnText}>Got it, let's go! 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Poll Modal */}
      {editingPoll && (
        <EditPollModal
          poll={editingPoll}
          visible={!!editingPoll}
          onClose={() => setEditingPoll(null)}
          onSaved={handleEditSaved}
        />
      )}

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
        {statsData.map((s) => (
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

      {/* Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, activeTab === "all" && styles.filterBtnActive]} onPress={() => setActiveTab("all")}>
          <Text style={[styles.filterText, activeTab === "all" && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {role === "organizer" && (
          <TouchableOpacity style={[styles.filterBtn, activeTab === "my" && styles.filterBtnActive]} onPress={() => setActiveTab("my")}>
            <Text style={[styles.filterText, activeTab === "my" && styles.filterTextActive]}>My Polls</Text>
          </TouchableOpacity>
        )}
        {role === "volunteer" && (
          <TouchableOpacity style={[styles.filterBtn, activeTab === "voted" && styles.filterBtnActive]} onPress={() => setActiveTab("voted")}>
            <Text style={[styles.filterText, activeTab === "voted" && styles.filterTextActive]}>✓ Voted</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.filterBtn, activeTab === "active" && styles.filterBtnActive]} onPress={() => setActiveTab("active")}>
          <Text style={[styles.filterText, activeTab === "active" && styles.filterTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeTab === "closed" && styles.filterBtnActive]} onPress={() => setActiveTab("closed")}>
          <Text style={[styles.filterText, activeTab === "closed" && styles.filterTextActive]}>Closed</Text>
        </TouchableOpacity>
        {role === "organizer" && (
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate("CreatePoll")}>
            <Text style={styles.createBtnText}>+ New</Text>
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
          <Text style={styles.errorEmoji}>{activeTab === "voted" ? "🗳️" : activeTab === "my" ? "🗂️" : "📭"}</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === "voted" ? "You haven't voted yet" : activeTab === "my" ? "No polls created yet" : "No polls found"}
          </Text>
          {role === "organizer" && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.navigate("CreatePoll")}>
              <Text style={styles.retryText}>Create Poll</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <>
              <PollCard
                poll={item}
                role={role}
                isMyPoll={myPollIdsRef.current.includes(item._id)}
                hasVoted={votedPollIds.includes(item._id)}
                onVote={() => navigation.navigate("Vote", { pollId: item._id, role })}
                onResults={() => navigation.navigate("Results", { pollId: item._id, role })}
                onDelete={() => handleDelete(item._id)}
                onClose={() => handleClose(item._id)}
                onShare={() => handleShare(item)}
                onDuplicate={() => handleDuplicate(item._id)}
                onEdit={() => setEditingPoll(item)}
              />
              {/* Thank you button below demo poll */}
              {item.isDemo && (
                <TouchableOpacity style={styles.dismissDemoBtn} onPress={dismissDemo}>
                  <Text style={styles.dismissDemoBtnText}>✅ I've explored it — remove sample poll</Text>
                </TouchableOpacity>
              )}
            </>
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

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  screenTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark },
  screenSubtitle: { fontSize: 13, color: COLORS.textMid, marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  statLabel: { fontSize: 11, color: COLORS.textMid, marginTop: 1 },
  searchInput: { marginHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textDark, marginBottom: 10 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: "wrap" },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: COLORS.textMid, textTransform: "capitalize" },
  filterTextActive: { color: COLORS.white },
  createBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: COLORS.primary },
  createBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 30, gap: 12 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  demoCard: { borderColor: COLORS.primary, borderWidth: 2 },
  demoBanner: { backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 8, marginBottom: 10, alignItems: "center" },
  demoBannerText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  demoInstructions: { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, marginTop: 10 },
  demoInstructTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textDark, marginBottom: 6 },
  demoInstructStep: { fontSize: 12, color: COLORS.textMid, marginBottom: 3 },
  bold: { fontWeight: "800", color: COLORS.textDark },
  dismissDemoBtn: { backgroundColor: "#dcfce7", borderRadius: 12, padding: 12, alignItems: "center", marginTop: -4, marginBottom: 8 },
  dismissDemoBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  cardHeader: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  votedBadge: { backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  votedBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
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
  actionCol: { alignItems: "flex-end" },
  actionRow: { flexDirection: "row", gap: 6 },
  btnPrimary: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  btnPrimaryText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  btnSecondary: { backgroundColor: "#f5f5f4", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  btnSecondaryText: { color: COLORS.textDark, fontSize: 12, fontWeight: "700" },
  btnShare: { backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  btnShareText: { color: "#1d4ed8", fontSize: 12, fontWeight: "700" },
  btnDuplicate: { backgroundColor: "#f5f3ff", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  btnDuplicateText: { color: "#7c3aed", fontSize: 12, fontWeight: "700" },
  btnEdit: { backgroundColor: "#fff7ed", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  btnEditText: { color: "#c2410c", fontSize: 12, fontWeight: "700" },
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
  hintBox: { marginTop: 10, backgroundColor: "#fef9c3", borderRadius: 10, padding: 8 },
  hintText: { fontSize: 11, color: "#92400e", fontWeight: "600", textAlign: "center" },
});

// Comment section styles
const cs = StyleSheet.create({
  container: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggleText: { fontSize: 13, fontWeight: "700", color: COLORS.textMid },
  toggleChevron: { fontSize: 12, color: COLORS.textLight },
  emptyText: { fontSize: 12, color: COLORS.textLight, marginTop: 8, marginBottom: 4 },
  commentCard: { backgroundColor: "#f9fafb", borderRadius: 10, padding: 10, marginTop: 8 },
  commentName: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  commentText: { fontSize: 13, color: COLORS.textMid, marginTop: 2 },
  commentTime: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },
  inputRow: { marginTop: 10, gap: 6 },
  nameInput: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textDark },
  textInput: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textDark, minHeight: 60, textAlignVertical: "top" },
  postBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
});

// Edit modal styles
const em = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  closeBtn: { fontSize: 20, color: COLORS.textMid, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMid, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#f5f5f4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border },
  optionRow: { marginBottom: 12 },
  optionInput: { backgroundColor: "#f5f5f4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6 },
  tagScroll: { marginBottom: 4 },
  tagBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: COLORS.border, marginRight: 6 },
  tagBtnActive: { backgroundColor: COLORS.primary },
  tagText: { fontSize: 12, fontWeight: "600", color: COLORS.textMid },
  tagTextActive: { color: COLORS.white },
  removeText: { color: COLORS.error, fontSize: 12, fontWeight: "600", marginTop: 2 },
  addOptionBtn: { borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border, borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 4 },
  addOptionText: { color: COLORS.textMid, fontSize: 13, fontWeight: "600" },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});

// Welcome modal styles
const wm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  box: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, width: "100%" },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, textAlign: "center", marginBottom: 12 },
  body: { fontSize: 14, color: COLORS.textMid, lineHeight: 22, textAlign: "center", marginBottom: 20 },
  bold: { fontWeight: "800", color: COLORS.textDark },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});