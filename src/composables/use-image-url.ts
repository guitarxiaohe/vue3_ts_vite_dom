export const useImageUrl = () => {
  return {
    ensureImageBaseUrl: (args?: any) => 'http://localhost:8002',
    resolveImageUrl: (args?: any) => 'http://localhost:8002' + args,
  };
};
