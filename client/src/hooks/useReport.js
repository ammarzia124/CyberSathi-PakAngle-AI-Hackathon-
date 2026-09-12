import { useState, useEffect } from "react";
import { api } from "../services/api.js";

export function useReport(reportId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getReport(reportId);
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  return { loading, error, report };
}
