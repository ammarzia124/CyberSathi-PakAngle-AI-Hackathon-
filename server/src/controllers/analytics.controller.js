import { supabase, isSupabaseConnected } from "../config/database.js";

const cache = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000;

export const getAnalytics = async (req, res, next) => {
  if (!(await isSupabaseConnected())) {
    return res.json({
      totalScans: 0,
      threatDistribution: {},
      avgRiskScore: null,
      recentScans: [],
    });
  }

  try {
    const now = Date.now();
    if (cache.data && now - cache.timestamp < CACHE_TTL) {
      return res.json(cache.data);
    }

    const [totalResult, threatResult, scoresResult, recentResult] = await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("threat_level"),
      supabase.from("reports").select("risk_score"),
      supabase.from("reports")
        .select("created_at, risk_score, threat_level")
        .order("created_at", { ascending: false })
        .limit(7),
    ]);

    const totalScans = totalResult.count || 0;

    const threatRows = threatResult.data || [];
    const threatDistribution = threatRows.reduce((acc, row) => {
      acc[row.threat_level] = (acc[row.threat_level] || 0) + 1;
      return acc;
    }, {});

    const scoreRows = scoresResult.data || [];
    const avgRiskScore = scoreRows.length > 0
      ? Math.round((scoreRows.reduce((sum, r) => sum + r.risk_score, 0) / scoreRows.length) * 10) / 10
      : null;

    const recentScans = (recentResult.data || []).map((row) => ({
      createdAt: row.created_at,
      riskScore: row.risk_score,
      threatLevel: row.threat_level,
    }));

    const result = {
      totalScans,
      threatDistribution,
      avgRiskScore,
      recentScans,
    };

    cache.data = result;
    cache.timestamp = now;

    res.json(result);
  } catch (error) {
    next(error);
  }
};
