import React, { useState, useContext, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react';
import SocketContext from '../Contexts/SocketContext';
import randomColor from 'randomcolor';

function CodeEditor() {
    const [currentTheme, setCurrentTheme] = useState('vs-dark');
    const [codevalue, setCodeValue] = useState('');
    const editorRef = useRef(null);
    const cursorsRef = useRef({});
    const cursorColors = new Map();

    const socket = useContext(SocketContext);

    function getCursorColor(userId) {
        if (!cursorColors.has(userId)) {
            cursorColors.set(userId, randomColor());
        }
        return cursorColors.get(userId);
    }

    function createCursor(userId) {
        const color = getCursorColor(userId);
        const cursor = document.createElement('div');
        cursor.className = `cursor cursor-${userId}`; // Use a different CSS class for each user.
        cursor.style.position = 'absolute';
        cursor.style.width = '4px';
        cursor.style.height = '18px'; // You can adjust this based on your font size.
        cursor.style.backgroundColor = color; // Use a different color for each user.
        return cursor;
    }

    function handleEditorChange(value, event) {
        if (socket) {
            socket.emit('CODE_CHANGED', value);

            if (editorRef?.current)
                socket.emit('CURSOR_POSITION_CHANGED', editorRef.current.getPosition());
        }
    }

    function ChangeTheme() {
        if (currentTheme === 'vs-dark') setCurrentTheme('light');
        else
            setCurrentTheme('vs-dark');
    }

    useEffect(() => {
        if (socket) {
            socket.on('CHANGE_CODE', (value) => {
                setCodeValue(value);
            })

            socket.on('CHANGE_CURSOR_POSITION', (data) => {
                const { userId, position } = data;
                const editor = editorRef.current;
                // Remove the old cursor if it exists.
                if (cursorsRef.current[userId]) {
                    editor.removeOverlayWidget(cursorsRef.current[userId]);
                }
                // Create a new cursor and add it to the editor.
                const cursor = createCursor(userId);
                cursorsRef.current[userId] = cursor;
                const cursorWidget = {
                    getId: () => 'cursor.' + userId,
                    getDomNode: () => cursor,
                    getPosition: () => ({ position: position, preference: [monaco.editor.ContentWidgetPositionPreference.EXACT] })
                };

                cursorsRef.current[userId] = cursorWidget;
                editor.addOverlayWidget(cursorWidget);

                // Update the cursor's position.
                const coords = editor.getScrolledVisiblePosition(position);
                cursor.style.left = coords.left + 'px';
                cursor.style.top = coords.top + 'px';
            });
        }
    }, [socket])

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;

        // editor.onDidChangeCursorPosition((event) => {
        //     if (socket) {
        //         socket.emit('CURSOR_POSITION_CHANGED', editor.getPosition());
        //     }
        // });
    }

    return (
        <div style={{ position: 'relative' }}>
            <Editor
                height="90vh"
                defaultLanguage="javascript"
                defaultValue="//Write something in JavaScript"
                onChange={handleEditorChange}
                theme={currentTheme}
                value={codevalue}
                onMount={handleEditorDidMount}
            />
            <button onClick={ChangeTheme}>Change Theme</button>
        </div>
    )
}

export default CodeEditor;
