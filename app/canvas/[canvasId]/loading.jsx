import Layout from "../../../src/components/layout"
import Footer from "../../../src/components/Footer"

const LoadingSkelton = () => {
  return <>
      <Layout>
        <div className='w-full pb-3 animate-pulse'> 
          <div className='flex flex-row mx-3 md:mx-8 md:mt-5 md:mb-2 items-center justify-center'>
            <div className='bg-gray-200 w-32 h-10 rounded-md mx-5'></div>
            <div className='flex flex-row items-center justify-center'>
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className='ml-2 '>
                <div className="h-3 w-20 bg-gray-200 rounded-md mb-2" />
                <div className="h-3 w-10 bg-gray-200 rounded-md" />
              </div>
            </div>
            <div className='flex-grow'/>
          </div>
        </div>
        <div className='flex w-full h-[calc(100vh_-_250px)] flex-wrap items-center justify-center p-6 '>
          <div className="h-2/3 w-1/6 p-4 animate-pulse" >
            <div className='bg-gray-200 rounded-md w-full h-full'/>
          </div>
          <div className="h-2/3 w-4/6 p-4 animate-pulse" >
            <div className='bg-gray-200 rounded-md w-full h-full'/>
          </div>
          <div className="h-2/3 w-1/6 p-4 animate-pulse" >
            <div className='bg-gray-200 rounded-md w-full h-full'/>
          </div>
          <div className="h-1/3 w-1/2 p-4 animate-pulse" >
            <div className='bg-gray-200 rounded-md w-full h-full'/>
          </div>
          <div className="h-1/3 w-1/2 p-4 animate-pulse" >
            <div className='bg-gray-200 rounded-md w-full h-full'/>
          </div>
        </div>      
      </Layout>
      <hr className="border-0 border-b border-slate-200"/>
      <Footer/>
    </>
}

export default LoadingSkelton