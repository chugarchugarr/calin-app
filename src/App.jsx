import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────

const SB_URL = "https://tieuutosriyosykcshdn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZXV1dG9zcml5b3N5a2NzaGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDU1MjQsImV4cCI6MjA4ODMyMTUyNH0.ixQ5dteC2coN_Lqonh1M0AmsLabYVYufVXo93F38hZU";
const supabase = createClient(SB_URL, SB_KEY);

// Silent fire-and-forget Supabase upsert — never blocks the UI
async function sbSync(table, payload) {
  try {
    await supabase.from(table).upsert(payload, { onConflict: "id" });
  } catch (e) {
    console.warn("[calib:sync]", table, e?.message);
  }
}

// ─────────────────────────────────────────
// PAYWALL CONFIG
// ─────────────────────────────────────────

const FREE_SESSION_LIMIT = 10;

// Replace with your real Stripe Payment Link URL.
// In the Payment Link settings, set:
//   - Success URL: https://calib-app-5r6n.vercel.app?upgraded=true
//   - Pass client_reference_id via URL param: append ?client_reference_id={CUSTOMER_ID}
//     (Stripe Payment Links support {CUSTOMER_ID} substitution for logged-in customers,
//      but for anonymous users we pass the Supabase user_id as a query param using the
//      Payment Link's "Allow customers to adjust quantity" → off, and Prefilled email.)
// Simplest approach: use the link directly; webhook matches by email.
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_cNi4gA92L0Pxbny3JkgjC03";

// Pro features summary for the modal
const PRO_FEATURES = [
  { icon: "◎", label: "Unlimited sessions", sub: "No cap — log every session, forever." },
  { icon: "◉", label: "Full insight engine", sub: "All 12 insight rules active and personalized." },
  { icon: "◈", label: "Pattern deep-dives", sub: "Reframes and read-backs for every pattern." },
  { icon: "≡", label: "Session export", sub: "Download your full session history as JSON." },
];

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────

const PATTERN_NAMES = {
  1: "Perfectionism as Procrastination", 2: "Addiction to Potential",
  3: "Comparison Paralysis", 4: "Waiting to Feel Ready",
  5: "Overidentifying with the Past", 6: "Fearing Success More Than Failure",
  7: "Emotional Self-Isolation", 8: "Romanticizing the Struggle",
  9: "Financial Martyrdom", 10: "Toxic Spiritual Bypassing",
  11: "Over-Researching, Under-Doing", 12: "Seeking Constant Validation",
  13: "Creating Only When Inspired", 14: "Creating from Wounds, Not Power",
  15: "Abandoning Projects Mid-Birth",
};
const PATTERN_SHORT = {
  1: "Perfectionism", 2: "Potential Trap", 3: "Comparison", 4: "Not Ready",
  5: "Living in the Past", 6: "Fearing Success", 7: "Self-Isolation",
  8: "Romanticizing", 9: "Financial Martyrdom", 10: "Spiritual Bypass",
  11: "Over-Research", 12: "Validation", 13: "Inspiration-Only",
  14: "Creating from Wounds", 15: "Abandonment",
};
const PATTERN_COLORS = {
  1: "#E8602C", 2: "#C84B2F", 3: "#B04020", 4: "#A63820",
  5: "#9A3218", 6: "#8B3018", 7: "#7C2A14", 8: "#6E2410",
  9: "#E8602C", 10: "#C84B2F", 11: "#A63820", 12: "#8B3018",
  13: "#C84B2F", 14: "#E8602C", 15: "#B04020",
};
const PATTERN_DESCRIPTIONS = {
  1: "You use perfectionism as a shield. If it's never finished, it can never fail. Your nervous system learned early that mistakes had real consequences — social, emotional, or both.",
  2: "You're in love with who you could become. The fantasy of the future self is more alive than the work in front of you. Beginnings feel electric; sustaining feels like dying.",
  3: "Other people's success reads as evidence of your inadequacy. Your brain runs constant comparison loops — measuring, ranking, reassessing.",
  4: "You're waiting for the conditions to be right. But 'ready' is a moving target your nervous system keeps pushing forward to avoid exposure.",
  5: "You've made your past the anchor of your identity. The old story protects you from having to write a new one.",
  6: "Success isn't just scary — it's threatening. Visibility means scrutiny. Some part of you isn't sure it can survive being fully seen.",
  7: "You've learned that needing people is weakness. So you close the door and carry everything alone. The isolation feels like focus. It's armor.",
  8: "You've romanticized the struggle so long it's become your identity. The suffering feels like proof you're serious. Staying in the wound isn't dedication — it's a loop.",
  9: "You treat financial sacrifice as creative virtue. Scarcity has become part of how you prove you're serious about the work.",
  10: "You use spiritual frameworks to avoid feeling difficult things. Detachment has become dissociation. Surrender has become escape.",
  11: "You use knowledge as a delay tactic. Every tutorial watched feels productive — but it's procrastination with a graduation robe on.",
  12: "You're creating for the response. The Artist makes work. The Orphan manufactures likability. When external feedback drives decisions, the work stops being yours.",
  13: "You only create when the feeling arrives. But inspiration is weather — unpredictable and unchosen. Waiting for it means the work is always at the mercy of your emotional state.",
  14: "Pain is your primary portal to creativity. But creating from wounds keeps you inside them. Power is what walks through — not what stays.",
  15: "You abandon projects at the threshold. Not because you don't care — because finishing means exposure. The incomplete project can't be judged.",
};
const PATTERN_REFRAMES = {
  1: "Done and imperfect is evidence of survival. Perfection is not a standard — it's a cage. The work doesn't need to be flawless. It needs to exist.",
  2: "The future self can't save you. Only the present action can. Fall in love with the doing, not the becoming.",
  3: "Someone else's success is not your failure. You're not in the same race. The only scoreboard that matters is the one between you and your last session.",
  6: "Being seen is the whole point. Success doesn't have to be safe to be real. What you built can hold the weight of being witnessed.",
  7: "Isolation isn't strength. Letting someone in doesn't compromise the work — it grounds the person doing it.",
  11: "You won't think your way into mastery. You'll move into it. Information isn't transformation — action is.",
  12: "Validation isn't the enemy. Dependence is. Create it first. Let the response come second. The order matters.",
  14: "Pain can open the portal. But power is what walks through it. You don't have to stay in the wound to make something real from it.",
  15: "Finishing is the most radical thing you can do. The project that's done and imperfect beats the perfect one that lives only in your head.",
};

const ALL_PRE_PROMPTS = [
  { id: "PRE-01", text: "What's the story you're telling yourself about this project right now?", tags: [1, 5, 8] },
  { id: "PRE-02", text: "Are you about to research or are you about to create?", tags: [11] },
  { id: "PRE-03", text: "Who are you making this for today — yourself or approval?", tags: [12] },
  { id: "PRE-04", text: "What would you do differently if no one would ever hear this?", tags: [6, 12] },
  { id: "PRE-05", text: "Are you waiting to feel ready, or are you ready enough?", tags: [4] },
  { id: "PRE-06", text: "What's the minimum you could finish today that would count as real?", tags: [15, 1] },
  { id: "PRE-07", text: "Is your excitement about what you could make, or what you are making?", tags: [2] },
  { id: "PRE-09", text: "Who came to make this today — the Artist or the Orphan?", tags: [12] },
  { id: "PRE-12", text: "Are you in your power right now, or creating from a wound?", tags: [14] },
];

const QUIZ_QUESTIONS = [
  { id: 1, text: "You finish a solid draft of something. Your first instinct is—", sub: "Be honest. What actually happens.",
    options: [
      { label: "It's not ready. I need to fix it before anyone hears it.", patterns: [1], weight: 3 },
      { label: "I'm already excited about the next idea.", patterns: [2, 15], weight: 3 },
      { label: "I wonder what people will think.", patterns: [12], weight: 3 },
      { label: "I feel exposed. What if it's not good enough?", patterns: [6, 1], weight: 3 },
    ]},
  { id: 2, text: "You haven't worked on your project in three days. What's the story?", sub: "Pick the one that hits closest.",
    options: [
      { label: "I'm waiting for the right energy or inspiration.", patterns: [13, 4], weight: 3 },
      { label: "I keep getting pulled into research and planning.", patterns: [11], weight: 3 },
      { label: "I'm scared to see where I left it.", patterns: [15, 1], weight: 3 },
      { label: "I've been comparing myself and it's messing with me.", patterns: [3], weight: 3 },
    ]},
  { id: 3, text: "When a project gets close to done, you typically—", sub: "Notice the pattern, not what you wish you did.",
    options: [
      { label: "Start a new project. The new one feels more alive.", patterns: [2, 15], weight: 3 },
      { label: "Slow down and find more things to fix.", patterns: [1, 15], weight: 3 },
      { label: "Push through, but with a lot of anxiety.", patterns: [6], weight: 2 },
      { label: "Finish it — but then avoid sharing it.", patterns: [6, 12], weight: 3 },
    ]},
  { id: 4, text: "Someone gives you critical feedback. Your gut reaction is—", sub: "Your first feeling before you reason through it.",
    options: [
      { label: "They're right. I knew it wasn't good enough.", patterns: [1, 12], weight: 3 },
      { label: "Maybe this just isn't my thing.", patterns: [5, 3], weight: 3 },
      { label: "I need to know if everyone else feels that way.", patterns: [12], weight: 3 },
      { label: "I want to disappear for a while.", patterns: [7], weight: 3 },
    ]},
  { id: 5, text: "When you're creating, where does most of your energy come from?", sub: "What actually fuels the sessions.",
    options: [
      { label: "Emotional pain or something I'm processing.", patterns: [14, 8], weight: 3 },
      { label: "Momentum — when I'm on a roll, I can't stop.", patterns: [13], weight: 2 },
      { label: "The fantasy of what this could become.", patterns: [2], weight: 3 },
      { label: "Discipline — I show up whether I feel it or not.", patterns: [], weight: 0 },
    ]},
  { id: 6, text: "You imagine yourself fully successful. Your honest reaction?", sub: "Go past the surface answer.",
    options: [
      { label: "Excited — I can see it clearly.", patterns: [2], weight: 2 },
      { label: "Anxious — I'm not sure I could handle it.", patterns: [6], weight: 3 },
      { label: "Doubtful — that version feels like someone else.", patterns: [5, 6], weight: 3 },
      { label: "Relieved — like it would finally prove something.", patterns: [12], weight: 3 },
    ]},
  { id: 7, text: "When you're blocked, what do you actually do?", sub: "Be real — not what you think you should do.",
    options: [
      { label: "Watch tutorials, read, or research the thing.", patterns: [11], weight: 3 },
      { label: "Wait until the feeling comes back.", patterns: [13, 4], weight: 3 },
      { label: "Isolate and try to power through alone.", patterns: [7], weight: 3 },
      { label: "Start something new and come back later.", patterns: [2, 15], weight: 3 },
    ]},
  { id: 8, text: "Be honest: what does making creative work cost you?", sub: "The real price you pay.",
    options: [
      { label: "Sleep, money, stability — I sacrifice a lot.", patterns: [9, 8], weight: 3 },
      { label: "Relationships — I isolate when I'm deep in it.", patterns: [7], weight: 3 },
      { label: "Peace of mind — I'm never satisfied.", patterns: [1, 14], weight: 3 },
      { label: "Confidence — every project makes me doubt myself.", patterns: [3, 12], weight: 3 },
    ]},
];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function computeProfile(answers) {
  const scores = {};
  answers.forEach(ans => {
    (ans.patterns || []).forEach(p => { scores[p] = (scores[p] || 0) + (ans.weight || 0); });
  });
  return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, score]) => ({
    id: parseInt(id), score: Math.min(99, score * 11),
    color: PATTERN_COLORS[parseInt(id)],
    name: PATTERN_NAMES[parseInt(id)],
    short: PATTERN_SHORT[parseInt(id)],
  }));
}

function getPersonalizedPrompts(profile) {
  const topIds = (profile || []).map(p => p.id);
  const weighted = ALL_PRE_PROMPTS.filter(p => p.tags.some(t => topIds.includes(t)));
  const rest = ALL_PRE_PROMPTS.filter(p => !weighted.includes(p));
  return [...weighted, ...rest].slice(0, 2);
}

// ─────────────────────────────────────────
// INSIGHT ENGINE — 12 trigger rules
// ─────────────────────────────────────────

const INSIGHT_RULES = [
  {
    id: "first-session",
    check: (sessions) => sessions.length === 1,
    build: (sessions) => ({
      type: "milestone", pattern: null,
      title: "First session logged.",
      message: "You showed up. That's the whole game. Most creatives never get past planning.",
      reframe: null,
    }),
  },
  {
    id: "streak-3",
    check: (sessions) => calcStreak(sessions) >= 3,
    build: (sessions) => ({
      type: "milestone", pattern: 13,
      title: `${calcStreak(sessions)}-session streak.`,
      message: "Discipline over inspiration. You're proving that Pattern 13 doesn't run you.",
      reframe: "Creating when you don't feel like it is the work. The feeling comes after, not before.",
    }),
  },
  {
    id: "streak-7",
    check: (sessions) => calcStreak(sessions) >= 7,
    build: (sessions) => ({
      type: "milestone", pattern: null,
      title: `${calcStreak(sessions)} days straight.`,
      message: "This is what it looks like when the patterns lose. You're building a new baseline.",
      reframe: null,
    }),
  },
  {
    id: "orphan-streak",
    check: (sessions) => {
      const last5 = sessions.slice(-5);
      return last5.length >= 4 && last5.filter(s => s.ao === "orphan").length >= 4;
    },
    build: (sessions) => ({
      type: "warning", pattern: 12,
      title: "Orphan mode — 4 of your last 5 sessions.",
      message: "You've been creating for approval, not from identity. The Orphan is running the sessions right now.",
      reframe: "Ask before your next session: who is this actually for? If the answer isn't you, that's the work to do first.",
    }),
  },
  {
    id: "pattern-repeat-3",
    check: (sessions) => {
      const last3 = sessions.slice(-3);
      if (last3.length < 3) return false;
      const counts = {};
      last3.forEach(s => (s.detectedPatterns || []).forEach(p => { counts[p] = (counts[p] || 0) + 1; }));
      return Object.values(counts).some(v => v >= 3);
    },
    build: (sessions) => {
      const counts = {};
      sessions.slice(-3).forEach(s => (s.detectedPatterns || []).forEach(p => { counts[p] = (counts[p] || 0) + 1; }));
      const topId = parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
      return {
        type: "warning", pattern: topId,
        title: `${PATTERN_SHORT[topId]} — 3 sessions in a row.`,
        message: `${PATTERN_NAMES[topId]} keeps showing up. This isn't a coincidence — it's a pattern trying to get your attention.`,
        reframe: PATTERN_REFRAMES[topId] || null,
      };
    },
  },
  {
    id: "abandonment-trigger",
    check: (sessions, _, projects) => {
      const stuckOrAbandoned = projects.filter(p => p.status === "abandoned" || (p.sessions >= 3 && p.phase === "almost done"));
      return stuckOrAbandoned.length >= 2;
    },
    build: (_, __, projects) => {
      const count = projects.filter(p => p.status === "abandoned" || (p.sessions >= 3 && p.phase === "almost done")).length;
      return {
        type: "warning", pattern: 15,
        title: `${count} projects stalled at the threshold.`,
        message: "This isn't a coincidence. Pattern 15 — Abandoning Projects Mid-Birth — is running. You stop when it gets real.",
        reframe: "The incomplete project can't be judged. That's the whole strategy. Finishing is the most radical thing you can do.",
      };
    },
  },
  {
    id: "low-energy-pattern",
    check: (sessions) => {
      const last4 = sessions.slice(-4);
      return last4.length >= 4 && last4.every(s => (s.energy || 3) <= 2);
    },
    build: () => ({
      type: "warning", pattern: 8,
      title: "Your energy has been consistently low going in.",
      message: "4 sessions in a row at energy 1–2. This could be Pattern 8 — Romanticizing the Struggle. Suffering as proof you're serious.",
      reframe: "You don't have to be depleted to make something real. Energy is not the enemy of depth.",
    }),
  },
  {
    id: "artist-streak",
    check: (sessions) => {
      const last5 = sessions.slice(-5);
      return last5.length >= 4 && last5.filter(s => s.ao === "artist").length >= 4;
    },
    build: () => ({
      type: "milestone", pattern: 12,
      title: "Artist mode — 4 of your last 5 sessions.",
      message: "You've been creating from identity, not for approval. This is what calibration looks like.",
      reframe: null,
    }),
  },
  {
    id: "stuck-repeat",
    check: (sessions) => {
      const last4 = sessions.slice(-4);
      return last4.length >= 3 && last4.filter(s => s.phase === "Stuck").length >= 3;
    },
    build: () => ({
      type: "warning", pattern: 4,
      title: "Stuck 3 sessions running.",
      message: "Naming yourself 'stuck' repeatedly might itself be the block. Pattern 4 — Waiting to Feel Ready — lives here.",
      reframe: "Ready is a feeling your nervous system will always delay. The session that breaks the stuck is the one you start anyway.",
    }),
  },
  {
    id: "first-completion",
    check: (_, __, projects) => projects.some(p => p.status === "completed"),
    build: (_, __, projects) => {
      const done = projects.find(p => p.status === "completed");
      return {
        type: "milestone", pattern: 15,
        title: "You finished something.",
        message: `"${done?.title}" — done. That's not small. Pattern 15 didn't win today.`,
        reframe: "Every completed project rewires the nervous system a little. Finishing is the proof.",
      };
    },
  },
  {
    id: "dormant",
    check: (sessions) => {
      if (sessions.length === 0) return false;
      const lastDate = new Date(sessions[sessions.length - 1].date);
      return (Date.now() - lastDate.getTime()) > 5 * 86400000;
    },
    build: (sessions) => {
      const daysSince = Math.floor((Date.now() - new Date(sessions[sessions.length - 1].date).getTime()) / 86400000);
      return {
        type: "warning", pattern: null,
        title: `${daysSince} days since your last session.`,
        message: "The gap isn't neutral. Every day away makes it easier to stay away. Notice what story you're in right now.",
        reframe: "The next session doesn't have to be good. It just has to happen.",
      };
    },
  },
  {
    id: "quiz-pattern-confirmed",
    check: (sessions, profile) => {
      if (sessions.length < 3 || !profile[0]) return false;
      const primaryId = profile[0].id;
      const confirmations = sessions.filter(s => (s.detectedPatterns || []).includes(primaryId)).length;
      return confirmations >= 3;
    },
    build: (sessions, profile) => {
      const primaryId = profile[0].id;
      const count = sessions.filter(s => (s.detectedPatterns || []).includes(primaryId)).length;
      return {
        type: "pattern", pattern: primaryId,
        title: `${PATTERN_SHORT[primaryId]} confirmed — ${count} sessions.`,
        message: `Your quiz identified ${PATTERN_NAMES[primaryId]} as your primary pattern. Your session data just confirmed it ${count} times.`,
        reframe: PATTERN_REFRAMES[primaryId] || null,
      };
    },
  },
];

function calcStreak(sessions) {
  if (!sessions.length) return 0;
  let streak = 0;
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date); d.setHours(0,0,0,0);
    const diff = Math.round((today - d) / 86400000);
    if (diff === streak || diff === streak + 1) { if (diff === streak + 1) streak++; else if (i === 0) streak = 1; }
    else break;
  }
  return streak;
}

function runInsightEngine(sessions, profile, projects, dismissedIds = []) {
  const fired = [];
  for (const rule of INSIGHT_RULES) {
    try {
      if (rule.check(sessions, profile, projects)) {
        const insight = rule.build(sessions, profile, projects);
        fired.push({
          ...insight,
          ruleId: rule.id,
          id: `${rule.id}-${sessions.length}-${projects.length}`,
          dismissed: dismissedIds.includes(rule.id),
          generatedAt: new Date().toISOString(),
        });
      }
    } catch {}
  }
  // If no rules fire, show a starter
  if (fired.length === 0 && sessions.length === 0) {
    fired.push({
      ruleId: "welcome", id: "welcome",
      type: "milestone", pattern: profile[0]?.id || null,
      title: "Your profile is set.",
      message: `${profile[0]?.name || "Your patterns"} — that's where we start. Every session will refine this.`,
      reframe: "Start your first session. The data builds from here.",
      dismissed: false,
      generatedAt: new Date().toISOString(),
    });
  }
  return fired;
}

// ─────────────────────────────────────────
// KEYWORD SCAN ENGINE
// ─────────────────────────────────────────

const KEYWORD_MAP = [
  // Pattern 1 — Perfectionism
  { patterns: [1], words: ["perfect", "not ready", "not good enough", "fix", "polish", "too rough", "needs work", "not there yet", "almost", "tweak", "improve", "better", "settle", "satisfied", "right", "flawed", "messy", "clean up", "refine"] },
  // Pattern 2 — Addiction to Potential
  { patterns: [2], words: ["could be", "potential", "imagine", "someday", "vision", "dream", "plan", "idea", "concept", "new project", "excited about", "next one", "thinking about", "what if"] },
  // Pattern 3 — Comparison
  { patterns: [3], words: ["compare", "other", "they", "them", "his track", "her music", "everyone else", "ahead", "behind", "better than me", "worse than", "jealous", "envious", "their", "successful", "blowing up"] },
  // Pattern 4 — Waiting to be Ready
  { patterns: [4], words: ["not ready", "wait", "when i", "someday", "once i", "after i", "need to learn", "need more", "not enough", "eventually", "later", "soon", "almost ready", "preparing"] },
  // Pattern 6 — Fearing Success
  { patterns: [6], words: ["afraid", "scared", "terrified", "what if it works", "what if people", "visibility", "exposed", "seen", "attention", "pressure", "expectations", "handle it", "too much", "overwhelm"] },
  // Pattern 7 — Self-Isolation
  { patterns: [7], words: ["alone", "by myself", "no one", "isolated", "shut out", "closed off", "don't need", "independent", "solo", "withdraw", "hiding", "disappear", "nobody understands"] },
  // Pattern 8 — Romanticizing Struggle
  { patterns: [8], words: ["struggle", "suffering", "pain", "sacrifice", "grind", "hustle", "worth it", "no sleep", "exhausted", "real art", "authentic", "earned", "deserve", "bled", "sweat"] },
  // Pattern 11 — Over-Research
  { patterns: [11], words: ["research", "tutorial", "watched", "read", "learn first", "study", "course", "not ready yet", "need to know", "plugin", "gear", "equipment", "technique", "more information"] },
  // Pattern 12 — Validation
  { patterns: [12], words: ["what will", "people think", "approval", "feedback", "response", "reaction", "like", "views", "streams", "comments", "followers", "posting", "share", "release", "audience", "fans", "reception", "judge"] },
  // Pattern 13 — Inspiration-Only
  { patterns: [13], words: ["not feeling it", "no inspiration", "unmotivated", "don't feel like", "not in the mood", "wait for", "when it hits", "spark", "flow", "vibe", "feeling off", "no energy", "blocked", "dry"] },
  // Pattern 14 — Creating from Wounds
  { patterns: [14], words: ["pain", "hurt", "trauma", "wound", "dark place", "depression", "anger", "rage", "grief", "processing", "healing", "broken", "loss", "raw", "bleeding", "vulnerable", "emotional"] },
  // Pattern 15 — Abandonment
  { patterns: [15], words: ["give up", "abandon", "quit", "move on", "new idea", "lost interest", "bored", "can't finish", "never finish", "half done", "incomplete", "stuck on", "stopped", "put it down", "set aside", "pause"] },
];

function scanKeywords(text) {
  if (!text || typeof text !== "string") return [];
  const lower = text.toLowerCase();
  const detected = new Set();
  for (const entry of KEYWORD_MAP) {
    for (const word of entry.words) {
      if (lower.includes(word)) {
        entry.patterns.forEach(p => detected.add(p));
        break; // one match per entry is enough
      }
    }
  }
  return Array.from(detected);
}

function scanAllAnswers(answers) {
  if (!answers || typeof answers !== "object") return [];
  const allText = Object.values(answers).filter(Boolean).join(" ");
  return scanKeywords(allText);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────

function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("save failed", e); }
}

function loadData(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
}

// ─────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────

function trackEvent(name, params) {
  try { if (window.gtag) window.gtag('event', name, params); } catch {}
}

// ─────────────────────────────────────────
// POST-SESSION REFLECTION GENERATOR
// ─────────────────────────────────────────

// One-sentence read-backs keyed to specific conditions.
// Priority order: keyword patterns first, then structural, then neutral.
const REFLECTION_READS = {
  // Keyword-detected, high specificity
  12: [
    "Your writing mentioned approval and audience. The Orphan was present today — notice when the work starts performing instead of creating.",
    "You referenced how others will respond. That's Pattern 12 language. The Artist doesn't check the crowd before the work is done.",
  ],
  1: [
    "Your responses used language around fixing, polish, and 'not there yet.' Perfectionism showed up in the text — not just in the phase.",
    "You wrote about the work not being ready. That's Pattern 1 running. The question is whether it's honest or it's a delay.",
  ],
  15: [
    "You mentioned moving on or new ideas. Pattern 15 — abandonment — is in the language today. Watch the threshold.",
    "Your writing touched on starting over or losing interest. That's worth sitting with before you open a new project.",
  ],
  11: [
    "Research and learning language came through in your responses. Are you creating today or preparing to create?",
    "Tutorial and technique language in your writing. Pattern 11 often sounds like preparation. Make sure you're making something.",
  ],
  14: [
    "Your responses carried pain language. Creating from wounds is real — just make sure the wound is the door, not the room.",
    "Emotional weight came through in what you wrote. You can make from that place. Just don't stay there after the session ends.",
  ],
  13: [
    "You described waiting for inspiration or not feeling it. Pattern 13 is in the language. Discipline is what you do with that feeling, not instead of it.",
  ],
  6: [
    "Fear language came through — exposure, being seen, what happens if it works. That's Pattern 6. The work can hold being witnessed.",
  ],
  3: [
    "Comparison language in your responses. Someone else's position isn't data about yours.",
  ],
  7: [
    "Isolation language in your writing. Closing the door is sometimes focus. Sometimes it's armor.",
  ],
  8: [
    "Struggle and sacrifice came through. Make sure the suffering is incidental to the work, not the point of it.",
  ],
  2: [
    "Future and potential language in your responses. The vision is alive — make sure the present work is too.",
  ],
  4: [
    "Readiness language in your writing. 'When I'm ready' is Pattern 4. You're already here.",
  ],
};

// Positive reads — for Artist + high energy
const POSITIVE_READS = [
  "Artist mode, energy strong. This is what calibrated looks like. Make the most of it.",
  "You showed up as the Artist today. That ratio matters over time — keep logging.",
  "High energy, Artist mode. The conditions are right. Don't waste them planning.",
];

// Neutral reads — fallback when no strong signals
const NEUTRAL_READS = [
  "Session logged. The data is building. Keep showing up.",
  "Another session in the record. The pattern profile sharpens with every one.",
  "Logged. Calib is watching the accumulation, not the individual session.",
];

function generateReflection(ao, energy, keywordPatterns, structuralPatterns, phase) {
  // Positive path — Artist + high energy, no concerning keywords
  if (ao === "artist" && energy >= 4 && keywordPatterns.length === 0) {
    return POSITIVE_READS[Math.floor(Math.random() * POSITIVE_READS.length)];
  }

  // Find the most specific keyword pattern that has a read
  const kwWithReads = keywordPatterns.filter(p => REFLECTION_READS[p]);
  if (kwWithReads.length > 0) {
    const reads = REFLECTION_READS[kwWithReads[0]];
    return reads[Math.floor(Math.random() * reads.length)];
  }

  // Structural fallbacks
  if (ao === "orphan" && REFLECTION_READS[12]) {
    return REFLECTION_READS[12][0];
  }
  if (phase === "Stuck") {
    return "You named yourself stuck. That honesty is useful — now make sure naming it isn't where the session ends.";
  }
  if (energy <= 2) {
    return "Low energy going in. Note whether that changes once you actually start. The session data will show the pattern over time.";
  }

  return NEUTRAL_READS[Math.floor(Math.random() * NEUTRAL_READS.length)];
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────

const CSS = `
  *{margin:0;padding:0;box-sizing:border-box;}
  :root{
    --bg:#0C0A08;--surface:#141210;--surface2:#1C1916;--border:#2A2520;
    --accent:#E8602C;--accent-dim:#8B3018;--text:#F0EAE0;
    --text-dim:#6A6050;--text-mid:#B0A898;--warn:#C84B2F;--good:#5E8B60;
  }
  .wrap{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;max-width:420px;margin:0 auto;position:relative;}
  .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
  @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  /* LOADING */
  .loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:16px;}
  .loading-logo{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;letter-spacing:-2px;}
  .loading-logo span{color:var(--accent);}
  .loading-dot{width:6px;height:6px;background:var(--accent);border-radius:50%;animation:pulse 1.2s ease infinite;}

  /* ONBOARDING */
  .ob-welcome{display:flex;flex-direction:column;justify-content:space-between;min-height:100vh;}
  .ob-top{padding:60px 32px 0;animation:rise .8s cubic-bezier(.4,0,.2,1) both;}
  .ob-logo{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;letter-spacing:-2px;line-height:1;margin-bottom:6px;}
  .ob-logo span{color:var(--accent);}
  .ob-tagline{font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--text-dim);margin-bottom:48px;}
  .ob-statement{font-family:'Playfair Display',serif;font-size:22px;font-style:italic;line-height:1.5;color:var(--text);}
  .ob-bottom{padding:32px;animation:rise .8s .2s cubic-bezier(.4,0,.2,1) both;}
  .accent-line{height:1px;background:linear-gradient(90deg,var(--accent) 0%,transparent 100%);width:60px;margin-bottom:24px;}
  .ob-note{font-size:12px;color:var(--text-dim);line-height:1.7;margin-bottom:32px;}
  .ob-name{padding:60px 32px 40px;display:flex;flex-direction:column;min-height:100vh;animation:rise .5s cubic-bezier(.4,0,.2,1) both;}
  .ob-name-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;line-height:1.3;margin-bottom:8px;}
  .ob-name-sub{font-size:13px;color:var(--text-dim);margin-bottom:40px;line-height:1.6;}
  .field-label{font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--text-dim);margin-bottom:10px;}
  .text-input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--accent-dim);color:var(--text);font-family:'Playfair Display',serif;font-size:22px;font-style:italic;padding:10px 0;outline:none;margin-bottom:32px;transition:border-color .15s;}
  .text-input:focus{border-bottom-color:var(--accent);}
  .type-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:40px;}
  .type-chip{padding:12px;background:var(--surface);border:1px solid var(--border);font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);text-align:center;cursor:pointer;transition:all .15s;}
  .type-chip:hover{border-color:var(--accent-dim);color:var(--text-mid);}
  .type-chip.sel{border-color:var(--accent);color:var(--accent);background:var(--surface2);}
  .ob-quiz{min-height:100vh;display:flex;flex-direction:column;}
  .quiz-prog{display:flex;gap:4px;padding:20px 24px 0;}
  .qseg{flex:1;height:2px;background:var(--border);transition:background .3s;}
  .qseg.done{background:var(--accent);}
  .qseg.active{background:var(--accent-dim);}
  .quiz-meta{padding:12px 24px 0;display:flex;justify-content:space-between;}
  .quiz-ct{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);}
  .quiz-body{padding:32px 24px 24px;flex:1;}
  .quiz-q{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;line-height:1.35;margin-bottom:10px;animation:rise .35s cubic-bezier(.4,0,.2,1) both;}
  .quiz-sub{font-size:12px;color:var(--text-dim);font-style:italic;margin-bottom:28px;animation:rise .35s .05s cubic-bezier(.4,0,.2,1) both;}
  .q-option{padding:16px 18px;background:var(--surface);border:1px solid var(--border);margin-bottom:10px;cursor:pointer;transition:all .15s;font-size:13px;color:var(--text-mid);line-height:1.5;display:flex;align-items:center;justify-content:space-between;gap:12px;animation:rise .35s cubic-bezier(.4,0,.2,1) both;}
  .q-option:nth-child(1){animation-delay:.08s}.q-option:nth-child(2){animation-delay:.12s}.q-option:nth-child(3){animation-delay:.16s}.q-option:nth-child(4){animation-delay:.20s}
  .q-option:hover{border-color:var(--accent-dim);color:var(--text);}
  .q-option.sel{border-color:var(--accent);background:var(--surface2);color:var(--text);}
  .q-arrow{color:var(--text-dim);font-size:12px;flex-shrink:0;transition:color .15s;}
  .q-option.sel .q-arrow{color:var(--accent);}
  .ob-result{min-height:100vh;display:flex;flex-direction:column;}
  .result-hdr{padding:48px 32px 28px;animation:rise .6s cubic-bezier(.4,0,.2,1) both;}
  .result-eyebrow{font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.15em;color:var(--accent);margin-bottom:14px;}
  .result-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;line-height:1.25;margin-bottom:12px;}
  .result-sub{font-size:13px;color:var(--text-dim);line-height:1.7;}
  .result-sub strong{color:var(--text-mid);}
  .p-cards{padding:0 24px;}
  .p-card{margin-bottom:12px;background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);animation:rise .5s cubic-bezier(.4,0,.2,1) both;}
  .p-card-top{padding:16px 18px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  .p-card-num{font-family:'DM Mono',monospace;font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
  .p-card-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--text);}
  .p-card-score{font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:var(--accent);flex-shrink:0;}
  .p-card-desc{padding:12px 18px 16px;font-size:12px;color:var(--text-dim);line-height:1.7;border-top:1px solid var(--border);}
  .primary-badge{font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;background:var(--accent);color:#fff;align-self:flex-start;flex-shrink:0;}
  .result-footer{padding:24px 32px 48px;animation:rise .5s .9s cubic-bezier(.4,0,.2,1) both;}
  .result-footer-note{font-size:12px;color:var(--text-dim);line-height:1.7;margin-bottom:20px;}

  /* BUTTON */
  .btn-primary{width:100%;background:var(--accent);color:#fff;border:none;padding:18px 24px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .15s;}
  .btn-primary:hover{background:#F07040;}
  .btn-primary:disabled{background:var(--surface2);color:var(--text-dim);cursor:default;}

  /* APP SHELL */
  .app-header{padding:18px 24px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:10;}
  .app-logo{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;letter-spacing:-.5px;}
  .app-logo span{color:var(--accent);}
  .app-header-right{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);text-align:right;line-height:1.6;}
  .app-content{padding:0 0 100px;overflow-y:auto;height:calc(100vh - 57px);}
  .section{padding:24px 24px 0;}
  .section-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:14px;}
  .divider{height:1px;background:var(--border);margin:24px 24px 0;}

  /* DASHBOARD */
  .start-btn{margin:24px 24px 0;width:calc(100% - 48px);background:var(--accent);color:#fff;border:none;padding:18px 24px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:background .15s;}
  .start-btn:hover{background:#F07040;}
  .start-btn-sub{font-family:'DM Mono',monospace;font-size:10px;opacity:.7;}
  .insight{margin-bottom:10px;padding:14px 16px;background:var(--surface);border-left:3px solid var(--border);cursor:pointer;transition:all .15s;}
  .insight.warning{border-left-color:var(--warn);}
  .insight.milestone{border-left-color:var(--good);}
  .insight.pattern{border-left-color:var(--accent-dim);}
  .insight-meta{font-family:'DM Mono',monospace;font-size:9px;color:var(--text-dim);margin-bottom:6px;text-transform:uppercase;letter-spacing:.08em;}
  .insight-text{font-size:13px;color:var(--text-mid);line-height:1.5;}
  .project-card{background:var(--surface);border:1px solid var(--border);padding:16px;margin-bottom:10px;cursor:pointer;transition:all .15s;}
  .project-card:hover{border-color:var(--accent-dim);}
  .project-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;}
  .project-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;font-style:italic;color:var(--text);line-height:1.3;}
  .project-type{font-family:'DM Mono',monospace;font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;border:1px solid var(--border);}
  .project-stats{display:flex;gap:16px;}
  .proj-stat{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);}
  .proj-stat strong{color:var(--text-mid);font-weight:500;}
  .streak-dot{display:inline-block;width:6px;height:6px;background:var(--accent);border-radius:50%;margin-right:4px;vertical-align:middle;}
  .phase-tag{display:inline-block;font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;padding:2px 8px;background:var(--surface2);color:var(--text-dim);margin-top:8px;}
  .add-project-btn{margin:0 24px 24px;padding:14px;background:transparent;border:1px dashed var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;width:calc(100% - 48px);transition:all .15s;text-align:center;}
  .add-project-btn:hover{border-color:var(--accent-dim);color:var(--text-mid);}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;display:flex;align-items:flex-end;justify-content:center;}
  .modal{background:var(--surface);border:1px solid var(--border);border-bottom:none;padding:28px 24px;width:100%;max-width:420px;animation:rise .3s cubic-bezier(.4,0,.2,1) both;}
  .modal-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:20px;}
  .modal-input{width:100%;background:var(--surface2);border:none;border-bottom:1px solid var(--accent-dim);color:var(--text);font-family:'Playfair Display',serif;font-size:18px;font-style:italic;padding:10px 0;outline:none;margin-bottom:20px;}
  .modal-input:focus{border-bottom-color:var(--accent);}
  .modal-type-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px;}
  .modal-type{padding:10px 8px;background:var(--bg);border:1px solid var(--border);font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);text-align:center;cursor:pointer;transition:all .15s;}
  .modal-type.sel{border-color:var(--accent);color:var(--accent);background:var(--surface2);}
  .modal-btns{display:flex;gap:10px;}
  .modal-cancel{flex:1;padding:14px;background:transparent;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;}

  /* CHECK-IN */
  .checkin-hdr{padding:32px 24px 20px;}
  .checkin-step-label{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;}
  .checkin-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;line-height:1.2;margin-bottom:8px;}
  .checkin-sub{font-size:13px;color:var(--text-dim);line-height:1.5;}
  .prog-bar{height:2px;background:var(--border);margin:0 24px;}
  .prog-fill{height:100%;background:var(--accent);transition:width .3s ease;}
  .phase-option{padding:16px;background:var(--surface);border:1px solid var(--border);margin-bottom:10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-size:14px;color:var(--text-mid);transition:all .15s;}
  .phase-option:hover{border-color:var(--accent);color:var(--text);}
  .ao-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 24px;}
  .ao-item{padding:16px;background:var(--surface);border:1px solid var(--border);cursor:pointer;transition:all .15s;text-align:center;}
  .ao-item:hover,.ao-item.sel{border-color:var(--accent);background:var(--surface2);}
  .ao-icon{font-size:22px;margin-bottom:8px;}
  .ao-label{font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-mid);}
  .ao-item.sel .ao-label{color:var(--accent);}
  .energy-row{display:flex;gap:10px;justify-content:center;margin:20px 24px;}
  .energy-dot{width:36px;height:36px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:12px;color:var(--text-dim);cursor:pointer;transition:all .15s;}
  .energy-dot.sel{background:var(--accent);border-color:var(--accent);color:#fff;}
  .prompt-card{margin:20px 24px;padding:24px;background:var(--surface);border:1px solid var(--border);}
  .prompt-id{font-family:'DM Mono',monospace;font-size:9px;color:var(--text-dim);margin-bottom:12px;text-transform:uppercase;letter-spacing:.1em;}
  .prompt-text{font-family:'Playfair Display',serif;font-size:18px;font-weight:400;font-style:italic;line-height:1.5;color:var(--text);margin-bottom:20px;}
  .prompt-ta{width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;padding:12px;resize:none;outline:none;height:80px;line-height:1.6;}
  .prompt-ta:focus{border-color:var(--accent-dim);}
  .prompt-ta::placeholder{color:var(--text-dim);}
  .next-btn{margin:16px 24px;width:calc(100% - 48px);background:var(--accent);color:#fff;border:none;padding:16px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:background .15s;}
  .next-btn:hover{background:#F07040;}
  .project-select-list{padding:0 24px;}
  .project-select-item{padding:14px 16px;background:var(--surface);border:1px solid var(--border);margin-bottom:8px;cursor:pointer;transition:all .15s;font-size:14px;color:var(--text-mid);display:flex;align-items:center;justify-content:space-between;}
  .project-select-item:hover,.project-select-item.sel{border-color:var(--accent);color:var(--text);}
  .session-history{padding:0 24px;}
  .session-row{padding:14px 0;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  .session-row-left{flex:1;}
  .session-date{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);margin-bottom:4px;}
  .session-project{font-size:13px;color:var(--text-mid);font-style:italic;margin-bottom:4px;}
  .session-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;}
  .session-tag{font-family:'DM Mono',monospace;font-size:9px;padding:2px 6px;background:var(--surface2);color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;}
  .session-ao{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);}

  /* PROFILE */
  .stats-grid{padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;}
  .stat-box{background:var(--surface);border:1px solid var(--border);padding:16px;}
  .stat-val{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:var(--text);line-height:1;margin-bottom:6px;}
  .stat-val.hi{color:var(--accent);}
  .stat-lbl{font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);}
  .pattern-row{margin-bottom:14px;cursor:pointer;transition:all .15s;}
  .pattern-row-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;}
  .pattern-name{font-size:13px;color:var(--text-mid);}
  .pattern-score{font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);}
  .pattern-bar-bg{height:4px;background:var(--surface2);}
  .pattern-bar-fill{height:100%;transition:width .6s cubic-bezier(.4,0,.2,1);}

  /* LIBRARY */
  .lib-item{padding:18px 24px;border-bottom:1px solid var(--border);cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:space-between;gap:16px;}
  .lib-item:hover{background:var(--surface);}
  .lib-num{font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);min-width:24px;}
  .lib-name{font-size:13px;color:var(--text-mid);flex:1;line-height:1.4;}
  .lib-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .pattern-detail{padding:24px;animation:rise .2s ease;}
  .back-btn{font-family:'DM Mono',monospace;font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;background:none;border:none;cursor:pointer;padding:0 0 24px;display:flex;align-items:center;gap:8px;}
  .detail-num{font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;}
  .detail-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;line-height:1.2;margin-bottom:20px;}
  .detail-section{font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--accent);margin-bottom:8px;margin-top:20px;}
  .detail-text{font-size:13px;color:var(--text-mid);line-height:1.7;}
  .detail-data{padding:16px;background:var(--surface);border:1px solid var(--border);font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);line-height:2;}

  /* NAV */
  .app-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:420px;background:var(--bg);border-top:1px solid var(--border);display:flex;padding:12px 0 20px;z-index:20;}
  .nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 0;}
  .nav-icon{font-size:18px;opacity:.35;transition:opacity .15s;}
  .nav-item.active .nav-icon{opacity:1;}
  .nav-label{font-family:'DM Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);}
  .nav-item.active .nav-label{color:var(--accent);}
  .reset-btn{margin:32px 24px 0;padding:14px;background:transparent;border:1px solid var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;width:calc(100% - 48px);transition:all .15s;text-align:center;}
  .reset-btn:hover{border-color:var(--warn);color:var(--warn);}
`;

// ─────────────────────────────────────────
// UPGRADE MODAL
// ─────────────────────────────────────────

function UpgradeModal({ onClose, sessionCount, authUser, upgradeSuccess }) {
  const handleUpgrade = () => {
    // Build the payment link URL.
    // We pass the user's email as prefill so Stripe can match the customer.
    let url = STRIPE_PAYMENT_LINK;
    if (authUser?.email) {
      url += `?prefilled_email=${encodeURIComponent(authUser.email)}`;
    }
    window.location.href = url;
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
      zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#141210", border: "1px solid #2A2520", borderBottom: "none",
        padding: "32px 28px 48px",
        fontFamily: "'DM Sans',sans-serif",
        animation: "rise .35s cubic-bezier(.4,0,.2,1) both",
      }}>
        {/* Close */}
        {onClose && !upgradeSuccess && (
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 20,
            background: "none", border: "none", color: "rgba(255,255,255,0.3)",
            fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0,
          }}>×</button>
        )}

        {upgradeSuccess ? (
          /* ── Success state ── */
          <>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".15em", color: "#5E8B60", marginBottom: 16 }}>
              ◉ Upgrade complete
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, lineHeight: 1.2, marginBottom: 12 }}>
              You're in.
            </div>
            <div style={{ fontSize: 13, color: "rgba(240,237,232,0.55)", lineHeight: 1.7, marginBottom: 28 }}>
              Unlimited sessions, full insights, complete pattern tracking. This is what calibrated looks like.
            </div>
            <button onClick={onClose} style={{
              width: "100%", background: "#E8602C", border: "none",
              padding: "16px 24px", color: "#fff",
              fontFamily: "'DM Mono',monospace", fontSize: 11,
              letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer",
            }}>
              Start a Session →
            </button>
          </>
        ) : (
          /* ── Gate state ── */
          <>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".15em", color: "#E8602C", marginBottom: 16 }}>
              {sessionCount >= FREE_SESSION_LIMIT ? `${FREE_SESSION_LIMIT} free sessions used` : "calib pro"}
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>
              {sessionCount >= FREE_SESSION_LIMIT
                ? "You've hit the free limit."
                : "Unlock the full system."}
            </div>
            <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", lineHeight: 1.7, marginBottom: 24 }}>
              {sessionCount >= FREE_SESSION_LIMIT
                ? `${FREE_SESSION_LIMIT} sessions of data collected. The pattern is forming. Keep going.`
                : "Everything you need to stop self-sabotaging your creative work."}
            </div>

            {/* Feature list */}
            <div style={{ marginBottom: 28 }}>
              {PRO_FEATURES.map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: "#E8602C", flexShrink: 0, marginTop: 1 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EAE0", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(240,237,232,0.4)", lineHeight: 1.5 }}>{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price */}
            <div style={{ padding: "14px 18px", background: "#1C1916", border: "1px solid rgba(232,96,44,0.2)", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#F0EAE0" }}>$9</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(240,237,232,0.4)", textTransform: "uppercase", letterSpacing: ".08em" }}>/ month</span>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(240,237,232,0.35)", marginTop: 4 }}>
                Cancel anytime. No contracts.
              </div>
            </div>

            {!authUser && (
              <div style={{ padding: "10px 14px", background: "rgba(232,96,44,0.08)", border: "1px solid rgba(232,96,44,0.15)", marginBottom: 16, fontSize: 11, color: "rgba(240,237,232,0.5)", lineHeight: 1.6 }}>
                ⚠ Save your email first (below) so your pro status syncs to your account after payment.
              </div>
            )}

            <button onClick={handleUpgrade} style={{
              width: "100%", background: "#E8602C", border: "none",
              padding: "18px 24px", color: "#fff",
              fontFamily: "'DM Mono',monospace", fontSize: 11,
              letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>Upgrade to Pro</span>
              <span>$9/mo →</span>
            </button>
            <div style={{ textAlign: "center", marginTop: 12, fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(240,237,232,0.25)", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Stripe-secured · Cancel anytime
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────

function Onboarding({ onComplete }) {
  const [ob, setOb] = useState("welcome");
  const [name, setName] = useState("");
  const [creativeType, setCreativeType] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (ob === "result" && profile) {
      const t = setInterval(() => setRevealed(r => { if (r >= profile.length) { clearInterval(t); return r; } return r + 1; }), 420);
      return () => clearInterval(t);
    }
  }, [ob, profile]);

  const pickAnswer = (opt) => {
    if (transitioning) return;
    setSelected(opt);
    setTransitioning(true);
    setTimeout(() => {
      const next = [...quizAnswers, opt];
      if (qIdx + 1 < QUIZ_QUESTIONS.length) {
        setQuizAnswers(next); setQIdx(q => q + 1); setSelected(null); setTransitioning(false);
      } else {
        setProfile(computeProfile(next)); setOb("result"); setTransitioning(false);
      }
    }, 300);
  };

  return (
    <div className="wrap">
      {ob === "welcome" && (
        <div className="ob-welcome">
          <div className="ob-top">
            <div className="ob-logo">calib<span>.</span></div>
            <div className="ob-tagline">Creative Self-Coaching</div>
            <div className="ob-statement">"This app doesn't help you make more music.<br />It helps you understand why you stop."</div>
          </div>
          <div className="ob-bottom">
            <div className="accent-line" />
            <div className="ob-note">You're about to take an 8-question pattern discovery quiz. No right answers — only honest ones. Your results map to the self-sabotage patterns most active in your creative life right now.</div>
            <button className="btn-primary" onClick={() => setOb("name")}><span>Start Discovery</span><span>→</span></button>
          </div>
        </div>
      )}

      {ob === "name" && (
        <div className="ob-name">
          <div style={{ flex: 1 }}>
            <div className="ob-name-title">Let's calibrate<br />to you.</div>
            <div className="ob-name-sub">A few things before we begin.</div>
            <div className="field-label">What do you go by?</div>
            <input className="text-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <div className="field-label">What do you make?</div>
            <div className="type-grid">
              {["Music", "Beats / Production", "Visual Art", "Film / Video", "Writing", "Other"].map(t => (
                <div key={t} className={`type-chip ${creativeType === t ? "sel" : ""}`} onClick={() => setCreativeType(t)}>{t}</div>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={() => setOb("quiz")} disabled={!name.trim() || !creativeType}><span>Enter the Quiz</span><span>→</span></button>
        </div>
      )}

      {ob === "quiz" && (
        <div className="ob-quiz">
          <div className="quiz-prog">{QUIZ_QUESTIONS.map((_, i) => <div key={i} className={`qseg ${i < qIdx ? "done" : i === qIdx ? "active" : ""}`} />)}</div>
          <div className="quiz-meta"><div className="quiz-ct">{qIdx + 1} / {QUIZ_QUESTIONS.length}</div><div className="quiz-ct">{name}</div></div>
          <div className="quiz-body" key={qIdx}>
            <div className="quiz-q">{QUIZ_QUESTIONS[qIdx].text}</div>
            <div className="quiz-sub">{QUIZ_QUESTIONS[qIdx].sub}</div>
            {QUIZ_QUESTIONS[qIdx].options.map((opt, i) => (
              <div key={i} className={`q-option ${selected === opt ? "sel" : ""}`} onClick={() => pickAnswer(opt)}>
                <span>{opt.label}</span><span className="q-arrow">→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ob === "result" && profile && (
        <div className="ob-result">
          <div className="result-hdr">
            <div className="result-eyebrow">Your Starting Profile</div>
            <div className="result-title">Here's what's running in the background, {name}.</div>
            <div className="result-sub">These aren't flaws — they're <strong>wiring</strong>. Understanding them is the first calibration.</div>
          </div>
          <div className="p-cards">
            {profile.slice(0, revealed).map((p, i) => (
              <div className="p-card" key={p.id} style={{ borderLeftColor: p.color, animationDelay: `${i * 0.1}s` }}>
                <div className="p-card-top">
                  <div><div className="p-card-num">Pattern {String(p.id).padStart(2, "0")}</div><div className="p-card-name">{p.name}</div></div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {i === 0 && <div className="primary-badge">Primary</div>}
                    <div className="p-card-score">{p.score}%</div>
                  </div>
                </div>
                {PATTERN_DESCRIPTIONS[p.id] && <div className="p-card-desc">{PATTERN_DESCRIPTIONS[p.id]}</div>}
              </div>
            ))}
          </div>
          {revealed >= profile.length && (
            <div className="result-footer">
              <div className="result-footer-note">Calib will use this profile to personalize your prompts, weight your dashboard, and surface insights as you work. It updates with every session.</div>
              <button className="btn-primary" onClick={() => onComplete({ name, creativeType, profile })}><span>Enter Calib</span><span>→</span></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

function MainApp({ user, sessions, projects, onSaveSession, onSaveProject, onReset, dismissedInsights, onDismissInsight, isPro, authUser, onUpgradeClick }) {
  const [screen, setScreen] = useState("dashboard");
  const [checkinStep, setCheckinStep] = useState(0);
  const [checkinAnswers, setCheckinAnswers] = useState({});
  const [ao, setAo] = useState(null);
  const [energy, setEnergy] = useState(3);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activePattern, setActivePattern] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectType, setNewProjectType] = useState("");
  const [activeProject, setActiveProject] = useState(null); // project detail view
  const [showCard, setShowCard] = useState(false);
  const [sessionReflection, setSessionReflection] = useState(null);
  const [showProjectActions, setShowProjectActions] = useState(null); // project id with open actions

  const sessionPrompts = getPersonalizedPrompts(user.profile);
  const allInsights = runInsightEngine(sessions, user.profile, projects, dismissedInsights);
  const activeInsights = allInsights.filter(i => !i.dismissed);
  const newInsightCount = activeInsights.length;

  const checkinSteps = [
    { type: "project" },
    { type: "phase" },
    { type: "ao" },
    { type: "energy" },
    { type: "prompt", prompt: sessionPrompts[0] },
    { type: "prompt", prompt: sessionPrompts[1] },
    { type: "done" },
  ];
  const progress = (checkinStep / (checkinSteps.length - 1)) * 100;
  const currentStep = checkinSteps[checkinStep];

  const finishSession = () => {
    // Structural signals
    const structuralPatterns = [];
    if (ao === "orphan") structuralPatterns.push(12);
    if (selectedPhase === "Stuck") structuralPatterns.push(1, 4);
    if (energy <= 2) structuralPatterns.push(8, 13);
    if (energy >= 4 && ao === "artist") structuralPatterns.push(); // positive signal, no pattern

    // Keyword scan from written responses
    const keywordPatterns = scanAllAnswers(checkinAnswers);

    // Merge: structural + keyword + primary profile pattern
    const allDetected = [...new Set([
      ...structuralPatterns,
      ...keywordPatterns,
    ])];

    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      projectId: selectedProject?.id,
      projectTitle: selectedProject?.title || "Unlinked session",
      phase: selectedPhase,
      ao,
      energy,
      answers: checkinAnswers,
      detectedPatterns: allDetected,
      keywordPatterns, // store separately so we know what was found in writing
      structuralPatterns,
    };
    const reflection = generateReflection(ao, energy, keywordPatterns, structuralPatterns, selectedPhase);
    setSessionReflection(reflection);

    onSaveSession(session);
    if (selectedProject) {
      const updated = projects.map(p => p.id === selectedProject.id
        ? { ...p, sessions: (p.sessions || 0) + 1, lastSession: new Date().toISOString() }
        : p);
      onSaveProject(updated);
    }
    setCheckinStep(s => s + 1);
  };

  const addProject = () => {
    if (!newProjectTitle.trim() || !newProjectType) return;
    const updated = [...projects, { id: Date.now(), title: newProjectTitle.trim(), type: newProjectType, status: "active", sessions: 0, phase: "starting", streak: 0, created: new Date().toISOString() }];
    onSaveProject(updated);
    setNewProjectTitle(""); setNewProjectType(""); setShowAddProject(false);
  };

  const updateProject = (id, changes) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...changes } : p);
    onSaveProject(updated);
  };

  const markComplete = (id) => {
    updateProject(id, { status: "completed", completedAt: new Date().toISOString() });
    setShowProjectActions(null);
    setActiveProject(null);
  };

  const markAbandoned = (id) => {
    updateProject(id, { status: "abandoned", abandonedAt: new Date().toISOString() });
    setShowProjectActions(null);
    setActiveProject(null);
  };

  const reactivateProject = (id) => {
    updateProject(id, { status: "active", phase: "starting" });
    setShowProjectActions(null);
    setActiveProject(null);
  };

  const updatePhase = (id, phase) => {
    updateProject(id, { phase });
    setShowProjectActions(null);
  };

  const projectSessions = (projectId) => sessions.filter(s => s.projectId === projectId);

  // compute live stats
  const totalSessions = sessions.length;
  const artistSessions = sessions.filter(s => s.ao === "artist").length;
  const artistRate = totalSessions > 0 ? Math.round((artistSessions / totalSessions) * 100) : 0;
  const completedProjects = projects.filter(p => p.status === "completed").length;

  // live pattern scores - merge quiz profile with session data
  const livePatternScores = (() => {
    const counts = {};
    sessions.forEach(s => (s.detectedPatterns || []).forEach(p => { counts[p] = (counts[p] || 0) + 1; }));
    return user.profile.map(p => ({ ...p, score: Math.min(99, p.score + (counts[p.id] || 0) * 5) })).sort((a, b) => b.score - a.score);
  })();

  return (
    <div className="wrap">
      <div className="app-header">
        <div className="app-logo">calib<span>.</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isPro ? (
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", padding: "3px 8px", background: "rgba(94,139,96,0.15)", border: "1px solid rgba(94,139,96,0.3)", color: "#5E8B60" }}>Pro</span>
          ) : (
            <button onClick={onUpgradeClick} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", padding: "4px 10px", background: "rgba(232,96,44,0.12)", border: "1px solid rgba(232,96,44,0.3)", color: "#E8602C", cursor: "pointer" }}>
              Upgrade
            </button>
          )}
          <div className="app-header-right">{user.name}<br />{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
        </div>
      </div>

      <div className="app-content">

        {/* ── DASHBOARD ── */}
        {screen === "dashboard" && (
          <>
            {/* EMPTY STATE — no sessions, no projects */}
            {sessions.length === 0 && projects.length === 0 ? (
              <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 57px - 100px)" }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".15em", color: "var(--accent)", marginBottom: 20 }}>
                  Step 1 of 3
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
                  Welcome, {user.name}.
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.8, marginBottom: 40 }}>
                  Your profile is set. Here's how to get the most out of your first session.
                </div>

                {/* Step cards */}
                {[
                  { num: "01", title: "Add a project", desc: "Something you're actively working on right now. A track, an EP, anything real.", action: () => setShowAddProject(true), cta: "Add Project →", done: false },
                  { num: "02", title: "Start your first session", desc: "Takes 2 minutes. You'll answer 3 prompts before you work — that's the whole check-in.", action: () => { setCheckinStep(0); setAo(null); setSelectedProject(null); setSelectedPhase(null); setCheckinAnswers({}); setScreen("checkin"); }, cta: "Start Session →", done: false },
                  { num: "03", title: "Watch your patterns", desc: "After a few sessions, Calib will start identifying what's actually happening when you create.", action: null, cta: null, done: false },
                ].map((step, i) => (
                  <div key={i} style={{ marginBottom: 16, padding: "20px", background: "var(--surface)", border: `1px solid ${i === 0 ? "var(--accent)" : "var(--border)"}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 32, fontWeight: 500, color: i === 0 ? "var(--accent)" : "var(--border)", position: "absolute", top: 12, right: 16, lineHeight: 1, opacity: .6 }}>{step.num}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginBottom: 6, color: i === 0 ? "var(--text)" : "var(--text-mid)" }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: step.cta ? 16 : 0 }}>{step.desc}</div>
                    {step.cta && (
                      <button onClick={step.action} style={{ background: i === 0 ? "var(--accent)" : "transparent", border: i === 0 ? "none" : "1px solid var(--border)", color: i === 0 ? "#fff" : "var(--text-dim)", padding: "10px 16px", fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", cursor: "pointer" }}>
                        {step.cta}
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ marginTop: "auto", paddingTop: 32, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-dim)", marginBottom: 10 }}>Your Primary Pattern</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{user.profile[0]?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{PATTERN_DESCRIPTIONS[user.profile[0]?.id]?.slice(0, 120)}…</div>
                  <button onClick={() => { setActivePattern(user.profile[0]); setScreen("library"); }} style={{ marginTop: 12, background: "none", border: "none", fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".1em", cursor: "pointer", padding: 0 }}>
                    Read more in Library →
                  </button>
                </div>
              </div>
            ) : (
              /* NORMAL DASHBOARD — has data */
              <>
                <button className="start-btn" onClick={() => {
                  if (!isPro && sessions.length >= FREE_SESSION_LIMIT) {
                    onUpgradeClick();
                    return;
                  }
                  setCheckinStep(0); setAo(null); setSelectedProject(null); setSelectedPhase(null); setCheckinAnswers({}); setScreen("checkin");
                }}>
                  <div>
                    <div>Start Session</div>
                    <div className="start-btn-sub">
                      {!isPro && sessions.length >= FREE_SESSION_LIMIT
                        ? `Free limit reached — upgrade to continue`
                        : !isPro
                          ? `${sessions.length} / ${FREE_SESSION_LIMIT} free sessions used`
                          : "Pre-session check-in · 2 min"}
                    </div>
                  </div>
                  <div>{!isPro && sessions.length >= FREE_SESSION_LIMIT ? "↑" : "→"}</div>
                </button>

                <div className="section" style={{ marginTop: 28 }}>
                  <div className="section-label">Active Projects</div>
                  {projects.filter(p => p.status === "active").length === 0 && (
                    <div style={{ padding: "16px 0", fontSize: 13, color: "var(--text-dim)", fontStyle: "italic" }}>No active projects yet.</div>
                  )}
              {projects.filter(p => p.status === "active").map(p => (
                <div className="project-card" key={p.id} onClick={() => setActiveProject(p)}>
                  <div className="project-top">
                    <div className="project-title">{p.title}</div>
                    <div className="project-type">{p.type}</div>
                  </div>
                  <div className="project-stats">
                    <div className="proj-stat"><strong>{p.sessions || 0}</strong> sessions</div>
                    <div className="proj-stat" style={{ color: "var(--accent)", fontSize: 10 }}>→ open</div>
                  </div>
                  <div className="phase-tag">{p.phase || "starting"}</div>
                </div>
              ))}
              {projects.filter(p => p.status === "completed" || p.status === "abandoned").length > 0 && (
                <div style={{ marginTop: 16, marginBottom: 8 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>Completed & Archived</div>
                  {projects.filter(p => p.status !== "active").map(p => (
                    <div key={p.id} onClick={() => setActiveProject(p)}
                      style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 8, cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontStyle: "italic", color: "var(--text-mid)", marginBottom: 2 }}>{p.title}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".08em" }}>{p.status} · {p.sessions || 0} sessions</div>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-dim)" }}>→</div>
                    </div>
                  ))}
                </div>
              )}
              <button className="add-project-btn" onClick={() => setShowAddProject(true)}>+ Add Project</button>
            </div>

            <div className="divider" />

            <div className="section" style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Insights</div>
                {newInsightCount > 0 && (
                  <button onClick={() => setScreen("insights")} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                    {newInsightCount} active →
                  </button>
                )}
              </div>
              {activeInsights.slice(0, 2).map((ins, i) => (
                <div key={ins.id} className={`insight ${ins.type}`} onClick={() => { setActiveInsight(ins); setScreen("insights"); }}>
                  <div className="insight-meta">{ins.type}{ins.pattern ? ` · Pattern ${ins.pattern}` : ""}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{ins.title}</div>
                  <div className="insight-text">{ins.message}</div>
                </div>
              ))}
              {activeInsights.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--text-dim)", fontStyle: "italic", paddingBottom: 8 }}>No active insights yet. Log sessions to trigger them.</div>
              )}
            </div>

                {totalSessions > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section" style={{ marginTop: 24, paddingBottom: 8 }}>
                      <div className="section-label">Recent Sessions</div>
                      <div className="session-history">
                        {sessions.slice(-5).reverse().map(s => (
                          <div className="session-row" key={s.id}>
                            <div className="session-row-left">
                              <div className="session-date">{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {timeAgo(s.date)}</div>
                              <div className="session-project">{s.projectTitle}</div>
                              <div className="session-tags">
                                {s.phase && <span className="session-tag">{s.phase}</span>}
                                {(s.detectedPatterns || []).slice(0, 2).map(p => <span key={p} className="session-tag">{PATTERN_SHORT[p]}</span>)}
                              </div>
                            </div>
                            <div className="session-ao">{s.ao === "artist" ? "🎨" : s.ao === "orphan" ? "👤" : "🤷"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── PROJECT DETAIL ── */}
        {activeProject && screen === "dashboard" && (
          <div style={{ position: "fixed", inset: 0, background: "var(--bg)", zIndex: 30, maxWidth: 420, margin: "0 auto", overflowY: "auto", paddingBottom: 100 }}>
            <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 10 }}>
              <button className="back-btn" style={{ paddingBottom: 0 }} onClick={() => setActiveProject(null)}>← Projects</button>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em" }}>
                {projects.find(p => p.id === activeProject.id)?.status || "active"}
              </div>
            </div>

            {/* Project header */}
            <div style={{ padding: "28px 24px 20px" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>
                {activeProject.type}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, fontStyle: "italic", lineHeight: 1.2, marginBottom: 16 }}>
                {activeProject.title}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-dim)" }}>
                  <strong style={{ color: "var(--text-mid)" }}>{activeProject.sessions || 0}</strong> sessions
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-dim)" }}>
                  started {new Date(activeProject.created).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Phase update — only for active projects */}
            {(projects.find(p => p.id === activeProject.id)?.status === "active") && (
              <div style={{ padding: "0 24px 20px" }}>
                <div className="section-label" style={{ marginBottom: 12 }}>Current Phase</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {["starting", "grinding", "almost done", "stuck"].map(phase => {
                    const current = projects.find(p => p.id === activeProject.id)?.phase;
                    const isActive = current === phase;
                    return (
                      <div key={phase} onClick={() => { updatePhase(activeProject.id, phase); setActiveProject(prev => ({...prev, phase})); }}
                        style={{ padding: "12px", background: isActive ? "var(--surface2)" : "var(--surface)", border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`, cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: isActive ? "var(--accent)" : "var(--text-dim)", textAlign: "center", transition: "all .15s" }}>
                        {phase}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session history for this project */}
            <div style={{ padding: "0 24px 20px" }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Session History</div>
              {projectSessions(activeProject.id).length === 0 && (
                <div style={{ fontSize: 13, color: "var(--text-dim)", fontStyle: "italic" }}>No sessions logged yet.</div>
              )}
              {projectSessions(activeProject.id).slice().reverse().map(s => (
                <div key={s.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 4 }}>
                        {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {timeAgo(s.date)}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {s.phase && <span className="session-tag">{s.phase}</span>}
                        <span className="session-tag">energy {s.energy}/5</span>
                        {(s.keywordPatterns || []).slice(0, 2).map(p => (
                          <span key={`kw-${p}`} className="session-tag" style={{ borderColor: PATTERN_COLORS[p], color: PATTERN_COLORS[p] }} title="Detected in writing">
                            {PATTERN_SHORT[p]}
                          </span>
                        ))}
                        {(s.structuralPatterns || []).filter(p => !(s.keywordPatterns||[]).includes(p)).slice(0, 1).map(p => (
                          <span key={`str-${p}`} className="session-tag">{PATTERN_SHORT[p]}</span>
                        ))}
                      </div>
                      {s.answers && Object.values(s.answers).filter(Boolean).length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, fontStyle: "italic", borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                          "{Object.values(s.answers).find(Boolean)?.slice(0, 100)}{Object.values(s.answers).find(Boolean)?.length > 100 ? "…" : ""}"
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16 }}>
                      {s.ao === "artist" ? "🎨" : s.ao === "orphan" ? "👤" : "🤷"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {(projects.find(p => p.id === activeProject.id)?.status === "active") && (
              <div style={{ padding: "0 24px" }}>
                <div className="section-label" style={{ marginBottom: 12 }}>Actions</div>
                <button onClick={() => markComplete(activeProject.id)}
                  style={{ width: "100%", padding: "16px", background: "var(--good)", color: "#fff", border: "none", fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Mark as Complete</span><span>✓</span>
                </button>
                <button onClick={() => markAbandoned(activeProject.id)}
                  style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Abandon Project</span><span>✕</span>
                </button>
              </div>
            )}

            {(projects.find(p => p.id === activeProject.id)?.status !== "active") && (
              <div style={{ padding: "0 24px" }}>
                <div className="section-label" style={{ marginBottom: 12 }}>Actions</div>
                <button onClick={() => reactivateProject(activeProject.id)}
                  style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid var(--accent-dim)", color: "var(--text-mid)", fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Reactivate Project</span><span>→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CHECK-IN ── */}
        {screen === "checkin" && (
          <>
            <div className="checkin-hdr">
              <div className="checkin-step-label">Pre-Session</div>
              <div className="checkin-title">
                {checkinStep === 0 && "Which project?"}
                {checkinStep === 1 && "What phase are you in?"}
                {checkinStep === 2 && "Artist or Orphan?"}
                {checkinStep === 3 && "Energy check."}
                {(checkinStep === 4 || checkinStep === 5) && "Check in."}
                {checkinStep === 6 && "You're calibrated."}
              </div>
              {checkinStep < 4 && (
                <div className="checkin-sub">
                  {checkinStep === 0 && "What are you working on today?"}
                  {checkinStep === 1 && "Be honest. This shapes your prompts."}
                  {checkinStep === 2 && "Who actually showed up today?"}
                  {checkinStep === 3 && "Rate where you're at right now."}
                </div>
              )}
            </div>

            <div className="prog-bar"><div className="prog-fill" style={{ width: `${progress}%` }} /></div>

            {checkinStep === 0 && (
              <div className="project-select-list" style={{ marginTop: 20 }}>
                {projects.filter(p => p.status === "active").map(p => (
                  <div key={p.id} className={`project-select-item ${selectedProject?.id === p.id ? "sel" : ""}`} onClick={() => { setSelectedProject(p); setCheckinStep(1); }}>
                    <span style={{ fontStyle: "italic" }}>{p.title}</span><span style={{ fontSize: 12, color: "var(--text-dim)" }}>→</span>
                  </div>
                ))}
                <div className="project-select-item" onClick={() => { setSelectedProject(null); setCheckinStep(1); }}>
                  <span>No specific project</span><span style={{ fontSize: 12, color: "var(--text-dim)" }}>→</span>
                </div>
              </div>
            )}

            {checkinStep === 1 && (
              <div style={{ padding: "20px 24px" }}>
                {["Starting fresh", "Grinding through", "Almost done", "Stuck"].map(phase => (
                  <div key={phase} className="phase-option" onClick={() => { setSelectedPhase(phase); setCheckinStep(2); }}>
                    <span>{phase}</span><span style={{ color: "var(--text-dim)", fontSize: 12 }}>→</span>
                  </div>
                ))}
              </div>
            )}

            {checkinStep === 2 && (
              <>
                <div className="ao-grid">
                  {[{ k: "artist", icon: "🎨", label: "Artist" }, { k: "orphan", icon: "👤", label: "Orphan" }].map(o => (
                    <div key={o.k} className={`ao-item ${ao === o.k ? "sel" : ""}`} onClick={() => setAo(o.k)}>
                      <div className="ao-icon">{o.icon}</div><div className="ao-label">{o.label}</div>
                    </div>
                  ))}
                  <div className={`ao-item ${ao === "unsure" ? "sel" : ""}`} style={{ gridColumn: "span 2" }} onClick={() => setAo("unsure")}>
                    <div className="ao-icon">🤷</div><div className="ao-label">Unsure</div>
                  </div>
                </div>
                {ao && <button className="next-btn" onClick={() => setCheckinStep(3)}>Continue →</button>}
              </>
            )}

            {checkinStep === 3 && (
              <>
                <div style={{ padding: "8px 24px 4px", textAlign: "center", fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Low · High</div>
                <div className="energy-row">
                  {[1, 2, 3, 4, 5].map(n => <div key={n} className={`energy-dot ${energy === n ? "sel" : ""}`} onClick={() => setEnergy(n)}>{n}</div>)}
                </div>
                <button className="next-btn" onClick={() => setCheckinStep(4)}>Continue →</button>
              </>
            )}

            {(checkinStep === 4 || checkinStep === 5) && currentStep.prompt && (
              <>
                <div className="prompt-card">
                  <div className="prompt-id">{currentStep.prompt.id}</div>
                  <div className="prompt-text">"{currentStep.prompt.text}"</div>
                  <textarea className="prompt-ta" placeholder="Write freely. No one is grading this."
                    value={checkinAnswers[currentStep.prompt.id] || ""}
                    onChange={e => setCheckinAnswers(prev => ({ ...prev, [currentStep.prompt.id]: e.target.value }))} />
                </div>
                <button className="next-btn" onClick={() => checkinStep === 5 ? finishSession() : setCheckinStep(s => s + 1)}>
                  {checkinStep === 5 ? "Save & Finish →" : "Next Prompt →"}
                </button>
              </>
            )}

            {checkinStep === 6 && (() => {
              const kwSigs = scanAllAnswers(checkinAnswers);
              const structSigs = [];
              if (ao === "orphan") structSigs.push(12);
              if (selectedPhase === "Stuck") structSigs.push(1, 4);
              if (energy <= 2) structSigs.push(8, 13);
              const allSigs = [...new Set([...kwSigs, ...structSigs])].filter(p => p !== user.profile[0]?.id).slice(0, 3);
              const isPositive = ao === "artist" && energy >= 4;

              return (
                <div style={{ padding: "48px 24px 32px", animation: "rise .4s cubic-bezier(.4,0,.2,1) both" }}>

                  {/* ✦ mark */}
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, marginBottom: 28, textAlign: "center", color: "var(--accent)" }}>✦</div>

                  {/* The reflection — headline of this screen */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-dim)", marginBottom: 14 }}>
                      Calib read this session as
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", lineHeight: 1.6, color: "var(--text)", borderLeft: `3px solid ${isPositive ? "var(--good)" : allSigs.length > 0 ? PATTERN_COLORS[allSigs[0]] || "var(--accent-dim)" : "var(--border)"}`, paddingLeft: 16 }}>
                      {sessionReflection || "Session logged. The data is building."}
                    </div>
                  </div>

                  {/* Compact data row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 28 }}>
                    <div style={{ padding: "12px 10px", background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: ao === "artist" ? "var(--good)" : ao === "orphan" ? "var(--warn)" : "var(--text-dim)", marginBottom: 4 }}>
                        {ao === "artist" ? "🎨" : ao === "orphan" ? "👤" : "🤷"}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-dim)" }}>
                        {ao || "unsure"}
                      </div>
                    </div>
                    <div style={{ padding: "12px 10px", background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 900, color: energy <= 2 ? "var(--warn)" : energy >= 4 ? "var(--good)" : "var(--text-mid)", marginBottom: 4, lineHeight: 1 }}>
                        {energy}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-dim)" }}>Energy</div>
                    </div>
                    <div style={{ padding: "12px 10px", background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 900, color: "var(--text-mid)", marginBottom: 4, lineHeight: 1 }}>
                        {allSigs.length || "—"}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-dim)" }}>
                        {allSigs.length === 1 ? "Pattern" : "Patterns"}
                      </div>
                    </div>
                  </div>

                  {/* Detected patterns — minimal, not a wall of data */}
                  {allSigs.length > 0 && (
                    <div style={{ marginBottom: 28, padding: "16px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-dim)", marginBottom: 12 }}>
                        Detected in this session
                      </div>
                      {allSigs.map(p => (
                        <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: PATTERN_COLORS[p], flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-dim)", marginBottom: 2 }}>
                              Pattern {String(p).padStart(2, "0")}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-mid)" }}>{PATTERN_NAMES[p]}</div>
                          </div>
                          {kwSigs.includes(p) && (
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: PATTERN_COLORS[p], textTransform: "uppercase", letterSpacing: ".08em" }}>
                              in writing
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>
                    Now make something real.
                  </div>

                  <button className="next-btn" style={{ margin: "0 auto" }} onClick={() => setScreen("dashboard")}>
                    ← Back to Dashboard
                  </button>
                </div>
              );
            })()}
          </>
        )}

        {/* ── INSIGHTS ── */}
        {screen === "insights" && !activeInsight && (
          <>
            <div className="section" style={{ paddingTop: 24, paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Active Insights</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em" }}>{newInsightCount} firing</div>
              </div>
            </div>
            {activeInsights.length === 0 && (
              <div style={{ padding: "24px", fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>
                No insights are firing yet. The engine checks after every session. Keep logging.
              </div>
            )}
            {activeInsights.map((ins) => (
              <div key={ins.id} className={`insight ${ins.type}`} style={{ marginBottom: 0, borderBottom: "1px solid var(--border)", borderLeft: "none", borderLeftWidth: 0, padding: "18px 24px", cursor: "pointer" }}
                onClick={() => setActiveInsight(ins)}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="insight-meta" style={{ marginBottom: 6 }}>{ins.type}{ins.pattern ? ` · Pattern ${String(ins.pattern).padStart(2,"0")}` : ""}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6, lineHeight: 1.3 }}>{ins.title}</div>
                    <div className="insight-text">{ins.message}</div>
                  </div>
                  <div style={{ color: "var(--accent)", fontSize: 12, flexShrink: 0, paddingTop: 2 }}>→</div>
                </div>
              </div>
            ))}
            {allInsights.filter(i => i.dismissed).length > 0 && (
              <div style={{ padding: "20px 24px 8px" }}>
                <div className="section-label">Dismissed</div>
                {allInsights.filter(i => i.dismissed).map(ins => (
                  <div key={ins.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", opacity: 0.4 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{ins.type}</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{ins.title}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {screen === "insights" && activeInsight && (
          <div className="pattern-detail">
            <button className="back-btn" onClick={() => setActiveInsight(null)}>← All Insights</button>
            <div style={{ display: "inline-block", fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", padding: "3px 8px", marginBottom: 16,
              background: activeInsight.type === "warning" ? "var(--warn)" : activeInsight.type === "milestone" ? "var(--good)" : "var(--accent-dim)",
              color: "#fff" }}>{activeInsight.type}</div>
            <div className="detail-title">{activeInsight.title}</div>
            {activeInsight.pattern && (
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 20 }}>
                Pattern {String(activeInsight.pattern).padStart(2, "0")} · {PATTERN_SHORT[activeInsight.pattern]}
              </div>
            )}
            <div className="detail-section">What This Means</div>
            <div className="detail-text">{activeInsight.message}</div>
            {activeInsight.reframe && (
              <>
                <div className="detail-section">The Reframe</div>
                <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)", fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7, fontStyle: "italic" }}>
                  {activeInsight.reframe}
                </div>
              </>
            )}
            {activeInsight.pattern && (
              <>
                <div className="detail-section">Go Deeper</div>
                <div onClick={() => { setActiveInsight(null); setActivePattern({ id: activeInsight.pattern, name: PATTERN_NAMES[activeInsight.pattern], color: PATTERN_COLORS[activeInsight.pattern], score: 0 }); setScreen("library"); }}
                  style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "var(--text-mid)" }}>
                  <span>Read Pattern {String(activeInsight.pattern).padStart(2,"0")} in Library</span>
                  <span style={{ color: "var(--accent)" }}>→</span>
                </div>
              </>
            )}
            <button onClick={() => { onDismissInsight(activeInsight.ruleId); setActiveInsight(null); }}
              style={{ marginTop: 28, width: "100%", padding: "14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", cursor: "pointer" }}>
              Dismiss This Insight
            </button>
          </div>
        )}

        {/* ── PROFILE ── */}
        {screen === "profile" && (
          <>
            <div className="stats-grid">
              <div className="stat-box"><div className="stat-val hi">{livePatternScores[0]?.score || 0}%</div><div className="stat-lbl">Top Pattern</div></div>
              <div className="stat-box"><div className="stat-val">{artistRate}%</div><div className="stat-lbl">Artist Rate</div></div>
              <div className="stat-box"><div className="stat-val">{totalSessions}</div><div className="stat-lbl">Sessions</div></div>
              <div className="stat-box"><div className="stat-val">{completedProjects}/{projects.length}</div><div className="stat-lbl">Finished</div></div>
            </div>
            <div className="section">
              <div className="section-label">Your Top Patterns</div>
              {livePatternScores.map(p => (
                <div className="pattern-row" key={p.id} onClick={() => { setActivePattern(p); setScreen("library"); }}>
                  <div className="pattern-row-top"><div className="pattern-name">{p.short}</div><div className="pattern-score">{p.score}%</div></div>
                  <div className="pattern-bar-bg"><div className="pattern-bar-fill" style={{ width: `${p.score}%`, background: p.color }} /></div>
                </div>
              ))}
            </div>

            {/* Share card CTA — only surfaces after real sessions */}
            <div style={{ margin: "28px 24px 0", padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-dim)", marginBottom: 8 }}>
                {totalSessions >= 3 ? "Your profile card is ready" : `${3 - totalSessions} more session${3 - totalSessions !== 1 ? "s" : ""} to unlock your card`}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6, lineHeight: 1.3 }}>
                {totalSessions >= 3 ? "Share your Calib profile." : "Keep going."}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: totalSessions >= 3 ? 16 : 0 }}>
                {totalSessions >= 3
                  ? "Your pattern profile, Artist/Orphan rate, and session count — as a card worth posting."
                  : "Your card generates after 3 sessions. The data needs weight before it means something."}
              </div>
              {totalSessions >= 3 && (
                <button onClick={() => setShowCard(true)}
                  style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "12px 20px", fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", cursor: "pointer" }}>
                  Generate Card →
                </button>
              )}
              {totalSessions < 3 && (
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: 3, flex: 1, background: totalSessions >= i ? "var(--accent)" : "var(--border)", transition: "background .3s" }} />
                  ))}
                </div>
              )}
            </div>

            <button className="reset-btn" onClick={onReset}>Reset Profile & Start Over</button>
          </>
        )}

        {/* ── PROFILE CARD MODAL ── */}
        {showCard && (
          <div className="modal-overlay" onClick={() => setShowCard(false)}>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", width: "100%", maxWidth: 420, animation: "rise .35s cubic-bezier(.4,0,.2,1) both", maxHeight: "92vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}>

              {/* The actual card — designed to screenshot */}
              <div id="calib-card" style={{
                background: "#0C0A08", padding: "36px 32px 32px",
                fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden"
              }}>
                {/* Decorative corner accent */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80,
                  background: "radial-gradient(circle at top right, rgba(232,96,44,.15) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 120, height: 60,
                  background: "radial-gradient(circle at bottom left, rgba(232,96,44,.08) 0%, transparent 70%)" }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 900, letterSpacing: -0.3, color: "#F0EAE0", marginBottom: 2 }}>
                      calib<span style={{ color: "#E8602C" }}>.</span>
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: ".15em", color: "#6A6050" }}>
                      Creative Self-Coaching
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontStyle: "italic", color: "#B0A898" }}>{user.name}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#6A6050", marginTop: 2 }}>{user.creativeType}</div>
                  </div>
                </div>

                {/* Primary pattern — the hero */}
                <div style={{ marginBottom: 24, padding: "18px", background: "#141210", border: "1px solid #2A2520", borderLeft: `3px solid ${livePatternScores[0]?.color || "#E8602C"}` }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: ".15em", color: "#6A6050", marginBottom: 6 }}>
                    Primary Pattern
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#F0EAE0", lineHeight: 1.2, marginBottom: 4 }}>
                    {livePatternScores[0]?.name}
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: livePatternScores[0]?.color || "#E8602C" }}>
                    {livePatternScores[0]?.score}% activation
                  </div>
                </div>

                {/* Top patterns list */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, textTransform: "uppercase", letterSpacing: ".12em", color: "#6A6050", marginBottom: 12 }}>
                    Top Patterns
                  </div>
                  {livePatternScores.slice(0, 4).map((p, i) => (
                    <div key={p.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: i === 0 ? "#B0A898" : "#6A6050", textTransform: "uppercase", letterSpacing: ".06em" }}>
                          {String(p.id).padStart(2,"0")} {p.short}
                        </div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#6A6050" }}>{p.score}%</div>
                      </div>
                      <div style={{ height: 2, background: "#1C1916" }}>
                        <div style={{ height: "100%", width: `${p.score}%`, background: p.color, opacity: i === 0 ? 1 : 0.5 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                  {[
                    { val: totalSessions, label: "Sessions" },
                    { val: `${artistRate}%`, label: "Artist Rate" },
                    { val: `${completedProjects}/${projects.length}`, label: "Finished" },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: "12px 10px", background: "#141210", border: "1px solid #2A2520", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900, color: "#F0EAE0", lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, textTransform: "uppercase", letterSpacing: ".1em", color: "#6A6050" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #2A2520" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#4A4040", textTransform: "uppercase", letterSpacing: ".1em" }}>
                    calib.app
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "#4A4040" }}>
                    {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Actions below card */}
              <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 16 }}>
                  Screenshot the card above to share. Long-press on mobile to save the image.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowCard(false)}
                    style={{ flex: 1, padding: "14px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-dim)", fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", cursor: "pointer" }}>
                    Close
                  </button>
                  <button onClick={() => {
                    const card = document.getElementById("calib-card");
                    if (!card) return;
                    // Copy card text as fallback
                    const text = `My Calib Profile

Primary Pattern: ${livePatternScores[0]?.name} (${livePatternScores[0]?.score}%)
Sessions: ${totalSessions} · Artist Rate: ${artistRate}% · Finished: ${completedProjects}/${projects.length}

calib.app`;
                    navigator.clipboard?.writeText(text).then(() => alert("Profile copied to clipboard!")).catch(() => alert("Screenshot the card to share it."));
                  }}
                    style={{ flex: 2, padding: "14px", background: "var(--accent)", color: "#fff", border: "none", fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Copy Profile Text</span><span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LIBRARY ── */}
        {screen === "library" && !activePattern && (
          <>
            <div className="section" style={{ paddingTop: 20 }}><div className="section-label">The 15 Patterns</div></div>
            {Object.entries(PATTERN_NAMES).map(([id, name]) => {
              const inProfile = livePatternScores.find(p => p.id === parseInt(id));
              return (
                <div className="lib-item" key={id} onClick={() => setActivePattern({ id: parseInt(id), name, color: PATTERN_COLORS[parseInt(id)], score: inProfile?.score || 0 })}>
                  <div className="lib-num">{String(id).padStart(2, "0")}</div>
                  <div className="lib-name">{name}</div>
                  <div className="lib-dot" style={{ background: inProfile ? inProfile.color : "var(--border)" }} />
                </div>
              );
            })}
          </>
        )}

        {screen === "library" && activePattern && (
          <div className="pattern-detail">
            <button className="back-btn" onClick={() => setActivePattern(null)}>← All Patterns</button>
            <div className="detail-num">Pattern {String(activePattern.id).padStart(2, "0")}</div>
            <div className="detail-title">{activePattern.name}</div>
            <div style={{ height: 3, width: 40, background: activePattern.color, marginBottom: 24 }} />
            <div className="detail-section">The Root Cause</div>
            <div className="detail-text">{PATTERN_DESCRIPTIONS[activePattern.id] || "Log sessions to unlock detail on this pattern."}</div>
            {PATTERN_REFRAMES[activePattern.id] && (<><div className="detail-section">The Reframe</div><div className="detail-text">{PATTERN_REFRAMES[activePattern.id]}</div></>)}
            <div className="detail-section">Your Data</div>
            <div className="detail-data">
              {activePattern.score > 0
                ? <>Activation score: <span style={{ color: "var(--text-mid)" }}>{activePattern.score}%</span><br />
                    Sessions triggered: <span style={{ color: "var(--text-mid)" }}>{sessions.filter(s => (s.detectedPatterns || []).includes(activePattern.id)).length}</span><br />
                    First detected: <span style={{ color: "var(--text-mid)" }}>Pattern Discovery Quiz</span></>
                : <>Not yet in your profile — hasn't surfaced in your sessions.</>}
            </div>
            <button className="back-btn" style={{ marginTop: 28, paddingBottom: 0 }} onClick={() => setActivePattern(null)}>← Back</button>
          </div>
        )}

      </div>

      {/* ADD PROJECT MODAL */}
      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">New Project</div>
            <input className="modal-input" placeholder="Project title" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} autoFocus />
            <div className="field-label">Type</div>
            <div className="modal-type-grid">
              {["Track", "EP", "Album", "Visual", "Film", "Other"].map(t => (
                <div key={t} className={`modal-type ${newProjectType === t ? "sel" : ""}`} onClick={() => setNewProjectType(t)}>{t}</div>
              ))}
            </div>
            <div className="modal-btns">
              <button className="modal-cancel" onClick={() => setShowAddProject(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={addProject} disabled={!newProjectTitle.trim() || !newProjectType}><span>Add Project</span><span>→</span></button>
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <div className="app-nav">
        {[{ key: "dashboard", icon: "⌂", label: "Home" }, { key: "checkin", icon: "◎", label: "Session" }, { key: "insights", icon: "◉", label: "Insights" }, { key: "profile", icon: "◈", label: "Profile" }, { key: "library", icon: "≡", label: "Library" }].map(n => (
          <div key={n.key} className={`nav-item ${(screen === n.key || (n.key === "insights" && screen === "insights")) ? "active" : ""}`}
            onClick={() => {
              if (n.key === "checkin") {
                if (!isPro && sessions.length >= FREE_SESSION_LIMIT) { onUpgradeClick(); return; }
                setCheckinStep(0); setAo(null); setSelectedProject(null); setSelectedPhase(null); setCheckinAnswers({});
              }
              if (n.key === "library") { setActivePattern(null); }
              if (n.key === "insights") { setActiveInsight(null); }
              setScreen(n.key);
            }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div className="nav-icon">{n.icon}</div>
              {n.key === "insights" && newInsightCount > 0 && screen !== "insights" && (
                <div style={{ position: "absolute", top: -2, right: -6, width: 8, height: 8, background: "var(--accent)", borderRadius: "50%", border: "2px solid var(--bg)" }} />
              )}
            </div>
            <div className="nav-label">{n.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────

export default function Calib() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dismissedInsights, setDismissedInsights] = useState([]);
  const [storageWarning, setStorageWarning] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState(null);         // Supabase session user
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const authDismissed = useRef(false);

  // Paywall state
  const [isPro, setIsPro] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Load all data on mount + listen for Supabase auth changes
  useEffect(() => {
    try {
      // Test localStorage availability
      localStorage.setItem("calib:__ping", "1");
      localStorage.removeItem("calib:__ping");
    } catch {
      setStorageWarning(true);
      setLoading(false);
      return;
    }
    try {
      const savedUser = loadData("calib:user");
      const savedSessions = loadData("calib:sessions");
      const savedProjects = loadData("calib:projects");
      const savedDismissed = loadData("calib:dismissed");
      if (savedUser) setUser(savedUser);
      if (savedSessions) setSessions(savedSessions);
      if (savedProjects) setProjects(savedProjects);
      if (savedDismissed) setDismissedInsights(savedDismissed);
    } catch (e) {
      console.error("Storage load failed:", e);
      setStorageWarning(true);
    }
    trackEvent("app_opened");
    setLoading(false);

    // Check for ?upgraded=true redirect from Stripe Payment Link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("upgraded") === "true") {
      setUpgradeSuccess(true);
      setShowUpgradeModal(true);
      trackEvent("upgrade_success_redirect");
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Supabase auth listener — pull cloud data on sign-in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        setShowAuthPrompt(false);
        trackEvent("auth_signed_in");
        // Pull cloud data and merge (cloud wins on conflict)
        try {
          const uid = session.user.id;
          const [{ data: sbProfile }, { data: sbSessions }, { data: sbProjects }, { data: sbDismissed }] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", uid).single(),
            supabase.from("sessions").select("*").eq("user_id", uid).order("created_at", { ascending: true }),
            supabase.from("projects").select("*").eq("user_id", uid),
            supabase.from("dismissed_insights").select("rule_id").eq("user_id", uid),
          ]);
          if (sbProfile) {
            setUser(sbProfile.data);
            saveData("calib:user", sbProfile.data);
            // Set pro status from Supabase profile
            const proStatus = sbProfile.stripe_status === "pro";
            const periodEnd = sbProfile.stripe_current_period_end;
            const isStillPro = proStatus && (!periodEnd || new Date(periodEnd) > new Date());
            setIsPro(isStillPro);
            saveData("calib:isPro", isStillPro);
          }
          if (sbSessions?.length) { setSessions(sbSessions.map(r => r.data)); saveData("calib:sessions", sbSessions.map(r => r.data)); }
          if (sbProjects?.length) { setProjects(sbProjects.map(r => r.data)); saveData("calib:projects", sbProjects.map(r => r.data)); }
          if (sbDismissed?.length) { const ids = sbDismissed.map(r => r.rule_id); setDismissedInsights(ids); saveData("calib:dismissed", ids); }
        } catch (e) { console.warn("[calib:pull]", e?.message); }
      } else {
        setAuthUser(null);
        // Restore pro status from localStorage if signed out (persists between sessions)
        const cachedPro = loadData("calib:isPro");
        if (cachedPro) setIsPro(true);
      }
    });

    // Show auth prompt after 60 seconds if not logged in and not dismissed
    const promptTimer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session && !authDismissed.current) setShowAuthPrompt(true);
      });
    }, 60000);

    return () => { subscription.unsubscribe(); clearTimeout(promptTimer); };
  }, []);

  const handleOnboardingComplete = (data) => {
    setUser(data);
    saveData("calib:user", data);
    trackEvent("onboarding_completed", { creative_type: data.creativeType, primary_pattern: data.profile?.[0]?.name });
    // Silent cloud sync
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) sbSync("profiles", { id: session.user.id, data, updated_at: new Date().toISOString() });
    });
  };

  const handleSaveSession = (session) => {
    const updated = [...sessions, session];
    setSessions(updated);
    saveData("calib:sessions", updated);
    trackEvent("session_logged", { session_number: updated.length, ao: session.ao, energy: session.energy });
    // Silent cloud sync
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) sbSync("sessions", { id: session.id || `${s.user.id}_${session.timestamp}`, user_id: s.user.id, data: session, created_at: new Date().toISOString() });
    });
  };

  const handleSaveProjects = (updated) => {
    setProjects(updated);
    saveData("calib:projects", updated);
    // Silent cloud sync
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updated.forEach(p => sbSync("projects", { id: p.id || `${session.user.id}_${p.name}`, user_id: session.user.id, data: p, updated_at: new Date().toISOString() }));
      }
    });
  };

  const handleDismissInsight = (ruleId) => {
    const updated = [...dismissedInsights, ruleId];
    setDismissedInsights(updated);
    saveData("calib:dismissed", updated);
    // Silent cloud sync
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) sbSync("dismissed_insights", { id: `${session.user.id}_${ruleId}`, user_id: session.user.id, rule_id: ruleId });
    });
  };

  const handleReset = () => {
    if (!window.confirm("Reset all data and start over?")) return;
    setUser(null); setSessions([]); setProjects([]); setDismissedInsights([]);
    saveData("calib:user", null);
    saveData("calib:sessions", []);
    saveData("calib:projects", []);
    saveData("calib:dismissed", []);
  };

  const handleSendMagicLink = async () => {
    if (!authEmail || !authEmail.includes("@")) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: authEmail, options: { shouldCreateUser: true } });
      if (!error) { setAuthSent(true); trackEvent("auth_magic_link_sent"); }
      else console.warn("[calib:auth]", error.message);
    } catch (e) { console.warn("[calib:auth]", e?.message); }
    setAuthLoading(false);
  };

  const dismissAuthPrompt = () => {
    authDismissed.current = true;
    setShowAuthPrompt(false);
  };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="grain" />
      {storageWarning && (
        <div style={{
          position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 420, zIndex: 200, padding: "12px 24px",
          background: "var(--warn)", color: "#fff",
          fontFamily: "'DM Mono',monospace", fontSize: 10,
          textTransform: "uppercase", letterSpacing: ".08em", textAlign: "center"
        }}>
          Storage unavailable — data will not persist between sessions
        </div>
      )}
      <div className="wrap">
        <div className="loading">
          <div className="loading-logo">calib<span>.</span></div>
          <div className="loading-dot" />
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="grain" />
      {!user
        ? <Onboarding onComplete={handleOnboardingComplete} />
        : <MainApp user={user} sessions={sessions} projects={projects} onSaveSession={handleSaveSession} onSaveProject={handleSaveProjects} onReset={handleReset} dismissedInsights={dismissedInsights} onDismissInsight={handleDismissInsight} isPro={isPro} authUser={authUser} onUpgradeClick={() => { setUpgradeSuccess(false); setShowUpgradeModal(true); }} />
      }
      {/* Upgrade Modal — paywall gate */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          sessionCount={sessions.length}
          authUser={authUser}
          upgradeSuccess={upgradeSuccess}
        />
      )}

      {/* Auth prompt — floats over everything, shown 60s after load if not signed in */}
      {showAuthPrompt && !authUser && !showUpgradeModal && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          width: "calc(100% - 48px)", maxWidth: 372, zIndex: 300,
          background: "#1a1714", border: "1px solid rgba(232,96,44,0.35)",
          borderRadius: 12, padding: "20px 20px 16px",
          fontFamily: "'DM Sans',sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,.6)"
        }}>
          <button onClick={dismissAuthPrompt} style={{
            position: "absolute", top: 10, right: 12,
            background: "none", border: "none", color: "rgba(255,255,255,0.35)",
            fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0
          }}>×</button>
          {!authSent ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f0ede8", marginBottom: 4 }}>Save your data to the cloud</div>
              <div style={{ fontSize: 11, color: "rgba(240,237,232,0.5)", marginBottom: 14, lineHeight: 1.5 }}>
                Your data lives in this browser. Enter your email to back it up — no password needed.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMagicLink()}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8, padding: "8px 12px", color: "#f0ede8",
                    fontFamily: "'DM Mono',monospace", fontSize: 12, outline: "none"
                  }}
                />
                <button onClick={handleSendMagicLink} disabled={authLoading} style={{
                  background: "#E8602C", border: "none", borderRadius: 8,
                  padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 600,
                  cursor: authLoading ? "wait" : "pointer", whiteSpace: "nowrap", flexShrink: 0
                }}>
                  {authLoading ? "..." : "Send link"}
                </button>
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: "rgba(240,237,232,0.3)", textAlign: "center" }}>
                No password · no spam · just a login link
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E8602C", marginBottom: 6 }}>Check your inbox</div>
              <div style={{ fontSize: 11, color: "rgba(240,237,232,0.55)", lineHeight: 1.6 }}>
                Magic link sent to <strong style={{ color: "#f0ede8" }}>{authEmail}</strong>. Click it to sync your data across devices.
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
