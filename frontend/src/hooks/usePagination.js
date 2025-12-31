import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (defaultLimit = 10) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const pageParam = parseInt(searchParams.get('page')) || 1;
  const limitParam = parseInt(searchParams.get('limit')) || defaultLimit;

  const [page, setPage] = useState(pageParam);
  const [limit, setLimit] = useState(limitParam);
  const [paginationMeta, setPaginationMeta] = useState(null);

  useEffect(() => {
    const newPage = parseInt(searchParams.get('page')) || 1;
    const newLimit = parseInt(searchParams.get('limit')) || defaultLimit;
    
    setPage(newPage);
    setLimit(newLimit);
  }, [searchParams, defaultLimit]);

  const updateParams = (newPage, newLimit) => {
    const params = new URLSearchParams(searchParams);
    if (newPage) params.set('page', newPage);
    if (newLimit) params.set('limit', newLimit);
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    updateParams(newPage, limit);
  };

  const handleLimitChange = (newLimit) => {
    
    updateParams(1, newLimit);
  };

  return {
    page,
    limit,
    paginationMeta,
    setPaginationMeta,
    handlePageChange,
    handleLimitChange,
    paginationParams: { page, limit }
  };
};
