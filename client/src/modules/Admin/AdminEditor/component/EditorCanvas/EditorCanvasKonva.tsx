import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import { Box, TextField } from '@mui/material';
import type { 
  ElementType, 
  StickerType, 
  TextElementType 
} from '../../../../../context/AdminEditorContext';

export type TextPatch = Partial<TextElementType>;
export type EditorCanvasHandle = {
  addImage: () => void;
  addText: () => void;
  updateSelectedText: (patch: TextPatch) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  setFontSize: (n: number) => void;
  setFontFamily: (name: string) => void;
  setColor: (hex: string) => void;
  addSticker: (path: string) => void;
  clearSelection: () => void;
  getSelectedText: () => TextElementType | null;
};

type Props = {
  elements: ElementType[];
  setElements: React.Dispatch<React.SetStateAction<ElementType[]>>;
  textElements: TextElementType[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElementType[]>>;
  stickerElements: StickerType[];
  setStickerElements: React.Dispatch<React.SetStateAction<StickerType[]>>;
  onFocus?: () => void;
  disabled?: boolean;
  canvasScale?: number;
};

// Image wrapper with transformer
const ImageWrapper: React.FC<{
  element: ElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransform: (x: number, y: number, width: number, height: number) => void;
  onDelete: () => void;
}> = ({ element, isSelected, onSelect, onDragEnd, onTransform, onDelete }) => {
  const [image] = useImage(element.src || '');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => onDragEnd(e.target.x(), e.target.y());
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    onTransform(node.x(), node.y(), node.width(), node.height());
  };

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
      {isSelected && (
        <Group x={element.x + element.width - 15} y={element.y - 15}>
          <Rect width={30} height={30} fill="black" cornerRadius={15} onClick={onDelete} />
          <KonvaText x={8} y={8} text="✕" fill="white" fontSize={14} onClick={onDelete} />
        </Group>
      )}
    </>
  );
};

// Sticker wrapper
const StickerWrapper: React.FC<{
  sticker: StickerType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransform: (x: number, y: number, width: number, height: number) => void;
  onDelete: () => void;
}> = ({ sticker, isSelected, onSelect, onDragEnd, onTransform, onDelete }) => {
  const [image] = useImage(sticker.sticker);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => onDragEnd(e.target.x(), e.target.y());
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    onTransform(node.x(), node.y(), node.width(), node.height());
  };

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={sticker.x}
        y={sticker.y}
        width={sticker.width}
        height={sticker.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
      {isSelected && (
        <Group x={sticker.x + sticker.width - 15} y={sticker.y - 15}>
          <Rect width={30} height={30} fill="black" cornerRadius={15} onClick={onDelete} />
          <KonvaText x={8} y={8} text="✕" fill="white" fontSize={14} onClick={onDelete} />
        </Group>
      )}
    </>
  );
};

// HTML Div component for text editing
const TextEditingDiv: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  textElement: TextElementType;
  onTextChange: (newText: string) => void;
  onBlur: () => void;
}> = ({ x, y, width, height, textElement, onTextChange, onBlur }) => {
  const [localText, setLocalText] = useState(textElement.text);

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: width,
        height: height,
        zIndex: 10000,
        backgroundColor: 'white',
        border: '2px solid #1976d2',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <TextField
        multiline
        fullWidth
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        onBlur={() => {
          onTextChange(localText);
          onBlur();
        }}
        autoFocus
        variant="outlined"
        sx={{
          height: '100%',
          '& .MuiInputBase-root': {
            height: '100%',
            alignItems: 'flex-start',
            fontWeight: textElement.bold ? 700 : 400,
            fontStyle: textElement.italic ? 'italic' : 'normal',
            fontSize: textElement.fontSize,
            fontFamily: textElement.fontFamily,
            color: textElement.color,
          },
          '& .MuiInputBase-input': {
            height: '100% !important',
            overflow: 'auto',
          }
        }}
      />
    </div>
  );
};

// Editable Text wrapper
const EditableTextWrapper: React.FC<{
  textElement: TextElementType;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransform: (x: number, y: number, width: number, height: number) => void;
  onDelete: () => void;
  onTextChange: (newText: string) => void;
  onEditingComplete: () => void;
}> = ({ textElement, isSelected, onSelect, onDragEnd, onTransform, onDelete, onTextChange, onEditingComplete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && !isEditing && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditing]);

  const handleDragEnd = (e: any) => onDragEnd(e.target.x(), e.target.y());
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    onTransform(node.x(), node.y(), node.width(), node.height());
  };
  const handleDoubleClick = () => {
    setIsEditing(true);
  };
  const handleBlur = () => {
    setIsEditing(false);
    onEditingComplete();
  };

  // Get absolute position for the editing div
  const getAbsolutePosition = () => {
    if (!containerRef.current) return { x: textElement.x, y: textElement.y };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left + textElement.x,
      y: rect.top + textElement.y
    };
  };

  const [absPos, setAbsPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isEditing && containerRef.current) {
      const pos = getAbsolutePosition();
      setAbsPos(pos);
    }
  }, [isEditing, textElement.x, textElement.y]);

  if (isEditing) {
    return (
      <TextEditingDiv
        x={absPos.x}
        y={absPos.y}
        width={textElement.width}
        height={textElement.height}
        textElement={textElement}
        onTextChange={onTextChange}
        onBlur={handleBlur}
      />
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <KonvaText
        ref={shapeRef}
        x={textElement.x}
        y={textElement.y}
        width={textElement.width}
        height={textElement.height}
        text={textElement.text || 'Double click to edit'}
        fontSize={textElement.fontSize}
        fontFamily={textElement.fontFamily}
        fill={textElement.color}
        fontStyle={`${textElement.italic ? 'italic ' : ''}${textElement.bold ? 'bold' : 'normal'}`}
        align="center"
        verticalAlign="middle"
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onDblClick={handleDoubleClick}
        onTapDbl={handleDoubleClick}
        wrap="word"
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
      {isSelected && (
        <Group x={textElement.x + textElement.width - 15} y={textElement.y - 15}>
          <Rect width={30} height={30} fill="black" cornerRadius={15} onClick={onDelete} />
          <KonvaText x={8} y={8} text="✕" fill="white" fontSize={14} onClick={onDelete} />
        </Group>
      )}
    </div>
  );
};

const EditorCanvasKonva = forwardRef<EditorCanvasHandle, Props>(
  (
    {
      elements,
      setElements,
      textElements,
      setTextElements,
      stickerElements,
      setStickerElements,
      onFocus,
      disabled = false,
      canvasScale = 1,
    },
    ref
  ) => {
    const stageRef = useRef<any>(null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const activeElementRef = useRef<string | null>(null);

    const baseSize = { width: 500, height: 700 };

    const selectedText = textElements.find((t) => t.id === selectedTextId) || null;

    const updateTextElement = (id: string, patch: TextPatch) =>
      setTextElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    useImperativeHandle(ref, () => ({
      addImage: () => {
        if (disabled) return;
        const id = `el_${Date.now()}`;
        setElements((prev) => [...prev, { id, x: 60, y: 60, width: 200, height: 120, src: null }]);
        setSelectedElementId(id);
        setSelectedTextId(null);
        setSelectedStickerId(null);
        activeElementRef.current = id;
        setTimeout(() => fileRef.current?.click(), 10);
      },
      addText: () => {
        if (disabled) return;
        const id = `txt_${Date.now()}`;
        setTextElements((prev) => [
          ...prev,
          {
            id,
            x: 60,
            y: 60,
            width: 220,
            height: 64,
            text: '',
            bold: false,
            italic: false,
            fontSize: 20,
            fontFamily: 'Arial',
            color: '#000000',
          },
        ]);
        setSelectedTextId(id);
        setSelectedElementId(null);
        setSelectedStickerId(null);
      },
      updateSelectedText: (patch) => selectedTextId && updateTextElement(selectedTextId, patch),
      toggleBold: () => selectedText && updateTextElement(selectedText.id, { bold: !selectedText.bold }),
      toggleItalic: () => selectedText && updateTextElement(selectedText.id, { italic: !selectedText.italic }),
      setFontSize: (n) => selectedText && updateTextElement(selectedText.id, { fontSize: n }),
      setFontFamily: (name) => selectedText && updateTextElement(selectedText.id, { fontFamily: name }),
      setColor: (hex) => selectedText && updateTextElement(selectedText.id, { color: hex }),
      addSticker: (path) => {
        if (disabled) return;
        const id = `sticker_${Date.now()}`;
        setStickerElements((prev) => [
          ...prev,
          { id, x: 80, y: 80, width: 100, height: 100, sticker: path, zIndex: 2 + prev.length },
        ]);
        setSelectedStickerId(id);
        setSelectedTextId(null);
        setSelectedElementId(null);
      },
      clearSelection: () => {
        setSelectedTextId(null);
        setSelectedElementId(null);
        setSelectedStickerId(null);
      },
      getSelectedText: () => selectedText,
    }), [disabled, selectedText, selectedTextId, setElements, setTextElements, setStickerElements]);

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeElementRef.current) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (!src) return;
        setElements((prev) => prev.map((el) => (el.id === activeElementRef.current ? { ...el, src } : el)));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    const handleStageClick = (e: any) => {
      if (e.target === e.target.getStage()) {
        setSelectedElementId(null);
        setSelectedTextId(null);
        setSelectedStickerId(null);
      }
    };

    const scaledWidth = baseSize.width * canvasScale;
    const scaledHeight = baseSize.height * canvasScale;

    return (
      <Box
        onMouseDown={onFocus}
        sx={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          borderRadius: '12px',
          boxShadow: '3px 5px 8px gray',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid lightGray',
          cursor: disabled ? 'not-allowed' : 'pointer',
          pointerEvents: disabled ? 'none' : 'auto',
          backgroundColor: '#fff',
        }}
      >
        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={onFile} />

        <Stage
          ref={stageRef}
          width={scaledWidth}
          height={scaledHeight}
          onClick={handleStageClick}
          onTap={handleStageClick}
          style={{ backgroundColor: '#fff' }}
        >
          <Layer>
            {/* Background */}
            <Rect x={0} y={0} width={scaledWidth} height={scaledHeight} fill="#fff" />

            {/* Images */}
            {elements.map((el) => (
              <ImageWrapper
                key={el.id}
                element={el}
                isSelected={selectedElementId === el.id}
                onSelect={() => {
                  setSelectedElementId(el.id);
                  setSelectedTextId(null);
                  setSelectedStickerId(null);
                  activeElementRef.current = el.id;
                }}
                onDragEnd={(x, y) => setElements((prev) => prev.map((p) => (p.id === el.id ? { ...p, x, y } : p)))}
                onTransform={(x, y, width, height) =>
                  setElements((prev) => prev.map((p) => (p.id === el.id ? { ...p, x, y, width, height } : p)))
                }
                onDelete={() => {
                  setElements((prev) => prev.filter((p) => p.id !== el.id));
                  if (selectedElementId === el.id) setSelectedElementId(null);
                }}
              />
            ))}

            {/* Stickers */}
            {stickerElements.map((st) => (
              <StickerWrapper
                key={st.id}
                sticker={st}
                isSelected={selectedStickerId === st.id}
                onSelect={() => {
                  setSelectedStickerId(st.id);
                  setSelectedTextId(null);
                  setSelectedElementId(null);
                  setStickerElements((prev) => prev.map((s) => (s.id === st.id ? { ...s, zIndex: prev.length + 50 } : s)));
                }}
                onDragEnd={(x, y) => setStickerElements((prev) => prev.map((s) => (s.id === st.id ? { ...s, x, y } : s)))}
                onTransform={(x, y, width, height) =>
                  setStickerElements((prev) => prev.map((s) => (s.id === st.id ? { ...s, x, y, width, height } : s)))
                }
                onDelete={() => {
                  setStickerElements((prev) => prev.filter((s) => s.id !== st.id));
                  if (selectedStickerId === st.id) setSelectedStickerId(null);
                }}
              />
            ))}

            {/* Text Elements */}
            {textElements.map((t) => (
              <EditableTextWrapper
                key={t.id}
                textElement={t}
                isSelected={selectedTextId === t.id}
                onSelect={() => {
                  setSelectedTextId(t.id);
                  setSelectedElementId(null);
                  setSelectedStickerId(null);
                }}
                onDragEnd={(x, y) => updateTextElement(t.id, { x, y })}
                onTransform={(x, y, width, height) => updateTextElement(t.id, { x, y, width, height })}
                onDelete={() => {
                  setTextElements((prev) => prev.filter((el) => el.id !== t.id));
                  if (selectedTextId === t.id) setSelectedTextId(null);
                }}
                onTextChange={(newText) => updateTextElement(t.id, { text: newText })}
                onEditingComplete={() => {}}
              />
            ))}
          </Layer>
        </Stage>
      </Box>
    );
  }
);

export default EditorCanvasKonva;