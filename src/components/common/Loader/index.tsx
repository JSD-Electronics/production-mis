const Loader = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-transparent backdrop-blur-sm fixed inset-0 z-[9999]">
      <div className="relative">
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent shadow-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20 backdrop-blur-md"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
