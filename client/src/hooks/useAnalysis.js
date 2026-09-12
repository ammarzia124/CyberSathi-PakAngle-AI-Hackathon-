import { useState } from "react";
import { api } from "../services/api.js";

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyzeUrl = async (url) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeUrl(url);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeMessage = async (text) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeMessage(text);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeScreenshot = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeScreenshot(file);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeCombined = async (text, urls) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeCombined(text, urls);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    analyzeUrl,
    analyzeMessage,
    analyzeScreenshot,
    analyzeCombined,
  };
}
