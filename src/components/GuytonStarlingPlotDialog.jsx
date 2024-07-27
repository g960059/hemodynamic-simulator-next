import React, { useState, useEffect } from 'react';
import { Dialog, Select, MenuItem, ToggleButtonGroup, ToggleButton, Popover, useMediaQuery } from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';
import ColorPicker from './ColorPicker';
import { getRandomColor } from '../styles/chartConstants';
import EditableText from './EditableText';
import { nanoid } from 'nanoid';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { useImmer } from 'use-immer';
import { Transition } from 'react-transition-group';


const GuytonStarlingPlotDialog = React.memo(({ open, onClose, initialView = null, updateView, patients }) => {
  const getDefaultView = () => ({
    id: nanoid(),
    name: "Guyton-Starling Plot",
    type: "GuytonStarlingPlot",
    hideTitle: false,
    items: [],
    options: {
      plotMode: '3D'
    }
  });

  const [view, setView] = useImmer(initialView || getDefaultView());
  const [viewItemAnchorEl, setViewItemAnchorEl] = useState(null);
  const [edittingIndex, setEdittingIndex] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [openNewItem, setOpenNewItem] = useState(false);
  const t = useTranslation();
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  useEffect(() => {
    if (initialView) {
      setView(initialView);
    } else {
      setView(getDefaultView());
    }
  }, [initialView]);

  const handlePlotModeChange = (event, newPlotMode) => {
    if (newPlotMode !== null) {
      setView(prev => ({
        ...prev,
        options: {
          ...prev.options,
          plotMode: newPlotMode
        }
      }));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  return (
    <Dialog
      fullScreen={!isUpMd}
      sx={{ ".MuiDialog-paper": { m: 0 } }}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <div className='sticky top-0 bg-white border-solid border-0 border-b border-slate-200 w-full p-3 pl-4 flex flex-row items-center justify-center'>
        <div className='text-base font-bold text-center inline-flex items-center'>
          <svg className='w-6 h-5 mr-1.5 stroke-blue-500' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
          {initialView ? "Edit Guyton-Starling Plot" : "Add New Guyton-Starling Plot"}
        </div>
        <div className='flex-grow' />
        <button onClick={onClose} type="button" className="bg-white cursor-pointer rounded-full pr-2 py-1 border-none inline-flex items-center justify-center">
          <svg className='stroke-slate-600 w-4 h-4' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className='w-full px-6 py-5'>
        <div className='text-base text-slate-500 font-bold'>設定</div>
        <hr className="mb-3 h-px border-0 bg-gray-300" />
        <div className='flex flex-row items-center w-full mt-1'>
          <div className='text-base'>タイトル</div>
          <div className='flex-grow' />
          <EditableText value={view?.name} updateValue={newTitle => setView(prev => ({ ...prev, name: newTitle }))} />
        </div>
        <div className='flex flex-row items-center w-full mt-4'>
          <div className='text-base'>プロットモード</div>
          <div className='flex-grow' />
          <ToggleButtonGroup
            value={view?.options?.plotMode}
            exclusive
            onChange={handlePlotModeChange}
            aria-label="plot mode"
          >
            <ToggleButton value="3D" aria-label="3D plot">
              3D
            </ToggleButton>
            <ToggleButton value="2D-LV" aria-label="2D LV plot">
              2D LV
            </ToggleButton>
            <ToggleButton value="2D-RV" aria-label="2D RV plot">
              2D RV
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div className='mt-7 text-base text-slate-500 font-bold'>表示モデル</div>
        <hr className="mb-3 h-px border-0 bg-gray-300" />
        <div className='w-full min-h-[320px]'>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
            if (over == null) return;
            if (active.id !== over.id) {
              setView(draft => {
                const oldIndex = draft.items.findIndex(item => item.id === active.id);
                const newIndex = draft.items.findIndex(item => item.id === over.id);
                draft.items = arrayMove(draft.items, oldIndex, newIndex);
              });
            }
          }}>
            <SortableContext items={view.items}>
              <div className="space-y-2">
                {view?.items?.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    index={index}
                    patients={patients}
                    setView={setView}
                    edittingIndex={edittingIndex}
                    setEdittingIndex={setEdittingIndex}
                    setOpenNewItem={setOpenNewItem}
                    setViewItemAnchorEl={setViewItemAnchorEl}
                    setActiveItemId={setActiveItemId}
                    viewItemAnchorEl={viewItemAnchorEl}
                    activeItemId={activeItemId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Transition in={!openNewItem} timeout={100}>
            {state => (            
              <div className={clsx("mt-4 border-solid rounded-lg", (state=="exiting" || state=="exited" || state=="entering") && "border-2 border-blue-500  ring-4 ring-sky-100",state =="entered" && "border border-slate-200")}>     
                <div onClick={() => { setOpenNewItem(true); setEdittingIndex(null); }}
                  className={ clsx(state== "entered" && "animate-in fade-in", state=="exiting" && "animate-out fade-out", (state=="exited" || state=="entering") && "hidden", "cursor-pointer py-2 px-4 text-base flex justify-center items-center hover:bg-slate-100 hover:border-slate-100 text-slate-600")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add new model
                </div>
                <div className={clsx(state=="exited" && "animate-in fade-in", state=="entering" && "animate-out fade-out", (state=="entered" || state=="exiting") && "hidden")}>
                  <EditableDataForm
                    patients={patients}
                    handleClose={() => { setOpenNewItem(false); }}
                    handleUpdate={(newItem) => {
                      setView(draft => {
                        draft.items.push({ ...newItem, id: nanoid() });
                      });
                      setOpenNewItem(false);
                    }}
                  />
                </div>
              </div>
            )}
          </Transition>                 
        </div>
        <div className='sticky bottom-0 bg-white w-full p-3 border-solid border-0 border-t border-slate-200 flex flex-row items-center justify-center md:justify-end space-x-4'>
          <div className='flex-grow'></div>
          <button type='button' onClick={onClose} className="py-2 px-4 w-full md:w-auto font-bold text-slate-600 bg-slate-100 cursor-pointer text-sm rounded-md flex justify-center items-center hover:bg-slate-200 transition">
            キャンセル
          </button>
          {view?.items?.length > 0 ?
            <button
              type='button'
              onClick={() => {
                updateView(view);
                if (!initialView) {
                  setView(getDefaultView());
                }
                onClose();
              }}
              className='bg-blue-500 text-white font-bold cursor-pointer w-full md:w-auto py-2 px-4 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
            >
              {initialView ? "更新する" : "追加する"}
            </button> : <button
              type='button'
              className=' bg-slate-200 text-slate-500 font-bold w-full md:w-auto py-2 px-4 text-sm rounded-md flex justify-center items-center border-none transition'
            >
              {initialView ? "更新する" : "追加する"}
            </button>
          }
        </div>
      </div>
    </Dialog>
  );
});
  
export default GuytonStarlingPlotDialog;
  
const SortableItem = ({ id, item, index, patients, setView, edittingIndex, setEdittingIndex, setOpenNewItem, setViewItemAnchorEl, setActiveItemId, viewItemAnchorEl, activeItemId }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Transition in={edittingIndex != index} timeout={100}>
      {state=>(
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={clsx("border-solid border rounded-lg overflow-hidden" , (state=="exiting" || state=="exited" || state=="entering") && "border-2 border-blue-500  ring-4 ring-blue-50",state =="entered" && "border border-slate-200")}>
          <div className={clsx("cursor-grab flex flex-row items-center justify-center  bg-slate-200 ", state== "entered" && "animate-in fade-in", state=="exiting" && "animate-out fade-out", (state=="exited" || state=="entering") && "hidden")}>
            <svg className="w-6 h-6" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DragIndicatorIcon"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
            <div onClick={() => { setEdittingIndex(index); setOpenNewItem(false); }} className='cursor-pointer bg-white rounded-lg pl-2 w-full flex items-center justify-center hover:bg-slate-100'>
              <div className='w-1 rounded-sm mr-3 py-3' style={{ backgroundColor: item.color }} />
              <div className='text-base'>{patients.find(p => p.id === item.patientId)?.name || "Unknown Model"}</div>
              <div className='flex-grow'></div>
              <div className='p-1 py-2 flex items-center' onClick={e => { e.stopPropagation(); setViewItemAnchorEl(e.currentTarget); setActiveItemId(item.id); }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </div>
              <Popover
                open={Boolean(viewItemAnchorEl) && activeItemId === item.id}
                anchorEl={viewItemAnchorEl}
                onClose={(e) => { e.stopPropagation(); setViewItemAnchorEl(null); setActiveItemId(null) }}
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
                disablePortal
                PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none', width: 'auto', maxWidth: 'none', } }}
              >
                <div className='flex flex-col items-center justify-center py-2 bg-white border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
                  <div onClick={() => { setEdittingIndex(index); setViewItemAnchorEl(null); setActiveItemId(null) }}
                    className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
                  >
                    <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); setView(draft => { draft.items.splice(index, 1) }); setViewItemAnchorEl(null); setActiveItemId(null) }}
                    className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </div>
                </div>
              </Popover>
            </div>
          </div>
          <div className={clsx(state=="exited" && "animate-in fade-in", state=="entering" && "animate-out fade-out", (state=="entered" || state=="exiting") && "hidden")}>
            <EditableDataForm
              key={item.id}
              initialItem={item}
              patients={patients}
              handleClose={() => { setEdittingIndex(null); }}
              handleUpdate={(newItem) => {
                setView(draft => {
                  draft.items[index] = newItem;
                  setEdittingIndex(null);
                });
              }}
            />
          </div>
        </div>
      )}
    </Transition>
  );
};
  
const EditableDataForm = ({ initialItem = null, patients, handleClose, handleUpdate }) => {
  const t = useTranslation();
  const [newItem, setNewItem] = useState(initialItem || {
    patientId: patients[0]?.id,
    color: getRandomColor()
  });

  return (
    <div className='flex flex-col items-center w-full rounded-lg p-2 '>
      <div className='flex flex-row items-center w-full'>
        <div className='text-base'>Model</div>
        <div className='flex-grow' />
        <Select
          variant="standard"
          disableUnderline
          id="chart-new-items"
          value={newItem.patientId}
          onChange={(e) => setNewItem(prev => ({ ...prev, patientId: e.target.value }))}
        >
          {patients.map(patient => (
            <MenuItem key={patient.id} value={patient.id}>{patient?.name || "無題のモデル"}</MenuItem>
          ))}
        </Select>
      </div>
      <div className='flex flex-row items-center w-full mt-1'>
        <div className='text-base'>Color</div>
        <div className='flex-grow min-w-[32px]' />
        <ColorPicker color={newItem.color} onChange={newColor => setNewItem(prev => ({ ...prev, color: newColor }))} />
      </div>
      <div className='w-full pl-3 mt-3 flex flex-row items-center justify-center'>
        <div className='flex-grow'></div>
        <button
          type='button'
          onClick={handleClose}
          className='bg-slate-100 text-slate-700 cursor-pointer py-2 px-3 text-sm rounded-md flex justify-center items-center hover:bg-slate-200 border-none transition'
        >
          Cancel
        </button>
        <button
          type='button'
          disabled={!newItem?.patientId}
          onClick={() => handleUpdate(newItem)}
          className='bg-blue-500 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer py-2 px-3 ml-3 text-sm rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition'
        >
          {initialItem ? "Update" : "Add"}
        </button>
      </div>
    </div>
  );
};