import React, { useState, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import Popover from '@mui/material/Popover';
import { lighten } from '@mui/system/colorManipulator';
import {COLORS as colors} from '../styles/chartConstants';


const ColorPicker = ({ color, onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const pickerRef = useRef(null);

  const handleColorClick = (newColor) => {
    onChange(newColor);
    setAnchorEl(null);
  };

  const handlePickerChange = (newColor) => {
    onChange(newColor);
  };

  const handlePickerClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div className="flex flex-wrap items-center justify-end space-x-1">
      {colors.map((c, index) => (
        <div
          key={index}
          className={`rounded-full p-0.5 flex justify-center items-center border-solid border-2 cursor-pointer transition-colors duration-200 ease-out `}
          style={{  borderColor: color === c ?lighten(c,.6) : 'transparent'}}
          onClick={() => handleColorClick(c)}
        >
          <div className='w-5 h-5 rounded-full flex justify-center items-center' style={{backgroundColor: c}}>
            {color === c && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="w-4 h-4  transform -translate-x-1/2 -translate-y-1/2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      ))}
      <div
        className={`rounded-full p-0.5 flex justify-center items-center border-solid border-2 cursor-pointer transition-colors duration-200 ease-out`}
        onClick={handlePickerClick}
        style={{ borderColor: colors.includes(color) ? 'transparent' : lighten(color,.6)}}
      >
        <div className='w-5 h-5 rounded-full flex justify-center items-center' style={{background: 'conic-gradient(from 90deg at 50% 50%,#b85ebf 0deg,#4882ab 61.83deg,#44bffc 121.33deg,#62c276 .498turn,#ffb024 238.04deg,#f75496 299.18deg,#fa4529 1turn)'}}>
          {!colors.includes(color) && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="white" className="w-4 h-4  transform -translate-x-1/2 -translate-y-1/2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div className="p-4">
          <HexColorPicker color={color} onChange={handlePickerChange} ref={pickerRef} />
        </div>
      </Popover>
    </div>
  );
};

export default ColorPicker;