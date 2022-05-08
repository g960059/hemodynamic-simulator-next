import React, { useRef, useState, useEffect, useCallback} from 'react'
import Popover from '@mui/material/Popover';
import { makeStyles} from '@mui/styles';
import { HexColorPicker } from "react-colorful";

const usePickerStyle = makeStyles((theme) => ({
  picker: {
    position: "relative",
  },
  swatch: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "3px solid #fff",
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
  },
  popover: {
    position: "absolute",
    top: "calc(100% + 2px)",
    left: "0",
    borderRadius: "9px",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
  }
}))

export const PopoverPicker = ({ color, onChange }) => {
  const classes = usePickerStyle()
  const [anchorEl, setAnchorEl] = React.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);


  return (
    <div className={classes.picker}>
      <div
        className={classes.swatch}
        style={{ backgroundColor: color }}
        onClick={handleClick}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        sx={{"& .MuiPaper-root":{p:1,boxShadow: "none",backgroundColor: "transparent"}}}
      >
        <HexColorPicker color={color} onChange={onChange} />
      </Popover>
    </div>
  );
};


