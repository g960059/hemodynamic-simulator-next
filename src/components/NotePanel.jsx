'use client';

import React,{useState, useEffect, useRef} from 'react';
import {Popover} from '@mui/material'

import { BlockNoteView, useBlockNote, ReactSlashMenuItem, getDefaultReactSlashMenuItems,createReactBlockSpec,InlineContent,lightDefaultTheme } from "@blocknote/react";
import { defaultBlockSchema, defaultProps} from "@blocknote/core";
import "@blocknote/core/style.css";
import { useDebounce } from '../hooks/index';

import {useTranslation} from '../hooks/useTranslation'
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog'
import NoteDialog from './NoteDialog';
import { nanoid } from 'nanoid';
import {db, storage} from '../utils/firebase'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import {RiImage2Fill} from 'react-icons/ri'
import { useImmer } from 'use-immer';

const theme = {
  ...lightDefaultTheme,
  componentStyles: (theme) => ({
    Editor: {
      overflow: 'scroll',
      height: '100%',
    },
  }),
}


const NotePanel = React.memo(({ view = null,updateView,removeView, isOwner,caseData, setCaseData}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [content, setContent] = useImmer(view?.content ? view?.content : [{id:nanoid(),type:"paragraph",props:{textColor:"default",backgroundColor:"default",textAlignment:"left"},content:[],children:[]}])
  const debouncedContent = useDebounce(content, 250);

  const uploadImageToStorage = async (file) => {
    const imageRef = ref(storage, `images/${caseData.id}/${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  }
  
  function ImageResizer({ src, alt, widthPercentage: initialWidthPercentage, onSizeChange }) {
    const [widthPercentage, setWidthPercentage] = useState(initialWidthPercentage);
    const containerRef = useRef(null);
    const imageRef = useRef(null);
  
    const handleMouseDown = (e) => {
      const startX = e.clientX;
      const startWidth = imageRef.current.offsetWidth;
  
      const handleMouseMove = (e) => {
        const newWidth = startWidth + (e.clientX - startX);
        const containerWidth = containerRef.current.offsetWidth;
        const newWidthPercentage = (newWidth / containerWidth) * 100;
        setWidthPercentage(newWidthPercentage);
        onSizeChange && onSizeChange(newWidthPercentage);
      };
  
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
  
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  
    return (
      <div ref={containerRef} className="relative inline-block w-full" >
        <div ref={imageRef} className='group cursor-default relative mx-auto block border border-solid border-slate-200' style={{ width: `${widthPercentage}%` }}>
          <img 
            src={src} 
            alt={alt} 
            className="block mx-auto w-full "
          />
          <div 
            className="flex justify-center items-center absolute top-0 w-5 h-full cursor-col-resize left-0"
            onMouseDown={handleMouseDown}
          >
            <div className='opacity-0 group-hover:opacity-100 transition-opacity w-2 h-10 border border-solid border-blue-500 bg-blue-50 rounded'/>
          </div>
          <div 
            className="flex justify-center items-center absolute top-0 w-5 h-full cursor-col-resize right-0"
            onMouseDown={handleMouseDown}
          >
            <div className='opacity-0 group-hover:opacity-100 transition-opacity w-2 h-10 border border-solid border-blue-500 bg-blue-50 rounded'/>
          </div>
        </div>
      </div>
    );
  }
  
  const ImageBlock = createReactBlockSpec({
    type: 'image',
    propSchema: {
      ...defaultProps,
      src: { default: 'https://via.placeholder.com/1000' },
      alt: { default: 'image' },
      width: { default: 60 },
    },
    containsInlineContent: true,
    render: ({ block }) => (
      <div id="image-wrapper">
        <ImageResizer 
          src={block.props.src} 
          alt={block.props.alt} 
          widthPercentage={block.props.width}
          onSizeChange={(newWidthPercentage) => {
            setContent(draft =>{
              const index = draft.findIndex(item => item.props?.id === block.props?.id);
              console.log(block)
              console.log(content)
              console.log(newWidthPercentage,index)
              draft[index].props.width = newWidthPercentage || 60;
            });
            editor.updateBlock(block, { props: { width: newWidthPercentage || 60 } })
          }}
        />
        <InlineContent />
      </div>
    ),
  });
  
  const insertImageMenuItem = {
    name: 'Insert Image',
    execute: async (editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        if (!input.files?.length) return;
        const file = input.files[0];
        const src = await uploadImageToStorage(file);
        const id = nanoid();
        editor.insertBlocks(
          [{id, type: 'image', props: {src, alt: file.name, width:60 } }],
          editor.getTextCursorPosition().block,
          'after'
        );
        setContent(draft =>{
          draft.push({ id, type: 'image', props: { src, alt: file.name, width:60 } })
        })
        
        await updateDoc(doc(db,'canvas',caseData.id),{allImagesInStorage: arrayUnion(src)})
        setCaseData(draft=>{
          draft.allImagesInStorage.push(src)
        })
      };
      input.click();
    },
    aliases: ['image', 'img', 'picture', 'media'],
    group: 'Media',
    icon: <RiImage2Fill/>,
    hint: 'Insert an image',
  };
  
  const customSchema = {
    ...defaultBlockSchema,
    image: ImageBlock,
  }

  const editor = useBlockNote({
    initialContent: content,
    editable: isOwner,
    onEditorContentChange : (editor) => {
      setContent(editor?.topLevelBlocks)
    },
    blockSchema: customSchema,
    slashMenuItems: [
      ...getDefaultReactSlashMenuItems(customSchema),
      insertImageMenuItem,
    ],
  });

  useEffect(() => {
    updateView({...view, content: content})
  }, [debouncedContent]);

  return <>
    <div className='w-full h-full '>
      <div className='flex items-center p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200 relative h-10'>
        <div className='draggable cursor-move font-bold text-lg pl-1'>{view?.name || "Note"}</div>
        <div className='draggable cursor-move flex-grow h-full'></div>
        {isOwner && <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget)}}>
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
        </div>}
      </div>
      <div className='w-full h-[calc(100%_-_48px)] relative '>
        <BlockNoteView editor={editor}  theme={theme} />
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
        <div onClick={()=> {setDialogOpen(true); setAnchorEl(null)}} 
          className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
        >
          <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit
        </div>
        <DeleteMenuItemWithDialog raw onDelete={()=>{removeView()}} onClose={()=>setAnchorEl(null)} message ={"「"+(view?.name || "Note") + "」を削除しようとしています。この操作は戻すことができません。"}>
          <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
            <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>                                
            Delete
          </div>
        </DeleteMenuItemWithDialog>
      </div>
    </Popover>
    <NoteDialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} initialView={view} updateView={(newView)=>{updateView({id:view.id, ...newView});}} />
  </>
})

export default NotePanel;



