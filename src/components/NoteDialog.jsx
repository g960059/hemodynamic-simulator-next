import React, {useState} from 'react';
import {Dialog,Grow,Popover,MenuItem,Select,useMediaQuery} from '@mui/material'
import EditableText from './EditableText';
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid';

const NoteDialog = React.memo(({open, onClose, initialView=null, updateView}) =>{
  const [view, setView] = useImmer(initialView || {name: "Note", type: "Note", content:[{id:nanoid(),type:"paragraph",props:{textColor:"default",backgroundColor:"default",textAlignment:"left"},content:[],children:[]}]});
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return <>
    <Dialog fullScreen={!isUpMd} sx={{ ".MuiDialog-paper": {m:0}}} open ={open} onClose ={onClose}>
      <div className='sticky top-0 md:min-w-[460px] bg-white border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='text-base font-bold text-center inline-flex items-center'>
          <svg className='w-6 h-5 mr-1.5 stroke-blue-500' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
          </svg>   
          {initialView ? "Edit Note" : "Add New Note"}  
        </div>
        <div className='md:w-60 flex-grow'/>
        <button onClick={onClose} type="button" className="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center ">
          <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className='w-full px-6 py-5 mb-10'>
        <div className='text-base text-slate-500 font-bold '>設定</div>
        <hr className="mb-3 h-px border-0 bg-gray-300" />
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>タイトル</div>
          <div className='flex-grow'/>
          <EditableText value={view?.name} updateValue={newTitle=>{setView(draft=>{draft.name=newTitle})}}  />
        </div>             
      </div>  
      <div className='sticky bottom-0 bg-white w-full p-3 border-solid border-0 border-t border-slate-200 flex flex-row items-center justify-center md:justify-end space-x-4'>
        <button  type='button' onClick={onClose} className="py-2 px-4 w-full md:w-auto font-bold text-slate-600 bg-slate-100 cursor-pointer text-sm rounded-md flex justify-center items-center  hover:bg-slate-200 transition">
          キャンセル
        </button>
        { view?.name != initialView?.name ? 
          <button 
            type='button' 
            onClick={()=>{
              updateView(view)
              if(!initialView){
                setView({name: "Metrics", type: "Metrics", items:[]})
              }
              onClose()
            }} 
            className='bg-blue-500 text-white font-bold cursor-pointer w-full md:w-auto py-2 px-4 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
          >
            {initialView ? "更新する" : "追加する"}
          </button>: <button 
            type='button' 
            disabled
            className='bg-slate-200 text-slate-500 font-bold w-full md:w-auto  py-2 px-4 text-sm rounded-md flex justify-center items-center  border-none transition'
          >
            {initialView ? "更新する" : "追加する"}
          </button>
        }
      </div>
    </Dialog>
  </>
})

export default NoteDialog;


