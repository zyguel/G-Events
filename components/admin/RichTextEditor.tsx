"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Heading1,
    Heading2,
    Heading3,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify
} from 'lucide-react';
import { useCallback, useState, useRef } from 'react';
import { LinkModal, ImageModal } from './EditorModals';
import { HexColorPicker } from 'react-colorful';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}


// Custom FontSize extension
const FontSize = Extension.create({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize || null,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

const FONT_FAMILIES = [
    { label: 'Default', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { label: 'Inter', value: 'Inter, sans-serif' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

export default function RichTextEditor({ content, onChange, placeholder = "Start typing..." }: RichTextEditorProps) {
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
    const colorButtonRef = useRef<HTMLButtonElement>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-600 underline',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            FontFamily.configure({
                types: ['textStyle'],
            }),
            FontSize,
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
            },
        },
    });

    const handleSetLink = useCallback((url: string) => {
        if (!editor) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const handleAddImage = useCallback((url: string) => {
        if (!editor) return;

        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const handleColorChange = (color: string) => {
        setCurrentColor(color);
        if (editor) {
            editor.chain().focus().setColor(color).run();
        }
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-t-xl overflow-hidden">
                {/* Font Family */}
                <select
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg pl-1 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[140px]"
                    title="Font Family"
                >
                    {FONT_FAMILIES.map((font) => (
                        <option key={font.value} value={font.value}>
                            {font.label}
                        </option>
                    ))}
                </select>

                {/* Font Size */}
                <select
                    onChange={(e) => {
                        const size = e.target.value;
                        if (size) {
                            editor.chain().focus().setFontSize(size).run();
                        }
                    }}
                    className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg pl-1 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    title="Font Size"
                >
                    <option value="">Size</option>
                    {FONT_SIZES.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                {/* Headings */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                            }`}
                        title="Heading 1"
                    >
                        <Heading1 size={16} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                            }`}
                        title="Heading 2"
                    >
                        <Heading2 size={16} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                            }`}
                        title="Heading 3"
                    >
                        <Heading3 size={16} className="text-gray-700 dark:text-gray-300" />
                    </button>
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                {/* Text Formatting */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Bold"
                >
                    <Bold size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Italic"
                >
                    <Italic size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Underline"
                >
                    <UnderlineIcon size={16} className="text-gray-700 dark:text-gray-300" />
                </button>

                {/* Text Color - Custom Color Picker */}
                <div className="relative">
                    <button
                        ref={colorButtonRef}
                        onClick={() => {
                            if (!showColorPicker && colorButtonRef.current) {
                                const rect = colorButtonRef.current.getBoundingClientRect();
                                setPickerPosition({
                                    top: rect.bottom + 4,
                                    left: rect.left
                                });
                            }
                            setShowColorPicker(!showColorPicker);
                        }}
                        className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-0.5"
                        title="Text Color"
                    >
                        <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: currentColor }} />
                        <span className="text-xs text-gray-700 dark:text-gray-300">▼</span>
                    </button>
                    {showColorPicker && (
                        <>
                            {/* Backdrop to close picker */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowColorPicker(false)}
                            />
                            {/* Color picker popup */}
                            <div
                                className="fixed p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
                                style={{
                                    top: `${pickerPosition.top}px`,
                                    left: `${pickerPosition.left}px`
                                }}
                            >
                                <HexColorPicker color={currentColor} onChange={handleColorChange} />
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={currentColor}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                        placeholder="#000000"
                                    />
                                    <button
                                        onClick={() => setShowColorPicker(false)}
                                        className="px-2 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                {/* Text Alignment */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Align Left"
                >
                    <AlignLeft size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Align Center"
                >
                    <AlignCenter size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Align Right"
                >
                    <AlignRight size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Justify"
                >
                    <AlignJustify size={16} className="text-gray-700 dark:text-gray-300" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Bullet List"
                >
                    <List size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Numbered List"
                >
                    <ListOrdered size={16} className="text-gray-700 dark:text-gray-300" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                {/* Link & Image */}
                <button
                    onClick={() => setLinkModalOpen(true)}
                    className={`p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                    title="Insert Link"
                >
                    <LinkIcon size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => setImageModalOpen(true)}
                    className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Insert Image"
                >
                    <ImageIcon size={16} className="text-gray-700 dark:text-gray-300" />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} className="text-gray-900 dark:text-gray-100 rounded-b-xl overflow-hidden" />

            {/* Modals */}
            <LinkModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onSubmit={handleSetLink}
                initialUrl={editor?.getAttributes('link').href || ''}
            />
            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                onSubmit={handleAddImage}
            />
        </div>
    );
}
