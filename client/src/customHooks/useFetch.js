import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (requestData = null) => {
    setLoading(true);
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers || { 'Content-Type': 'application/json' },
        data: requestData,
        withCredentials: options.withCredentials || false, // Para enviar cookies si es necesario
      });
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { data, error, loading, fetchData };
};

export default useFetch;
