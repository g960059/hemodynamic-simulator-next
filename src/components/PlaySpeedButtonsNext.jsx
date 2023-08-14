import React, {useState, useEffect} from 'react';
import {Box, Button, IconButton, Stack, Typography, Menu, MenuItem,Tooltip, useMediaQuery,Popover} from '@mui/material'


import {PlayArrow,Pause,} from "@mui/icons-material";
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog';
import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'
import NeumoIconButton from '../elements/NeumoIconButton';


const PlaySpeedButtons = ({engine, removeView}) =>{
  const {isPlaying, setIsPlaying, setSpeed} = engine
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedAnchorEl, setSpeedAnchorEl] = useState(null);
  const [speedDisplayed, setSpeedDisplayed] = useState(1.0);
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});

    return (
      <div className='w-full h-full flex flex-col p-1'>
        <div className='flex w-full'>
          <div className='draggable cursor-move flex-grow'></div>
          <div className='py-1 pl-3 -mr-1 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => {setAnchorEl(e.currentTarget);}}>
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </div>
        </div>
        <div className='draggable cursor-move flex flex-wrap flex-grow w-full items-center justify-center'>
          <Tooltip title={isPlaying ? t['Pause']: t['Play']} className='m-2 -mt-5'>
            <button onClick={(e)=>{e.preventDefault();e.stopPropagation(); setIsPlaying(prev=>!prev)}} type="button" className=' bg-slate-100 stroke-slate-500 text-slate-500 cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'>
              {isPlaying ? <Pause/>:<PlayArrow/>}
            </button>
          </Tooltip>  
          <Tooltip title={t['PlaySpeed']} className='m-2  -mt-5'>
            <button onClick={(e)=>{e.preventDefault();e.stopPropagation(); setSpeedAnchorEl(e.currentTarget)}} type="button" id="speed-button" aria-controls="speed-items" aria-haspopup="true" aria-expanded={Boolean(anchorEl) ? 'true' : undefined} className=' bg-slate-100 stroke-slate-500 text-slate-500 cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'>
              x{speedDisplayed>=1 ? speedDisplayed.toFixed(1): speedDisplayed}
            </button>
          </Tooltip>
          <Menu
            id="speed-items"
            anchorEl={speedAnchorEl}
            open={Boolean(speedAnchorEl)}
            onClose={()=>{setSpeedAnchorEl(null)}}
            MenuListProps={{
              'aria-labelledby': 'speed-button',
            }}
          >
            {[0.25, 0.5, 0.75,1,2,5].map(s=>(
              <MenuItem onClick={()=>{setSpeed(s);setSpeedDisplayed(s); setSpeedAnchorEl(null);}} key={s}>{s==1 ? t['NormalSpeed']: s + t['SpeedRatio']}</MenuItem>
            ))}
          </Menu> 
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
            PaperProps={{style: {backgroundColor: 'transparent'}}}
          >
            <div className='flex flex-col items-center justify-center py-2 bg-white  border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
              <DeleteMenuItemWithDialog raw onDelete={()=>{removeView()}} onClose={()=>setAnchorEl(null)} message ={"再生・速度調整ボタンを削除しようとしています。この操作は戻すことができません。"}>
                <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
                  <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>                                
                  Delete
                </div>
              </DeleteMenuItemWithDialog>
            </div>
          </Popover>                 
        </div>
      </div>
    )

    // return <>
    //   <div onClick={()=>{setIsPlaying(prev=>!prev)}} className='bg-white px-1.5 m-1.5 mx-1 inline-flex items-center rounded cursor-pointer'>
    //     {isPlaying ? 
    //       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5  fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
    //         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    //       </svg> : 
    //       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
    //         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    //       </svg>          
    //     }
    //   </div>
    //   <div onClick={(e)=>{setAnchorEl(e.currentTarget)}} className="font-bold text-sm text-gray-500 bg-white px-1.5 m-1.5 ml-1 mr-2 inline-flex items-center rounded-sm cursor-pointer" id="speed-button" aria-controls="speed-items" aria-haspopup="true" aria-expanded={Boolean(anchorEl) ? 'true' : undefined}>
    //     x{speedDisplayed>=1 ? speedDisplayed.toFixed(1): speedDisplayed}
    //   </div>
    //   <Menu
    //     id="speed-items"
    //     anchorEl={anchorEl}
    //     open={Boolean(anchorEl)}
    //     onClose={()=>{setAnchorEl(null)}}
    //     MenuListProps={{
    //       'aria-labelledby': 'speed-button',
    //     }}
    //   >
    //     {[0.25, 0.5, 0.75,1,2,5].map(s=>(
    //       <MenuItem onClick={()=>{setSpeed(s);setSpeedDisplayed(s); setAnchorEl(null);}} key={s}>{s==1 ? t['NormalSpeed']: s + t['SpeedRatio']}</MenuItem>
    //     ))}
    //   </Menu>       
    // </>

}

export default PlaySpeedButtons