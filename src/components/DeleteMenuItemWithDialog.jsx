import React,{useState} from 'react';
import {Button,Dialog,DialogContent,DialogActions,DialogTitle,ListItemText,MenuItem,DialogContentText} from '@mui/material'


const DeleteMenuItemWithDialog = React.memo(({onDelete,message,onClose,messageTitle="削除しますか", raw=false, children}) => {
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  const handleOpen = () => {
    setOpen(true);
  };
  return <>
    {!raw ?
      <MenuItem onClick={handleOpen} >
        <ListItemText primary="削除する" />
      </MenuItem> :
      <div onClick={handleOpen} className='w-full'>
        {children}
      </div>
    }
    <Dialog open={open} onClose={handleClose} maxWidth="xs">
      <DialogTitle sx={{fontWeight:"bold", display:"flex", justifyContent:"center",pt:3}}>{messageTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{whiteSpace: "pre-wrap"}}>
          {message}
        </DialogContentText>
      </DialogContent>  
      <DialogActions sx={{display:"flex", justifyContent:"space-evenly",pb:3}}>
        <Button onClick={handleClose} color="secondary" variant="outlined" >
          キャンセル
        </Button>
        <Button variant="contained" className='text-white font-bold' onClick={()=>{onDelete();handleClose()}} color="primary" autoFocus>
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  </>
})

export default  DeleteMenuItemWithDialog