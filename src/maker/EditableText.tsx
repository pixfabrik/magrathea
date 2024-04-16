/* eslint-disable @typescript-eslint/no-unused-vars */
import "./EditableText.less";
import classNames from "classnames";
import React, { useEffect, useState, useRef } from "react";

type EditableTextProps = {
  className: string;
  value: string;
  onChange: (value: string) => void;
};

// ----------
const EditableText: React.FC<EditableTextProps> = ({
  className,
  value,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className={classNames("EditableText", className)}>
      {!isEditing && (
        <div
          onClick={() => {
            setIsEditing(true);
            setText(value);
          }}
        >
          {value}
        </div>
      )}
      {isEditing && (
        <input
          type="text"
          value={text}
          ref={inputRef}
          onChange={(e) => {
            setText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditing(false);
              onChange(text);
            } else if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          onBlur={() => {
            setIsEditing(false);
            onChange(text);
          }}
        />
      )}
    </div>
  );
};

export default EditableText;
