import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Popover } from '@mui/material'
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog'
import {formatDateDiff} from '../utils/utils'
import Image from 'next/image'

const CanvasItem = ({canvasItem,removeCanvas=null, isOwner=false}) => {
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    router.prefetch(`/canvas/${canvasItem?.id}`)
  }, []);


  return <>
    <div key={canvasItem?.id} onClick={(e)=>{e.preventDefault();e.stopPropagation();router.push(`/canvas/${canvasItem?.id}`)}}  className="w-full flex flex-col py-3 px-4 bg-white cursor-pointer border border-solid border-slate-200 rounded-md overflow-hidden hover:shadow transition">
      <div className='flex flex-row items-center'>
        {canvasItem?.photoURL ?
          <div className="h-8 w-8 rounded-full overflow-hidden" onClick={(e)=>{e.stopPropagation(); router.push(`/users/${canvasItem.userId}`)}}>
            <Image src={canvasItem?.photoURL} height="32" width="32" alt="userPhoto"/>
          </div> :
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={(e)=>{e.stopPropagation();router.push(`/users/${canvasItem.userId}`)}}>
            <span className="text-xs font-medium leading-none text-white">{canvasItem?.displayName[0]}</span>
          </div>
        }
        <div className='ml-2 text-slate-500' >
          <div onClick={(e)=>{e.stopPropagation(); router.push(`/users/${canvasItem.userId}`)}} className='text-sm font-medium no-underline hover:underline text-slate-500'>
              {canvasItem?.displayName}
          </div>
          <div className='flex flex-row items-center justify-between'>
            <span className='text-sm font-medium '>{ formatDateDiff(new Date(), new Date(canvasItem?.updatedAt?.seconds * 1000)) } </span>
          </div>
        </div>
        <div className='flex-grow'/>
        {isOwner && <div className='p-1 px-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => {e.stopPropagation(); setAnchorEl(e.currentTarget)}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>}
      </div>
      <div className='ml-10 mt-2' >
        <div onClick={(e)=>{e.preventDefault();e.stopPropagation();router.push(`/canvas/${canvasItem?.id}`)}} className='font-bold text-xl text-slate-800 no-underline hover:underline'>
            {canvasItem?.name || "Untitled"}
        </div>
        <div className='flex flex-row items-center justify-start mt-2'>
          {canvasItem.tags?.map(tag=><span class="inline-flex items-center gap-1.5 py-1 px-2 mr-2 rounded-md text-xs font-medium bg-slate-100 text-slate-800">{tag}</span>)}
        </div>
      </div>
      <div className='flex-grow'/>
      <div className='ml-10 mt-2 flex items-center justify-center'>
        <span className='mr-3 text-sm flex flex-row items-center justify-start text-slate-500'>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className='text-sm ml-0.5'>{canvasItem?.totalLikes || 0}</span>
        </span>
        <span className='text-sm flex flex-row items-center justify-start text-slate-500'>
            <svg xmlns="http://www.w3.org/2000/svg" strokeWidth={1.5} className="h-4 w-4 md:h-5 md:w-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          <span className='text-sm ml-0.5'>{canvasItem?.totalBookmarks || 0}</span>
        </span>        
        <div className='flex-grow'/>
        {
          isOwner && (
            canvasItem.visibility=="public" ?  
              <span class="inline-flex items-center py-1 px-2 rounded-md text-xs font-medium text-blue-500 border border-solid border-blue-500">公開中</span> :
              <span class="inline-flex items-center py-1 px-2 rounded-md text-xs font-medium text-slate-400 border border-solid border-slate-300">下書き</span>
          )
        }
      </div>
    </div>
    <Popover 
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={(e)=>{setAnchorEl(null)}}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      elevation={0}
      marginThreshold={0}
    >
      <div className='flex flex-col items-center justify-center py-2 bg-white  border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
        <div onClick={()=> {router.push(`/canvas/${canvasItem?.id}`); setAnchorEl(null)}} 
          className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
        >
          <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit
        </div>
        <DeleteMenuItemWithDialog raw onDelete={()=>{if(isOwner) removeCanvas(canvasItem?.id);}} onClose={()=>setAnchorEl(null)} message ={"「"+(canvasItem?.name || "Untitled") + "」を削除しようとしています。この操作は戻すことができません。"}>
          <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>                                
            Delete
          </div>
        </DeleteMenuItemWithDialog>
      </div>
    </Popover>    
  </>
}

export default CanvasItem;