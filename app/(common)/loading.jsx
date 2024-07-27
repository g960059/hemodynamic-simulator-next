import CanvasItemSkeleton from "../../src/components/CanvasItemSkeleton"

const Loading = () =>{
  return <>
    <div className='w-full sticky top-0 bg-white mx-auto md:px-10 text-base font-medium text-center text-slate-500 border-solid border-0 border-b border-slate-200'>
      <div className='flex flex-nowrap flex-row justify-center md:justify-start items-center overflow-x-auto -mb-px max-w-7xl '>
        <div  className="flex flex-row items-center justify-center text-sm px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2  text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300">
          <svg className='w-5 h-5 mr-1 hidden md:block' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
          </svg>
          トレンド
        </div>
        <div  className="flex flex-row items-center justify-center text-sm px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300">
          <svg className='w-5 h-5 mr-1 hidden md:block' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          マイページ  
        </div>
        <div className="flex flex-row items-center justify-center text-sm px-4 py-2 cursor-pointer transition-all duration-200  border-0 border-solid border-b-2 text-slate-400 border-transparent hover:font-bold hover:text-slate-700 hover:border-gray-300">
          <svg className='w-5 h-5 mr-1 hidden md:block' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          あとで読む 
        </div> 
      </div>
    </div>
    <div className='max-w-4xl w-full mx-auto py-4 md:py-10 px-4 min-h-[440px]'>
      <div className="grid md:grid-cols-2 gap-4 md:gap-8">
        {
          [1,2,3,4,5,6,7,8].map(i=><CanvasItemSkeleton key={i}/>)
        }
      </div> 
    </div>
  </>
}



export default Loading