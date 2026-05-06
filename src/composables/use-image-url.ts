export const useImageUrl = () => {
  return {
    ensureImageBaseUrl: (_args?: unknown) => 'http://localhost:8002',
    resolveImageUrl: (path?: unknown) =>
      `http://localhost:8002${String(path ?? '')}`,
  };
};
