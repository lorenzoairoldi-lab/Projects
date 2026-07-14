import axios from "axios";

const api = axios.create({ baseURL: "/" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        try {
          const { data } = await axios.post("/auth/refresh", { refreshToken: refresh });
          localStorage.setItem("token", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data;
}

export async function register(email, password, name) {
  const { data } = await api.post("/auth/register", { email, password, name });
  localStorage.setItem("token", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data;
}

export async function getWorkouts(page = 1, limit = 20) {
  const { data } = await api.get("/workouts", { params: { page, limit } });
  return data;
}

export async function createWorkout(workout) {
  const { data } = await api.post("/workouts", workout);
  return data;
}

export async function deleteWorkout(id) {
  await api.delete(`/workouts/${id}`);
}

export async function getWeeklyStats(weeks = 4) {
  const { data } = await api.get("/stats/weekly", { params: { weeks } });
  return data;
}

export async function getMonthlyStats(months = 3) {
  const { data } = await api.get("/stats/monthly", { params: { months } });
  return data;
}

export async function getPersonalBests() {
  const { data } = await api.get("/stats/personal-bests");
  return data;
}

export async function getProgress(metric = "distance", period = "monthly") {
  const { data } = await api.get("/stats/progress", { params: { metric, period } });
  return data;
}

export async function logout() {
  const refreshToken = localStorage.getItem("refreshToken");
  try { await api.post("/auth/logout", { refreshToken }); } catch {}
  localStorage.clear();
}
