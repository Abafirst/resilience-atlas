/**
 * useQuests.js
 * React hook for quest progress tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { ALL_QUESTS } from '../data/gamification/quests.js';
import { loadJSON, saveJSON, addActivityEntry } from '../utils/gamificationHelpers.js';

const QUESTS_KEY = 'iatlas_active_quests';

function loadActiveQuests() {
  return loadJSON(QUESTS_KEY, []);
}

function saveActiveQuests(quests) {
  saveJSON(QUESTS_KEY, quests);
}

export default function useQuests() {
  const [activeQuests, setActiveQuests]       = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);

  const refresh = useCallback(() => {
    const all = loadActiveQuests();
    setActiveQuests(all.filter(q => q.status === 'active'));
    setCompletedQuests(all.filter(q => q.status === 'completed'));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startQuest = useCallback((questId) => {
    const template = ALL_QUESTS.find(q => q.id === questId);
    if (!template) return;
    const all = loadActiveQuests();
    if (all.find(q => q.questId === questId && q.status === 'active')) return; // Already active
    const now = new Date();
    const expires = new Date(now.getTime() + template.duration * 86400000);
    all.push({
      questId,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      progress: { current: 0, target: getQuestTarget(template), percentage: 0 },
      completedAt: null,
    });
    saveActiveQuests(all);
    refresh();
  }, [refresh]);

  const abandonQuest = useCallback((questId) => {
    const all = loadActiveQuests().map(q =>
      q.questId === questId ? { ...q, status: 'abandoned' } : q
    );
    saveActiveQuests(all);
    refresh();
  }, [refresh]);

  const updateQuestProgress = useCallback((stats) => {
    const all = loadActiveQuests();
    let changed = false;
    for (const quest of all) {
      if (quest.status !== 'active') continue;
      const template = ALL_QUESTS.find(q => q.id === quest.questId);
      if (!template) continue;
      const now = new Date();
      // Check expiry
      if (quest.expiresAt && new Date(quest.expiresAt) < now) {
        quest.status = 'failed';
        changed = true;
        continue;
      }
      const newProgress = computeQuestProgress(template, stats);
      quest.progress = newProgress;
      if (newProgress.percentage >= 100) {
        quest.status = 'completed';
        quest.completedAt = now.toISOString();
        changed = true;
        addActivityEntry({ type: 'quest_complete', questId: template.id, questTitle: template.title, xp: template.rewards.xp });
      }
    }
    if (changed) {
      saveActiveQuests(all);
      refresh();
    }
    return all.filter(q => q.status === 'completed' && q.completedAt && new Date(q.completedAt) > new Date(Date.now() - 5000));
  }, [refresh]);

  return { activeQuests, completedQuests, startQuest, abandonQuest, updateQuestProgress, refresh };
}

function getQuestTarget(template) {
  const r = template.requirements;
  if (r.skillsComplete)    return r.skillsComplete;
  if (r.dimensionsComplete) return r.dimensionsComplete;
  if (r.dimensionsCount)   return r.dimensionsCount;
  if (r.dimensionComplete) return 1;
  return 1;
}

function computeQuestProgress(template, stats) {
  const r = template.requirements;
  let current = 0;
  let target = getQuestTarget(template);
  if (r.skillsComplete) {
    if (r.sameDimension) {
      // Track the highest skill count achieved in any single dimension
      current = stats.maxSkillsInOneDimension || 0;
    } else if (r.level) {
      current = stats.skillsByLevel?.[r.level] || 0;
    } else {
      current = stats.totalSkills || 0;
    }
  } else if (r.dimensionsCount) {
    current = stats.dimensionsStarted || 0;
  } else if (r.dimensionsComplete) {
    // e.g. { dimensionsComplete: 6, level: 'foundation' } — count dimensions with the given level fully done
    current = r.level
      ? (stats.dimensionsCompleteByLevel?.[r.level] || 0)
      : (stats.dimensionsFullyComplete || 0);
    target = r.dimensionsComplete;
  } else if (r.dimensionComplete) {
    current = stats.dimensionsFullyComplete || 0;
    target = 1;
  } else if (r.dailyStreak) {
    current = stats.overallStreak || 0;
  } else if (r.overallStreak) {
    current = stats.overallStreak || 0;
    target = r.overallStreak;
  } else if (r.reflectionsComplete) {
    current = stats.totalReflections || 0;
    target = r.reflectionsComplete;
  } else if (r.totalSkills) {
    current = stats.totalSkills || 0;
    target = r.totalSkills;
  }
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return { current, target, percentage };
}
