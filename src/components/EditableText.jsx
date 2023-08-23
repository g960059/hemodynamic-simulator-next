import { useState, useRef, useEffect } from 'react';
const EditableText = ({value, updateValue, inputArgs={}, textArgs={}}) => {
  const [isEditing, setEditing] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
      if (isEditing) {
          inputRef.current.focus();
      }
  }, [isEditing]);
  const handleKeyDown = (event) => {
      const { key } = event;
      switch (key) {
          case "Enter":
              setEditing(false);
              break;
      }
  }
  const handleBlur = () => {
      setEditing(false);
  }
  const handleChange = (e) => {
      updateValue(e.target.value);
  }
  const handleClick = () => {
      setEditing(true);
  }
  return (
    <div>
        <input
            ref={inputRef}
            type="text"
            className="appearance-none p-2 border-solid border-1 rounded-md bg-slate-100 border-slate-200 focus:outline focus:border-blue-500 focus:outline-2 focus:outline-[#bfdcff] "
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            {...inputArgs}
        />
          
    </div>
  )
}
export default EditableText