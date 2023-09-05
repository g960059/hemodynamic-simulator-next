const CanvasItemSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="w-full flex flex-col py-3 px-4 bg-gray-100 cursor-pointer border border-solid border-gray-300 rounded-md">
        <div className="flex flex-row items-center">
          <div className="h-8 w-8 rounded-full bg-gray-300"></div>
          <div className="ml-2">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="mt-2 h-4 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="flex-grow"></div>
        </div>
        <div className="ml-10 mt-2">
          <div className="h-6 bg-gray-300 rounded w-2/3"></div>
          <div className="mt-2 flex flex-row space-x-2">
            <div className="h-4 bg-gray-300 rounded w-12"></div>
            <div className="h-4 bg-gray-300 rounded w-12"></div>
          </div>
        </div>
        <div className="flex-grow"></div>
        <div className="ml-10 mt-2 flex items-center justify-start">
          <div className="h-4 bg-gray-300 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};

export default CanvasItemSkeleton;