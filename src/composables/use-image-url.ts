export const useImageUrl = () => {
  return {
    ensureImageBaseUrl: (_args?: unknown) =>
      import.meta.env.VITE_BASE_URL || '',
    resolveImageUrl: (path?: unknown) =>
      `${import.meta.env.VITE_BASE_URL}${String(path ?? '')}`,
  };
};
