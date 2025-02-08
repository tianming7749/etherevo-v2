// useLoadData.ts
import { useState, useEffect } from 'react';

const useLoadData = (loadFunction: () => Promise<any>) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await loadFunction();
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadFunction]);

  return { data, loading, error };
};

export default useLoadData;