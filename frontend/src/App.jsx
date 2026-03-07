import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import CreatePollScreen from "./components/CreatePollScreen";
import VoteScreen from "./components/VoteScreen";
import ResultsScreen from "./components/ResultsScreen";

// Role selection landing page
function LandingScreen({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 flex flex-col items-center justify-center px-4">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, #4ade80 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #fbbf24 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 text-center animate-fade-in max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🌱</span>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 tracking-tight">
          VolunteerPoll
        </h1>
        <p className="text-forest-200 text-lg mb-10 font-body">
          Coordinate NGO activities through simple, clear polls
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => onSelectRole("organizer")}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 hover:border-white/40 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="text-4xl mb-3">🗂️</div>
            <h2 className="text-white font-display font-bold text-xl mb-1">Organizer</h2>
            <p className="text-forest-200 text-sm font-body">
              Create polls, view results & insights, manage activities
            </p>
            <div className="mt-4 text-forest-300 text-sm font-semibold group-hover:text-white transition-colors">
              Enter as Organizer →
            </div>
          </button>

          <button
            onClick={() => onSelectRole("volunteer")}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 hover:border-white/40 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="text-4xl mb-3">🙋</div>
            <h2 className="text-white font-display font-bold text-xl mb-1">Volunteer</h2>
            <p className="text-forest-200 text-sm font-body">
              Browse open polls and cast your vote for activities
            </p>
            <div className="mt-4 text-forest-300 text-sm font-semibold group-hover:text-white transition-colors">
              Enter as Volunteer →
            </div>
          </button>
        </div>

        <p className="text-forest-400 text-xs mt-8 font-body">
          Made for NGO communities 🤝
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(null); // "organizer" | "volunteer"
  const [screen, setScreen] = useState("home");
  const [selectedPollId, setSelectedPollId] = useState(null);

  // Navigate helper
  const navigate = (to, pollId = null) => {
    setSelectedPollId(pollId);
    setScreen(to);
    window.scrollTo(0, 0);
  };

  if (!role) return <LandingScreen onSelectRole={setRole} />;

  return (
    <div className="min-h-screen bg-bark-50">
      {/* Top nav bar */}
      <nav className="bg-white border-b border-bark-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 font-display font-bold text-forest-700 text-lg hover:text-forest-900 transition-colors"
          >
            <span className="text-2xl">🌱</span>
            <span className="hidden sm:inline">VolunteerPoll</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span className={`tag-pill text-xs font-semibold ${
              role === "organizer"
                ? "bg-forest-100 text-forest-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {role === "organizer" ? "🗂️ Organizer" : "🙋 Volunteer"}
            </span>

            {/* Switch role */}
            <button
              onClick={() => { setRole(null); setScreen("home"); }}
              className="text-xs text-bark-500 hover:text-bark-800 underline transition-colors ml-1"
            >
              Switch
            </button>
          </div>
        </div>
      </nav>

      {/* Screens */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {screen === "home" && (
          <HomeScreen
            role={role}
            navigate={navigate}
          />
        )}
        {screen === "create" && role === "organizer" && (
          <CreatePollScreen navigate={navigate} />
        )}
        {screen === "vote" && (
          <VoteScreen pollId={selectedPollId} navigate={navigate} role={role} />
        )}
        {screen === "results" && (
          <ResultsScreen pollId={selectedPollId} navigate={navigate} role={role} />
        )}
      </main>
    </div>
  );
}