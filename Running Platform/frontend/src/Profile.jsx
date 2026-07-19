import React, { useState, useEffect } from "react";
import { getProfile, updateProfile } from "./api";
import { useToast } from "./Toast";

export default function Profile() {
  const [form, setForm] = useState({ bio: "", weightKg: "", heightCm: "", experienceLevel: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    getProfile()
      .then((data) => {
        const p = data.profile;
        setForm({
          bio: p.bio || "",
          weightKg: p.weight_kg ? String(p.weight_kg) : "",
          heightCm: p.height_cm ? String(p.height_cm) : "",
          experienceLevel: p.experience_level || "",
        });
      })
      .catch(() => addToast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      if (form.bio) payload.bio = form.bio;
      if (form.weightKg) payload.weightKg = parseFloat(form.weightKg);
      if (form.heightCm) payload.heightCm = parseInt(form.heightCm);
      if (form.experienceLevel) payload.experienceLevel = form.experienceLevel;
      await updateProfile(payload);
      addToast("Profile updated!");
    } catch {
      addToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-sm bg-white";

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Profile</h2>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={3}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Weight (kg)</label>
            <input
              type="number" step="0.1" placeholder="e.g. 70"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Height (cm)</label>
            <input
              type="number" placeholder="e.g. 175"
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Experience Level</label>
          <select
            value={form.experienceLevel}
            onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
            className={inputClass}
          >
            <option value="">Select...</option>
            <option value="beginner">🥇 Beginner</option>
            <option value="intermediate">🥈 Intermediate</option>
            <option value="advanced">🥉 Advanced</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
