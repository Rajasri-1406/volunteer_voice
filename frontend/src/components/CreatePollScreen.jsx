import { useState } from "react";
import { createPoll } from "../api";
import { TAG_OPTIONS } from "../data/polls";

const POLL_TYPES = [
  { value: "activity", label: "🌿 Activity Choice" },
  { value: "date", label: "📅 Date / Time" },
  { value: "location", label: "📍 Location" },
  { value: "general", label: "💬 General" },
];

const QUICK_OPTIONS = {
  activity: [
    { label: "Tree Planting", tag: "Environment" },
    { label: "Food Donation Drive", tag: "Food" },
    { label: "Community Clean-up", tag: "Community" },
    { label: "Health Camp", tag: "Health" },
  ],
  date: [
    { label: "This Saturday Morning", tag: "Other" },
    { label: "This Sunday Morning", tag: "Other" },
    { label: "Next Weekday Evening", tag: "Other" },
    { label: "Next Weekend", tag: "Other" },
  ],
  location: [
    { label: "City Park", tag: "Environment" },
    { label: "Community Hall", tag: "Community" },
    { label: "Local School Ground", tag: "Community" },
    { label: "Beach / Riverside", tag: "Environment" },
  ],
  general: [
    { label: "Option A", tag: "Other" },
    { label: "Option B", tag: "Other" },
  ],
};

export default function CreatePollScreen({ navigate }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    organizerName: "",
    organizerEmail: "",
    pollType: "activity",
    deadline: "",
  });
  const [options, setOptions] = useState([
    { label: "", tag: "Environment" },
    { label: "", tag: "Environment" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: details, 2: options, 3: review

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addOption = () =>
    setOptions((o) => [...o, { label: "", tag: "Other" }]);

  const removeOption = (i) =>
    setOptions((o) => o.filter((_, idx) => idx !== i));

  const updateOption = (i, key, val) =>
    setOptions((o) => o.map((opt, idx) => (idx === i ? { ...opt, [key]: val } : opt)));

  const loadQuickOptions = () => {
    setOptions(QUICK_OPTIONS[form.pollType].map((o) => ({ ...o })));
  };

  const canGoStep2 =
    form.title.trim() && form.organizerName.trim();

  const canSubmit =
    canGoStep2 && options.filter((o) => o.label.trim()).length >= 2;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const cleanOptions = options.filter((o) => o.label.trim());
      await createPoll({
        ...form,
        options: cleanOptions,
        deadline: form.deadline || null,
      });
      navigate("home");
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate("home"))}
          className="w-10 h-10 rounded-xl bg-white border border-bark-200 flex items-center justify-center hover:bg-bark-50 transition-colors"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-bark-900">Create a Poll</h1>
          <p className="text-bark-500 text-sm">Step {step} of 3</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex gap-2 mb-7">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              s <= step ? "bg-forest-500" : "bg-bark-200"
            }`}
          />
        ))}
      </div>

      {/* ── STEP 1: Poll Details ── */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card">
            <h2 className="font-display font-bold text-bark-800 mb-4">Poll Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-bark-700 mb-1.5">
                  Poll Title *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. March Volunteer Activity Vote"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-bark-700 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  className="input-field resize-none h-20"
                  placeholder="Help volunteers understand what they're voting for..."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-bark-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    className="input-field"
                    placeholder="Organizer name"
                    value={form.organizerName}
                    onChange={(e) => setField("organizerName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-bark-700 mb-1.5">
                    Your Email (optional)
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="organizer@ngo.org"
                    value={form.organizerEmail}
                    onChange={(e) => setField("organizerEmail", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-bark-700 mb-2">
                  Poll Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POLL_TYPES.map((pt) => (
                    <button
                      key={pt.value}
                      onClick={() => setField("pollType", pt.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-semibold text-left transition-all duration-200 border ${
                        form.pollType === pt.value
                          ? "bg-forest-600 text-white border-forest-600 shadow-sm"
                          : "bg-white text-bark-700 border-bark-200 hover:border-forest-300"
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-bark-700 mb-1.5">
                  Deadline (optional)
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={form.deadline}
                  onChange={(e) => setField("deadline", e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canGoStep2}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next: Add Options →
          </button>
        </div>
      )}

      {/* ── STEP 2: Options ── */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-bark-800">Poll Options</h2>
              <button
                onClick={loadQuickOptions}
                className="text-xs text-forest-600 hover:text-forest-800 font-semibold bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                ✨ Quick fill
              </button>
            </div>

            <div className="space-y-3">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <input
                      className="input-field"
                      placeholder={`Option ${i + 1}`}
                      value={opt.label}
                      onChange={(e) => updateOption(i, "label", e.target.value)}
                    />
                    <select
                      className="input-field text-sm py-2"
                      value={opt.tag}
                      onChange={(e) => updateOption(i, "tag", e.target.value)}
                    >
                      {TAG_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="mt-2 w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addOption}
              className="mt-4 w-full py-2.5 border-2 border-dashed border-bark-200 hover:border-forest-400 text-bark-500 hover:text-forest-600 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              + Add Option
            </button>

            <p className="text-xs text-bark-400 mt-3">
              Minimum 2 options required · {options.filter((o) => o.label.trim()).length} valid
            </p>
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={options.filter((o) => o.label.trim()).length < 2}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next: Review →
          </button>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 3 && (
        <div className="space-y-4 animate-slide-up">
          <div className="card">
            <h2 className="font-display font-bold text-bark-800 mb-4">Review Your Poll</h2>

            <div className="space-y-3">
              <div className="bg-bark-50 rounded-xl p-4">
                <p className="text-xs text-bark-500 font-semibold uppercase tracking-wide mb-1">Title</p>
                <p className="font-display font-bold text-bark-900 text-lg">{form.title}</p>
                {form.description && (
                  <p className="text-bark-600 text-sm mt-1">{form.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-bark-50 rounded-xl p-3">
                  <p className="text-xs text-bark-500 font-semibold uppercase tracking-wide mb-1">Organizer</p>
                  <p className="text-bark-800 font-semibold text-sm">{form.organizerName}</p>
                  {form.organizerEmail && (
                    <p className="text-bark-500 text-xs">{form.organizerEmail}</p>
                  )}
                </div>
                <div className="bg-bark-50 rounded-xl p-3">
                  <p className="text-xs text-bark-500 font-semibold uppercase tracking-wide mb-1">Type / Deadline</p>
                  <p className="text-bark-800 font-semibold text-sm capitalize">{form.pollType}</p>
                  <p className="text-bark-500 text-xs">
                    {form.deadline
                      ? new Date(form.deadline).toLocaleString()
                      : "No deadline"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-bark-500 font-semibold uppercase tracking-wide mb-2">
                  Options ({options.filter((o) => o.label.trim()).length})
                </p>
                <div className="space-y-1.5">
                  {options
                    .filter((o) => o.label.trim())
                    .map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-bark-50 rounded-lg px-3 py-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-700 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="text-bark-800 font-medium text-sm flex-1">{opt.label}</span>
                        <span className="tag-pill bg-bark-200 text-bark-600 text-xs">{opt.tag}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-base py-4"
          >
            {loading ? "Creating Poll..." : "🚀 Create Poll"}
          </button>
        </div>
      )}
    </div>
  );
}