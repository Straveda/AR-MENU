import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const usePagination = (defaultLimit = 10) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || defaultLimit;
  const [paginationMeta, setPaginationMeta] = useState(null);

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
