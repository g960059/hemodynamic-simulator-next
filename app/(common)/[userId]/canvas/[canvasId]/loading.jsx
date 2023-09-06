const LoadingSkelton = () => {
  return <>
        <div className='w-full pb-3 animate-pulse'> 
          <div className='w-full flex flex-col space-y-4  mt-5 md:mx-8 items-start justify-center'>
            <div className='bg-gray-200 w-2/3 md:w-1/3 h-7 md:h-7 rounded-md mx-5'></div>
            <div className='flex flex-row items-center justify-center mx-5'>
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className='ml-2 '>
                <div className="h-3 w-32 bg-gray-200 rounded-md mb-2" />
                <div className="h-3 w-10 bg-gray-200 rounded-md" />
              </div>
            </div>
            <div className='flex-grow'/>
          </div>
        </div>
        <div className='animate-pulse px-7 flex flex-col  md:flex-row w-full md:h-[calc(100vh_-_250px)] md:flex-wrap items-center justify-center overflow-auto '>
          <div className="h-60 md:h-2/3 w-full  md:w-1/6 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 md:h-2/3 w-full  md:w-4/6 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 md:h-2/3 w-full  md:w-1/6 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 w-full  md:w-1/2 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
          <div className="h-60 w-full  md:w-1/2 px-1 py-2 md:p-4">
            <div className="bg-gray-200 rounded-md w-full h-full"/>
          </div>
        </div>        
    </>
}

export default LoadingSkelton