const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ─── Generic fetch helper ──────────────────────────────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// ─── Polls API ─────────────────────────────────────────────────────────────

/** Fetch all polls */
export const getAllPolls = () => request("/polls");

/** Fetch polls by organizer email */
export const getPollsByOrganizer = (email) =>
  request(`/polls/organizer/${encodeURIComponent(email)}`);

/** Fetch single poll by ID */
export const getPollById = (id) => request(`/polls/${id}`);

/** Create a new poll */
export const createPoll = (pollData) =>
  request("/polls", {
    method: "POST",
    body: JSON.stringify(pollData),
  });

/** Submit a vote */
export const submitVote = (pollId, optionIndex, voterName) =>
  request(`/polls/${pollId}/vote`, {
    method: "POST",
    body: JSON.stringify({ optionIndex, voterName }),
  });

/** Close a poll */
export const closePoll = (pollId) =>
  request(`/polls/${pollId}/close`, { method: "PATCH" });

/** Delete a poll */
export const deletePoll = (pollId) =>
  request(`/polls/${pollId}`, { method: "DELETE" });