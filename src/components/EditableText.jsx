import { useState, useEffect, useRef, memo } from 'react';

const EditableText = memo(({value, updateValue, ...props}) => {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef(null);
    const isComposingRef = useRef(false);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !isComposingRef.current) {
            updateValue(localValue);
            e.currentTarget.blur();
        }
    }

    const handleBlur = () => {
        updateValue(localValue);
    }

    const handleCompositionStart = () => {
        isComposingRef.current = true;
    }

    const handleCompositionEnd = () => {
        isComposingRef.current = false;
    }

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            ref={inputRef}
            type="text"
            className="appearance-none p-2 border-solid border-1 rounded-md bg-slate-100 border-slate-200 focus:outline focus:border-blue-500 focus:outline-2 focus:outline-[#bfdcff]"
            value={localValue}
            onChange={e => {setLocalValue(e.target.value)}}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            {...props}
        />
    )
})

export default EditableText