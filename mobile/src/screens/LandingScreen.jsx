import { View, Text, TouchableOpacity, StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🤝</Text>
        <Text style={styles.title}>VolunteerPoll</Text>
        <Text style={styles.subtitle}>
          Coordinate NGO activities through simple, clear polls
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Home", { role: "organizer" })}
        >
          <Text style={styles.cardEmoji}>🗂️</Text>
          <Text style={styles.cardTitle}>Organizer</Text>
          <Text style={styles.cardDesc}>
            Create polls, view results and manage activities
          </Text>
          <View style={styles.cardBtn}>
            <Text style={styles.cardBtnText}>Enter as Organizer →</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardVolunteer]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Home", { role: "volunteer" })}
        >
          <Text style={styles.cardEmoji}>🙋</Text>
          <Text style={styles.cardTitle}>Volunteer</Text>
          <Text style={styles.cardDesc}>
            Browse open polls and cast your vote for activities
          </Text>
          <View style={[styles.cardBtn, styles.cardBtnVolunteer]}>
            <Text style={[styles.cardBtnText, { color: "#1d4ed8" }]}>
              Enter as Volunteer →
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Made for NGO communities 🤝</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: { alignItems: "center", marginTop: 20 },
  emoji: { fontSize: 52, marginBottom: 10 },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#bbf7d0",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  cardContainer: { gap: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  cardVolunteer: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  cardEmoji: { fontSize: 36, marginBottom: 8 },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#bbf7d0",
    lineHeight: 20,
    marginBottom: 14,
  },
  cardBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  cardBtnVolunteer: {
    backgroundColor: "#dbeafe",
  },
  cardBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13,
  },
  footer: {
    color: "#86efac",
    textAlign: "center",
    fontSize: 13,
  },
});
