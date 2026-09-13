import { supabase, isSupabaseConnected } from "../config/database.js";

export const getScans = async (req, res, next) => {
  if (!(await isSupabaseConnected())) {
    return res.json({ scans: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const [scansResult, countResult] = await Promise.all([
      supabase
        .from("reports")
        .select("report_id, input_type, risk_score, threat_level, threat_type, created_at")
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase.from("reports").select("*", { count: "exact", head: true }),
    ]);

    const scans = (scansResult.data || []).map((row) => ({
      reportId: row.report_id,
      inputType: row.input_type,
      riskScore: row.risk_score,
      threatLevel: row.threat_level,
      threatType: row.threat_type,
      createdAt: row.created_at,
    }));

    const total = countResult.count || 0;

    res.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getScanById = async (req, res, next) => {
  if (!(await isSupabaseConnected())) {
    return res.status(503).json({ error: "Database unavailable", statusCode: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("report_id, input_type, risk_score, threat_level, threat_type, created_at")
      .eq("report_id", req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Scan not found" });
    }

    res.json({
      reportId: data.report_id,
      inputType: data.input_type,
      riskScore: data.risk_score,
      threatLevel: data.threat_level,
      threatType: data.threat_type,
      createdAt: data.created_at,
    });
  } catch (error) {
    next(error);
  }
};
