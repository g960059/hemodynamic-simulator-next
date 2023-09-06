'use client';

import React,{useState, useEffect, useRef} from 'react';
import {Popover, useMediaQuery} from '@mui/material'

import { BlockNoteView, useBlockNote, ReactSlashMenuItem, getDefaultReactSlashMenuItems,createReactBlockSpec,InlineContent,lightDefaultTheme } from "@blocknote/react";
import { defaultBlockSchema, defaultProps} from "@blocknote/core";
import "@blocknote/core/style.css";
import { useDebounce } from '../hooks/index';
import DeleteMenuItemWithDialog from './DeleteMenuItemWithDialog'
import NoteDialog from './NoteDialog';
import { nanoid } from 'nanoid';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { arrayUnion, doc, getFirestore, updateDoc } from "firebase/firestore";
import {RiImage2Fill} from 'react-icons/ri'
import { useImmer } from 'use-immer';
import { InlineMath, BlockMath } from 'react-katex';
import TextareaAutosize from 'react-textarea-autosize';
import 'katex/dist/katex.min.css';




const NoteViewer = React.memo(({ view = null,updateView,removeView, isOwner,caseData, setCaseData}) => {
  const db = getFirestore()
  const storage = getStorage()
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [content, setContent] = useImmer(view?.content ? view?.content : [{id:nanoid(),type:"paragraph",props:{textColor:"default",backgroundColor:"default",textAlignment:"left"},content:[],children:[]}])
  const [mathPopoverAnchor, setMathPopoverAnchor] = useState(null);
  const [currentEquation, setCurrentEquation] = useState("");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [newMathBlockInserted, setNewMathBlockInserted] = useState(false);
  const debouncedContent = useDebounce(content, 250);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  
  const theme = {
    ...lightDefaultTheme,
    componentStyles: (theme) => ({
      Editor: {
        overflow: 'scroll',
        height: '100%',
        ".ProseMirror":{
          padding: isUpMd ? "0px 16px": "0px 12px",
        }
      },
    }),
  }

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
              draft[index].props.width = newWidthPercentage || 60;
            });
            editor.updateBlock(block, { props: { width: newWidthPercentage || 60 } })
          }}
        />
        <InlineContent />
      </div>
    ),
  });
  

  const MathBlock = createReactBlockSpec({
    type: "math",
    propSchema: {
      equation: {
        default: "\\int_0^\\infty x^2 dx",
      },
    },
    containsInlineContent: false,
    render: ({ block }) => (
      <div
        id = {block.id}
        onClick={(e) => {
          setSelectedBlock(block);
          setCurrentEquation(block.props.equation);
          setMathPopoverAnchor(e.currentTarget);
        }}
        className='w-full h-full flex items-center justify-center p-2  [&>div]:w-full'
      >
        <BlockMath math={block.props.equation} />
        {block.props.equation === "" && <div className=' text-sm text-slate-400 px-3 py-2 flex flex-row items-center justify-center'>
          <svg role="graphics-symbol" viewBox="0 0 32 21" className=' w-6 h-6 stroke-slate-300 mr-2' ><g> <g id="d7fc5246-3c04-467c-8f25-6c129c5642ac" data-name="tex"> <g id="ec363c67-067d-4da0-8c27-f8d029e068bd" data-name="E"> <path id="e1948427-1829-4c96-a9f4-14a99a3d5b97" data-name="path0 fill" d="M497.33,497.82c-1.2,0-2.11-.06-3-0.06a0.5,0.5,0,0,0-.55.27c0,0.15.17,0.23,0.57,0.32a1.08,1.08,0,0,1,1.06,1.23c0,0.55,0,1,0,3.32s-0.08,4.43-.13,5.21c-0.08,1-.42,1.2-1.39,1.41a0.59,0.59,0,0,0-.53.32c0,0.21.23,0.25,0.59,0.25,0.7,0,1.08-.09,2.13-0.09,2.76,0,6,.13,6.21.13a0.7,0.7,0,0,0,.36-0.21,14.63,14.63,0,0,0,.68-2.07c0-.21,0-0.53-0.15-0.53a0.78,0.78,0,0,0-.48.55,2.41,2.41,0,0,1-1.54,1.41,9,9,0,0,1-1.8.15,10.57,10.57,0,0,1-1.69-.13,0.74,0.74,0,0,1-.38-0.44,7,7,0,0,1-.15-1.56c0-.78,0-2.49.06-2.93a0.26,0.26,0,0,1,.17-0.17c0.53,0,1.29,0,1.9,0,1.06,0.06,1.18.13,1.44,1a0.52,0.52,0,0,0,.32.4c0.15,0,.23-0.19.23-0.53s-0.06-.68-0.06-1.2,0-.84.06-1.35c0-.17,0-0.46-0.17-0.46a0.54,0.54,0,0,0-.36.42c-0.34.87-.38,0.93-2.09,0.93h-1.27a0.18,0.18,0,0,1-.17-0.17c0-.44,0-3.84.08-4.29a0.5,0.5,0,0,1,.27-0.55,21.09,21.09,0,0,1,2.7.1,1.4,1.4,0,0,1,1.25,1.31,0.54,0.54,0,0,0,.3.47,0.46,0.46,0,0,0,.3-0.51c0-.38,0-1.08,0-1.84a0.28,0.28,0,0,0-.17-0.23,14.12,14.12,0,0,1-1.75.08h-2.81Z" transform="translate(-484.44 -490.06)"></path> </g> <g id="8dfbf0a9-85f0-49da-99d8-6229354b9534" data-name="T"> <path id="8602b8e9-f5d6-42d3-88c6-0649b350ce04" data-name="path1 fill" d="M490.48,490.82c-2.18,0-3.91-.06-4.39-0.11a1.32,1.32,0,0,1-.68-0.34,0.85,0.85,0,0,0-.3-0.3,0.39,0.39,0,0,0-.28.32,19.85,19.85,0,0,1-.38,2.55,0.4,0.4,0,0,0,.23.42c0.08,0,.19,0,0.38-0.42a5.64,5.64,0,0,1,.61-1,1.72,1.72,0,0,1,1.35-.44c0.32,0,1.94,0,2.3.09a0.26,0.26,0,0,1,.17.25v2.26c0,1.46-.09,5.3-0.13,6.44-0.06,1.41-.11,1.71-1.41,2a0.47,0.47,0,0,0-.38.34c0,0.11.19,0.23,0.57,0.23s1.33-.13,2.22-0.13,2.13,0.1,2.28.1,0.53,0,.53-0.25a0.65,0.65,0,0,0-.49-0.34c-1.22-.25-1.31-0.53-1.39-1.33s-0.1-2.6-.1-4.81c0-1.63,0-3.61,0-4.5a0.35,0.35,0,0,1,.15-0.25c0.29-.06,2.26-0.06,2.6,0,1.12,0.06,1.37.15,1.5,1.16,0.06,0.48.15,0.61,0.28,0.61a0.43,0.43,0,0,0,.32-0.38,11.69,11.69,0,0,1,.42-2.2c0.1-.27,0-0.44-0.09-0.44a0.72,0.72,0,0,0-.28.13,2.49,2.49,0,0,1-1.33.32C494,490.8,491.49,490.82,490.48,490.82Z" transform="translate(-484.44 -490.06)"></path> </g> <g id="88168da7-a35d-4a6e-af2a-2bab78b9d062" data-name="X"> <path id="f33958e3-fb20-476c-b2a8-674ffe821a96" data-name="path2 fill" d="M504,491a0.52,0.52,0,0,0,.51.36,3,3,0,0,1,1.84,1.14,53.54,53.54,0,0,1,3,4.73,0.22,0.22,0,0,1-.06.27c-1.14,1.58-2.22,2.87-3,3.72a4.47,4.47,0,0,1-2.22,1.27c-0.51.1-.7,0.27-0.7,0.44s0.15,0.21.51,0.21,1.2-.1,2-0.1c0.61,0,1.48.06,2,.06,0.25,0,.46-0.08.46-0.27a0.53,0.53,0,0,0-.46-0.32c-0.74-.27-1-0.47-0.17-1.82,0.53-.78,1.44-2,2.05-2.72a0.15,0.15,0,0,1,.19,0c0.23,0.21,2.09,3.17,2.53,4a0.26,0.26,0,0,1-.08.34,3.18,3.18,0,0,1-.68.23c-0.32.11-.42,0.19-0.42,0.34s0.11,0.25.47,0.25,1-.08,1.58-0.08c1.12,0,2.17.11,2.79,0.11,0.42,0,.57-0.09.57-0.25a0.49,0.49,0,0,0-.44-0.36,3.37,3.37,0,0,1-2.34-1.73c-0.49-.67-2.7-4-2.83-4.31a0.45,0.45,0,0,1,0-.23c0.91-1.27,2.17-2.7,2.85-3.52a3.79,3.79,0,0,1,2.38-1.41,0.5,0.5,0,0,0,.44-0.34,0.44,0.44,0,0,0-.46-0.21c-0.44,0-1.56.06-2,.06s-1.12,0-1.69,0c-0.36,0-.53.1-0.53,0.25a0.49,0.49,0,0,0,.48.34c0.67,0.13,1,.34.72,0.89a32.86,32.86,0,0,1-2.53,3.44,0.14,0.14,0,0,1-.19,0,33.44,33.44,0,0,1-2.3-3.63c-0.21-.38,0-0.59.34-0.68s0.46-.21.46-0.36a0.43,0.43,0,0,0-.47-0.21c-0.55,0-.91,0-1.63,0s-2-.1-2.39-0.1S504,490.84,504,491Z" transform="translate(-484.44 -490.06)"></path> </g> </g> </g></svg>
          Add a Tex equation
        </div>}    
      </div>
    ),
  });


  
  const customSchema = {
    ...defaultBlockSchema,
    image: ImageBlock,
    math: MathBlock,
  }

  const editor = useBlockNote({
    initialContent: content,
    editable: false,
    blockSchema: customSchema,
  });






  return <>
    <div className='w-full h-full '>
      <div className='flex items-center pt-2 pb-1 px-3  mb-2 border-solid border-0 border-b border-b-slate-200 relative min-h-10'>
        <div className='font-bold text-base md:text-lg pl-1 whitespace-wrap'>{view?.name || "Note"}</div>
        <div className='flex-grow h-full'></div>
      </div>
      <div className='w-full relative h-[calc(100%_-_50px)] overflow-y-auto'>
        <BlockNoteView editor={editor}  theme={theme} />
      </div>
    </div>
 
  </>
})

export default NoteViewer;



