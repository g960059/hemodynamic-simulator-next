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
          {isEditing ? (
              <input
                  ref={inputRef}
                  type="text"
                  className="appearance-none p-2 border-solid border-2 rounded  focus:border-blue-500 focus:outline-none "
                  value={value}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  {...inputArgs}
              />
          ) : (
              <div onClick={handleClick} className="cursor-pointer pb-1.5 pt-[5px] px-2 rounded  hover:bg-slate-100 " {...textArgs}>{value}</div>
          )}
      </div>
  )
}
export default EditableText