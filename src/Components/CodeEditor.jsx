import React, { useState, useContext, useEffect, useRef } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react';
import SocketContext from '../Contexts/SocketContext';
import randomColor from 'randomcolor';

function CodeEditor() {
    const [currentTheme, setCurrentTheme] = useState('vs-dark');
    const [codevalue, setCodeValue] = useState('');
    const editorRef = useRef(null);
    // const monaco = useMonaco();
    const cursorsRef = useRef({});
    const cursorColors = new Map();

    const socket = useContext(SocketContext);

    function getUserColor(userId) {
        if (!cursorColors.has(userId)) {
            cursorColors.set(userId, randomColor());
        }
        return cursorColors.get(userId);
    }

    function createCursor(userId) {
        const color = getUserColor(userId);
        const cursor = document.createElement('div');
        cursor.className = `cursor cursor-${userId}`; // Use a different CSS class for each user.
        cursor.style.position = 'absolute';
        cursor.style.width = '4px';
        cursor.style.height = '18px'; // You can adjust this based on your font size.
        cursor.style.backgroundColor = color; // Use a different color for each user.
        return cursor;
    }

    function createPointer(userId) {
        // badgeContainer styles
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'badge-container';
        badgeContainer.id = `badge-container-${userId}`;

        // badge styles
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.innerText = userId.toString().slice(0, 5);
        badge.style.backgroundColor = getUserColor(userId);
        badgeContainer.appendChild(badge);

        // pointer styles
        const pointer = document.createElement('div');
        pointer.className = 'pointer';
        pointer.style.borderRight = `20px solid ${getUserColor(userId)}`
        pointer.id = `pointer-${userId}`;
        badgeContainer.appendChild(pointer);
        return badgeContainer;
    }

    function handleEditorChange(value, event) {
        if (socket) {
            socket.emit('CODE_CHANGED', value);
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

            socket.on('MOUSE_MOVE', (data) => {
                const { userId, position } = data;

                let pointerContainer = document.getElementById(`badge-container-${userId}`);
                if (!pointerContainer) {
                    pointerContainer = createPointer(userId);
                    editorRef?.current?.getDomNode()?.appendChild(pointerContainer);
                }

                pointerContainer.style.left = `${position.x}px`;
                pointerContainer.style.top = `${position.y}px`;
            });

            socket.on('MOUSE_LEAVE', (data) => {
                const { userId } = data;
                const pointerContainer = document.querySelector(`#badge-container-${userId}`);
                if (pointerContainer) {
                    pointerContainer.remove();
                }
            });

            socket.on('MOUSE_ENTER', (data) => {
                const { userId } = data;
                const pointerContainer = document.querySelector(`#badge-container-${userId}`);
                if (pointerContainer) {
                    editorRef?.current?.getDomNode()?.appendChild(pointerContainer);
                }
            });
        }
    }, [socket])

    useEffect(() => {

        let domNode = null;
        if (editorRef.current) {
            domNode = editorRef.current.getDomNode();
            domNode.addEventListener('mousemove', handleMouseMove);
            domNode.addEventListener('mouseleave', handleMouseLeave);
            domNode.addEventListener('mouseenter', handleMouseEnter);
        }


        // Cleanup function
        return () => {
            if (domNode) {
                domNode.removeEventListener('mousemove', handleMouseMove);
                domNode.removeEventListener('mouseleave', handleMouseLeave);
                domNode.removeEventListener('mouseenter', handleMouseEnter);
            }
        };
    }, [editorRef]);

    function handleMouseMove(event) {
        const rect = editorRef.current.getDomNode().getBoundingClientRect();
        const position = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        if (socket) {
            socket.emit('MOUSE_MOVE', position);
        }
    }

    function handleMouseLeave(event) {
        if (socket) {
            socket.emit('MOUSE_LEAVE');
        }
    }

    function handleMouseEnter(event) {
        if (socket) {
            socket.emit('MOUSE_ENTER');
        }
    }

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;

        editor.onDidChangeCursorPosition((event) => {
            if (socket) {
                socket.emit('CURSOR_POSITION_CHANGED', editor.getPosition());
            }
        });

        editor.getDomNode().addEventListener('mousemove', handleMouseMove);
        editor.getDomNode().addEventListener('mouseleave', handleMouseLeave);
        editor.getDomNode().addEventListener('mouseenter', handleMouseEnter);
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
