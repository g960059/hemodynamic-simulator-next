import  { useState,  useEffect, memo } from 'react';
const EditableText = memo(({value, updateValue, ...props}) => {
    const [localValue, setLocalValue] = useState(value);

    const handleKeyDown = (e) => {
        if (e.key == "Enter") {
            updateValue(localValue);
            e.currentTarget.blur();
        }
    }
    const handleBlur = () => {
        updateValue(localValue);
    }

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            type="text"
            className={"appearance-none p-2 border-solid border-1 rounded-md bg-slate-100 border-slate-200 focus:outline focus:border-blue-500 focus:outline-2 focus:outline-[#bfdcff]"}
            value={localValue}
            onChange={e =>{setLocalValue(e.target.value)}}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            {...props}
        />
    )
})
export default EditableText