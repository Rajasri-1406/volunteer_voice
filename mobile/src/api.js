import axios from "axios";

const BASE_URL = "https://volunteer-voice.onrender.com/api";


const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

export const getAllPolls = async () => {
  const res = await api.get("/polls");
  return res.data;
};

export const getPollById = async (id) => {
  const res = await api.get(`/polls/${id}`);
  return res.data;
};

export const createPoll = async (pollData) => {
  const res = await api.post("/polls", pollData);
  return res.data;
};

export const submitVote = async (pollId, optionIndex, voterName) => {
  const res = await api.post(`/polls/${pollId}/vote`, { optionIndex, voterName });
  return res.data;
};

export const closePoll = async (pollId) => {
  const res = await api.patch(`/polls/${pollId}/close`);
  return res.data;
};

export const deletePoll = async (pollId) => {
  const res = await api.delete(`/polls/${pollId}`);
  return res.data;
};
